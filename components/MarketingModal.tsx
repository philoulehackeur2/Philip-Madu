
import React from 'react';
import { X, Lightbulb, Image as ImageIcon } from 'lucide-react';
import { MarketingStrategy, BrandArchetype } from '../types';

interface MarketingModalProps {
  strategy: MarketingStrategy | null;
  isLoading: boolean;
  brand: BrandArchetype;
  onClose: () => void;
  onVisualize: (prompt: string) => void;
}

export const MarketingModal: React.FC<MarketingModalProps> = ({ 
  strategy, 
  isLoading, 
  brand,
  onClose,
  onVisualize 
}) => {
  if (!strategy && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-mono">
      <div className={`max-w-2xl w-full border p-8 shadow-2xl relative ${brand === BrandArchetype.DE_ROCHE ? 'bg-[#1a1a1a] border-white/10' : 'bg-[#000] border-[#C5A059]'}`}>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-full ${brand === BrandArchetype.DE_ROCHE ? 'bg-white/5' : 'bg-[#C5A059]/20'}`}>
            <Lightbulb size={24} className={brand === BrandArchetype.DE_ROCHE ? 'text-gray-300' : 'text-[#C5A059]'} />
          </div>
          <div>
            <h3 className="text-sm uppercase tracking-widest text-gray-500">Marketing Lenses</h3>
            <h2 className={`text-2xl font-header ${brand === BrandArchetype.DE_ROCHE ? 'text-white' : 'text-[#C5A059]'}`}>{isLoading ? 'Analyzing Brand DNA...' : strategy?.title}</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <div className={`w-12 h-12 border-2 border-t-transparent rounded-full animate-spin ${brand === BrandArchetype.DE_ROCHE ? 'border-white' : 'border-[#C5A059]'}`}></div>
            <p className="text-sm text-gray-400 font-mono animate-pulse">Consulting the {brand === BrandArchetype.DE_ROCHE ? 'Persona' : 'Shadow'}...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-300 leading-relaxed font-light text-lg">
              {strategy?.description}
            </p>

            <div className={`bg-black/20 p-6 rounded-sm border ${brand === BrandArchetype.DE_ROCHE ? 'border-white/5' : 'border-[#C5A059]/20'}`}>
              <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Tactical Execution</h4>
              <ul className="space-y-3">
                {strategy?.tactics.map((tactic, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${brand === BrandArchetype.DE_ROCHE ? 'bg-gray-500' : 'bg-[#C5A059]'}`}></span>
                    {tactic}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onVisualize(strategy?.title + ". " + strategy?.description || "")}
              className={`w-full py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all ${brand === BrandArchetype.DE_ROCHE ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#C5A059] text-black hover:bg-[#E6E1E7]'}`}
            >
              <ImageIcon size={18} />
              Visualize this Concept
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
