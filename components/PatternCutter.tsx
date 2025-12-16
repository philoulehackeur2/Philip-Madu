
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Download, ZoomIn, ZoomOut, Layers, AlertTriangle, Cpu, MessageSquarePlus, Save, Trash2, Printer, FileJson } from 'lucide-react';
import { BrandArchetype, CollectionLook, PatternData, DesignParameters } from '../types';
import { exportPatternToPDF } from '../services/pdfGenerator';
import { generateDXFContent } from '../services/dxfService';
import { TiledPDFGenerator } from './TiledPDFGenerator';
import { useAppStore } from '../store';

interface PatternCutterProps {
  // brand is now in store
  lookData?: CollectionLook; 
  onClose: () => void;
}

// Internal type for user added annotations
interface UserAnnotation {
  id: string;
  pieceIndex: number;
  pointIndex: number;
  text: string;
}

export const PatternCutter: React.FC<PatternCutterProps> = ({ lookData, onClose }) => {
  const brand = useAppStore(state => state.brand);
  const isDeRoche = brand === BrandArchetype.DE_ROCHE;
  
  // --- 1. STATE MANAGEMENT ---
  const [committedParams, setCommittedParams] = useState<DesignParameters>({
      fitTension: isDeRoche ? 20 : 60,
      gravity: 20,
      distortion: isDeRoche ? 0 : 40
  });
  
  const [ghostParams, setGhostParams] = useState<DesignParameters>(committedParams);
  const [patternData, setPatternData] = useState<PatternData | null>(null);
  const [zoom, setZoom] = useState(0.65);
  const [isCalculating, setIsCalculating] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // --- ANNOTATION STATE ---
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [userAnnotations, setUserAnnotations] = useState<UserAnnotation[]>([]);
  const [activeNoteInput, setActiveNoteInput] = useState<{ pieceIndex: number, pointIndex: number, x: number, y: number } | null>(null);
  const [noteText, setNoteText] = useState("");

  // Worker Ref
  const workerRef = useRef<Worker | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 2. WORKER INIT ---
  useEffect(() => {
    // Load worker from dedicated file
    const worker = new Worker(new URL('../workers/patternEngine.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
        setPatternData(e.data);
        setIsCalculating(false);
    };

    if (lookData) {
        worker.postMessage({ look: lookData, brand, params: committedParams });
    }

    return () => worker.terminate();
  }, [lookData, brand]);

  // --- 3. ZERO-LATENCY HANDLER ---
  const handleSliderChange = (key: keyof DesignParameters, val: number) => {
      setGhostParams(prev => ({ ...prev, [key]: val }));
      setIsDragging(true);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      
      debounceTimer.current = setTimeout(() => {
          setCommittedParams(prev => {
              const newParams = { ...prev, [key]: val }; 
              if (workerRef.current && lookData) {
                  setIsCalculating(true);
                  workerRef.current.postMessage({ look: lookData, brand, params: newParams });
              }
              return newParams;
          });
          setIsDragging(false);
      }, 300);
  };

  // --- 4. ANNOTATION HANDLERS ---
  const handleVertexClick = (pieceIndex: number, pointIndex: number, clientX: number, clientY: number) => {
    if (!isAnnotating) return;
    setActiveNoteInput({ pieceIndex, pointIndex, x: clientX, y: clientY });
    setNoteText("");
  };

  const saveAnnotation = () => {
    if (activeNoteInput && noteText.trim()) {
      const newAnnotation: UserAnnotation = {
        id: Math.random().toString(36).substr(2, 9),
        pieceIndex: activeNoteInput.pieceIndex,
        pointIndex: activeNoteInput.pointIndex,
        text: noteText
      };
      setUserAnnotations(prev => [...prev, newAnnotation]);
      setActiveNoteInput(null);
      setNoteText("");
      setIsAnnotating(false); // Optional: Exit mode after add
    }
  };

  const deleteAnnotation = (id: string) => {
    setUserAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const handleExport = () => patternData && exportPatternToPDF(patternData);
  
  const handleDXFExport = () => {
     if (!patternData) return;
     try {
        const dxfContent = generateDXFContent(patternData);
        const blob = new Blob([dxfContent], { type: 'application/dxf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${patternData.styleName}.dxf`;
        a.click();
        window.URL.revokeObjectURL(url);
     } catch (e) {
         console.error("DXF generation failed", e);
         alert("Failed to generate DXF file.");
     }
  };

  // --- 5. GHOST VISUAL LOGIC ---
  const deltaTension = (ghostParams.fitTension - committedParams.fitTension) / 100;
  const deltaGravity = (ghostParams.gravity - committedParams.gravity) / 100;
  const deltaDistortion = (ghostParams.distortion - committedParams.distortion);

  const ghostStyle = isDragging ? {
      transform: `
          scaleX(${1 + deltaTension}) 
          scaleY(${1 + deltaGravity}) 
          skewX(${deltaDistortion}deg)
      `,
      transition: 'none', 
      filter: !isDeRoche ? 'blur(2px) opacity(0.8)' : 'none',
      stroke: isDeRoche ? '#00FF00' : undefined,
      strokeDasharray: isDeRoche ? '4 4' : undefined
  } : {
      transform: 'none',
      transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
  };

  const strokeColor = isDeRoche ? "#FFFFFF" : "#C5A059";
  const bgColor = isDeRoche ? "bg-[#232222]" : "bg-[#1a1a1a]";
  
  // --- DYNAMIC GHOST BODY GENERATION ---
  const isPant = lookData?.coreItem.toLowerCase().includes("pant") || lookData?.coreItem.toLowerCase().includes("trouser");
  
  const getStandardBodyPath = () => {
      const sy = 1.15; // Vertical scale factor matching the pattern logic
      
      if (!isPant) {
          // BODICE GHOST (Relative to offset 100, 50)
          const ox = 100;
          const oy = 50;
          return `
            M ${ox} ${oy-50} L ${ox} ${oy+700}
            M ${ox} ${oy} C ${ox+30} ${oy} ${ox+60} ${oy+10} ${ox+70} ${oy+15*sy}
            L ${ox+140} ${oy+40*sy}
            Q ${ox+130} ${oy+180*sy} ${ox+135} ${oy+350*sy}
            L ${ox+150} ${oy+550*sy}
          `;
      } else {
          // PANT GHOST (Relative to offset 200, 50)
          // Pant Center Front is calculated at 140 relative -> 340 absolute
          const ox = 200;
          const oy = 50;
          return `
            M ${ox+140} ${oy-50} L ${ox+140} ${oy+750}
            M ${ox+40} ${oy} 
            Q ${ox+10} ${oy+130*sy} ${ox+30} ${oy+600*sy}
            M ${ox+140} ${oy+10*sy}
            Q ${ox+150} ${oy+120*sy} ${ox+130} ${oy+600*sy}
          `;
      }
  };
  
  const ghostBodyPath = getStandardBodyPath();

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col animate-in fade-in duration-300 font-mono text-white ${bgColor}`}>
      
      {/* Header */}
      <header className={`h-14 flex items-center justify-between px-6 border-b ${isDeRoche ? 'border-white/20' : 'border-[#C5A059]'}`}>
        <div className="flex items-center gap-4">
           <Layers size={18} className={isDeRoche ? "text-white" : "text-[#C5A059]"} />
           <div className="flex flex-col">
             <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                 PATTERN ENGINE v4.1 (GHOST)
                 {isCalculating && <span className="text-[9px] px-2 py-0.5 bg-white/20 rounded animate-pulse">{isDeRoche ? "CALCULATING..." : "RENDERING CHAOS..."}</span>}
             </span>
             <span className="text-[10px] opacity-50">MODE: {brand} // ZERO-LATENCY</span>
           </div>
        </div>
        <div className="flex gap-4">
           {/* DXF Export Button */}
           <button 
             onClick={handleDXFExport}
             className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase border rounded-sm transition-all ${isDeRoche ? 'border-white hover:bg-white hover:text-black' : 'border-[#C5A059] hover:bg-[#C5A059] hover:text-black'}`}
             title="Download DXF"
           >
             <FileJson size={14} /> DXF
           </button>

           {/* Annotation Toggle */}
           <button 
             onClick={() => setIsAnnotating(!isAnnotating)}
             className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase border rounded-sm transition-all ${isAnnotating ? (isDeRoche ? 'bg-white text-black border-white' : 'bg-[#C5A059] text-black border-[#C5A059]') : 'border-current opacity-60 hover:opacity-100'}`}
           >
             <MessageSquarePlus size={14} />
             {isAnnotating ? 'Mode: Active' : 'Add Note'}
           </button>

           <div className="flex items-center gap-2 mr-4 border-l border-current pl-4">
              <button onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}><ZoomOut size={16}/></button>
              <span className="text-xs w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
              <button onClick={() => setZoom(Math.min(2, zoom + 0.1))}><ZoomIn size={16}/></button>
           </div>
           
           <button onClick={onClose} className="hover:text-red-500 ml-4"><X size={24} /></button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 relative overflow-hidden flex cursor-grab active:cursor-grabbing">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ backgroundImage: `linear-gradient(${strokeColor} 1px, transparent 1px), linear-gradient(90deg, ${strokeColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
        </div>

        <div className="w-full h-full flex items-center justify-center overflow-auto">
           <svg width="100%" height="100%" viewBox="0 0 1000 800" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
              <defs>
                 <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                    <path d="M0,0 L10,5 L0,10" fill="none" stroke={strokeColor} />
                 </marker>
                 <filter id="chaosFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
                 </filter>
              </defs>

              {/* Ghost Block / Standard Body Overlay */}
              <g opacity="0.2" className="pointer-events-none">
                  <path d={ghostBodyPath} fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={isPant ? 340 : 100} y="40" fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace" style={{ letterSpacing: '2px' }}>
                      STD BODY (190cm / SZ38)
                  </text>
              </g>

              {/* LIVE PATTERN LAYER */}
              {patternData && patternData.pieces.map((piece, pIdx) => (
                 <g key={pIdx} style={ghostStyle} className="origin-center">
                    {/* Path */}
                    <path 
                      d={piece.path} 
                      fill="none"
                      stroke={isDragging && isDeRoche ? "#00FF00" : strokeColor} 
                      strokeWidth={isDeRoche ? 1.5 : 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={isDragging && !isDeRoche ? "blur(2px)" : (isDeRoche ? "" : "url(#chaosFilter)")}
                    />
                    <text x="500" y="400" fill={strokeColor} fontSize="14" textAnchor="middle">
                       {piece.name.toUpperCase()}
                    </text>

                    {/* Vertices (Clickable for Annotation) */}
                    {isAnnotating && piece.rawPoints?.map((pt, vIdx) => (
                        <circle 
                          key={`v-${vIdx}`}
                          cx={pt.x}
                          cy={pt.y * 1.15} // Scale Y match
                          r="6"
                          fill={isDeRoche ? "#00FF00" : "#C5A059"}
                          className="cursor-pointer hover:stroke-white hover:stroke-2"
                          onClick={(e) => {
                             e.stopPropagation();
                             const rect = e.currentTarget.getBoundingClientRect();
                             handleVertexClick(pIdx, vIdx, rect.left + window.scrollX, rect.top + window.scrollY);
                          }}
                        />
                    ))}

                    {/* Rendered User Annotations */}
                    {userAnnotations.filter(a => a.pieceIndex === pIdx).map((ann) => {
                        const pt = piece.rawPoints?.[ann.pointIndex];
                        if (!pt) return null;
                        const px = pt.x;
                        const py = pt.y * 1.15;
                        
                        return (
                           <g key={ann.id}>
                              <line x1={px} y1={py} x2={px + 20} y2={py - 20} stroke={strokeColor} strokeWidth="0.5" />
                              <text x={px + 25} y={py - 20} fill={strokeColor} fontSize="10" fontFamily="monospace">
                                 {ann.text}
                              </text>
                              <circle cx={px} cy={py} r="2" fill={strokeColor} />
                           </g>
                        );
                    })}
                 </g>
              ))}
           </svg>
        </div>

        {/* CONTROLS (Floating) */}
        {!isAnnotating && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[500px] z-50 flex flex-col gap-4">
               {patternData && (
                  <div className={`backdrop-blur-xl border border-white/20 rounded-md p-2 shadow-2xl ${isDeRoche ? 'bg-white/90' : 'bg-black/90'}`}>
                     <TiledPDFGenerator patternData={patternData} />
                  </div>
               )}

               <div className={`backdrop-blur-xl border border-white/20 rounded-full px-8 py-4 shadow-2xl flex gap-8 ${isDeRoche ? 'bg-white/10' : 'bg-black/60'}`}>
                   <SliderControl label="Tension" value={ghostParams.fitTension} onChange={(v) => handleSliderChange('fitTension', v)} theme={isDeRoche} />
                   <SliderControl label="Gravity" value={ghostParams.gravity} onChange={(v) => handleSliderChange('gravity', v)} theme={isDeRoche} />
                   <SliderControl label="Distortion" value={ghostParams.distortion} onChange={(v) => handleSliderChange('distortion', v)} theme={isDeRoche} />
               </div>
          </div>
        )}

        {/* INPUT MODAL */}
        {activeNoteInput && (
           <div 
             className="absolute z-[200] bg-black border border-white/20 p-3 rounded-lg shadow-xl flex flex-col gap-2 w-48"
             style={{ top: '20%', left: '50%', transform: 'translate(-50%, -50%)' }} // Centralized for simplicity in handling SVG coords
           >
              <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase font-bold mb-1">
                 <span>New Annotation</span>
                 <button onClick={() => setActiveNoteInput(null)}><X size={12}/></button>
              </div>
              <input 
                autoFocus
                type="text" 
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter note..."
                className="bg-white/10 border-none text-white text-xs p-2 rounded focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && saveAnnotation()}
              />
              <button 
                onClick={saveAnnotation}
                className={`w-full py-1 text-[10px] uppercase font-bold rounded ${isDeRoche ? 'bg-white text-black' : 'bg-[#C5A059] text-black'}`}
              >
                Save
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

const SliderControl = ({ label, value, onChange, theme }: { label: string, value: number, onChange: (v: number) => void, theme: boolean }) => (
    <div className="flex-1 flex flex-col gap-2">
        <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest text-white/80">
           <span>{label}</span><span>{value}%</span>
        </div>
        <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} className={`w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer ${theme ? '[&::-webkit-slider-thumb]:bg-white' : '[&::-webkit-slider-thumb]:bg-[#C5A059]'} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full`} />
    </div>
);
