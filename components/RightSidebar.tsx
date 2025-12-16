
import React, { useState } from 'react';
import { GeneratedImage, BrandArchetype } from '../types';
import { Loader2, Sparkles, FileText, X, Wand2, PenTool, Copy, Video, Waves, GitBranch, Zap, Split, TestTube, Edit3, Palette, Ruler, Image as ImageIcon, Maximize2, UserPlus } from 'lucide-react';
import { generateConceptSketch, modifyGarmentFabric } from '../services/geminiService';
import { PatternCutter } from './PatternCutter';

interface RightSidebarProps {
  selectedImage: GeneratedImage | null;
  onClose: () => void;
  onUpdateImage: (id: string, newUrl: string) => void;
  onAddSketch: (originalImage: GeneratedImage, sketchUrl: string) => void;
  onEditStart: (id: string, prompt: string) => Promise<string>;
  onGenerateTechPack: (image: GeneratedImage) => void;
  isGeneratingTechPack: boolean;
  onGenerateVariations: (image: GeneratedImage) => void;
  isGeneratingVariations: boolean;
  onGenerateVideo: (image: GeneratedImage) => void;
  isGeneratingVideo: boolean;
  onSimulateFabric: (image: GeneratedImage, fabric: string) => void;
  isSimulatingFabric: boolean;
  onGenerateIteration: (mode: 'EVOLVE' | 'MUTATE' | 'BREAK') => void;
  onGenerateStrategy: (image: GeneratedImage) => void;
  isGeneratingStrategy: boolean;
  onOpenStudio: () => void;
  onSaveAsModel?: (image: GeneratedImage) => void;
}

export const RightSidebar = React.memo<RightSidebarProps>(({
  selectedImage,
  onClose,
  onUpdateImage,
  onAddSketch,
  onEditStart,
  onGenerateTechPack,
  isGeneratingTechPack,
  onGenerateVariations,
  isGeneratingVariations,
  onGenerateVideo,
  isGeneratingVideo,
  onSimulateFabric,
  isSimulatingFabric,
  onGenerateIteration,
  onGenerateStrategy,
  isGeneratingStrategy,
  onOpenStudio,
  onSaveAsModel
}) => {
  const [activeTab, setActiveTab] = useState<'ATELIER' | 'CONSTRUCTION'>('ATELIER');
  const [showPatternCutter, setShowPatternCutter] = useState(false);
  
  // Atelier State
  const [editPrompt, setEditPrompt] = useState('');
  const [hexColor, setHexColor] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSketching, setIsSketching] = useState(false);
  const [isIterating, setIsIterating] = useState(false);
  
  // Fabric Lab State
  const [fabricPrompt, setFabricPrompt] = useState('Silk Charmeuse');
  const [fabricWeight, setFabricWeight] = useState('Medium');
  const [fabricStructure, setFabricStructure] = useState('Woven');
  const [isRematerializing, setIsRematerializing] = useState(false);

  if (!selectedImage) return null;

  const isChaos = selectedImage.brand === BrandArchetype.CHAOSCHICC;
  const borderColor = isChaos ? 'border-[#C5A059]' : 'border-white/10';
  const bgColor = isChaos ? 'bg-[#0a0a0a]' : 'bg-[#0a0a0a]';
  const accentColor = isChaos ? 'text-[#C5A059]' : 'text-white';
  
  // Basic Color Presets for Quick Selection
  const COLOR_PRESETS = isChaos 
    ? ['#4F2170', '#9E8A66', '#8B0000', '#000000'] 
    : ['#232222', '#A7A8AA', '#E6E1E6', '#FFFFFF'];

  const handleEditSubmit = async () => {
    if (!editPrompt.trim()) return;
    setIsEditing(true);
    try {
      const newUrl = await onEditStart(selectedImage.id, editPrompt);
      onUpdateImage(selectedImage.id, newUrl);
      setEditPrompt('');
    } catch (e: any) {
      if (e.name !== 'AbortError') {
         alert("Edit failed: " + (e.message || "Unknown error"));
      }
    } finally {
      setIsEditing(false);
    }
  };
  
  const handleApplyColor = async () => {
     if (!hexColor.trim()) return;
     setIsEditing(true);
     try {
       // Apply color grading via edit
       const newUrl = await onEditStart(selectedImage.id, `Apply a subtle ${hexColor} color grade and tint to the entire image. Maintain cinematic lighting.`);
       onUpdateImage(selectedImage.id, newUrl);
     } catch (e: any) {
       if (e.name !== 'AbortError') {
          alert("Color grading failed");
       }
     } finally {
       setIsEditing(false);
     }
  };

  const handleGenerateSketch = async () => {
    setIsSketching(true);
    try {
      const sketchUrl = await generateConceptSketch(selectedImage.url, selectedImage.brand);
      onAddSketch(selectedImage, sketchUrl);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
         alert("Sketch generation failed");
      }
    } finally {
      setIsSketching(false);
    }
  };

  const handleRematerialize = async () => {
    if (!fabricPrompt) return;
    setIsRematerializing(true);
    try {
        const fullFabricDesc = `${fabricPrompt}, ${fabricWeight} weight, ${fabricStructure} structure`;
        const newUrl = await modifyGarmentFabric(selectedImage.url, fullFabricDesc, fabricStructure, fabricWeight);
        onUpdateImage(selectedImage.id, newUrl);
    } catch(e: any) {
        if (e.name !== 'AbortError') {
           alert("Fabric modification failed");
        }
    } finally {
        setIsRematerializing(false);
    }
  };
  
  const triggerIteration = async (mode: 'EVOLVE' | 'MUTATE' | 'BREAK') => {
      setIsIterating(true);
      try {
          await onGenerateIteration(mode);
      } catch(e: any) {
          if (e.name !== 'AbortError') {
             console.error(e);
          }
      } finally {
          setIsIterating(false);
      }
  };

  return (
    <>
    {/* Full Screen Pattern Cutter Overlay */}
    {showPatternCutter && (
       <PatternCutter 
          brand={selectedImage.brand} 
          lookData={selectedImage.lookData}
          onClose={() => setShowPatternCutter(false)} 
       />
    )}

    <aside className={`w-[360px] h-screen border-l ${borderColor} ${bgColor} flex flex-col fixed right-0 top-0 z-30 transition-all duration-300 shadow-2xl font-mono`}>
      {/* Header Tabs */}
      <div className="flex border-b border-white/10">
         <button 
            onClick={() => setActiveTab('ATELIER')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'ATELIER' ? (isChaos ? 'bg-[#C5A059] text-black' : 'bg-white text-black') : 'text-gray-500 hover:text-white'}`}
         >
            Atelier
         </button>
         <button 
            onClick={() => setActiveTab('CONSTRUCTION')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'CONSTRUCTION' ? (isChaos ? 'bg-[#C5A059] text-black' : 'bg-white text-black') : 'text-gray-500 hover:text-white'}`}
         >
            Construction
         </button>
         <button onClick={onClose} className="px-4 text-gray-500 hover:text-white border-l border-white/10">
            <X size={16} />
         </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        
        {/* Preview is always visible */}
        <div className="space-y-2">
          <div className={`relative aspect-[3/4] w-full border ${borderColor} rounded-sm overflow-hidden group`}>
             {selectedImage.videoUrl ? (
                <video src={selectedImage.videoUrl} className="w-full h-full object-cover" autoPlay loop muted controls />
             ) : (
                <img src={selectedImage.url} className="w-full h-full object-cover" />
             )}
             
             {/* Studio Trigger Button */}
             <button 
                onClick={onOpenStudio}
                className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 text-[9px] uppercase font-bold tracking-wider hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100"
             >
                <Maximize2 size={12} /> Enter Studio
             </button>
          </div>
          
          {/* RECRUIT TO AGENCY BUTTON */}
          {onSaveAsModel && (
             <button 
                onClick={() => onSaveAsModel(selectedImage)}
                className={`w-full py-2 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest border rounded-sm transition-all hover:bg-white/10 ${borderColor} ${accentColor}`}
                title="Save this character as a reusable model for future generations"
             >
                <UserPlus size={12} /> Recruit to Agency
             </button>
          )}
        </div>

        {/* --- ATELIER TAB (Creative) --- */}
        {activeTab === 'ATELIER' && (
           <>
             {/* 1. Magic Edit */}
             <div className="space-y-3">
               <div className="flex items-center gap-2 text-white/80">
                  <Edit3 size={14} className={accentColor} />
                  <label className="text-xs uppercase tracking-widest font-bold">Magic Edit</label>
               </div>
               <div className="relative">
                 <input 
                   type="text" 
                   value={editPrompt}
                   onChange={(e) => setEditPrompt(e.target.value)}
                   placeholder="Modify specifics..."
                   className={`w-full p-3 pr-10 text-xs bg-transparent border rounded-sm focus:outline-none ${isChaos ? 'border-[#C5A059]/40 text-[#C5A059] placeholder-[#C5A059]/30' : 'border-white/20 text-white placeholder-gray-600'}`}
                   onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
                 />
                 <button 
                   onClick={handleEditSubmit}
                   disabled={isEditing}
                   className={`absolute right-1 top-1 p-2 rounded-sm ${isChaos ? 'text-[#C5A059]' : 'text-white'}`}
                 >
                   {isEditing ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12} />}
                 </button>
               </div>
             </div>
             
             {/* 2. Iteration (Restored) */}
             <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-white/80">
                    <GitBranch size={14} className={accentColor} />
                    <label className="text-xs uppercase tracking-widest font-bold">Evolution Protocol</label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => triggerIteration('EVOLVE')} disabled={isIterating} className={`py-2 text-[9px] font-bold uppercase border rounded-sm hover:bg-white/10 ${isChaos ? 'border-[#C5A059] text-[#C5A059]' : 'border-white text-white'}`}>
                        {isIterating ? <Loader2 className="animate-spin mx-auto" size={10}/> : 'Evolve'}
                    </button>
                    <button onClick={() => triggerIteration('MUTATE')} disabled={isIterating} className={`py-2 text-[9px] font-bold uppercase border rounded-sm hover:bg-white/10 ${isChaos ? 'border-[#C5A059] text-[#C5A059]' : 'border-white text-white'}`}>
                        {isIterating ? <Loader2 className="animate-spin mx-auto" size={10}/> : 'Mutate'}
                    </button>
                    <button onClick={() => triggerIteration('BREAK')} disabled={isIterating} className={`py-2 text-[9px] font-bold uppercase border rounded-sm hover:bg-white/10 ${isChaos ? 'border-[#C5A059] text-[#C5A059]' : 'border-white text-white'}`}>
                        {isIterating ? <Loader2 className="animate-spin mx-auto" size={10}/> : 'Break'}
                    </button>
                </div>
             </div>

             {/* 3. Chromatic Grading (Restored Swatches) */}
             <div className="space-y-3 pt-4 border-t border-white/5">
               <div className="flex items-center gap-2 text-white/80">
                  <Palette size={14} className={accentColor} />
                  <label className="text-xs uppercase tracking-widest font-bold">Chromatic Grading</label>
               </div>
               
               {/* Quick Swatches */}
               <div className="flex gap-2 mb-2">
                  {COLOR_PRESETS.map(c => (
                     <button 
                        key={c} 
                        onClick={() => setHexColor(c)} 
                        className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform" 
                        style={{ backgroundColor: c }}
                     />
                  ))}
               </div>

               <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    placeholder="#HEX"
                    className={`flex-1 p-2 text-xs bg-transparent border rounded-sm focus:outline-none uppercase font-mono ${isChaos ? 'border-[#C5A059]/40 text-[#C5A059] placeholder-[#C5A059]/30' : 'border-white/20 text-white placeholder-gray-600'}`}
                  />
                  <button 
                     onClick={handleApplyColor}
                     disabled={isEditing}
                     className={`px-3 py-2 text-[9px] font-bold uppercase border rounded-sm hover:bg-white/10 transition-colors ${isChaos ? 'border-[#C5A059] text-[#C5A059]' : 'border-white text-white'}`}
                  >
                     Tint
                  </button>
               </div>
            </div>

             {/* 4. Media Expansion */}
             <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-white/80">
                    <Video size={14} className={accentColor} />
                    <label className="text-xs uppercase tracking-widest font-bold">Media Expansion</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => onGenerateVideo(selectedImage)}
                        disabled={isGeneratingVideo}
                        className={`py-3 flex flex-col items-center justify-center gap-1 border rounded-sm text-[9px] uppercase font-bold transition-all ${isGeneratingVideo ? 'opacity-50' : 'hover:bg-white/10'} ${isChaos ? 'border-[#C5A059]/30 text-[#C5A059]' : 'border-white/20 text-white'}`}
                    >
                        {isGeneratingVideo ? <Loader2 size={14} className="animate-spin"/> : <Video size={14} />}
                        <span>Gen Video</span>
                    </button>
                    <button 
                        onClick={() => onGenerateVariations(selectedImage)}
                        disabled={isGeneratingVariations}
                        className={`py-3 flex flex-col items-center justify-center gap-1 border rounded-sm text-[9px] uppercase font-bold transition-all ${isGeneratingVariations ? 'opacity-50' : 'hover:bg-white/10'} ${isChaos ? 'border-[#C5A059]/30 text-[#C5A059]' : 'border-white/20 text-white'}`}
                    >
                        {isGeneratingVariations ? <Loader2 size={14} className="animate-spin"/> : <Copy size={14} />}
                        <span>Variations</span>
                    </button>
                </div>
             </div>

             {/* 5. Fabric Lab */}
             <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-white/80">
                   <TestTube size={14} className={isChaos ? "text-[#C5A059]" : "text-white"} />
                   <label className="text-xs uppercase tracking-widest font-bold">Fabric Physics Lab</label>
                </div>
                
                <div className="space-y-2">
                   <div className="grid grid-cols-2 gap-2">
                      <select 
                         value={fabricStructure}
                         onChange={(e) => setFabricStructure(e.target.value)}
                         className={`p-1.5 text-[10px] bg-transparent border rounded-sm focus:outline-none ${isChaos ? 'border-[#C5A059]/40 text-[#C5A059]' : 'border-white/20 text-white'}`}
                      >
                         <option value="Woven" className="bg-[#111]">Woven</option>
                         <option value="Knit" className="bg-[#111]">Knit</option>
                         <option value="Non-Woven" className="bg-[#111]">Non-Woven</option>
                         <option value="Composite" className="bg-[#111]">Composite</option>
                      </select>
                      <select 
                         value={fabricWeight}
                         onChange={(e) => setFabricWeight(e.target.value)}
                         className={`p-1.5 text-[10px] bg-transparent border rounded-sm focus:outline-none ${isChaos ? 'border-[#C5A059]/40 text-[#C5A059]' : 'border-white/20 text-white'}`}
                      >
                         <option value="Sheer" className="bg-[#111]">Sheer</option>
                         <option value="Medium" className="bg-[#111]">Medium</option>
                         <option value="Heavy" className="bg-[#111]">Heavy</option>
                      </select>
                   </div>
                   
                   <input 
                     type="text" 
                     value={fabricPrompt} 
                     onChange={(e) => setFabricPrompt(e.target.value)}
                     placeholder="e.g. Bio-luminescent Mycelium Leather"
                     className={`w-full p-2 text-xs bg-transparent border rounded-sm focus:outline-none ${isChaos ? 'border-[#C5A059]/40 text-[#C5A059] placeholder-[#C5A059]/50' : 'border-white/20 text-white placeholder-gray-600'}`}
                   />

                   <div className="grid grid-cols-2 gap-2 mt-2">
                       <button 
                          onClick={handleRematerialize}
                          disabled={isRematerializing}
                          className={`w-full py-2 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 rounded-sm border ${isRematerializing ? 'opacity-50' : ''} ${isChaos ? 'border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10' : 'border-white text-white hover:bg-white/10'}`}
                       >
                          {isRematerializing ? <Loader2 className="animate-spin" size={10} /> : <Wand2 size={10} />}
                          Rematerialize
                       </button>
                       <button 
                          onClick={() => onSimulateFabric(selectedImage, `${fabricPrompt} (${fabricWeight}, ${fabricStructure})`)}
                          disabled={isSimulatingFabric}
                          className={`w-full py-2 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 rounded-sm border ${isSimulatingFabric ? 'opacity-50' : ''} ${isChaos ? 'border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10' : 'border-white text-white hover:bg-white/10'}`}
                       >
                          {isSimulatingFabric ? <Loader2 className="animate-spin" size={10} /> : <Waves size={10} />}
                          Simulate Motion
                       </button>
                   </div>
                </div>
             </div>
           </>
        )}

        {/* --- CONSTRUCTION TAB (Technical) --- */}
        {activeTab === 'CONSTRUCTION' && (
           <>
             {/* 1. Technical Drawing (Restored) */}
             <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/80">
                   <PenTool size={14} className={accentColor} />
                   <label className="text-xs uppercase tracking-widest font-bold">Technical Illustration</label>
                </div>
                <button 
                   onClick={handleGenerateSketch}
                   disabled={isSketching}
                   className={`w-full py-3 flex items-center justify-center gap-2 border rounded-sm text-xs font-bold uppercase transition-all ${isChaos ? 'border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-black' : 'border-white text-white hover:bg-white hover:text-black'}`}
                >
                   {isSketching ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14} />}
                   Generate Flat Sketch
                </button>
             </div>

             {/* 2. Pattern Cutter Trigger */}
             <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-white/80">
                   <Ruler size={14} className={accentColor} />
                   <label className="text-xs uppercase tracking-widest font-bold">Pattern Engineering</label>
                </div>
                <button 
                   onClick={() => setShowPatternCutter(true)}
                   className={`w-full py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 text-black transition-all ${isChaos ? 'bg-[#C5A059] hover:bg-white' : 'bg-white hover:bg-gray-200'}`}
                >
                   <PenTool size={16} /> Open Pattern Cutter
                </button>
             </div>

             {/* 3. Tech Pack */}
             <div className="space-y-3 pt-4 border-t border-white/5">
                <button 
                   onClick={() => onGenerateTechPack(selectedImage)}
                   disabled={isGeneratingTechPack}
                   className="w-full py-3 border border-white/20 text-white hover:bg-white/10 text-xs font-bold uppercase flex items-center justify-center gap-2"
                >
                   {isGeneratingTechPack ? <Loader2 className="animate-spin" size={14}/> : <FileText size={14} />} 
                   Generate Tech Pack
                </button>
             </div>
           </>
        )}

      </div>
    </aside>
    </>
  );
});
