
import React, { useState } from 'react';
import { Users, RefreshCw, Star, Upload, Check, Fingerprint, ChevronDown, X, Loader2 } from 'lucide-react';
import { BrandArchetype, SavedModel } from '../types';
import { useAppStore } from '../store';
import { saveModelToAgency } from '../services/storageService';
import { scanFaceGeometry, getBase64FromUrl } from '../services/geminiService';

interface CastingDirectorProps {
  brand: BrandArchetype;
  castGender: string;
  setCastGender: (val: string) => void;
  castVibe: string;
  setCastVibe: (val: string) => void;
  castHair: string;
  setCastHair: (val: string) => void;
  castFace: string;
  setCastFace: (val: string) => void;
  castDetails: string;
  setCastDetails: (val: string) => void;
  activeTab: 'AUTO' | 'AGENCY';
  onTabChange: (tab: 'AUTO' | 'AGENCY') => void;
}

// --- CONSTANTS ---
const CASTING_GENDERS = ["Female", "Male", "Non-Binary", "Androgynous", "Fluid", "Alien", "Unspecified"];
const CASTING_VIBES = ["Regal", "Manic", "Ethereal", "Feral", "Minimalist", "Cybernetic", "Opulent", "Decayed", "Vulnerable", "Haughty"];
const CASTING_HAIR = ["Shaved", "Architectural Bob", "Wet-Look Long", "Spiked", "Buzzcut", "Wind-Swept", "Braided", "Bleached", "Natural Afro"];
const CASTING_FACE = ["Classic", "Alien", "Severe", "Doll-like", "Pierced", "Tattooed", "Gaunt", "Freckled", "Fresh"];

export const CastingDirector: React.FC<CastingDirectorProps> = ({
  brand,
  castGender, setCastGender,
  castVibe, setCastVibe,
  castHair, setCastHair,
  castFace, setCastFace,
  castDetails, setCastDetails,
  activeTab, onTabChange
}) => {
  const { savedModels, selectModel, selectedModelId, addModel } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);

  const isDeRoche = brand === BrandArchetype.DE_ROCHE;
  const inputClass = isDeRoche 
    ? 'bg-gray-50 border-gray-300 text-black focus:border-black placeholder-gray-400' 
    : 'bg-[#111] border-[#C5A059]/30 text-[#C5A059] focus:border-[#C5A059] placeholder-[#C5A059]/30';
  const textAccent = isDeRoche ? 'text-black' : 'text-[#C5A059]';
  const labelClass = "flex items-center justify-between mb-2 opacity-80 uppercase tracking-widest text-[9px] font-bold";

  const renderSelectInput = (label: string, value: string, setValue: (val: string) => void, options: string[], placeholder: string) => { 
      const isCustom = !options.includes(value) && value !== 'RANDOM'; 
      return ( 
        <div className="relative group mb-2"> 
            {isCustom ? ( 
                <div className="relative animate-in fade-in duration-200"> 
                    <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} autoFocus className={`w-full p-2 pr-8 text-[10px] border rounded-sm outline-none font-mono ${inputClass}`} /> 
                    <button onClick={() => setValue('RANDOM')} className={`absolute right-2 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform ${textAccent}`} title="Reset to Random"><X size={12} /></button> 
                </div> 
            ) : ( 
                <> 
                    <select value={value} onChange={(e) => { if (e.target.value === 'CUSTOM_INPUT') { setValue(''); } else { setValue(e.target.value); } }} className={`w-full p-2 text-[10px] border rounded-sm outline-none appearance-none cursor-pointer font-mono uppercase ${inputClass}`}> 
                        <option value="RANDOM" className="bg-[#111] text-gray-500">[ RANDOM {label.toUpperCase()} ]</option> 
                        {options.map((opt) => (<option key={opt} value={opt} className="bg-[#111] text-white">{opt}</option>))} 
                        <option value="CUSTOM_INPUT" className="bg-[#111] text-[#C5A059] font-bold tracking-widest">:: CUSTOM ::</option> 
                    </select> 
                    <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none ${textAccent}`} /> 
                </> 
            )} 
        </div> 
      ); 
  };

  const handleModelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        
        // 1. Convert to Base64 for scanning
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            const mimeType = file.type;

            // 2. Perform Biometric Scan (Gemini)
            let scanResult = "";
            try {
               scanResult = await scanFaceGeometry(base64, mimeType);
            } catch (err) {
               console.warn("Auto-scan failed, saving without biometrics", err);
            }

            // 3. Save to Agency with Biometrics
            const newModel = await saveModelToAgency(file, 'UPLOADED', 'Imported Model', scanResult);
            
            // 4. Update Store
            addModel(newModel);
            selectModel(newModel.id);
            setIsUploading(false);
        };
        
        reader.onerror = () => {
            alert("File read error");
            setIsUploading(false);
        }

      } catch (error) {
        console.error("Model upload failed", error);
        alert("Failed to import model.");
        setIsUploading(false);
      }
    }
  };

  const selectedAgentModel = savedModels.find(m => m.id === selectedModelId);

  return (
    <section>
        <div className={labelClass}>
            <div className="flex items-center gap-2"><Users size={12} /> <span>Casting Director</span></div>
        </div>
        
        {/* TABS */}
        <div className="flex gap-1 mb-3">
            <button 
                onClick={() => { onTabChange('AUTO'); selectModel(null); }}
                className={`flex-1 py-2 text-[8px] uppercase font-bold tracking-wider border rounded-sm transition-all ${activeTab === 'AUTO' ? (isDeRoche ? 'bg-black text-white border-black' : 'bg-[#C5A059] text-black border-[#C5A059]') : 'opacity-50 border-transparent hover:opacity-100'}`}
            >
                <RefreshCw size={10} className="inline mr-1"/> Auto-Cast
            </button>
            <button 
                onClick={() => onTabChange('AGENCY')}
                className={`flex-1 py-2 text-[8px] uppercase font-bold tracking-wider border rounded-sm transition-all ${activeTab === 'AGENCY' ? (isDeRoche ? 'bg-black text-white border-black' : 'bg-[#C5A059] text-black border-[#C5A059]') : 'opacity-50 border-transparent hover:opacity-100'}`}
            >
                <Star size={10} className="inline mr-1"/> Agency ({savedModels.length})
            </button>
        </div>

        {activeTab === 'AGENCY' ? (
            <div className={`p-3 border rounded-sm ${isDeRoche ? 'bg-gray-100 border-gray-300' : 'bg-black/40 border-[#C5A059]/30'}`}>
                <div className="grid grid-cols-3 gap-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
                    {/* UPLOAD BUTTON */}
                    <label className="aspect-square border border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 opacity-60 hover:opacity-100 transition-all relative">
                        {isUploading ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14} />}
                        <span className="text-[7px] mt-1 uppercase font-bold text-center px-1">{isUploading ? "Scanning..." : "Recruit New"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleModelImport} disabled={isUploading} />
                    </label>

                    {/* MODEL CARDS */}
                    {savedModels.map(model => (
                        <button 
                            key={model.id}
                            onClick={() => selectModel(model.id)}
                            className={`relative aspect-square rounded overflow-hidden border-2 transition-all group ${selectedModelId === model.id ? (isDeRoche ? 'border-black' : 'border-[#C5A059]') : 'border-transparent opacity-60 hover:opacity-100'}`}
                            title={model.name || "Model"}
                        >
                            <img src={model.url} className="w-full h-full object-cover" alt="Model" />
                            <div className="absolute bottom-0 left-0 w-full bg-black/60 p-1 text-[6px] text-white truncate text-center font-mono">
                                {model.name || "Unknown"}
                            </div>
                            {selectedModelId === model.id && (
                                <div className={`absolute inset-0 flex items-center justify-center bg-black/40`}>
                                    <Check size={16} className="text-white drop-shadow-md" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
                <p className="text-[8px] text-center opacity-50 uppercase font-mono border-t border-dashed border-current pt-2 mt-2">
                    {selectedAgentModel ? `Subject Locked: ${selectedAgentModel.name || 'Model'}` : "Select a model to lock identity"}
                </p>
                {selectedAgentModel?.biometricData && (
                    <div className="flex justify-center mt-1">
                        <span className="text-[7px] bg-green-900/30 text-green-500 px-1 rounded border border-green-500/30 flex items-center gap-1">
                            <Fingerprint size={8} /> BIOMETRICS VERIFIED
                        </span>
                    </div>
                )}
            </div>
        ) : (
            <div className={`space-y-1 opacity-80 animate-in fade-in duration-300`}>
                {renderSelectInput("Gender", castGender, setCastGender, CASTING_GENDERS, "e.g. Female")}
                {renderSelectInput("Vibe", castVibe, setCastVibe, CASTING_VIBES, "e.g. Regal")}
                {renderSelectInput("Hair", castHair, setCastHair, CASTING_HAIR, "e.g. Shaved")}
                {renderSelectInput("Face", castFace, setCastFace, CASTING_FACE, "e.g. Alien")}
                <div className="relative mt-2">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50"><Fingerprint size={10} /></div>
                    <input type="text" value={castDetails} onChange={(e) => setCastDetails(e.target.value)} placeholder="SPECIFIC MARKINGS / DETAILS..." className={`w-full py-2 pl-6 pr-2 text-[10px] border-b bg-transparent rounded-none focus:outline-none placeholder-opacity-50 ${isDeRoche ? 'border-gray-300 text-black placeholder-gray-400' : 'border-[#C5A059]/30 text-[#C5A059] placeholder-[#C5A059]/30'}`} />
                </div>
                <div className="p-2 mt-2 text-[8px] text-center border border-dashed rounded opacity-50 font-mono">
                    AI will generate a unique face for every shot.
                </div>
            </div>
        )}
    </section>
  );
};
