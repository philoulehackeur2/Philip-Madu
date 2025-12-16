import React, { useState, memo } from 'react';
import { Download, Edit2, Check, Star, Tag } from 'lucide-react';
import { GeneratedImage, BrandArchetype } from '../types';

interface GeneratedImageCardProps {
  image: GeneratedImage;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpenSidebar: () => void;
  onRate?: (rating: number) => void;
  onAddCollection?: (collection: string) => void;
}

export const GeneratedImageCard = memo<GeneratedImageCardProps>(({ 
  image, 
  isSelected, 
  onToggleSelect, 
  onOpenSidebar,
  onRate,
  onAddCollection
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `lumiere-editorial-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag && onAddCollection) {
      onAddCollection(newTag);
      setNewTag('');
      setIsTagging(false);
    }
  };

  const isChaos = image.brand === BrandArchetype.CHAOSCHICC;

  // STRICT THEME STYLING
  // De Roche: Trapezoid Clip Path + Monochrome border
  // Chaos: Torn Edge Clip Path + Frosted Glass
  const themeCardClass = isChaos ? 'chaos-card' : 'roche-card';

  // Hover Effects
  const chaosHover = "transition-all duration-300 hover:contrast-125 hover:saturate-150";
  const rocheHover = "transition-transform duration-500 ease-out hover:scale-[1.02]";

  return (
    <div 
      className={`relative group w-full h-full overflow-hidden ${themeCardClass} ${isSelected ? 'border-2 border-white' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsTagging(false); }}
      onClick={onOpenSidebar}
    >
      <img 
        src={image.url} 
        alt="Generated fashion editorial" 
        className={`w-full h-full object-cover ${isChaos ? chaosHover : rocheHover} ${isSelected ? 'opacity-80' : 'opacity-100'}`}
      />

      {/* Collections / Tags Display */}
      {image.collections && image.collections.length > 0 && (
         <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10 pointer-events-none">
           {image.collections.map(tag => (
             <span key={tag} className="px-2 py-0.5 bg-black/60 backdrop-blur text-[9px] text-white uppercase tracking-wider border border-white/10">
               {tag}
             </span>
           ))}
         </div>
      )}

      {/* Selection Checkbox */}
      <div 
        className={`absolute top-3 right-3 z-20 transition-all duration-200 ${isHovered || isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-white border-white text-black' : 'bg-black/40 border-white/50 text-transparent hover:bg-black/60 hover:border-white'}`}
          title="Select for comparison"
        >
          <Check size={14} strokeWidth={4} />
        </button>
      </div>

      {/* Interaction Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 flex flex-col justify-end p-4 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
      >
          {/* Main Actions */}
          <div className="flex gap-3 justify-center mb-6">
             <button 
              onClick={(e) => { e.stopPropagation(); onOpenSidebar(); }}
              className="p-3 bg-white text-black hover:bg-gray-200 transition-transform hover:scale-110 shadow-lg"
              title="Open in Atelier (Edit)"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={handleDownload}
              className="p-3 bg-black/50 border border-white text-white hover:bg-white hover:text-black transition-colors backdrop-blur-sm"
              title="Download"
            >
              <Download size={16} />
            </button>
          </div>

          {/* Rating & Tagging Bar */}
          <div className="flex justify-between items-center border-t border-white/10 pt-3" onClick={e => e.stopPropagation()}>
             {/* Stars */}
             <div className="flex gap-1">
               {[1, 2, 3, 4, 5].map((star) => (
                 <button
                   key={star}
                   onClick={() => onRate && onRate(star)}
                   className={`transition-all hover:scale-125 ${image.rating && image.rating >= star ? 'text-yellow-400' : 'text-gray-600 hover:text-white'}`}
                 >
                   <Star size={14} fill={image.rating && image.rating >= star ? "currentColor" : "none"} />
                 </button>
               ))}
             </div>

             {/* Tagging */}
             <div className="relative">
                <button 
                  onClick={() => setIsTagging(!isTagging)}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                >
                  <Tag size={14} />
                </button>
                
                {isTagging && (
                   <form onSubmit={handleTagSubmit} className="absolute bottom-8 right-0 w-32 bg-black border border-white/20 p-1 rounded shadow-xl">
                      <input 
                        autoFocus
                        type="text" 
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="New Collection..."
                        className="w-full bg-transparent text-[10px] text-white p-1 focus:outline-none placeholder-gray-600"
                      />
                   </form>
                )}
             </div>
          </div>
      </div>
    </div>
  );
});