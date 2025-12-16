
import React, { useState } from 'react';
import { X, ScanLine, Save, Loader2, Fingerprint, Activity, CheckCircle2 } from 'lucide-react';
import { GeneratedImage, BrandArchetype } from '../types';
import { saveModelToAgency, fetchMyModels } from '../services/storageService';
import { getBase64FromUrl, scanFaceGeometry } from '../services/geminiService';

interface ModelRecruiterModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'IDENTITY' | 'SCANNING' | 'SAVING';

export const ModelRecruiterModal: React.FC<ModelRecruiterModalProps> = ({ image, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>('IDENTITY');
  const [modelName, setModelName] = useState('');
  const [biometricMap, setBiometricMap] = useState<string>('');
  const [error, setError] = useState('');

  const isDeRoche = image.brand === BrandArchetype.DE_ROCHE;
  const accentColor = isDeRoche ? 'text-black' : 'text-[#C5A059]';
  const borderColor = isDeRoche ? 'border-gray-200' : 'border-[#C5A059]/30';
  const bgColor = isDeRoche ? 'bg-[#f4f4f4]' : 'bg-[#0a0a0a]';

  const handleStartScan = async () => {
    if (!modelName.trim()) {
        setError("Identity Required");
        return;
    }
    setError('');
    setStep('SCANNING');

    try {
        // 1. Get Base64
        const { base64, mimeType } = await getBase64FromUrl(image.localUrl || image.url);
        
        // 2. Scan Face
        const scanResult = await scanFaceGeometry(base64, mimeType);
        if (!scanResult) throw new Error("Facial recognition failed.");
        
        setBiometricMap(scanResult);
        
        // 3. Auto-Proceed to Saving
        setStep('SAVING');
        
        // 4. Save to Agency
        // Convert base64 back to blob for upload
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        await saveModelToAgency(blob, 'GENERATED', modelName, scanResult);
        
        onSuccess();
        
    } catch (e: any) {
        console.error(e);
        setError("Scan Protocol Failed: " + e.message);
        setStep('IDENTITY');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200 font-mono">
      <div className={`w-full max-w-lg ${bgColor} border ${borderColor} shadow-2xl relative overflow-hidden flex flex-col md:flex-row`}>
        
        {/* Left: Image Preview */}
        <div className="w-full md:w-1/3 aspect-[3/4] relative border-b md:border-b-0 md:border-r border-inherit">
           <img src={image.url} className="w-full h-full object-cover" alt="Subject" />
           {step === 'SCANNING' && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                 <div className="w-full h-1 bg-green-500 absolute top-0 animate-[scan_2s_linear_infinite] shadow-[0_0_15px_#00ff00]"></div>
                 <ScanLine size={48} className="text-green-500 animate-pulse" />
              </div>
           )}
        </div>

        {/* Right: Controls */}
        <div className="flex-1 p-8 flex flex-col justify-between relative">
           <button onClick={onClose} className={`absolute top-4 right-4 hover:opacity-50 ${accentColor}`}>
              <X size={20} />
           </button>

           <div>
              <div className="flex items-center gap-2 mb-6">
                 <Fingerprint size={20} className={accentColor} />
                 <h2 className={`text-xl font-header uppercase tracking-wider ${accentColor}`}>Agency Recruit</h2>
              </div>

              {step === 'IDENTITY' && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <p className="text-[10px] uppercase opacity-70 tracking-widest font-bold">Subject Identity</p>
                    <input 
                       autoFocus
                       type="text" 
                       placeholder="CODE NAME / MODEL NAME" 
                       value={modelName}
                       onChange={(e) => setModelName(e.target.value)}
                       className={`w-full bg-transparent border-b-2 py-2 text-lg font-bold outline-none uppercase tracking-widest ${isDeRoche ? 'border-gray-300 text-black placeholder-gray-400' : 'border-[#C5A059]/50 text-[#C5A059] placeholder-[#C5A059]/30'}`}
                    />
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                 </div>
              )}

              {step === 'SCANNING' && (
                 <div className="space-y-4 text-center py-8">
                    <p className={`text-xs font-mono uppercase animate-pulse ${isDeRoche ? 'text-black' : 'text-[#C5A059]'}`}>
                       Mapping Facial Geometry...
                    </p>
                    <div className="h-1 w-full bg-gray-800 rounded overflow-hidden">
                       <div className={`h-full w-1/2 animate-[loading_1s_infinite] ${isDeRoche ? 'bg-black' : 'bg-[#C5A059]'}`}></div>
                    </div>
                 </div>
              )}

              {step === 'SAVING' && (
                 <div className="space-y-4 text-center py-8">
                    <CheckCircle2 size={32} className="mx-auto text-green-500" />
                    <p className={`text-xs font-mono uppercase ${isDeRoche ? 'text-black' : 'text-[#C5A059]'}`}>
                       Biometrics Encrypted. Uploading...
                    </p>
                 </div>
              )}
           </div>

           {step === 'IDENTITY' && (
              <button 
                 onClick={handleStartScan}
                 className={`w-full py-4 mt-8 flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest transition-all ${isDeRoche ? 'bg-black text-white hover:bg-gray-800' : 'bg-[#C5A059] text-black hover:bg-white'}`}
              >
                 <Activity size={16} /> Initiate Scan & Save
              </button>
           )}
        </div>

      </div>
    </div>
  );
};
