import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { BrandArchetype } from '../types';

interface VibeCheckProps {
  onClose: () => void;
  onComplete: (brand: BrandArchetype) => void;
}

export const VibeCheck: React.FC<VibeCheckProps> = ({ onClose, onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50);
  const [showModal, setShowModal] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current && !showModal) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left; 
      const width = rect.width;
      const percentage = Math.max(0, Math.min(100, (x / width) * 100));
      setSplit(percentage);
    }
  };

  const isRocheDominant = split < 50;

  const handleAction = () => {
    setShowModal(true);
  };

  const handleConfirm = () => {
    onComplete(isRocheDominant ? BrandArchetype.DE_ROCHE : BrandArchetype.CHAOSCHICC);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col font-mono select-none overflow-hidden">
      <style>{`
        .layer-deroche {
          background: linear-gradient(180deg, #FFFFFF 0%, #E6E1E7 40%, #A7A8AA 100%);
        }
        .text-roche {
          font-family: 'Michroma', sans-serif;
          color: #232222;
        }
        .text-chaos {
          font-family: 'Michroma', sans-serif;
          color: #C5A059; /* Gold */
          text-shadow: 0 0 10px rgba(197, 160, 89, 0.5);
        }
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E");
        }
        .torn-edge {
          clip-path: polygon(2% 0, 100% 1%, 98% 100%, 0% 98%);
        }
      `}</style>

      {/* --- SPLIT CONTAINER --- */}
      <div 
        ref={containerRef}
        className="relative w-full h-full flex cursor-crosshair"
        onMouseMove={handleMouseMove}
      >
        {/* Layer 1: De Roche (Base - Silver) */}
        <div className="absolute inset-0 layer-deroche flex flex-col justify-center pl-[5vw] transition-all duration-200">
          <div className="text-roche uppercase z-0">
            <h1 className="text-[5vw] leading-none tracking-tighter m-0 font-header">De Roche</h1>
            <p className="font-mono tracking-[2px] mt-2">FIG 01. STRUCTURAL STABILITY</p>
          </div>
        </div>

        {/* Layer 2: Chaos (Overlay - Gold/Dark) */}
        <div 
          className="absolute inset-0 bg-[#0a0a0a] overflow-hidden"
          style={{ clipPath: `polygon(${split}% 0, 100% 0, 100% 100%, ${split}% 100%)` }}
        >
          {/* Blobs */}
          <div className="absolute w-[60vw] h-[60vw] rounded-full bg-[#1a1a1a] -top-[20%] -right-[10%] blur-[60px] opacity-70"></div>
          <div className="absolute w-[40vw] h-[40vw] rounded-full bg-[#3d3118] -bottom-[10%] left-[20%] blur-[60px] opacity-70"></div>
          <div className="absolute w-[20vw] h-[20vw] rounded-full bg-[#C5A059] top-[40%] right-[40%] blur-[60px] opacity-30"></div>
          <div className="absolute inset-0 noise-bg pointer-events-none"></div>

          <div className="absolute right-[5vw] top-[35%] text-right w-full">
            <div className="text-chaos uppercase">
              <h1 className="text-[5vw] leading-none m-0 font-header">CHAOS</h1>
              <p className="font-mono tracking-[4px] text-[#C5A059] mt-2 text-shadow-none">// THE ROYAL ANARCHY</p>
            </div>
          </div>
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-20 shadow-[0_0_15px_white]"
          style={{ left: `${split}%` }}
        >
          <div className="absolute top-1/2 -left-[23px] w-[50px] h-[50px] border-2 border-white bg-black rounded-full flex items-center justify-center text-white text-xl">
            ⇄
          </div>
        </div>

        {/* Action Area */}
        {!showModal && (
          <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-30 text-center">
            <button 
              onClick={handleAction}
              className={`px-12 py-4 text-xl uppercase border-2 transition-all duration-300 font-header tracking-wider ${
                isRocheDominant 
                  ? "border-[#232222] bg-[#E6E1E7] text-[#232222] hover:bg-white"
                  : "border-[#C5A059] bg-[#0a0a0a] text-[#C5A059] hover:bg-[#C5A059] hover:text-black"
              }`}
            >
              {isRocheDominant ? "SCAN IDENTITY" : "DISRUPT REALITY"}
            </button>
          </div>
        )}
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 text-white hover:text-red-500 transition-colors"
        >
          <X size={32} />
        </button>
      </div>

      {/* --- RESULT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" style={{ background: isRocheDominant ? "rgba(35,34,34,0.95)" : "rgba(10, 10, 10, 0.95)" }}>
          
          {isRocheDominant ? (
            /* DE ROCHE CARD (Silver) */
            <div className="w-full max-w-[400px] bg-[#f0f0f0] border border-[#A7A8AA] p-8 text-[#232222] font-mono relative shadow-[10px_10px_0_#A7A8AA]">
              <div className="absolute top-2 left-2">+</div>
              <div className="absolute bottom-2 right-2">+</div>
              
              <div className="flex justify-between border-b-2 border-[#232222] pb-2 mb-4">
                <span className="font-header">BLUEPRINT A-12</span>
                <span>[CONFIRMED]</span>
              </div>
              
              <div className="space-y-2 mb-8 text-sm">
                <div className="flex justify-between border-b border-dashed border-[#ccc] pb-1">
                  <span>STRUCTURE:</span> <span>RIGID/LINEAR</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-[#ccc] pb-1">
                  <span>PALETTE:</span> <span>MINERAL SEQUENCE</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-[#ccc] pb-1">
                  <span>OBJECTIVE:</span> <span>STABILITY</span>
                </div>
              </div>

              <button 
                onClick={handleConfirm}
                className="w-full bg-[#A7A8AA] text-white py-4 text-center text-xs hover:bg-[#232222] transition-colors uppercase font-bold"
              >
                // GENERATE WARDROBE
              </button>
            </div>
          ) : (
            /* CHAOS CARD (Gold) */
            <div className="w-full max-w-[400px] bg-[#0a0a0a] border border-[#C5A059] p-10 font-mono relative torn-edge noise-bg">
              <div className="absolute -top-4 left-[35%] w-[100px] h-[30px] bg-[#C5A059] opacity-90 -rotate-2 shadow-sm"></div>
              
              <h2 className="font-header text-5xl text-[#C5A059] m-0 -rotate-2 leading-none mb-6">
                MANIFESTO
              </h2>
              
              <p className="border-b border-[#C5A059] text-[#C5A059] pb-2 mb-6">
                Identity Verification: <strong>UNSTABLE</strong>
              </p>
              
              <div className="space-y-2 mb-6 text-[#E6E1E7]">
                <p><strong>VIBE:</strong> TOTAL ANARCHY</p>
                <p><strong>PALETTE:</strong> ROYAL VOID</p>
                <p><strong>OBJECTIVE:</strong> DISRUPTION</p>
              </div>

              <button 
                onClick={handleConfirm}
                className="w-full bg-[#C5A059] text-black py-4 font-header text-xl hover:bg-white hover:text-black transition-colors border-none cursor-pointer"
              >
                INITIATE
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};