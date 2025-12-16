import React, { useState } from 'react';
import { X, Columns, Layers } from 'lucide-react';
import { GeneratedImage } from '../types';

interface ImageComparatorProps {
  image1: GeneratedImage;
  image2: GeneratedImage;
  onClose: () => void;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ image1, image2, onClose }) => {
  const [mode, setMode] = useState<'overlay' | 'side-by-side'>('side-by-side');
  const [opacity, setOpacity] = useState(50);

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 md:px-8 bg-[#0a0a0a]">
        <h2 className="text-xl font-serif text-white tracking-wide">Comparison View</h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-[#111] rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setMode('side-by-side')}
              className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${mode === 'side-by-side' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
              title="Side by Side"
            >
              <Columns size={16} />
              <span className="hidden sm:inline">Side by Side</span>
            </button>
            <button
              onClick={() => setMode('overlay')}
              className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${mode === 'overlay' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
              title="Overlay with Opacity"
            >
              <Layers size={16} />
              <span className="hidden sm:inline">Overlay</span>
            </button>
          </div>
          <div className="w-px h-6 bg-white/10 mx-2"></div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4 md:p-8 flex items-center justify-center bg-[#050505]">
        {mode === 'side-by-side' ? (
          <div className="flex gap-4 w-full h-full items-center justify-center">
            <div className="flex-1 h-full flex flex-col items-center justify-center relative group bg-[#111] border border-white/5 rounded-sm overflow-hidden">
               <img src={image1.url} className="w-full h-full object-contain" />
               <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-xs text-white font-mono rounded-full">IMG A</div>
            </div>
            <div className="flex-1 h-full flex flex-col items-center justify-center relative group bg-[#111] border border-white/5 rounded-sm overflow-hidden">
               <img src={image2.url} className="w-full h-full object-contain" />
               <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-xs text-white font-mono rounded-full">IMG B</div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Overlay Container */}
            <div className="relative h-full aspect-[3/4] md:aspect-video lg:aspect-auto flex items-center justify-center max-w-full">
               <div className="relative h-full w-full flex items-center justify-center">
                 {/* Base Image */}
                 <img 
                    src={image1.url} 
                    className="max-h-full max-w-full object-contain absolute inset-0 m-auto" 
                    style={{ zIndex: 1 }}
                 />
                 {/* Overlay Image */}
                 <img 
                    src={image2.url} 
                    className="max-h-full max-w-full object-contain absolute inset-0 m-auto" 
                    style={{ opacity: opacity / 100, zIndex: 2 }}
                 />
               </div>
               
               {/* Slider Control Floating */}
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-72 bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/20 flex items-center gap-4 shadow-2xl z-10">
                  <span className="text-[10px] uppercase text-gray-400 font-bold w-4 text-center">A</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={opacity} 
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-200"
                  />
                  <span className="text-[10px] uppercase text-gray-400 font-bold w-4 text-center">B</span>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};