
import React from 'react';
import { Search, ArrowUpDown, Star } from 'lucide-react';
import { BrandArchetype } from '../types';

interface ArchiveControlsProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterBrand: 'ALL' | BrandArchetype;
  onFilterBrandChange: (b: 'ALL' | BrandArchetype) => void;
  sortBy: 'NEWEST' | 'OLDEST' | 'RATING';
  onSortChange: (s: 'NEWEST' | 'OLDEST' | 'RATING') => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  isDeRoche: boolean;
}

export const ArchiveControls: React.FC<ArchiveControlsProps> = ({
  searchQuery, onSearchChange,
  filterBrand, onFilterBrandChange,
  sortBy, onSortChange,
  showFavoritesOnly, onToggleFavorites,
  isDeRoche
}) => {
  const baseClass = isDeRoche ? "bg-white border-gray-200 text-black" : "bg-[#111] border-[#C5A059]/30 text-[#C5A059]";
  const activeClass = isDeRoche ? "bg-black text-white" : "bg-[#C5A059] text-black";

  return (
    <div className={`sticky top-0 z-30 flex flex-wrap items-center gap-4 p-4 border-b backdrop-blur-md transition-colors duration-500 ${isDeRoche ? 'bg-white/80 border-gray-200' : 'bg-black/80 border-[#C5A059]/20'}`}>
      
      {/* 1. SEARCH BAR */}
      <div className={`flex-1 flex items-center px-3 py-2 border rounded-sm ${baseClass}`}>
        <Search size={14} className="opacity-50 mr-2" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="SEARCH ARCHIVE (e.g. 'Velvet', 'Cyberpunk')..." 
          className={`bg-transparent outline-none text-[10px] font-mono uppercase w-full placeholder-opacity-50 ${isDeRoche ? 'placeholder-gray-500' : 'placeholder-[#C5A059]/50'}`}
        />
      </div>

      {/* 2. BRAND FILTER */}
      <div className="flex gap-1">
        {(['ALL', 'DE_ROCHE', 'CHAOSCHICC'] as const).map(b => (
          <button
            key={b}
            onClick={() => onFilterBrandChange(b)}
            className={`px-3 py-2 text-[9px] font-bold uppercase border rounded-sm transition-all ${filterBrand === b ? activeClass : baseClass}`}
          >
            {b.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* 3. SORT & FAVORITES */}
      <div className="flex gap-2">
        <button 
          onClick={onToggleFavorites}
          className={`p-2 border rounded-sm transition-all ${showFavoritesOnly ? activeClass : baseClass}`}
          title="Show Favorites Only"
        >
          <Star size={14} fill={showFavoritesOnly ? "currentColor" : "none"} />
        </button>

        <div className="relative group">
          <button className={`flex items-center gap-2 px-3 py-2 border rounded-sm text-[9px] font-bold uppercase ${baseClass}`}>
            <ArrowUpDown size={12} />
            <span>{sortBy}</span>
          </button>
          
          {/* Dropdown */}
          <div className={`absolute right-0 top-full mt-1 w-32 py-1 border rounded-sm shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all ${isDeRoche ? 'bg-white' : 'bg-[#111]'} ${baseClass}`}>
            {['NEWEST', 'OLDEST', 'RATING'].map((opt) => (
              <button 
                key={opt}
                onClick={() => onSortChange(opt as any)}
                className={`w-full text-left px-3 py-2 text-[9px] font-bold uppercase hover:opacity-50`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
