
import React, { useState, useEffect, useRef } from 'react';
import { HarmonyRule } from '../types';
import { hslToHex, hexToHsl } from '../utils';

interface ColorHarmonyWheelProps {
  baseColorHex?: string;
  fixedPalette?: string[]; // New: For visualizing specific brand recipes
  rule: HarmonyRule;
  onPaletteChange: (colors: string[]) => void;
  brandMode: 'DE_ROCHE' | 'CHAOSCHICC';
  mode: 'THEORY' | 'BRAND'; // New: Switch between math generation and fixed brand colors
}

export const ColorHarmonyWheel: React.FC<ColorHarmonyWheelProps> = ({
  baseColorHex,
  fixedPalette,
  rule,
  onPaletteChange,
  brandMode,
  mode
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [hue, setHue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize hue from prop if provided
  useEffect(() => {
    if (baseColorHex && !isDragging && mode === 'THEORY') {
      const hsl = hexToHsl(baseColorHex);
      setHue(hsl.h);
    }
  }, [baseColorHex, mode]);

  // --- INTERACTION LOGIC (Only active in THEORY mode) ---
  const handleInteraction = (clientX: number, clientY: number) => {
    if (!wheelRef.current || mode === 'BRAND') return; // Disable drag for fixed palettes
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    if (angle < 0) angle += 360;
    setHue(angle);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode === 'BRAND') return;
    setIsDragging(true);
    handleInteraction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleInteraction(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // --- PALETTE CALCULATION ---
  const [displayPalette, setDisplayPalette] = useState<{h:number, s:number, l:number, hex: string}[]>([]);

  useEffect(() => {
    if (mode === 'BRAND' && fixedPalette) {
      // VISUALIZE FIXED PALETTE
      const mapped = fixedPalette.map(hex => {
        const hsl = hexToHsl(hex);
        return { ...hsl, hex };
      });
      setDisplayPalette(mapped);
      // We don't trigger onPaletteChange here to avoid loops, parent controls fixedPalette
    } else {
      // CALCULATE THEORY PALETTE
      const s = brandMode === 'DE_ROCHE' ? 10 : 80;
      const l = brandMode === 'DE_ROCHE' ? 40 : 50;
      const base = { h: hue, s, l };
      
      let hsls: {h:number, s:number, l:number}[] = [];

      switch (rule) {
        case 'ANALOGOUS':
          hsls = [base, { h: (hue + 30) % 360, s, l }, { h: (hue - 30 + 360) % 360, s, l }];
          break;
        case 'TRIAD':
          hsls = [base, { h: (hue + 120) % 360, s, l }, { h: (hue + 240) % 360, s, l }];
          break;
        case 'SPLIT_COMPLEMENTARY':
          hsls = [base, { h: (hue + 150) % 360, s, l }, { h: (hue + 210) % 360, s, l }];
          break;
        case 'MONOCHROMATIC':
        default:
          hsls = [base, { h: hue, s, l: Math.min(100, l + 30) }, { h: hue, s, l: Math.max(0, l - 30) }];
          break;
      }

      const hexs = hsls.map(c => hslToHex(c.h, c.s, c.l));
      setDisplayPalette(hsls.map((c, i) => ({ ...c, hex: hexs[i] })));
      onPaletteChange(hexs);
    }
  }, [hue, rule, mode, fixedPalette, brandMode]);

  const borderColor = brandMode === 'DE_ROCHE' ? '#FFFFFF' : '#C5A059';

  return (
    <div 
      ref={wheelRef}
      onMouseDown={handleMouseDown}
      className={`relative w-40 h-40 rounded-full select-none transition-transform active:scale-105 ${mode === 'THEORY' ? 'cursor-crosshair' : 'cursor-default'}`}
      style={{ touchAction: 'none' }}
    >
        {/* Visual Rings */}
        <div className="absolute inset-0 rounded-full border-2 border-white/10 pointer-events-none"></div>
        <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none"></div>

        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full rounded-full shadow-2xl bg-black/80 backdrop-blur-xl border border-white/20"
        >
          {/* Conic Gradient (The Spectrum) */}
          <foreignObject x="0" y="0" width="100" height="100" style={{ pointerEvents: 'none' }}>
             <div style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                background: `conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red)`,
                opacity: brandMode === 'DE_ROCHE' ? 0.3 : 0.8,
                mask: 'radial-gradient(transparent 55%, black 56%)',
                WebkitMask: 'radial-gradient(transparent 55%, black 56%)',
             }}></div>
          </foreignObject>

          {/* Active Lines & Nodes */}
          {displayPalette.map((color, i) => {
             const rad = (color.h * Math.PI) / 180;
             // If monochrome, vary radius to show stack
             const r = 40 - (mode === 'THEORY' && rule === 'MONOCHROMATIC' ? i * 10 : 0); 
             const cx = 50 + r * Math.cos(rad);
             const cy = 50 + r * Math.sin(rad);
             
             return (
                <g key={`node-${i}`}>
                   {/* Connection Line to Center */}
                   <line 
                      x1="50" y1="50" x2={cx} y2={cy} 
                      stroke={borderColor} 
                      strokeWidth={i === 0 ? 1.5 : 0.5} 
                      strokeOpacity="0.6"
                   />
                   {/* The Node Dot */}
                   <circle 
                      cx={cx} 
                      cy={cy} 
                      r={i === 0 ? 6 : 4} 
                      fill={color.hex} 
                      stroke="white" 
                      strokeWidth="1.5"
                      className="drop-shadow-lg transition-all duration-300"
                   />
                </g>
             );
          })}

          {/* Center Pivot */}
          <circle cx="50" cy="50" r="8" fill="#111" stroke={borderColor} strokeWidth="1" />
          <circle cx="50" cy="50" r="4" fill={displayPalette[0]?.hex || '#000'} />
        </svg>
        
        {/* Interaction Hint */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] uppercase tracking-widest opacity-50 pointer-events-none text-white">
           {mode === 'THEORY' ? (isDragging ? 'ADJUSTING HARMONY' : 'DRAG TO ROTATE') : 'BRAND LOCKED'}
        </div>
    </div>
  );
};
