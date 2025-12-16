
import React, { useState } from 'react';
import { X, FileText, Printer, Ruler, Layers, Activity, PenTool, Box, Tag, ClipboardCheck } from 'lucide-react';
import { TechPack, GeneratedImage, BrandArchetype } from '../types';

interface TechPackModalProps {
  techPack: TechPack;
  image: GeneratedImage;
  onClose: () => void;
}

export const TechPackModal: React.FC<TechPackModalProps> = ({ techPack, image, onClose }) => {
  const isChaos = image.brand === BrandArchetype.CHAOSCHICC;
  const [activeTab, setActiveTab] = useState<'blueprint' | 'bom' | 'specs'>('blueprint');

  // Generate a random SKU
  const sku = `${image.brand.substring(0,2).toUpperCase()}-${techPack.season.replace(/ /g,'').toUpperCase()}-${Math.floor(Math.random()*10000)}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      
      {/* Main Container - PLM Software Style */}
      <div className="w-full h-full max-w-[1600px] bg-[#f0f0f0] text-black overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Top Header Bar */}
        <header className="h-14 bg-[#1a1a1a] text-white flex items-center justify-between px-6 flex-shrink-0 border-b border-gray-700">
           <div className="flex items-center gap-4">
              <div className="font-mono text-xs text-gray-400">LUMIÈRE PLM SYSTEM v4.2</div>
              <div className="h-4 w-px bg-gray-600"></div>
              <div className="font-bold tracking-wider text-sm">{sku}</div>
           </div>
           <button onClick={onClose} className="hover:text-red-500 transition-colors"><X size={20}/></button>
        </header>

        <div className="flex-1 flex overflow-hidden">
           
           {/* Sidebar Navigation */}
           <nav className="w-64 bg-[#e5e5e5] border-r border-gray-300 flex flex-col p-4 gap-2">
              <div className="mb-6">
                 <div className="aspect-[3/4] w-full bg-white border border-gray-300 shadow-sm p-1">
                    <img src={image.url} className="w-full h-full object-cover grayscale opacity-80 hover:opacity-100 transition-opacity" alt="Ref" />
                 </div>
                 <div className="mt-2 text-[10px] font-mono text-gray-500 text-center">REFERENCE IMAGE</div>
              </div>

              <button 
                onClick={() => setActiveTab('blueprint')}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${activeTab === 'blueprint' ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <PenTool size={14} /> Blueprint (CAD)
              </button>
              <button 
                onClick={() => setActiveTab('bom')}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${activeTab === 'bom' ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <Layers size={14} /> Bill of Materials
              </button>
              <button 
                onClick={() => setActiveTab('specs')}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${activeTab === 'specs' ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <Ruler size={14} /> Measurements
              </button>

              <div className="mt-auto pt-6 border-t border-gray-300">
                 <button onClick={() => window.print()} className="w-full py-3 border border-black text-black text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2">
                    <Printer size={14} /> Export PDF
                 </button>
              </div>
           </nav>

           {/* Content Area */}
           <main className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 pointer-events-none opacity-20" 
                   style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
              </div>

              <div className="p-12 min-h-full relative z-10">
                 
                 {/* Page Header */}
                 <div className="flex justify-between items-end border-b-4 border-black pb-4 mb-8">
                    <div>
                       <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">{techPack.garmentName}</h1>
                       <div className="flex gap-4 text-xs font-mono text-gray-600">
                          <span>SEASON: <b className="text-black">{techPack.season}</b></span>
                          <span>|</span>
                          <span>DATE: <b className="text-black">{new Date().toLocaleDateString()}</b></span>
                          <span>|</span>
                          <span>SAMPLE SIZE: <b className="text-black">M</b></span>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="border-2 border-black px-4 py-1 text-xs font-bold uppercase inline-block mb-1">
                          Status: APPROVED
                       </div>
                       <div className="text-[10px] font-mono text-gray-500">REV 0.4</div>
                    </div>
                 </div>

                 {/* TAB CONTENT */}
                 {activeTab === 'blueprint' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <div className="grid grid-cols-3 gap-8 h-[600px]">
                          {/* Main Drawing Area */}
                          <div className="col-span-2 border-2 border-black p-8 relative flex items-center justify-center bg-white">
                             <div className="absolute top-2 left-2 text-[10px] font-mono bg-black text-white px-2 py-1">FRONT VIEW</div>
                             {techPack.flatSketchUrl ? (
                                <img src={techPack.flatSketchUrl} className="max-h-full max-w-full object-contain" alt="Flat Drawing" />
                             ) : (
                                <div className="text-gray-300 font-mono text-sm">NO VECTOR DATA AVAILABLE</div>
                             )}
                             
                             {/* Annotations Overlay Simulation */}
                             <div className="absolute top-1/4 right-1/4 flex items-center gap-2">
                                <div className="w-8 h-px bg-red-500"></div>
                                <span className="text-[9px] text-red-600 font-mono bg-white px-1 border border-red-500">DTM THREAD</span>
                             </div>
                             <div className="absolute bottom-1/3 left-1/3 flex items-center gap-2">
                                <span className="text-[9px] text-blue-600 font-mono bg-white px-1 border border-blue-500">DBL NEEDLE</span>
                                <div className="w-8 h-px bg-blue-500"></div>
                             </div>
                          </div>

                          {/* Info Column */}
                          <div className="flex flex-col gap-4">
                             <div className="border border-gray-300 p-4 bg-gray-50">
                                <h3 className="font-bold text-xs uppercase border-b border-gray-300 pb-2 mb-2 flex items-center gap-2">
                                   <Activity size={12} /> Construction
                                </h3>
                                <ul className="space-y-2">
                                   {techPack.constructionDetails.slice(0, 5).map((detail, i) => (
                                      <li key={i} className="text-[10px] font-mono leading-tight text-gray-700 flex items-start gap-2">
                                         <span className="text-black">•</span> {detail}
                                      </li>
                                   ))}
                                </ul>
                             </div>

                             <div className="border border-gray-300 p-4 bg-gray-50 flex-1">
                                <h3 className="font-bold text-xs uppercase border-b border-gray-300 pb-2 mb-2 flex items-center gap-2">
                                   <Tag size={12} /> Colorway
                                </h3>
                                <div className="space-y-3">
                                   {techPack.colorPalette.map((col, i) => (
                                      <div key={i} className="flex items-center gap-3">
                                         <div className="w-8 h-8 border border-gray-300 shadow-sm" style={{ backgroundColor: col }}></div>
                                         <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase">PANTONE</span>
                                            <span className="text-[9px] font-mono text-gray-500">{col}</span>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <div className="mt-8 border border-gray-300 p-4 bg-yellow-50/50">
                          <h4 className="font-bold text-xs uppercase mb-1">Fit Comments</h4>
                          <p className="font-mono text-xs text-gray-700">{techPack.fitNotes}</p>
                       </div>
                    </div>
                 )}

                 {activeTab === 'bom' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <h3 className="font-bold text-lg uppercase mb-4 flex items-center gap-2"><Layers size={18} /> Bill of Materials</h3>
                       <div className="border-2 border-black bg-white">
                          <table className="w-full text-xs text-left font-mono">
                             <thead className="bg-black text-white">
                                <tr>
                                   <th className="p-3 border-r border-gray-700 w-16">ID</th>
                                   <th className="p-3 border-r border-gray-700">PLACEMENT</th>
                                   <th className="p-3 border-r border-gray-700">ITEM / DESCRIPTION</th>
                                   <th className="p-3 border-r border-gray-700">SUPPLIER</th>
                                   <th className="p-3">CONSUMPTION</th>
                                </tr>
                             </thead>
                             <tbody>
                                {techPack.billOfMaterials.map((item, i) => (
                                   <tr key={i} className="border-b border-gray-300 hover:bg-gray-100">
                                      <td className="p-3 border-r border-gray-300 font-bold text-gray-500">{(i+1).toString().padStart(3,'0')}</td>
                                      <td className="p-3 border-r border-gray-300 font-bold">{item.placement}</td>
                                      <td className="p-3 border-r border-gray-300">{item.item}</td>
                                      <td className="p-3 border-r border-gray-300 text-blue-600">{item.supplier}</td>
                                      <td className="p-3">{item.consumption}</td>
                                   </tr>
                                ))}
                                {/* Empty rows for authentic feel */}
                                {[1,2,3].map(j => (
                                   <tr key={`e-${j}`} className="border-b border-gray-200">
                                      <td className="p-3 border-r border-gray-200">&nbsp;</td>
                                      <td className="p-3 border-r border-gray-200"></td>
                                      <td className="p-3 border-r border-gray-200"></td>
                                      <td className="p-3 border-r border-gray-200"></td>
                                      <td className="p-3"></td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                       
                       <div className="mt-8 flex gap-8">
                          <div className="flex-1 border border-gray-300 p-4 bg-white">
                             <h4 className="font-bold text-xs uppercase mb-2">Primary Fabric</h4>
                             <div className="h-24 bg-gray-100 flex items-center justify-center border border-dashed border-gray-400 text-gray-400 text-[10px]">
                                SWATCH CARD
                             </div>
                             <p className="mt-2 text-xs font-mono">{techPack.fabricComposition}</p>
                          </div>
                          <div className="flex-1 border border-gray-300 p-4 bg-white">
                             <h4 className="font-bold text-xs uppercase mb-2">Trim / Labels</h4>
                             <div className="h-24 bg-gray-100 flex items-center justify-center border border-dashed border-gray-400 text-gray-400 text-[10px]">
                                LABEL PLACEMENT
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {activeTab === 'specs' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <h3 className="font-bold text-lg uppercase mb-4 flex items-center gap-2"><Ruler size={18} /> Graded Specs</h3>
                       <div className="border-2 border-black bg-white">
                          <table className="w-full text-xs text-left font-mono">
                             <thead className="bg-black text-white">
                                <tr>
                                   <th className="p-3 border-r border-gray-700 w-16">CODE</th>
                                   <th className="p-3 border-r border-gray-700">POINT OF MEASURE</th>
                                   <th className="p-3 border-r border-gray-700 text-center w-24">TOL (+/-)</th>
                                   <th className="p-3 text-center bg-gray-800 w-24">SAMPLE (M)</th>
                                </tr>
                             </thead>
                             <tbody>
                                {techPack.measurements.map((m, i) => (
                                   <tr key={i} className="border-b border-gray-300 hover:bg-gray-100">
                                      <td className="p-3 border-r border-gray-300 font-bold text-gray-500">{(i+1).toString().padStart(2,'0')}</td>
                                      <td className="p-3 border-r border-gray-300 font-bold">{m.point}</td>
                                      <td className="p-3 border-r border-gray-300 text-center">{m.tolerance}</td>
                                      <td className="p-3 text-center bg-gray-50 font-bold">{m.spec}</td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                       
                       <div className="mt-8 flex justify-end">
                          <div className="w-64 border-2 border-black p-4 bg-white">
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold uppercase">Tech Approval</span>
                                <ClipboardCheck size={16} />
                             </div>
                             <div className="h-16 border-b border-gray-300 mb-2"></div>
                             <div className="flex justify-between text-[10px] text-gray-500">
                                <span>SIGNATURE</span>
                                <span>DATE</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

              </div>
           </main>
        </div>
      </div>
    </div>
  );
};
