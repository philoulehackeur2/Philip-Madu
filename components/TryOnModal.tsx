
import React, { useState } from 'react';
import { X, Shirt, User, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { GeneratedImage, SavedModel, BrandArchetype } from '../types';
import { executeVirtualTryOn } from '../services/geminiService';

interface TryOnModalProps {
  garmentImage: GeneratedImage;
  agencyModels: SavedModel[];
  onClose: () => void;
  onSuccess: (newImageUrl: string) => void;
}

export const TryOnModal: React.FC<TryOnModalProps> = ({ garmentImage, agencyModels, onClose, onSuccess }) => {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [fitNotes, setFitNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const isDeRoche = garmentImage.brand === BrandArchetype.DE_ROCHE;
  const accentColor = isDeRoche ? 'text-black' : 'text-[#C5A059]';
  const borderColor = isDeRoche ? 'border-black' : 'border-[#C5A059]';
  const bgColor = isDeRoche ? 'bg-[#f4f4f4]' : 'bg-[#0a0a0a]';

  const selectedModel = agencyModels.find(m => m.id === selectedModelId);

  const handleRunFitting = async () => {
    if (!selectedModel) return;
    setIsProcessing(true);
    setStatus('INITIALIZING VTON PROTOCOL...');

    try {
      // 1. Analyze Geometry
      setStatus('ANALYZING GARMENT GEOMETRY...');
      await new Promise(r => setTimeout(r, 1000)); // UI pacing

      // 2. Execute VTON
      setStatus('MAPPING TO SUBJECT...');
      const newImageUrl = await executeVirtualTryOn(selectedModel.url, garmentImage.url, fitNotes || "High fashion editorial fit.");
      
      setStatus('RENDERING FINAL COMPOSITE...');
      onSuccess(newImageUrl);
      onClose();
    } catch (e: any) {
      console.error(e);
      setStatus('ERROR: FITTING FAILED');
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in zoom-in-95 duration-300 font-mono text-xs">
      <div className={`w-full max-w-4xl h-[80vh] flex flex-col ${bgColor} border ${borderColor} shadow-2xl relative`}>
        
        {/* Header */}
        <div className={`p-6 border-b ${isDeRoche ? 'border-gray-300' : 'border-[#C5A059]/30'} flex justify-between items-center`}>
           <div className="flex items-center gap-3">
              <Shirt size={20} className={accentColor} />
              <div>
                 <h2 className={`text-lg font-bold uppercase tracking-widest ${accentColor}`}>Virtual Fitting Room</h2>
                 <p className="opacity-50 text-[10px]">VERTEX AI // VTON-PREVIEW-08-04</p>
              </div>
           </div>
           <button onClick={onClose} className={`hover:opacity-50 ${accentColor}`}><X size={24}/></button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
           
           {/* Left: Model Selection */}
           <div className={`w-1/3 border-r ${isDeRoche ? 'border-gray-300' : 'border-[#C5A059]/30'} flex flex-col`}>
              <div className="p-4 border-b border-inherit">
                 <h3 className={`font-bold uppercase tracking-wider mb-2 ${accentColor}`}>1. Select Agency Model</h3>
                 <p className="text-[10px] opacity-50">Choose a subject for the fitting.</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                 {agencyModels.length === 0 && (
                    <div className="text-center opacity-50 py-10">NO MODELS IN AGENCY</div>
                 )}
                 {agencyModels.map(model => (
                    <div 
                       key={model.id}
                       onClick={() => !isProcessing && setSelectedModelId(model.id)}
                       className={`flex items-center gap-3 p-2 border rounded cursor-pointer transition-all ${selectedModelId === model.id ? (isDeRoche ? 'bg-black text-white border-black' : 'bg-[#C5A059] text-black border-[#C5A059]') : 'border-transparent hover:bg-white/5 opacity-60 hover:opacity-100'}`}
                    >
                       <img src={model.url} className="w-12 h-12 object-cover rounded-sm bg-gray-800" alt="Model" />
                       <div>
                          <div className="font-bold uppercase">{model.name}</div>
                          <div className="text-[9px] opacity-70 truncate max-w-[120px]">{model.biometricData ? 'BIOMETRICS: LOCKED' : 'STANDARD'}</div>
                       </div>
                       {selectedModelId === model.id && <CheckCircle2 size={16} className="ml-auto" />}
                    </div>
                 ))}
              </div>
           </div>

           {/* Middle: Visualization Area */}
           <div className="flex-1 p-8 flex flex-col items-center justify-center relative bg-black/5">
              <div className="flex items-center gap-8 w-full justify-center">
                 {/* Model Slot */}
                 <div className={`w-48 aspect-[3/4] border-2 border-dashed flex items-center justify-center relative ${isDeRoche ? 'border-gray-300' : 'border-[#C5A059]/30'}`}>
                    {selectedModel ? (
                       <img src={selectedModel.url} className="w-full h-full object-cover" alt="Model" />
                    ) : (
                       <div className="text-center opacity-30">
                          <User size={32} className="mx-auto mb-2"/>
                          <span>SELECT MODEL</span>
                       </div>
                    )}
                    <div className="absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest opacity-50">Subject</div>
                 </div>

                 <ArrowRight size={24} className="opacity-30" />

                 {/* Garment Slot */}
                 <div className={`w-48 aspect-[3/4] border-2 border-dashed flex items-center justify-center relative ${isDeRoche ? 'border-gray-300' : 'border-[#C5A059]/30'}`}>
                    <img src={garmentImage.url} className="w-full h-full object-cover" alt="Garment" />
                    <div className="absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest opacity-50">Garment</div>
                 </div>
              </div>

              {/* Status Overlay */}
              {isProcessing && (
                 <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                    <Loader2 size={48} className={`animate-spin mb-4 ${isDeRoche ? 'text-white' : 'text-[#C5A059]'}`} />
                    <p className="text-sm font-bold uppercase tracking-widest text-white animate-pulse">{status}</p>
                 </div>
              )}
           </div>

           {/* Right: Controls */}
           <div className={`w-1/4 border-l ${isDeRoche ? 'border-gray-300' : 'border-[#C5A059]/30'} p-6 flex flex-col`}>
              <h3 className={`font-bold uppercase tracking-wider mb-4 ${accentColor}`}>Fitting Notes</h3>
              <textarea 
                 value={fitNotes}
                 onChange={(e) => setFitNotes(e.target.value)}
                 placeholder="e.g. Tuck in the shirt, roll up sleeves..."
                 className={`w-full h-32 bg-transparent border p-3 rounded-sm resize-none focus:outline-none mb-4 ${isDeRoche ? 'border-gray-300 placeholder-gray-500 text-black' : 'border-[#C5A059]/30 placeholder-[#C5A059]/30 text-[#C5A059]'}`}
                 disabled={isProcessing}
              />
              
              <div className="mt-auto">
                 <button 
                    onClick={handleRunFitting}
                    disabled={!selectedModel || isProcessing}
                    className={`w-full py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                        !selectedModel 
                           ? 'opacity-50 cursor-not-allowed border border-current' 
                           : (isDeRoche ? 'bg-black text-white hover:bg-gray-800' : 'bg-[#C5A059] text-black hover:bg-white')
                    }`}
                 >
                    {isProcessing ? "FITTING..." : <><Sparkles size={14} /> RUN VTON</>}
                 </button>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};
