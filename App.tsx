import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { 
  Camera, Lock, Unlock, Dice5, ChevronDown, 
  LayoutGrid, Users, Palette, Layers, 
  Maximize, Image as ImageIcon, Monitor, Sliders, RefreshCw,
  X, Type, Hexagon, Fingerprint, Filter, Loader2
} from 'lucide-react';
import { 
  GeneratedImage, BrandArchetype, EnvironmentPreset, 
  LightingPreset, FramingPreset, UploadedFile, 
  MarketingStrategy, TechPack, CollectionLook, 
  ImageResolution, AspectRatio, ModelPreset, SourceInterpretation, HarmonyRule 
} from './types';
import { generateId, fileToBase64 } from './utils';
import { 
  generateEditorialImages, checkApiKey, selectApiKey, 
  generateMarketingStrategy, generateTechPack, 
  editGeneratedImage, generateVideo, generateVariations, 
  simulateFabricMovement, MODEL_PRESETS, enhancePrompt,
  generateCreativePrompt, generateRandomModelProfile
} from './services/geminiService';

import { ApiKeyModal } from './components/ApiKeyModal';
import { UploadZone } from './components/UploadZone';
import { GeneratedImageCard } from './components/GeneratedImageCard';
import { RightSidebar } from './components/RightSidebar';
import { MarketingModal } from './components/MarketingModal';
import { ImageComparator } from './components/ImageComparator';
import { NarrativeEngine } from './components/NarrativeEngine';
import { VibeCheck } from './components/VibeCheck';
import { ImmersiveStudio } from './components/ImmersiveStudio';
import { ChatBot } from './components/ChatBot';
import { ColorHarmonyWheel } from './components/ColorHarmonyWheel';
import { PromptInput } from './components/PromptInput';
import { useAppStore } from './store';

// Lazy Load Heavy Components
const TechPackModal = lazy(() => import('./components/TechPackModal').then(module => ({ default: module.TechPackModal })));
const CollectionArchitect = lazy(() => import('./components/CollectionArchitect').then(module => ({ default: module.CollectionArchitect })));

// --- CASTING CONSTANTS ---
const CASTING_GENDERS = ["Female", "Male", "Non-Binary", "Androgynous", "Fluid", "Alien", "Unspecified"];
const CASTING_VIBES = ["Regal", "Manic", "Ethereal", "Feral", "Minimalist", "Cybernetic", "Opulent", "Decayed", "Vulnerable", "Haughty"];
const CASTING_HAIR = ["Shaved", "Architectural Bob", "Wet-Look Long", "Spiked", "Buzzcut", "Wind-Swept", "Braided", "Bleached", "Natural Afro"];
const CASTING_FACE = ["Classic", "Alien", "Severe", "Doll-like", "Pierced", "Tattooed", "Gaunt", "Freckled", "Fresh"];

const App: React.FC = () => {
  // Use Store hooks
  const { 
    brand, 
    setBrand, 
    isGenerating, 
    setIsGenerating,
    setLoadingStep,
    generatedImages, 
    setGeneratedImages,
    addGeneratedImage,
    updateGeneratedImage,
    uploadedFiles, 
    setUploadedFiles,
    addUploadedFiles,
    removeUploadedFile,
    selectedImageId, 
    setSelectedImageId,
    comparisonImageId, 
    setComparisonImageId,
    useGrounding
  } = useAppStore();

  // --- LOCAL STATE (Specific to Controls/Modals) ---
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showVibeCheck, setShowVibeCheck] = useState(true);
  const [galleryFilter, setGalleryFilter] = useState<'ALL' | BrandArchetype>('ALL');
  const [promptOverride, setPromptOverride] = useState<string | undefined>(undefined);
  const [learningContext, setLearningContext] = useState<string[]>([]);

  // CONFIG & CONTROLS
  const [castGender, setCastGender] = useState('RANDOM');
  const [castVibe, setCastVibe] = useState('RANDOM');
  const [castHair, setCastHair] = useState('RANDOM');
  const [castFace, setCastFace] = useState('RANDOM');
  const [castDetails, setCastDetails] = useState('');
  
  // Brand DNA
  const [deRocheLogo, setDeRocheLogo] = useState<UploadedFile | null>(null);
  const [chaosLogo, setChaosLogo] = useState<UploadedFile | null>(null);

  // Colors
  const [colorPalette, setColorPalette] = useState<string>('');
  const [harmonyRule, setHarmonyRule] = useState<HarmonyRule>('MONOCHROMATIC');
  const [customHexInput, setCustomHexInput] = useState('');
  
  // Source
  const [sourceFidelity, setSourceFidelity] = useState<number>(50);
  const [sourceInterpretation, setSourceInterpretation] = useState<SourceInterpretation | undefined>(SourceInterpretation.BLEND_50_50);
  const [sourceMaterialPrompt, setSourceMaterialPrompt] = useState('');
  
  // OUTPUT CONFIG
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [resolution, setResolution] = useState<ImageResolution>(ImageResolution.RES_2K);

  // Scene Director State
  const [environment, setEnvironment] = useState<string>(EnvironmentPreset.RANDOM);
  const [lighting, setLighting] = useState<string>(LightingPreset.RANDOM);
  const [framing, setFraming] = useState<string>(FramingPreset.RANDOM);
  const [isSeedLocked, setIsSeedLocked] = useState(false);
  const [seed, setSeed] = useState(Math.random());
  const [customScenePrompt, setCustomScenePrompt] = useState('');

  // Modals & Sidebars
  const [marketingStrategy, setMarketingStrategy] = useState<MarketingStrategy | null>(null);
  const [isMarketingLoading, setIsMarketingLoading] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  
  const [techPack, setTechPack] = useState<TechPack | null>(null);
  const [isGeneratingTechPack, setIsGeneratingTechPack] = useState(false);
  const [showTechPackModal, setShowTechPackModal] = useState(false);

  const [activeLookForNarrative, setActiveLookForNarrative] = useState<CollectionLook | null>(null);
  const [showStudio, setShowStudio] = useState(false);

  // Loaders for Sidebar Actions (Kept local as they are transient tasks)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isSimulatingFabric, setIsSimulatingFabric] = useState(false);
  const [isIterating, setIsIterating] = useState(false);

  // --- STYLES ---
  const isDeRoche = brand === BrandArchetype.DE_ROCHE;
  const bgClass = isDeRoche ? 'bg-[#f4f4f4] text-[#111]' : 'bg-[#050505] text-[#C5A059]';
  const sidebarClass = isDeRoche ? 'bg-white border-r border-gray-200' : 'bg-[#0a0a0a] border-r border-[#C5A059]/30';
  const inputClass = isDeRoche 
    ? 'bg-gray-50 border-gray-300 text-black focus:border-black placeholder-gray-400' 
    : 'bg-[#111] border-[#C5A059]/30 text-[#C5A059] focus:border-[#C5A059] placeholder-[#C5A059]/30';
  const textAccent = isDeRoche ? 'text-black' : 'text-[#C5A059]';
  const labelClass = "flex items-center justify-between mb-2 opacity-80 uppercase tracking-widest text-[9px] font-bold";
  
  // --- EFFECTS ---
  useEffect(() => {
    checkApiKey().then(hasKey => {
      setHasApiKey(hasKey);
      if (!hasKey) setShowApiKeyModal(true);
    });
  }, []);

  useEffect(() => {
    return () => {
      generatedImages.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, []);

  // --- HANDLERS ---
  const handleApiKeySelect = async () => {
    await selectApiKey();
    const hasKey = await checkApiKey();
    setHasApiKey(hasKey);
    if (hasKey) setShowApiKeyModal(false);
  };

  const handleRateImage = useCallback((id: string, rating: number) => {
    // Update store
    updateGeneratedImage(id, { rating });
    
    if (rating >= 4) {
       const img = generatedImages.find(i => i.id === id);
       if (img) {
           const successMarker = `Style Guide (${rating}★): ${img.prompt.slice(0, 100)}... [Vibe: ${img.modelPrompt || 'Unknown'}]`;
           setLearningContext(prev => {
               const newContext = [...prev, successMarker];
               if (newContext.length > 5) return newContext.slice(-5);
               return newContext;
           });
       }
    }
  }, [generatedImages, updateGeneratedImage]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetBrand: BrandArchetype) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const base64 = await fileToBase64(file);
        const newFile = { id: generateId(), file, previewUrl: URL.createObjectURL(file), base64, mimeType: file.type, category: 'brand' as const };
        if (targetBrand === BrandArchetype.DE_ROCHE) setDeRocheLogo(newFile);
        else setChaosLogo(newFile);
    }
  };

  const handlePaletteChange = useCallback((colors: string[]) => {
    setColorPalette(colors.join(', '));
  }, []);

  const randomizeScene = () => {
    const envs = Object.values(EnvironmentPreset).filter(k => k !== 'RANDOM');
    const lights = Object.values(LightingPreset).filter(k => k !== 'RANDOM');
    const frames = Object.values(FramingPreset).filter(k => k !== 'RANDOM');
    
    setEnvironment(envs[Math.floor(Math.random() * envs.length)]);
    setLighting(lights[Math.floor(Math.random() * lights.length)]);
    setFraming(frames[Math.floor(Math.random() * frames.length)]);
    if (!isSeedLocked) setSeed(Math.random());
  };

  const generateCasting = () => {
     const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
     setCastGender(getRandom(CASTING_GENDERS));
     setCastVibe(getRandom(CASTING_VIBES));
     setCastHair(getRandom(CASTING_HAIR));
     setCastFace(getRandom(CASTING_FACE));
  };

  // Called by PromptInput (Enhance/Inspire handlers removed from App.tsx as logic moved to component or handled there)
  // Wait, `onEnhance` and `onInspire` require API calls and state updates. 
  // PromptInput still expects callbacks. I will keep the service calls here but remove state.
  
  const handleGetInspiration = async () => {
    // Logic kept for PromptInput callback
    try {
        const castingStr = `Gender: ${castGender}, Vibe: ${castVibe}`;
        const { concept } = await generateCreativePrompt(brand, castingStr);
        // We return string, component sets local state
        return concept;
    } catch (e) {
        console.error(e);
        return "";
    }
  };

  const handleEnhance = async (currentPrompt: string) => {
    if (!currentPrompt) return "";
    try {
        const result = await enhancePrompt(currentPrompt, brand);
        if (result.suggestedScene) {
            if (result.suggestedScene.environment && result.suggestedScene.environment !== 'Random') setEnvironment(result.suggestedScene.environment);
            if (result.suggestedScene.lighting && result.suggestedScene.lighting !== 'Random') setLighting(result.suggestedScene.lighting);
            if (result.suggestedScene.framing && result.suggestedScene.framing !== 'Full Body') setFraming(result.suggestedScene.framing);
        }
        return result.improvedPrompt;
    } catch (e: any) {
        console.error("Enhance failed", e);
        return "";
    }
  };

  const handleGenerate = async (finalPrompt: string) => {
    if (!finalPrompt && uploadedFiles.length === 0) return;
    setIsGenerating(true);
    setLoadingStep("ANALYZING BRIEF...");

    const steps = ["CASTING MODEL...", "CONSTRUCTING SCENE...", "STYLING LOOK...", "RENDERING LIGHT...", "DEVELOPING FILM..."];
    let stepIdx = 0;
    const interval = setInterval(() => {
        if (stepIdx < steps.length) {
            setLoadingStep(steps[stepIdx]);
            stepIdx++;
        }
    }, 2500);

    try {
      let builtCasting = "";
      if (castGender !== 'RANDOM') builtCasting += `CASTING: ${castGender}. `;
      if (castVibe !== 'RANDOM') builtCasting += `VIBE: ${castVibe.toUpperCase()}. `;
      if (castHair !== 'RANDOM') builtCasting += `HAIR: ${castHair}. `;
      if (castFace !== 'RANDOM') builtCasting += `FACE: ${castFace}. `;
      if (castDetails) builtCasting += `DETAILS: ${castDetails}.`;

      const images = await generateEditorialImages({
        prompt: finalPrompt,
        uploadedFiles,
        resolution,
        aspectRatio,
        brand,
        environment,
        lighting,
        framing,
        customScenePrompt,
        seed: isSeedLocked ? seed : Math.random(),
        modelPrompt: builtCasting || undefined, 
        colorPalette: customHexInput ? customHexInput : (colorPalette || undefined),
        sourceFidelity: sourceFidelity,
        sourceInterpretation: sourceInterpretation,
        logoBase64: (brand === BrandArchetype.DE_ROCHE ? deRocheLogo?.base64 : chaosLogo?.base64),
        locationQuery: useGrounding ? finalPrompt : undefined, 
        sourceMaterialPrompt,
        learningContext: learningContext 
      });

      const newImages: GeneratedImage[] = images.map(url => ({
        id: generateId(),
        url,
        prompt: finalPrompt,
        resolution,
        timestamp: Date.now(),
        brand,
        type: 'editorial',
        mode: undefined 
      }));

      // Store Update
      setGeneratedImages((prev) => [...newImages, ...prev]);
    } catch (error: any) {
      console.error("Generation failed", error);
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
         alert("Request Timed Out: The generation took too long or was interrupted. Please try again.");
      } else if (error.message?.includes("Failed to fetch")) {
        alert("Connection Error: Failed to fetch from the AI service. Please check your internet connection or try selecting a new API Key.");
      } else {
        alert("Generation failed. Please check the console for details.");
      }
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      setLoadingStep("");
    }
  };

  const handleEditImage = async (id: string, editPrompt: string): Promise<string> => {
    const img = generatedImages.find(i => i.id === id);
    if (!img) throw new Error("Image not found");
    return await editGeneratedImage(img.url, editPrompt);
  };
  const triggerTechPack = async (image: GeneratedImage) => {
     setIsGeneratingTechPack(true);
     try { const tp = await generateTechPack(image.url); setTechPack(tp); setShowTechPackModal(true); } 
     catch (e) { console.error(e); alert("Failed"); } finally { setIsGeneratingTechPack(false); }
  };
  const triggerMarketing = async (image: GeneratedImage) => {
     setIsMarketingLoading(true); setShowMarketingModal(true);
     try { const strategy = await generateMarketingStrategy(image.brand, []); setMarketingStrategy(strategy); } 
     catch (e) { console.error(e); setShowMarketingModal(false); } finally { setIsMarketingLoading(false); }
  };
  const triggerVideo = async (image: GeneratedImage) => {
    setIsGeneratingVideo(true);
    try { const videoUrl = await generateVideo(image.url, image.prompt, image.brand); updateGeneratedImage(image.id, { videoUrl }); } 
    catch (e) { console.error(e); alert("Failed"); } finally { setIsGeneratingVideo(false); }
  };
  const triggerVariations = async (image: GeneratedImage) => {
    setIsGeneratingVariations(true);
    try { const vars = await generateVariations(image.url, image.prompt, image.brand); const newImages = vars.map(url => ({ ...image, id: generateId(), url, timestamp: Date.now() })); setGeneratedImages(prev => [...newImages, ...prev]); } 
    catch (e) { console.error(e); alert("Failed"); } finally { setIsGeneratingVariations(false); }
  };
  const triggerSimulateFabric = async (image: GeneratedImage, fabricDesc: string) => {
      setIsSimulatingFabric(true);
      try { const videoUrl = await simulateFabricMovement(image.url, image.prompt, image.brand, fabricDesc); updateGeneratedImage(image.id, { videoUrl }); } 
      catch (e) { console.error(e); alert("Failed"); } finally { setIsSimulatingFabric(false); }
  };

  const handleIterationTrigger = async (mode: 'EVOLVE' | 'MUTATE' | 'BREAK') => {
      if (!selectedImageId) return;
      const originalImage = generatedImages.find(i => i.id === selectedImageId);
      if (!originalImage) return;

      setIsIterating(true);
      try {
          const images = await generateEditorialImages({
            prompt: `${originalImage.prompt}.`,
            uploadedFiles: [],
            resolution: originalImage.resolution,
            aspectRatio: AspectRatio.PORTRAIT,
            brand: originalImage.brand,
            environment: environment,
            lighting: lighting,
            framing: framing,
            seed: Math.random(),
            iterationMode: mode,
            referenceImageId: originalImage.id
          });
          
          const newImages: GeneratedImage[] = images.map(url => ({
            id: generateId(),
            url,
            prompt: `Iteration (${mode}): ${originalImage.prompt}`,
            resolution: originalImage.resolution,
            timestamp: Date.now(),
            brand: originalImage.brand,
            type: 'editorial'
          }));
          
          setGeneratedImages((prev) => [...newImages, ...prev]);
      } catch (e: any) {
          console.error(e);
          if (e.name !== 'AbortError') alert("Iteration failed");
      } finally {
          setIsIterating(false);
      }
  };

  const handleStudioApply = async (prompt: string) => {
      if (!selectedImageId) return;
      setIsGenerating(true); 
      try {
          const newUrl = await handleEditImage(selectedImageId, prompt);
          updateGeneratedImage(selectedImageId, { url: newUrl });
          setShowStudio(false);
      } catch (e: any) {
          console.error(e);
          if (e.name !== 'AbortError') alert("Failed to apply studio changes.");
      } finally {
          setIsGenerating(false);
      }
  };

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
  
  const renderSceneSelect = (label: string, value: string, setValue: (val: string) => void, enumObj: any, placeholder: string) => {
      const options = Object.values(enumObj).filter((k: any) => k !== 'RANDOM') as string[];
      return renderSelectInput(label, value, setValue, options, placeholder);
  };

  // --- FILTERED VIEW ---
  const filteredImages = generatedImages.filter(img => {
      if (galleryFilter === 'ALL') return true;
      return img.brand === galleryFilter;
  });

  return (
    <div className={`flex h-screen w-full overflow-hidden ${bgClass} font-sans selection:bg-pink-500 selection:text-white`}>
      
      {/* 1. LEFT SIDEBAR (Controls) */}
      <aside className={`w-[340px] flex-shrink-0 flex flex-col h-full overflow-y-auto custom-scrollbar z-20 ${sidebarClass} transition-colors duration-500`}>
        <div className="p-6 space-y-8 pb-32">
          
          {/* HEADER */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className={`text-3xl font-black uppercase tracking-tighter leading-none mb-1 ${textAccent} font-header`}>Lumière</h1>
                <p className="text-[9px] font-mono opacity-60 uppercase tracking-widest">AI Atelier // v3.3</p>
              </div>
              <div className={`w-8 h-8 flex items-center justify-center border rounded-full ${isDeRoche ? 'border-black' : 'border-[#C5A059]'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isDeRoche ? 'bg-green-500' : 'bg-[#C5A059]'}`}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              <button onClick={() => setBrand(BrandArchetype.DE_ROCHE)} className={`py-3 px-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${brand === BrandArchetype.DE_ROCHE ? 'bg-black text-white border-black' : 'bg-transparent text-gray-400 border-gray-200 hover:border-gray-400'}`}>De Roche</button>
              <button onClick={() => setBrand(BrandArchetype.CHAOSCHICC)} className={`py-3 px-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${brand === BrandArchetype.CHAOSCHICC ? 'bg-[#C5A059] text-black border-[#C5A059]' : 'bg-transparent text-gray-400 border-[#C5A059]/30 hover:border-[#C5A059]'}`}>ChaosChicc</button>
            </div>
          </div>

          {/* SECTION 1: SCENE DIRECTOR */}
          <section>
             <div className={labelClass}>
               <div className="flex items-center gap-2"><Camera size={12} /> <span>Scene Director</span></div>
               <div className="flex gap-1">
                 <button onClick={() => setIsSeedLocked(!isSeedLocked)} className="hover:opacity-100 opacity-50">{isSeedLocked ? <Lock size={12} /> : <Unlock size={12} />}</button>
                 <button onClick={randomizeScene} className="hover:opacity-100 opacity-50"><Dice5 size={12} /></button>
               </div>
             </div>
             <div className="space-y-1">
                {renderSceneSelect("Environment", environment, setEnvironment, EnvironmentPreset, "e.g. Cyberpunk Alleyway...")}
                {renderSceneSelect("Lighting", lighting, setLighting, LightingPreset, "e.g. Neon Strobe...")}
                {renderSceneSelect("Framing", framing, setFraming, FramingPreset, "e.g. Dutch Angle...")}
                <div className="relative mt-2">
                   <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50"><Type size={10} /></div>
                   <input type="text" value={customScenePrompt} onChange={(e) => setCustomScenePrompt(e.target.value)} placeholder="ADDITIONAL DIRECTOR NOTES..." className={`w-full py-2 pl-6 pr-2 text-[10px] border-b bg-transparent rounded-none focus:outline-none placeholder-opacity-50 ${isDeRoche ? 'border-gray-300 text-black placeholder-gray-400' : 'border-[#C5A059]/30 text-[#C5A059] placeholder-[#C5A059]/30'}`} />
                </div>
             </div>
          </section>
          
          {/* SECTION 2: BRAND DNA */}
          <section>
             <div className={labelClass}>
               <div className="flex items-center gap-2"><Hexagon size={12} /> <span>Brand DNA (Logos)</span></div>
             </div>
             <div className="grid grid-cols-2 gap-3">
               <label className={`block w-full aspect-square border border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/5 ${inputClass}`}>
                  {deRocheLogo ? <img src={deRocheLogo.previewUrl} className="w-full h-full object-contain p-2" /> : <span className="text-[9px] opacity-50">+ DE ROCHE</span>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, BrandArchetype.DE_ROCHE)} />
               </label>
               <label className={`block w-full aspect-square border border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/5 ${inputClass}`}>
                  {chaosLogo ? <img src={chaosLogo.previewUrl} className="w-full h-full object-contain p-2" /> : <span className="text-[9px] opacity-50">+ CHAOS</span>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, BrandArchetype.CHAOSCHICC)} />
               </label>
             </div>
          </section>

          {/* SECTION 3: CHROMATICS */}
          <section>
            <div className={labelClass}>
               <div className="flex items-center gap-2"><Palette size={12} /> <span>Harmonies</span></div>
            </div>
            <div className="flex gap-1 mb-2 overflow-x-auto custom-scrollbar pb-1">
               {(['ANALOGOUS', 'TRIAD', 'SPLIT_COMPLEMENTARY', 'MONOCHROMATIC'] as HarmonyRule[]).map(r => (
                  <button 
                    key={r} 
                    onClick={() => setHarmonyRule(r)} 
                    className={`flex-shrink-0 px-2 py-1 text-[8px] uppercase border rounded-sm transition-all ${
                        harmonyRule === r 
                            ? (isDeRoche ? 'bg-black text-white border-black' : 'bg-[#C5A059] text-black border-[#C5A059]')
                            : (isDeRoche ? 'text-gray-800 border-gray-300' : 'text-gray-500 border-current opacity-50 hover:opacity-100')
                    }`}
                  >
                    {r.replace('_', ' ')}
                  </button>
               ))}
            </div>
            <div className={`p-4 border rounded ${isDeRoche ? 'border-[#232222]' : 'border-[#C5A059]'} bg-black/20`}>
               <ColorHarmonyWheel rule={harmonyRule} onPaletteChange={handlePaletteChange} brandMode={brand === BrandArchetype.DE_ROCHE ? 'DE_ROCHE' : 'CHAOSCHICC'} mode="THEORY" />
            </div>
            <input type="text" value={customHexInput} onChange={(e) => setCustomHexInput(e.target.value)} placeholder="#HEX, #HEX..." className={`w-full p-2 text-[10px] border rounded-sm outline-none mt-2 font-mono uppercase ${inputClass}`} />
          </section>

          {/* SECTION 4: CASTING (REFACTORED) */}
          <section>
             <div className={labelClass}>
               <div className="flex items-center gap-2"><Users size={12} /> <span>Casting</span></div>
               <button onClick={generateCasting} className="flex items-center gap-1 hover:underline cursor-pointer" title="Randomize Model"><RefreshCw size={10} /> AUTO-CAST</button>
             </div>
             
             <div className="space-y-1">
                {renderSelectInput("Gender", castGender, setCastGender, CASTING_GENDERS, "e.g. Female")}
                {renderSelectInput("Vibe", castVibe, setCastVibe, CASTING_VIBES, "e.g. Regal")}
                {renderSelectInput("Hair", castHair, setCastHair, CASTING_HAIR, "e.g. Shaved")}
                {renderSelectInput("Face", castFace, setCastFace, CASTING_FACE, "e.g. Alien")}
                
                <div className="relative mt-2">
                   <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50"><Fingerprint size={10} /></div>
                   <input 
                      type="text" 
                      value={castDetails} 
                      onChange={(e) => setCastDetails(e.target.value)} 
                      placeholder="SPECIFIC MARKINGS / DETAILS..." 
                      className={`w-full py-2 pl-6 pr-2 text-[10px] border-b bg-transparent rounded-none focus:outline-none placeholder-opacity-50 ${isDeRoche ? 'border-gray-300 text-black placeholder-gray-400' : 'border-[#C5A059]/30 text-[#C5A059] placeholder-[#C5A059]/30'}`} 
                   />
                </div>
             </div>
          </section>

          {/* SECTION 5: SOURCE MATERIAL (REFINED GRID) */}
          <section>
             <div className={labelClass}>
               <div className="flex items-center gap-2"><Layers size={12} /> <span>Source Material</span></div>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <UploadZone label="Mood" category="moodboard" files={uploadedFiles.filter(f => f.category === 'moodboard')} onAddFiles={(files) => addUploadedFiles(files)} onRemoveFile={removeUploadedFile} />
                <UploadZone label="Ref" category="reference" files={uploadedFiles.filter(f => f.category === 'reference')} onAddFiles={(files) => addUploadedFiles(files)} onRemoveFile={removeUploadedFile} />
             </div>
             
             {uploadedFiles.length > 0 && (
                <div className="space-y-2 mt-2">
                   {/* Full Source Interpretation Options Grid (Improved Layout) */}
                   <div className="grid grid-cols-2 gap-1.5">
                      {Object.values(SourceInterpretation).map((mode) => (
                        <button key={mode} onClick={() => setSourceInterpretation(sourceInterpretation === mode ? undefined : mode)} className={`px-2 py-1.5 text-[8px] uppercase border font-medium truncate transition-all ${sourceInterpretation === mode ? 'bg-current text-black' : (isDeRoche ? 'border-gray-300 text-gray-600 hover:border-black' : 'border-[#C5A059]/30 text-[#C5A059] hover:border-[#C5A059]')}`}>
                          {mode.replace(/_/g, ' ')}
                        </button>
                      ))}
                   </div>
                   
                   <textarea value={sourceMaterialPrompt} onChange={(e) => setSourceMaterialPrompt(e.target.value)} placeholder="SOURCE NOTES (e.g. 'Use texture from Image A')..." className={`w-full h-10 p-2 text-[9px] border rounded-sm resize-none outline-none font-mono ${inputClass}`} />

                   <div>
                       <div className="flex justify-between text-[9px] font-bold uppercase opacity-70 mb-1"><span>Vibe Only</span><span>Strict Fidelity</span></div>
                       <input type="range" min="0" max="100" step="10" value={sourceFidelity} onChange={(e) => setSourceFidelity(Number(e.target.value))} className={`w-full h-1 bg-gray-500/30 rounded-lg appearance-none cursor-pointer ${isDeRoche ? '[&::-webkit-slider-thumb]:bg-black' : '[&::-webkit-slider-thumb]:bg-[#C5A059]'} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full`} />
                   </div>
                </div>
             )}
          </section>

          {/* SECTION 6: CREATIVE DIRECTION (NOW ISOLATED) */}
          <PromptInput 
             onGenerate={handleGenerate}
             onEnhance={handleEnhance}
             onInspire={handleGetInspiration}
             overridePrompt={promptOverride}
          />

          {/* SECTION 7: OUTPUT */}
          <section className="border-t border-dashed border-current opacity-80 pt-4">
              <div className={labelClass}><div className="flex items-center gap-2"><Sliders size={12} /> <span>Output Config</span></div></div>
              <div className="grid grid-cols-2 gap-2">
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className={`w-full p-2 text-[9px] border rounded-sm outline-none appearance-none cursor-pointer uppercase ${inputClass}`}>
                      <option value={AspectRatio.PORTRAIT} className="bg-[#111]">Portrait (3:4)</option>
                      <option value={AspectRatio.LANDSCAPE} className="bg-[#111]">Landscape (16:9)</option>
                      <option value={AspectRatio.SQUARE} className="bg-[#111]">Square (1:1)</option>
                      <option value={AspectRatio.TALL} className="bg-[#111]">Mobile (9:16)</option>
                  </select>
                  <select value={resolution} onChange={(e) => setResolution(e.target.value as ImageResolution)} className={`w-full p-2 text-[9px] border rounded-sm outline-none appearance-none cursor-pointer uppercase ${inputClass}`}>
                      <option value={ImageResolution.RES_2K} className="bg-[#111]">2K Resolution</option>
                      <option value={ImageResolution.RES_4K} className="bg-[#111]">4K Resolution</option>
                  </select>
              </div>
          </section>
        </div>
      </aside>

      {/* 2. MAIN GALLERY AREA */}
      <main className="flex-1 flex flex-col h-full relative z-10">
         {/* GALLERY FILTER HEADER */}
         <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${isDeRoche ? 'border-gray-200 bg-white/50' : 'border-[#C5A059]/20 bg-black/50'} backdrop-blur-md sticky top-0 z-20`}>
            <div className="flex items-center gap-2 opacity-50">
               <LayoutGrid size={14} className={isDeRoche ? 'text-black' : 'text-[#C5A059]'} />
               <span className={`text-[10px] font-bold uppercase tracking-widest ${isDeRoche ? 'text-black' : 'text-[#C5A059]'}`}>Atelier Archives ({filteredImages.length})</span>
            </div>
            
            <div className="flex gap-1 bg-black/5 p-1 rounded-sm">
                <button 
                   onClick={() => setGalleryFilter('ALL')}
                   className={`px-3 py-1 text-[9px] font-bold uppercase transition-all rounded-sm ${galleryFilter === 'ALL' ? (isDeRoche ? 'bg-black text-white shadow' : 'bg-[#C5A059] text-black shadow') : 'opacity-50 hover:opacity-100 hover:bg-black/5'}`}
                >
                   All
                </button>
                <button 
                   onClick={() => setGalleryFilter(BrandArchetype.DE_ROCHE)}
                   className={`px-3 py-1 text-[9px] font-bold uppercase transition-all rounded-sm ${galleryFilter === BrandArchetype.DE_ROCHE ? (isDeRoche ? 'bg-black text-white shadow' : 'bg-[#C5A059] text-black shadow') : 'opacity-50 hover:opacity-100 hover:bg-black/5'}`}
                >
                   De Roche
                </button>
                <button 
                   onClick={() => setGalleryFilter(BrandArchetype.CHAOSCHICC)}
                   className={`px-3 py-1 text-[9px] font-bold uppercase transition-all rounded-sm ${galleryFilter === BrandArchetype.CHAOSCHICC ? (isDeRoche ? 'bg-black text-white shadow' : 'bg-[#C5A059] text-black shadow') : 'opacity-50 hover:opacity-100 hover:bg-black/5'}`}
                >
                   Chaos
                </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {filteredImages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                  <Filter size={48} className="mb-4" />
                  <p className="text-sm font-mono uppercase tracking-widest">No assets found in filter.</p>
                  <p className="text-xs mt-2">Adjust filter or generate new concepts.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredImages.map(img => (
                     <div key={img.id} className="aspect-[3/4]">
                        <GeneratedImageCard 
                           image={img}
                           isSelected={comparisonImageId === img.id}
                           onToggleSelect={() => setComparisonImageId(comparisonImageId === img.id ? null : img.id)}
                           onOpenSidebar={() => setSelectedImageId(img.id)}
                           onRate={(r) => handleRateImage(img.id, r)}
                        />
                     </div>
                  ))}
               </div>
            )}
         </div>
      </main>

      {/* 3. COLLECTION ARCHITECT */}
      <Suspense fallback={
         <div className="fixed bottom-8 left-8 bg-black/80 text-white p-4 rounded flex items-center gap-2 z-[9999]">
            <Loader2 className="animate-spin" /> Initializing Tldraw Engine...
         </div>
      }>
         <CollectionArchitect brand={brand} images={generatedImages} onOpenNarrative={setActiveLookForNarrative} onVisualizeLook={(look) => { setPromptOverride(`${look.coreItem} in ${look.material}. ${look.vibe} vibe. ${look.silhouette} silhouette.`); }} />
      </Suspense>
      
      <ChatBot brand={brand} />

      {/* MODALS */}
      {showApiKeyModal && <ApiKeyModal onSelect={handleApiKeySelect} />}
      {showVibeCheck && <VibeCheck onClose={() => setShowVibeCheck(false)} onComplete={(b) => { setBrand(b); setShowVibeCheck(false); }} />}
      {selectedImageId && (
         <RightSidebar 
            onClose={() => setSelectedImageId(null)}
            // State passed via store in component
            // Service callbacks still passed
            onEditStart={handleEditImage}
            onGenerateTechPack={triggerTechPack}
            isGeneratingTechPack={isGeneratingTechPack}
            onGenerateVariations={triggerVariations}
            isGeneratingVariations={isGeneratingVariations}
            onGenerateVideo={triggerVideo}
            isGeneratingVideo={isGeneratingVideo}
            onSimulateFabric={triggerSimulateFabric}
            isSimulatingFabric={isSimulatingFabric}
            onGenerateIteration={handleIterationTrigger}
            onGenerateStrategy={triggerMarketing}
            isGeneratingStrategy={isMarketingLoading}
            onOpenStudio={() => setShowStudio(true)}
         />
      )}
      {showMarketingModal && <MarketingModal strategy={marketingStrategy} isLoading={isMarketingLoading} brand={brand} onClose={() => setShowMarketingModal(false)} onVisualize={(p) => setPromptOverride(p)} />}
      
      {showTechPackModal && techPack && selectedImageId && (
         <Suspense fallback={
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 text-white">
               <Loader2 size={48} className="animate-spin mb-4" />
               <p>Compiling Technical Data...</p>
            </div>
         }>
            <TechPackModal techPack={techPack} image={generatedImages.find(i => i.id === selectedImageId)!} onClose={() => setShowTechPackModal(false)} />
         </Suspense>
      )}

      {comparisonImageId && selectedImageId && comparisonImageId !== selectedImageId && <ImageComparator image1={generatedImages.find(i => i.id === selectedImageId)!} image2={generatedImages.find(i => i.id === comparisonImageId)!} onClose={() => setComparisonImageId(null)} />}
      {activeLookForNarrative && <NarrativeEngine look={activeLookForNarrative} brand={brand} onClose={() => setActiveLookForNarrative(null)} onSendToProduction={(narrative) => { console.log("Narrative approved:", narrative); setActiveLookForNarrative(null); }} />}
      {showStudio && selectedImageId && <ImmersiveStudio 
          image={generatedImages.find(i => i.id === selectedImageId)!} 
          brand={brand} 
          onClose={() => setShowStudio(false)} 
          onApplyToImage={handleStudioApply}
      />}
    </div>
  );
};

export default App;