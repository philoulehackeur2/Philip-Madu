
import React, { useState, useEffect } from 'react';
import { Type, ArrowRight, X, Cpu, Quote } from 'lucide-react';
import { BrandArchetype, CollectionLook, NarrativeData } from '../types';

interface NarrativeEngineProps {
  look: CollectionLook;
  brand: BrandArchetype;
  onClose: () => void;
  onSendToProduction: (narrative: NarrativeData) => void;
}

export const NarrativeEngine: React.FC<NarrativeEngineProps> = ({ look, brand, onClose, onSendToProduction }) => {
  const [isGenerating, setIsGenerating] = useState(true);
  const [narrative, setNarrative] = useState<NarrativeData | null>(null);

  const isDeRoche = brand === BrandArchetype.DE_ROCHE;

  useEffect(() => {
    // SIMULATE AI GENERATION
    const timer = setTimeout(() => {
      if (isDeRoche) {
        setNarrative({
          headline: `OBJECT ${look.number.toString().padStart(3, '0')}: STRUCTURAL COAT`,
          technicalDescription: `Material density 800GSM. Weave structure: Twill. Architectural shoulder pad placement at 15 degrees.`,
          mood: "COLD. PRECISE. MONOLITHIC."
        });
      } else {
        setNarrative({
          headline: "THE FABRIC SCREAMS GOLD",
          technicalDescription: "Bias cut silk struggling against gravity. Asymmetric distortion index: 45%.",
          mood: "ROYAL ANARCHY. VIBRATIONAL."
        });
      }
      setIsGenerating(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [look, brand, isDeRoche]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
      <div className={`relative max-w-lg w-full p-8 border-2 shadow-2xl ${isDeRoche ? 'bg-[#232222] border-[#A7A8AA]' : 'bg-[#0a0a0a] border-[#C5A059]'}`}>
        
        {/* Decorative Elements */}
        {isDeRoche && (
          <>
            <div className="absolute top-2 left-2 text-[10px] font-mono text-[#A7A8AA]">SYS.TXT.GEN.v4</div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-[#A7A8AA]/10"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-[#A7A8AA]/10"></div>
          </>
        )}
        {!isDeRoche && (
          <>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#C5A059] opacity-50 blur-xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cGF0aCBkPSJNMCAyMGwyMCAyMCAyMC0yMHoiIGZpbGw9IiNDNUEwNTkiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')]"></div>
          </>
        )}

        <button onClick={onClose} className={`absolute top-4 right-4 hover:scale-110 transition-transform ${isDeRoche ? 'text-[#A7A8AA]' : 'text-[#C5A059]'}`}>
          <X size={24} />
        </button>

        {/* HEADER */}
        <div className="mb-8 flex items-center gap-3">
          {isGenerating ? (
            <Cpu size={24} className={`animate-spin ${isDeRoche ? 'text-white' : 'text-[#C5A059]'}`} />
          ) : (
            <Type size={24} className={isDeRoche ? 'text-white' : 'text-[#C5A059]'} />
          )}
          <h2 className={`text-xl tracking-widest uppercase font-header ${isDeRoche ? 'text-white' : 'text-[#E6E1E7]'}`}>
            {isGenerating ? 'ANALYZING SEMANTICS...' : 'NARRATIVE ENGINE'}
          </h2>
        </div>

        {/* CONTENT */}
        <div className="min-h-[200px] flex flex-col justify-center">
          {isGenerating ? (
            <div className="space-y-2">
              <div className={`h-2 w-full ${isDeRoche ? 'bg-[#A7A8AA]/20' : 'bg-[#C5A059]/20'} animate-pulse`}></div>
              <div className={`h-2 w-3/4 ${isDeRoche ? 'bg-[#A7A8AA]/20' : 'bg-[#C5A059]/20'} animate-pulse delay-75`}></div>
              <div className={`h-2 w-1/2 ${isDeRoche ? 'bg-[#A7A8AA]/20' : 'bg-[#C5A059]/20'} animate-pulse delay-150`}></div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-2">
              <div>
                <label className={`text-[10px] uppercase tracking-widest mb-1 block ${isDeRoche ? 'text-[#A7A8AA]' : 'text-[#C5A059]'}`}>Headline</label>
                <h1 className={`text-2xl leading-tight font-header ${isDeRoche ? 'text-white' : 'text-[#C5A059]'}`}>
                  {narrative?.headline}
                </h1>
              </div>
              
              <div className={`p-4 border-l-2 ${isDeRoche ? 'border-[#A7A8AA] bg-black/20' : 'border-[#C5A059] bg-[#C5A059]/10'}`}>
                <Quote size={16} className={`mb-2 opacity-50 ${isDeRoche ? 'text-white' : 'text-[#C5A059]'}`} />
                <p className={`text-xs leading-relaxed font-mono ${isDeRoche ? 'text-[#A7A8AA]' : 'text-[#E6E1E7]'}`}>
                  {narrative?.technicalDescription}
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono opacity-60 text-white">
                 <span>SENTIMENT: {narrative?.mood}</span>
                 <span>ID: {look.id}</span>
              </div>
            </div>
          )}
        </div>

        {/* ACTION */}
        <button
          onClick={() => narrative && onSendToProduction(narrative)}
          disabled={isGenerating}
          className={`w-full py-4 mt-8 flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest transition-all ${
            isDeRoche 
              ? 'bg-[#A7A8AA] text-[#232222] hover:bg-white' 
              : 'bg-[#C5A059] text-black hover:bg-white hover:text-black border border-[#C5A059]'
          }`}
        >
          <span>Send to Production</span>
          <ArrowRight size={16} />
        </button>

      </div>
    </div>
  );
};
