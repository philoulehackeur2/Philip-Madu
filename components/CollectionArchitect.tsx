
import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Tldraw, 
  Editor, 
  createShapeId,
} from 'tldraw';
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragEndEvent, 
  DragStartEvent,
  DragOverlay,
  useSensor, 
  useSensors, 
  PointerSensor,
  defaultDropAnimationSideEffects,
  DropAnimation,
  pointerWithin
} from '@dnd-kit/core';
import { Layers, SplitSquareHorizontal, Wand2, RefreshCw, X, Maximize2, Save, Loader2 } from 'lucide-react';
import { BrandArchetype, GeneratedImage } from '../types';
import { FashionCardUtil, ComparisonUtil } from './TldrawShapes';
import { useAuth } from '../contexts/AuthContext';
import { saveCollectionState } from '../services/storageService';

interface CollectionArchitectProps {
  brand: BrandArchetype;
  images: GeneratedImage[];
  onOpenNarrative: (look: any) => void;
  onVisualizeLook: (look: any) => void;
}

// --- HELPER: SVG TO BLOB ---
const convertSvgToPng = (svg: SVGSVGElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const svgStr = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No context'));
      
      // White background for preview consistency
      ctx.fillStyle = '#ffffff'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
         if(blob) resolve(blob);
         else reject(new Error('Blob failed'));
      }, 'image/png');
    };
    img.onerror = reject;
    // Utilize base64 encoding to prevent taint issues with external resources inside SVG if any (though Tldraw usually embeds)
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
  });
};

// --- SIDEBAR ITEM (DRAGGABLE) ---
const SidebarItem = React.memo(({ image, isOverlay = false }: { image: GeneratedImage, isOverlay?: boolean }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `asset-${image.id}`,
    data: { 
      type: 'fashion-asset', 
      imgUrl: image.url, 
      prompt: image.prompt,
      brand: image.brand
    },
    disabled: isOverlay
  });

  return (
    <div
      ref={isOverlay ? null : setNodeRef}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      className={`relative w-full aspect-[3/4] border group bg-black transition-all touch-none
        ${isDragging ? 'opacity-30' : 'opacity-100'} 
        ${isOverlay ? 'shadow-2xl scale-105 cursor-grabbing z-[9999]' : 'cursor-grab hover:scale-[1.02]'}
        ${image.brand === BrandArchetype.CHAOSCHICC ? 'border-[#C5A059]/50' : 'border-white/20'}
      `}
    >
      <img src={image.url} alt="Asset" className="w-full h-full object-cover pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
         <p className="text-[9px] text-white truncate font-mono tracking-wider">{image.prompt}</p>
      </div>
    </div>
  );
});

// --- MAIN COMPONENT ---
// Define shape utils array
const customShapeUtils = [FashionCardUtil, ComparisonUtil];

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: { opacity: '0.5' },
    },
  }),
};

export const CollectionArchitect = React.memo<CollectionArchitectProps>(({ brand, images, onVisualizeLook }) => {
  const { user } = useAuth();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [activeDragImage, setActiveDragImage] = useState<GeneratedImage | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { setNodeRef } = useDroppable({ id: 'canvas-droppable' });
  
  const isDeRoche = brand === BrandArchetype.DE_ROCHE;

  // Memoize sensors to avoid re-renders
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const assetId = event.active.id.toString().replace('asset-', '');
    const img = images.find(a => a.id === assetId);
    if (img) setActiveDragImage(img);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragImage(null);
    const { active, over } = event;

    // Check if dropped over the canvas
    if (over && over.id === 'canvas-droppable' && editor) {
      const assetData = active.data.current;
      
      if (assetData && assetData.type === 'fashion-asset') {
         // Get the center of the viewport to drop if we can't calculate exact coord easily without mouse event
         const { x, y } = editor.getViewportScreenCenter();
         
         editor.createShape({
            id: createShapeId(),
            type: 'fashion-card',
            x: x - 120, 
            y: y - 160,
            props: {
              imgUrl: assetData.imgUrl,
              prompt: assetData.prompt,
              brand: assetData.brand,
              w: 240, 
              h: 320
            }
         });
      }
    }
  }, [editor]);

  const handleCompareSelection = () => {
    if (!editor) return;
    const selectedShapes = editor.getSelectedShapes();
    const validCards = selectedShapes.filter(s => s.type === 'fashion-card');

    if (validCards.length !== 2) {
      alert("Select exactly two fashion cards to compare.");
      return;
    }

    const [cardA, cardB] = validCards as any[];
    const midX = (cardA.x + cardB.x) / 2;
    const midY = (cardA.y + cardB.y) / 2;

    editor.batch(() => {
      editor.deleteShapes([cardA.id, cardB.id]);
      editor.createShape({
        id: createShapeId(),
        type: 'comparison-card',
        x: midX,
        y: midY,
        props: {
          w: 400,
          h: 500,
          imgLeft: cardA.props.imgUrl,
          imgRight: cardB.props.imgUrl
        }
      });
    });
  };

  const handleSaveCollection = async () => {
    if (!editor || !user) return;
    setIsSaving(true);

    try {
      // 1. Get the "Brains" (JSON Snapshot)
      const snapshot = editor.store.getSnapshot();

      // 2. Get the "Look" (Visual Preview)
      // Tldraw 2.x API for getting SVG of all shapes on current page
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      
      if (shapeIds.length === 0) {
         alert("Canvas is empty. Add assets before saving.");
         setIsSaving(false);
         return;
      }

      const svg = await editor.getSvg(shapeIds, { scale: 1, background: true });
      if (!svg) throw new Error("Failed to generate SVG");
      
      const pngBlob = await convertSvgToPng(svg);

      // 3. Send to Storage Service
      await saveCollectionState(
        user.uid,
        `Collection ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 
        snapshot, 
        pngBlob
      );
      
      alert("Collection Saved to Cloud Archive!");
    } catch (e) {
      console.error(e);
      alert("Save failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // If collapsed, show a trigger button
  if (!isExpanded) {
     return (
        <button 
           onClick={() => setIsExpanded(true)}
           className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold uppercase tracking-widest text-xs transition-transform hover:scale-105 ${isDeRoche ? 'bg-white text-black border border-gray-300' : 'bg-[#C5A059] text-black border border-[#C5A059]'}`}
        >
           <Layers size={16} /> Open Collection Architect
        </button>
     );
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`fixed inset-0 z-[40] flex font-sans ${isDeRoche ? 'bg-[#E6E1E7]' : 'bg-[#0a0a0a]'}`}>
        
        {/* SIDEBAR TRAY */}
        <div className={`w-64 flex flex-col z-50 shadow-xl border-r relative flex-shrink-0 ${isDeRoche ? 'bg-white border-[#232222]' : 'bg-black border-[#C5A059]'}`}>
          <div className="p-4 border-b border-inherit flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Layers className={isDeRoche ? "text-black" : "text-[#C5A059]"} size={16} />
                <h2 className={`text-xs font-bold uppercase tracking-widest ${isDeRoche ? "text-black" : "text-[#C5A059]"}`}>Asset Stream</h2>
            </div>
            <button onClick={() => setIsExpanded(false)}><X size={16} className="opacity-50 hover:opacity-100"/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {images.map((img) => (
              <div key={img.id} className="w-full">
                <SidebarItem image={img} />
              </div>
            ))}
            {images.length === 0 && (
              <div className="text-center mt-10 opacity-50 text-xs font-mono text-gray-500">
                GENERATE IMAGES TO POPULATE STREAM
              </div>
            )}
          </div>
        </div>

        {/* INFINITE CANVAS WRAPPER */}
        <div ref={setNodeRef} className="flex-1 relative h-full w-full bg-gray-100 overflow-hidden">
          <div className="absolute inset-0">
             <Tldraw 
              onMount={setEditor}
              shapeUtils={customShapeUtils}
              hideUi={false}
              className="z-0"
            >
              {/* FLOATING ACTION BAR */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto flex gap-2">
                 <button 
                  onClick={handleCompareSelection}
                  className="bg-black text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold uppercase hover:scale-105 transition-transform border border-white/20"
                 >
                   <SplitSquareHorizontal size={14} /> Compare
                 </button>
              </div>

              {/* SAVE BUTTON OVERLAY */}
              <div className="absolute top-4 right-4 z-[100] pointer-events-auto">
                <button 
                  onClick={handleSaveCollection}
                  disabled={isSaving}
                  className="bg-black text-white px-4 py-2 rounded shadow-xl flex items-center gap-2 uppercase text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>}
                  Save Page
                </button>
              </div>
            </Tldraw>
          </div>
        </div>

        {/* DRAG OVERLAY PORTAL */}
        {createPortal(
          <DragOverlay dropAnimation={dropAnimation} style={{ zIndex: 9999 }}>
            {activeDragImage ? (
              <div className="w-[180px]">
                <SidebarItem image={activeDragImage} isOverlay />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </div>
    </DndContext>
  );
});
