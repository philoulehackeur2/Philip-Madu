
import React, { useState, useEffect } from 'react';
import { Sliders, Palette, ChevronLeft, Layers, Zap, Command, Lock, Wand2 } from 'lucide-react';
import { GeneratedImage, BrandArchetype, HarmonyRule } from '../types';
import { PatternCutter } from './PatternCutter';
import { ColorHarmonyWheel } from './ColorHarmonyWheel';

interface ImmersiveStudioProps {
  image: GeneratedImage;
  onClose: () => void;
  brand: BrandArchetype;
  onApplyToImage?: (prompt: string) => void;
}

// --- SPECIFIC BRAND PANTONE ANCHORS ---
const BRAND_KEYS = [
  { name: 'Royal Purple', hex: '#4F2170', pantone: '2617 C' },
  { name: 'Void Black', hex: '#232222', pantone: 'Neutral Black C' },
  { name: 'Antique Gold', hex: '#9E8A66', pantone: '7554 C' },
  { name: 'Concrete', hex: '#A7A8AA', pantone: 'Cool Gray 6 C' },
  { name: 'Ghost White', hex: '#E6E1E6', pantone: '663 C' },
];

// --- SPECIFIC BRAND RECIPES ---
const BRAND_RECIPES = {
  [BrandArchetype.DE_ROCHE]: [
    { name: 'The Signature', colors: ['#232222', '#A7A8AA', '#E6E1E6'] }, // Void, Silver, White
    { name: 'Industrial Zen', colors: ['#A7A8AA', '#8C8C8C', '#232222'] }, // Concrete Mono
    { name: 'Deep Foundation', colors: ['#000000', '#232222', '#1a1a1a'] }  // All Blacks
  ],
  [BrandArchetype.CHAOSCHICC]: [
    { name: 'Royal Anarchy', colors: ['#4F2170', '#9E8A66', '#000000'] }, // Purple, Gold, Black
    { name: 'Gilded Rot', colors: ['#9E8A66', '#4F2170', '#8B0000'] },    // Gold, Purple, Red
    { name: 'Vandal', colors: ['#000000', '#E6E1E6', '#FF0000'] }         // Black, White, Red Spray
  ]
};

const THEORY_RULES: { id: HarmonyRule, label: string }[] = [
  { id: 'MONOCHROMATIC', label: 'Mono' },
  { id: 'ANALOGOUS', label: 'Analogous' },
  { id: 'TRIAD', label: 'Triad' },
  { id: 'SPLIT_COMPLEMENTARY', label: 'Split' },
];

export const ImmersiveStudio: React.FC<ImmersiveStudioProps> = ({ image, onClose, brand, onApplyToImage }) => {
  const [xRayValue, setXRayValue] = useState(0); 
  const [selectedKeyColor, setSelectedKeyColor] = useState(BRAND_KEYS[0]);
  
  // HARMONY ENGINE STATE
  const [harmonyMode, setHarmonyMode] = useState<'THEORY' | 'BRAND'>('BRAND');
  const [selectedRule, setSelectedRule] = useState<HarmonyRule>('MONOCHROMATIC');
  
  // State for Brand Recipe selection
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  
  const [activePalette, setActivePalette] = useState<string[]>([]);
  const [gradingOpacity, setGradingOpacity] = useState(30); 
  
  const isDeRoche = brand === BrandArchetype.DE_ROCHE;
  const currentBrandRecipes = BRAND_RECIPES[brand] || BRAND_RECIPES[BrandArchetype.CHAOSCHICC];

  // Logic to handle Palette updates based on Mode
  useEffect(() => {
    if (harmonyMode === 'BRAND') {
      const recipe = currentBrandRecipes[selectedRecipeIndex];
      setActivePalette(recipe.colors);
    }
    // Theory mode updates are handled via callback from Wheel
  }, [harmonyMode, selectedRecipeIndex, brand]);

  const handleApply = () => {
      if (onApplyToImage) {
          const colors = activePalette.join(', ');
          const prompt = `Apply a color grading of [${colors}] with ${gradingOpacity}% intensity. The look should be consistent with the current lighting but tinted with these specific hues.`;
          onApplyToImage(prompt);
      }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDeRoche ? 'theme-deroche' : 'theme-chaos'} bg-[#050505]`}>
      
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-start pointer-events-none">
         <div className="pointer-events-auto">
            <button onClick={onClose} className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded-full backdrop-blur-md text-white border border-white/10">
               <ChevronLeft size={16} /> Back to Architect
            </button>
         </div>
         <div className="glass-panel px-4 py-2 rounded-full flex gap-4 pointer-events-auto border border-white/20 bg-black/20 backdrop-blur-md">
            <div className="text-[10px] font-bold uppercase flex items-center gap-2 text-white">
               <Sliders size={12} /> Tech Lens: {xRayValue}%
            </div>
         </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
         {/* Canvas */}
         <div className="relative h-[60vh] md:h-[70vh] aspect-[3/4] md:aspect-[3/4] max-w-4xl shadow-2xl transition-all duration-500 rounded-lg overflow-hidden border border-white/10 mt-[-50px]">
            {/* Layer 1: Photo + Live Grade */}
            <div 
               className="absolute inset-0 z-10 transition-opacity duration-100 ease-linear"
               style={{ opacity: 1 - (xRayValue / 100) }}
            >
               <img src={image.url} className="w-full h-full object-cover" />
               {activePalette.length > 0 && (
                 <div 
                    className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay transition-colors duration-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${activePalette[0]} 0%, ${activePalette[1] || activePalette[0]} 100%)`,
                      opacity: gradingOpacity / 100
                    }}
                 ></div>
               )}
               {activePalette.length > 0 && (
                 <div 
                    className="absolute inset-0 z-20 pointer-events-none mix-blend-soft-light transition-colors duration-300"
                    style={{ 
                      backgroundColor: activePalette[0],
                      opacity: (gradingOpacity / 100) * 0.5
                    }}
                 ></div>
               )}
            </div>

            {/* Layer 2: Tech Pattern */}
            <div 
               className="absolute inset-0 z-30 pointer-events-none bg-black"
               style={{ opacity: xRayValue / 100 }}
            >
               <div className="w-full h-full relative">
                  <PatternCutter brand={brand} lookData={image.lookData} onClose={() => {}} />
               </div>
            </div>
         </div>

         {/* SLIDERS (X-Ray & Grade) */}
         <div className="absolute right-8 top-1/2 -translate-x-1/2 h-48 glass-panel rounded-full p-2 flex flex-col items-center z-50 border border-white/20 bg-black/40 backdrop-blur-md">
            <input type="range" min="0" max="100" value={xRayValue} onChange={(e) => setXRayValue(Number(e.target.value))} className="h-full appearance-none bg-transparent w-1 cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any} />
            <div className="mt-4 text-[9px] uppercase font-bold opacity-50 rotate-90 whitespace-nowrap text-white">Scan</div>
         </div>
         <div className="absolute left-8 top-1/2 -translate-y-1/2 h-48 glass-panel rounded-full p-2 flex flex-col items-center z-50 border border-white/20 bg-black/40 backdrop-blur-md">
            <input type="range" min="0" max="100" value={gradingOpacity} onChange={(e) => setGradingOpacity(Number(e.target.value))} className="h-full appearance-none bg-transparent w-1 cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-current text-[#C5A059]" style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any} />
            <div className="mt-4 text-[9px] uppercase font-bold opacity-50 rotate-90 whitespace-nowrap text-[#C5A059]">Grade</div>
         </div>

         {/* --- HARMONY CONSOLE --- */}
         <div className="absolute bottom-0 left-0 w-full z-50 bg-black/90 border-t border-white/10 backdrop-blur-xl p-6 pb-8 animate-in slide-in-from-bottom-full duration-500">
            <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
               
               {/* 1. BRAND ANCHORS (PANTONE KEYS) */}
               <div className="flex flex-col gap-3 items-center md:items-start">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                     <Palette size={12}/> Brand Key (Pantone)
                  </span>
                  <div className="flex gap-3">
                     {BRAND_KEYS.map((bk) => {
                        const isSelected = selectedKeyColor.hex === bk.hex;
                        return (
                           <button
                              key={bk.hex}
                              onClick={() => { setSelectedKeyColor(bk); if(harmonyMode === 'BRAND') setHarmonyMode('THEORY'); }} // Auto-switch to theory if picking raw key
                              className={`w-10 h-10 rounded-full border transition-all relative group ${isSelected ? 'border-white scale-110 ring-2 ring-offset-2 ring-offset-black ring-white' : 'border-white/20 opacity-60 hover:opacity-100 hover:scale-105'}`}
                              style={{ backgroundColor: bk.hex }}
                              title={`${bk.name} (${bk.pantone})`}
                           >
                              {isSelected && <div className="absolute inset-0 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>}
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">{bk.name}</span>
                           </button>
                        );
                     })}
                  </div>
               </div>

               {/* 2. THE WHEEL (Visualizer) */}
               <div className="relative -mt-20 md:-mt-24 mb-4 md:mb-0 group transform hover:scale-110 transition-transform duration-300">
                  <ColorHarmonyWheel 
                     brandMode={brand === BrandArchetype.DE_ROCHE ? 'DE_ROCHE' : 'CHAOSCHICC'}
                     rule={selectedRule}
                     fixedPalette={harmonyMode === 'BRAND' ? activePalette : undefined}
                     onPaletteChange={(colors) => { if(harmonyMode === 'THEORY') setActivePalette(colors); }}
                     baseColorHex={selectedKeyColor.hex}
                     mode={harmonyMode}
                  />
                  <div className="absolute -bottom-8 w-full flex justify-center">
                     <div className="bg-black/80 px-3 py-1 rounded-full border border-white/20 text-[9px] uppercase tracking-widest font-bold flex items-center gap-2">
                        {harmonyMode === 'BRAND' ? <Lock size={10}/> : <Zap size={10}/>}
                        {harmonyMode === 'BRAND' ? 'Locked Recipe' : 'Generative'}
                     </div>
                  </div>
               </div>

               {/* 3. HARMONY ENGINE & RENDER BUTTON */}
               <div className="flex flex-col items-center md:items-end gap-3 min-w-[280px]">
                  <div className="flex items-center gap-4 mb-1">
                     <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                        <Command size={12}/> Harmony Engine
                     </span>
                     <div className="flex bg-white/10 rounded-lg p-0.5">
                        <button 
                           onClick={() => setHarmonyMode('BRAND')} 
                           className={`px-3 py-1 text-[9px] uppercase font-bold rounded-md transition-all ${harmonyMode === 'BRAND' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                           Brand DNA
                        </button>
                        <button 
                           onClick={() => setHarmonyMode('THEORY')} 
                           className={`px-3 py-1 text-[9px] uppercase font-bold rounded-md transition-all ${harmonyMode === 'THEORY' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                           Theory
                        </button>
                     </div>
                  </div>

                  {/* Contextual Buttons based on Mode */}
                  {harmonyMode === 'BRAND' ? (
                     <div className="flex gap-2 flex-wrap justify-end">
                        {currentBrandRecipes.map((recipe, idx) => (
                           <button
                              key={recipe.name}
                              onClick={() => setSelectedRecipeIndex(idx)}
                              className={`px-3 py-2 rounded text-[9px] font-bold uppercase tracking-wider border transition-all ${selectedRecipeIndex === idx ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/40'}`}
                           >
                              {recipe.name}
                           </button>
                        ))}
                     </div>
                  ) : (
                     <div className="flex gap-2 flex-wrap justify-end">
                        {THEORY_RULES.map((rule) => (
                           <button
                              key={rule.id}
                              onClick={() => setSelectedRule(rule.id)}
                              className={`px-3 py-2 rounded text-[9px] font-bold uppercase tracking-wider border transition-all ${selectedRule === rule.id ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/40'}`}
                           >
                              {rule.label}
                           </button>
                        ))}
                     </div>
                  )}
                  
                  {/* Palette Readout */}
                  <div className="flex gap-2 mt-2 justify-end">
                     {activePalette.map((hex, i) => (
                        <div key={i} className="group relative">
                           <div className="w-10 h-6 border border-white/10 transition-transform group-hover:scale-110" style={{ backgroundColor: hex }}></div>
                           <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[7px] font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{hex}</span>
                        </div>
                     ))}
                  </div>

                  {/* RENDER BUTTON */}
                  {onApplyToImage && (
                      <button 
                        onClick={handleApply}
                        className={`w-full mt-2 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isDeRoche ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#C5A059] text-black hover:bg-white'}`}
                      >
                        <Wand2 size={14} /> Render Changes
                      </button>
                  )}
               </div>

            </div>
         </div>

      </div>
    </div>
  );
};
