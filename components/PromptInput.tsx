import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Globe, Loader2, Wand2 } from 'lucide-react';
import { BrandArchetype } from '../types';

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  onEnhance: (currentPrompt: string) => Promise<string>;
  onInspire: () => Promise<string>;
  overridePrompt?: string; // Prop to force update the internal state
  isGenerating: boolean;
  loadingStep: string;
  isEnhancing: boolean;
  isGettingInspiration: boolean;
  useGrounding: boolean;
  setUseGrounding: (val: boolean) => void;
  brand: BrandArchetype;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onGenerate,
  onEnhance,
  onInspire,
  overridePrompt,
  isGenerating,
  loadingStep,
  isEnhancing,
  isGettingInspiration,
  useGrounding,
  setUseGrounding,
  brand
}) => {
  const [localPrompt, setLocalPrompt] = useState('');

  // Sync with parent when overridePrompt changes (e.g. from Inspire or Enhance or external setter)
  useEffect(() => {
    if (overridePrompt !== undefined) {
      setLocalPrompt(overridePrompt);
    }
  }, [overridePrompt]);

  const handleEnhanceClick = async () => {
    if (!localPrompt) return;
    try {
      const enhanced = await onEnhance(localPrompt);
      if (enhanced) setLocalPrompt(enhanced);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInspireClick = async () => {
    try {
      const inspired = await onInspire();
      if (inspired) setLocalPrompt(inspired);
    } catch (e) {
      console.error(e);
    }
  };

  const isDeRoche = brand === BrandArchetype.DE_ROCHE;
  const inputClass = isDeRoche 
    ? 'bg-gray-50 border-gray-300 text-black focus:border-black placeholder-gray-400' 
    : 'bg-[#111] border-[#C5A059]/30 text-[#C5A059] focus:border-[#C5A059] placeholder-[#C5A059]/30';
  const buttonClass = isDeRoche
    ? 'bg-black text-white hover:bg-gray-800'
    : 'bg-[#C5A059] text-black hover:bg-white';
  const labelClass = "flex items-center justify-between mb-2 opacity-80 uppercase tracking-widest text-[9px] font-bold";

  return (
    <>
      <section>
         <div className={labelClass}>
            <div className="flex items-center gap-2"><Sparkles size={12} /> <span>Creative Direction</span></div>
            <div className="flex gap-2">
               <button onClick={() => setUseGrounding(!useGrounding)} className={`flex items-center gap-1 transition-all text-[9px] ${useGrounding ? 'opacity-100 text-green-500 font-bold' : 'opacity-50 hover:opacity-100'}`} title="Search Grounding">
                  <Globe size={10} /> {useGrounding ? 'GROUNDED' : 'OFFLINE'}
               </button>
               <button onClick={handleEnhanceClick} disabled={isEnhancing || !localPrompt} className={`hover:underline flex items-center gap-1 ${!localPrompt ? 'opacity-30 cursor-not-allowed' : ''}`}>
                  {isEnhancing ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10} />} Enhance
               </button>
               <button onClick={handleInspireClick} disabled={isGettingInspiration} className="hover:underline flex items-center gap-1">
                  {isGettingInspiration ? <Loader2 size={10} className="animate-spin"/> : <Wand2 size={10} />} Inspire Me
               </button>
            </div>
         </div>
         <textarea 
            value={localPrompt} 
            onChange={(e) => setLocalPrompt(e.target.value)} 
            placeholder="CONCEPT..." 
            className={`w-full h-24 p-2 text-xs border rounded-sm resize-none outline-none ${inputClass}`} 
         />
      </section>

      {/* GENERATE BUTTON */}
      <button 
        onClick={() => onGenerate(localPrompt)} 
        disabled={isGenerating} 
        className={`w-full py-4 text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-xl overflow-hidden relative mt-auto mb-6 ${buttonClass} ${isGenerating ? 'cursor-not-allowed' : ''}`}
      >
        {isGenerating ? (
            <div className="flex w-full justify-between items-center px-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full"></div>
                    <span>FABRICATING</span>
                </div>
                {/* Small box for loading step on the right */}
                <div className={`text-[9px] font-mono opacity-80 border-l border-white/20 pl-3 ml-2 h-full flex items-center px-2 py-0.5 rounded ${isDeRoche ? 'bg-white/20 text-white' : 'bg-black/20 text-black'}`}>
                    {loadingStep}
                </div>
            </div>
        ) : (
            <><Zap size={14} /> Generate Editorial</>
        )}
        
        {/* Subtle Progress Bar Animation */}
        {isGenerating && (
            <div className="absolute top-0 left-0 h-full w-full bg-white/10 animate-[pulse_2s_ease-in-out_infinite] origin-left"></div>
        )}
      </button>
    </>
  );
};
