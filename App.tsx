
import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { 
  Camera, Lock, Unlock, Dice5, ChevronDown, 
  Users, Palette, Layers, 
  Monitor, Sliders, RefreshCw,
  X, Type, Hexagon, Fingerprint, Filter, Loader2, Sparkles, Plus,
  LogOut, Settings, HardDrive, Mail, UserCheck, ArrowRight, ShieldCheck,
  Star, Upload, Check, AlertTriangle // Added icons
} from 'lucide-react';
import { 
  GeneratedImage, BrandArchetype, EnvironmentPreset, 
  LightingPreset, FramingPreset, UploadedFile, 
  MarketingStrategy, TechPack, CollectionLook, 
  ImageResolution, AspectRatio, SourceInterpretation, ImageMode, SavedModel
} from './types';
import { generateId, fileToBase64 } from './utils';
import { 
  generateEditorialImages, checkApiKey, selectApiKey, 
  generateMarketingStrategy, generateTechPack, 
  editGeneratedImage, generateVideo, generateVariations, 
  simulateFabricMovement, enhancePrompt,
  generateCreativePrompt
} from './services/geminiService';
import { 
  uploadFile, getAssetDownloadUrl, getUserStorageUsage, 
  uploadGeneratedAsset, fetchMyModels, saveModelToAgency
} from './services/storageService';

// Firebase Imports
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './contexts/AuthContext';

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
import { PromptInput } from './components/PromptInput';
import { ProfileModal } from './components/ProfileModal';
import { ArchiveControls } from './components/ArchiveControls';
import { GuestExitModal } from './components/GuestExitModal';

// Lazy Load Heavy Components
const TechPackModal = lazy(() => import('./components/TechPackModal').then(module => ({ default: module.TechPackModal })));
const CollectionArchitect = lazy(() => import('./components/CollectionArchitect').then(module => ({ default: module.CollectionArchitect })));

// --- CONSTANTS ---
const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// --- CASTING CONSTANTS ---
const CASTING_GENDERS = ["Female", "Male", "Non-Binary", "Androgynous", "Fluid", "Alien", "Unspecified"];
const CASTING_VIBES = ["Regal", "Manic", "Ethereal", "Feral", "Minimalist", "Cybernetic", "Opulent", "Decayed", "Vulnerable", "Haughty"];
const CASTING_HAIR = ["Shaved", "Architectural Bob", "Wet-Look Long", "Spiked", "Buzzcut", "Wind-Swept", "Braided", "Bleached", "Natural Afro"];
const CASTING_FACE = ["Classic", "Alien", "Severe", "Doll-like", "Pierced", "Tattooed", "Gaunt", "Freckled", "Fresh"];

// --- BRAND COLOR DATA ---
const BRAND_RECIPES = {
  [BrandArchetype.DE_ROCHE]: [
    { name: 'Signature Void', colors: ['#232222', '#A7A8AA', '#E6E1E6'] }, 
    { name: 'Industrial Zen', colors: ['#A7A8AA', '#8C8C8C', '#232222'] },
    { name: 'Deep Foundation', colors: ['#000000', '#1a1a1a', '#232222'] } 
  ],
  [BrandArchetype.CHAOSCHICC]: [
    { name: 'Royal Anarchy', colors: ['#4F2170', '#9E8A66', '#000000'] }, 
    { name: 'Gilded Rot', colors: ['#9E8A66', '#4F2170', '#8B0000'] }, 
    { name: 'Soutter\'s Shadow', colors: ['#000000', '#E6E1E6', '#FFD700'] } 
  ]
};

const BRAND_PANTONES = {
  [BrandArchetype.DE_ROCHE]: [
    { name: 'Neutral Black C', hex: '#232222' },
    { name: 'Cool Gray 6 C', hex: '#A7A8AA' },
    { name: '663 C', hex: '#E6E1E6' },
    { name: 'True Black', hex: '#000000' }
  ],
  [BrandArchetype.CHAOSCHICC]: [
    { name: '2617 C', hex: '#4F2170' },
    { name: '7554 C', hex: '#9E8A66' },
    { name: 'Blood Red', hex: '#8B0000' },
    { name: 'Void', hex: '#000000' }
  ]
};

// --- AUTH COMPONENTS ---
type AuthView = 'SPLASH' | 'MEMBER_LOGIN' | 'REGISTER';

const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  const { signInWithGoogle, signInGuest } = useAuth();
  const [view, setView] = useState<AuthView>('SPLASH');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick Guest Entry
  const handleEnterAtelier = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInGuest();
    } catch (err: any) {
      setError("Entry failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
        setError("Invalid Credentials");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // Auth Listener will handle the redirection
    } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
            setError("Email is already registered.");
        } else if (err.code === 'auth/weak-password') {
            setError("Password should be at least 6 characters.");
        } else {
            setError(err.message || "Registration Failed");
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
      setIsLoading(true);
      try { await signInWithGoogle(); } catch(e) { setError("Google Sign In Failed"); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center relative overflow-hidden font-mono text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#C5A059] opacity-5 blur-[150px] rounded-full animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#E6E1E7] opacity-5 blur-[150px] rounded-full"></div>
      </div>

      <div className="z-10 w-full max-w-lg p-10 flex flex-col items-center text-center relative">
        
        {/* Logo Mark */}
        <div className="mb-12 relative group cursor-default">
           <div className="text-6xl font-black tracking-tighter mix-blend-difference font-header">LUMIÈRE</div>
           <div className="text-[10px] tracking-[0.3em] opacity-50 uppercase mt-2">Editorial Intelligence Engine</div>
        </div>

        {view === 'SPLASH' && (
           <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* PRIMARY ACTION: ENTER (Guest) */}
              <button 
                onClick={handleEnterAtelier} 
                disabled={isLoading}
                className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)] relative overflow-hidden group"
              >
                 {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                       <Loader2 className="animate-spin" size={16}/> INITIALIZING...
                    </div>
                 ) : (
                    <div className="flex items-center justify-center gap-3">
                       ENTER ATELIER <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                    </div>
                 )}
              </button>

              {/* SECONDARY: Member Access */}
              <div className="pt-8 border-t border-white/10 w-full">
                 <button 
                    onClick={() => setView('MEMBER_LOGIN')} 
                    className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors"
                 >
                    <ShieldCheck size={12} /> Member Access
                 </button>
              </div>
              
              {error && <div className="text-red-500 text-[10px] uppercase tracking-wider">{error}</div>}
           </div>
        )}

        {view === 'MEMBER_LOGIN' && (
           <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-300 bg-[#111] p-8 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xs font-bold uppercase tracking-widest">Identify Yourself</h2>
                 <button onClick={() => setView('SPLASH')} className="text-gray-500 hover:text-white" title="Back to Home"><X size={14}/></button>
              </div>
              
              <button onClick={handleGoogle} className="w-full py-3 bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#444]">
                 Continue with Google
              </button>
              
              <div className="flex items-center gap-2 opacity-30 my-4">
                 <div className="h-px bg-white flex-1"></div>
                 <span className="text-[9px]">OR</span>
                 <div className="h-px bg-white flex-1"></div>
              </div>

              <form onSubmit={handleMemberLogin} className="space-y-3">
                 <input type="email" placeholder="EMAIL" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-xs focus:border-white outline-none placeholder-gray-600"/>
                 <input type="password" placeholder="PASSWORD" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-xs focus:border-white outline-none placeholder-gray-600"/>
                 <button type="submit" disabled={isLoading} className="w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-gray-200">
                    {isLoading ? "Verifying..." : "Login"}
                 </button>
              </form>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                 <button onClick={() => setView('REGISTER')} className="text-[9px] uppercase tracking-widest text-gray-400 hover:text-white underline decoration-gray-700 underline-offset-4">
                    New? Create an Account
                 </button>
              </div>

              {error && <div className="text-red-500 text-[10px] uppercase text-center">{error}</div>}
           </div>
        )}

        {view === 'REGISTER' && (
            <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-300 bg-[#111] p-8 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest">New Architect</h2>
                    <button onClick={() => setView('SPLASH')} className="text-gray-500 hover:text-white" title="Back to Home"><X size={14}/></button>
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                    <input type="email" placeholder="EMAIL" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-xs focus:border-white outline-none placeholder-gray-600 text-white"/>
                    <input type="password" placeholder="PASSWORD (MIN 6 CHARS)" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-xs focus:border-white outline-none placeholder-gray-600 text-white"/>
                    <button type="submit" disabled={isLoading} className="w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors">
                        {isLoading ? "Creating Identity..." : "Create Account"}
                    </button>
                </form>
                
                <div className="mt-4 pt-4 border-t border-white/5">
                    <button onClick={() => setView('MEMBER_LOGIN')} className="text-[9px] uppercase tracking-widest text-gray-400 hover:text-white underline decoration-gray-700 underline-offset-4">
                        Already have an account? Login
                    </button>
                </div>

                {error && <div className="text-red-500 text-[10px] uppercase text-center mt-2">{error}</div>}
            </div>
        )}

      </div>
      
      <div className="absolute bottom-6 text-[9px] text-gray-700 font-mono">
         SYSTEM v4.2.0 // NO PATTERN
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- AUTH STATE ---
  const { user, userProfile, loading: authLoading, logout } = useAuth();

  // --- APP STATE ---
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGuestExitModal, setShowGuestExitModal] = useState(false);
  
  // Storage State
  const [storageUsed, setStorageUsed] = useState(0);
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [selectedAgentModel, setSelectedAgentModel] = useState<SavedModel | null>(null);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [castingTab, setCastingTab] = useState<'AUTO' | 'AGENCY'>('AUTO');
  
  // Brand & Vibe
  const [brand, setBrand] = useState<BrandArchetype>(BrandArchetype.DE_ROCHE);
  const [showVibeCheck, setShowVibeCheck] = useState(true);

  // Gallery Controls
  const [galleryFilter, setGalleryFilter] = useState<'ALL' | BrandArchetype>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'RATING'>('NEWEST');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Generation Inputs
  const [promptOverride, setPromptOverride] = useState<string | undefined>(undefined);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(''); 
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGettingInspiration, setIsGettingInspiration] = useState(false);

  // Context & Config
  const [learningContext, setLearningContext] = useState<string[]>([]);
  const [castGender, setCastGender] = useState('RANDOM');
  const [castVibe, setCastVibe] = useState('RANDOM');
  const [castHair, setCastHair] = useState('RANDOM');
  const [castFace, setCastFace] = useState('RANDOM');
  const [castDetails, setCastDetails] = useState('');
  
  const [deRocheLogo, setDeRocheLogo] = useState<UploadedFile | null>(null);
  const [chaosLogo, setChaosLogo] = useState<UploadedFile | null>(null);
  const [colorMode, setColorMode] = useState<'AUTO' | 'BRAND' | 'CUSTOM'>('AUTO');
  const [selectedColors, setSelectedColors] = useState<string[]>([]); 
  
  const [sourceFidelity, setSourceFidelity] = useState<number>(50);
  const [sourceInterpretation, setSourceInterpretation] = useState<SourceInterpretation | undefined>(SourceInterpretation.BLEND_50_50);
  const [sourceMaterialPrompt, setSourceMaterialPrompt] = useState('');
  const [useGrounding, setUseGrounding] = useState(false);
  
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [resolution, setResolution] = useState<ImageResolution>(ImageResolution.RES_2K);
  const [imageMode, setImageMode] = useState<ImageMode>(ImageMode.CINEMATIC);

  const [environment, setEnvironment] = useState<string>(EnvironmentPreset.RANDOM);
  const [lighting, setLighting] = useState<string>(LightingPreset.RANDOM);
  const [framing, setFraming] = useState<string>(FramingPreset.RANDOM);
  const [isSeedLocked, setIsSeedLocked] = useState(false);
  const [seed, setSeed] = useState(Math.random());
  const [customScenePrompt, setCustomScenePrompt] = useState('');

  // Gallery Data
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [comparisonImageId, setComparisonImageId] = useState<string | null>(null);

  // Modals
  const [marketingStrategy, setMarketingStrategy] = useState<MarketingStrategy | null>(null);
  const [isMarketingLoading, setIsMarketingLoading] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  
  const [techPack, setTechPack] = useState<TechPack | null>(null);
  const [isGeneratingTechPack, setIsGeneratingTechPack] = useState(false);
  const [showTechPackModal, setShowTechPackModal] = useState(false);

  const [activeLookForNarrative, setActiveLookForNarrative] = useState<CollectionLook | null>(null);
  const [showStudio, setShowStudio] = useState(false);

  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isSimulatingFabric, setIsSimulatingFabric] = useState(false);
  const [isIterating, setIsIterating] = useState(false);

  // --- SYNC BRAND WITH PROFILE ---
  useEffect(() => {
    if (userProfile && userProfile.brandArchetype) {
      setBrand(userProfile.brandArchetype);
    }
  }, [userProfile]);

  // --- STORAGE & MODELS UPDATE LOGIC ---
  const refreshStorageUsage = useCallback(async () => {
    if (user) {
      const usage = await getUserStorageUsage(user.uid);
      setStorageUsed(usage);
      const models = await fetchMyModels(); // Corrected call with no args
      setSavedModels(models);
    }
  }, [user]);

  useEffect(() => {
    refreshStorageUsage();
  }, [refreshStorageUsage]);

  // --- GUEST SESSION PROTECTION ---
  useEffect(() => {
    if (!user?.isAnonymous) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; 
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

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
    if (user) {
      checkApiKey()
        .then(hasKey => {
          setHasApiKey(hasKey);
          if (!hasKey) setShowApiKeyModal(true);
        })
        .catch(err => {
          console.error("Initialization error:", err);
          setShowApiKeyModal(true);
        });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      generatedImages.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, []);

  const handleSignOut = () => {
    if (user?.isAnonymous) {
      setShowGuestExitModal(true);
    } else {
      logout();
    }
  };

  const handleApiKeySelect = async () => {
    try {
      await selectApiKey();
      const hasKey = await checkApiKey();
      setHasApiKey(hasKey);
      if (hasKey) setShowApiKeyModal(false);
    } catch (e) {
      console.error("API Key selection failed", e);
      alert("Failed to select API Key. Please ensure popups are allowed.");
    }
  };

  // --- MODEL RECRUITMENT ---
  const handleSaveAsModel = async (image: GeneratedImage) => {
    if (!user) return;
    try {
        setLoadingStep("RECRUITING AGENT...");
        setIsGenerating(true);
        
        let blob: Blob;
        // Prefer localUrl (session blob) if available to avoid CORS
        const sourceUrl = image.localUrl || image.url;

        if (sourceUrl.startsWith('data:')) {
             const arr = sourceUrl.split(',');
             const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
             const bstr = atob(arr[1]);
             let n = bstr.length;
             const u8arr = new Uint8Array(n);
             while (n--) u8arr[n] = bstr.charCodeAt(n);
             blob = new Blob([u8arr], { type: mime });
        } else {
             try {
                 // Try standard fetch first (works for same-origin blobs)
                 const response = await fetch(sourceUrl, { mode: 'cors', credentials: 'omit' });
                 if (!response.ok) throw new Error("Network fetch failed");
                 blob = await response.blob();
             } catch (fetchErr) {
                 console.warn("Fetch failed, attempting canvas fallback", fetchErr);
                 // Canvas Fallback for CORS opaque images (try anonymous)
                 blob = await new Promise((resolve, reject) => {
                     const img = new Image();
                     img.crossOrigin = "Anonymous";
                     img.onload = () => {
                         const canvas = document.createElement('canvas');
                         canvas.width = img.width;
                         canvas.height = img.height;
                         const ctx = canvas.getContext('2d');
                         if(ctx) {
                             ctx.drawImage(img, 0, 0);
                             canvas.toBlob(b => b ? resolve(b) : reject(new Error("Canvas blob failed")), 'image/png');
                         } else reject(new Error("No canvas context"));
                     };
                     img.onerror = () => reject(new Error("Image load failed due to CORS restrictions"));
                     img.src = sourceUrl;
                 });
             }
        }

        await saveModelToAgency(blob, 'GENERATED');
        await refreshStorageUsage(); 
        alert("Agent Recruited Successfully");
    } catch (e: any) {
        console.error("Failed to save model", e);
        alert("Failed to recruit agent. The image source may be restricted. Try downloading and re-uploading.");
    } finally {
        setIsGenerating(false);
        setLoadingStep("");
    }
  };

  const handleModelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingModel(true);
      try {
        const file = e.target.files[0];
        const newModel = await saveModelToAgency(file, 'UPLOADED');
        await refreshStorageUsage();
        setSelectedAgentModel(newModel);
        setCastingTab('AGENCY');
      } catch (error) {
        console.error("Model upload failed", error);
        alert("Failed to import model.");
      } finally {
        setIsUploadingModel(false);
      }
    }
  };

  const handleRateImage = useCallback((id: string, rating: number) => {
    setGeneratedImages(prev => prev.map(img => img.id === id ? { ...img, rating } : img));
    if (rating >= 4) {
       setGeneratedImages(currentImages => {
           const img = currentImages.find(i => i.id === id);
           if (img) {
               const successMarker = `Style Guide (${rating}★): ${img.prompt.slice(0, 100)}... [Vibe: ${img.modelPrompt || 'Unknown'}]`;
               setLearningContext(prev => {
                   const newContext = [...prev, successMarker];
                   if (newContext.length > 5) return newContext.slice(-5);
                   return newContext;
               });
           }
           return currentImages;
       });
    }
  }, []);

  // --- FILTERED & SORTED VIEW ---
  const filteredAndSortedImages = useMemo(() => {
    let result = generatedImages;
    if (galleryFilter !== 'ALL') {
      result = result.filter(img => img.brand === galleryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(img => 
        img.prompt.toLowerCase().includes(q) || 
        (img.modelPrompt && img.modelPrompt.toLowerCase().includes(q)) ||
        (img.collections && img.collections.some(c => c.toLowerCase().includes(q)))
      );
    }
    if (showFavoritesOnly) {
      result = result.filter(img => (img.rating || 0) >= 4);
    }
    return [...result].sort((a, b) => {
      if (sortBy === 'NEWEST') return b.timestamp - a.timestamp;
      if (sortBy === 'OLDEST') return a.timestamp - b.timestamp;
      if (sortBy === 'RATING') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }, [generatedImages, galleryFilter, searchQuery, showFavoritesOnly, sortBy]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetBrand: BrandArchetype) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const base64 = await fileToBase64(file);
        const newFile = { id: generateId(), file, previewUrl: URL.createObjectURL(file), base64, mimeType: file.type, category: 'brand' as const };
        if (targetBrand === BrandArchetype.DE_ROCHE) setDeRocheLogo(newFile);
        else setChaosLogo(newFile);
    }
  };
  const handleColorAdd = (hex: string, index: number) => { const newColors = [...selectedColors]; newColors[index] = hex; setSelectedColors(newColors); };
  const handleColorRemove = (index: number) => { const newColors = [...selectedColors]; newColors[index] = ''; setSelectedColors(newColors); };
  const randomizeScene = () => {
    const envs = Object.values(EnvironmentPreset).filter(k => k !== 'RANDOM'); const lights = Object.values(LightingPreset).filter(k => k !== 'RANDOM'); const frames = Object.values(FramingPreset).filter(k => k !== 'RANDOM');
    setEnvironment(envs[Math.floor(Math.random() * envs.length)]); setLighting(lights[Math.floor(Math.random() * lights.length)]); setFraming(frames[Math.floor(Math.random() * frames.length)]);
    if (!isSeedLocked) setSeed(Math.random());
  };
  const generateCasting = () => { const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]; setCastGender(getRandom(CASTING_GENDERS)); setCastVibe(getRandom(CASTING_VIBES)); setCastHair(getRandom(CASTING_HAIR)); setCastFace(getRandom(CASTING_FACE)); setSelectedAgentModel(null); };
  const handleGetInspiration = async () => { setIsGettingInspiration(true); try { const castingStr = `Gender: ${castGender}, Vibe: ${castVibe}`; const { concept } = await generateCreativePrompt(brand, castingStr); setPromptOverride(concept); return concept; } catch (e) { console.error(e); return ""; } finally { setIsGettingInspiration(false); } };
  const handleEnhance = async (currentPrompt: string) => { if (!currentPrompt) return ""; setIsEnhancing(true); try { const result = await enhancePrompt(currentPrompt, brand); if (result.suggestedScene) { if (result.suggestedScene.environment && result.suggestedScene.environment !== 'Random') setEnvironment(result.suggestedScene.environment); if (result.suggestedScene.lighting && result.suggestedScene.lighting !== 'Random') setLighting(result.suggestedScene.lighting); if (result.suggestedScene.framing && result.suggestedScene.framing !== 'Full Body') setFraming(result.suggestedScene.framing); } return result.improvedPrompt; } catch (e: any) { console.error("Enhance failed", e); return ""; } finally { setIsEnhancing(false); } };
  
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

    const currentSeed = isSeedLocked ? seed : Math.random();

    try {
      let builtCasting = ""; 
      // Only include physical attributes if NO agent model is selected
      // If an agent model IS selected, we don't want "shaved head" text clashing with a "long hair" image.
      if (!selectedAgentModel) {
          if (castGender !== 'RANDOM') builtCasting += `CASTING: ${castGender}. `; 
          if (castHair !== 'RANDOM') builtCasting += `HAIR: ${castHair}. `; 
          if (castFace !== 'RANDOM') builtCasting += `FACE: ${castFace}. `; 
      }
      
      // Vibe and Details are modifiers that can apply to a visual reference too (e.g. expression)
      if (castVibe !== 'RANDOM') builtCasting += `VIBE: ${castVibe.toUpperCase()}. `; 
      if (castDetails) builtCasting += `DETAILS: ${castDetails}.`;

      let activePalette = undefined; 
      let activeHexColors = undefined;
      if (colorMode !== 'AUTO') { 
          const validColors = selectedColors.filter(c => c && c.trim() !== ''); 
          if (validColors.length > 0) { 
              activePalette = validColors.join(', '); 
              activeHexColors = validColors; 
          } 
      }

      const tempImages = await generateEditorialImages({
        prompt: finalPrompt,
        uploadedFiles,
        resolution,
        aspectRatio,
        brand,
        environment,
        lighting,
        framing,
        customScenePrompt,
        seed: currentSeed,
        modelPrompt: builtCasting || undefined,
        colorPalette: activePalette,
        customHexColors: activeHexColors,
        sourceFidelity: sourceFidelity,
        sourceInterpretation: sourceInterpretation,
        logoBase64: (brand === BrandArchetype.DE_ROCHE ? deRocheLogo?.base64 : chaosLogo?.base64),
        locationQuery: useGrounding ? finalPrompt : undefined,
        sourceMaterialPrompt,
        learningContext: learningContext,
        imageMode: imageMode,
        referenceModelUrl: selectedAgentModel?.url 
      });

      let savedImages: GeneratedImage[] = [];

      if (user) {
          setLoadingStep("ARCHIVING ASSETS...");
          savedImages = await Promise.all(tempImages.map(async (tempUrl) => {
              try {
                  const response = await fetch(tempUrl);
                  const blob = await response.blob();
                  const savedAsset = await uploadGeneratedAsset(user.uid, blob, finalPrompt, brand);
                  return {
                      id: savedAsset.id,
                      url: savedAsset.downloadUrl,
                      localUrl: tempUrl, // KEEP SESSION BLOB FOR CORS-FREE OPERATIONS
                      prompt: finalPrompt,
                      resolution,
                      timestamp: Date.now(),
                      brand,
                      type: 'editorial',
                      mode: imageMode,
                      seed: currentSeed
                  };
              } catch (e) {
                  return { id: generateId(), url: tempUrl, localUrl: tempUrl, prompt: finalPrompt, resolution, timestamp: Date.now(), brand, type: 'editorial', mode: imageMode, seed: currentSeed };
              }
          }));
          refreshStorageUsage(); 
      } else {
          savedImages = tempImages.map(url => ({ id: generateId(), url, localUrl: url, prompt: finalPrompt, resolution, timestamp: Date.now(), brand, type: 'editorial', mode: imageMode, seed: currentSeed }));
      }

      setGeneratedImages(prev => [...savedImages, ...prev]);

    } catch (error: any) {
        alert("Generation failed: " + error.message);
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      setLoadingStep("");
    }
  };

  const handleUpdateImage = (id: string, newUrl: string) => { setGeneratedImages(prev => prev.map(img => { if (img.id === id) { if (img.url !== newUrl && img.url.startsWith('blob:')) { URL.revokeObjectURL(img.url); } return { ...img, url: newUrl, localUrl: newUrl }; } return img; })); };
  const handleAddSketch = (originalImage: GeneratedImage, sketchUrl: string) => { const sketchImage: GeneratedImage = { ...originalImage, id: generateId(), url: sketchUrl, localUrl: sketchUrl, prompt: `Technical Sketch of ${originalImage.prompt}`, type: 'editorial' }; setGeneratedImages(prev => [sketchImage, ...prev]); };
  const handleEditImage = async (id: string, editPrompt: string): Promise<string> => {
    const img = generatedImages.find(i => i.id === id);
    if (!img) throw new Error("Image not found");
    const newUrl = await editGeneratedImage(img.url, editPrompt);
    if (user) { (async () => { try { const blob = await (await fetch(newUrl)).blob(); await uploadFile(user.uid, blob, `edit_${id}_${Date.now()}.png`, 'generated_editorial', { prompt: `EDIT: ${editPrompt} | REF: ${img.prompt}`, brand: img.brand }, id); refreshStorageUsage(); } catch(e) { console.error("Auto-save edit failed", e); } })(); }
    return newUrl;
  };

  const triggerTechPack = async (image: GeneratedImage) => { setIsGeneratingTechPack(true); try { const tp = await generateTechPack(image.url); setTechPack(tp); setShowTechPackModal(true); } catch (e) { console.error(e); alert("Failed"); } finally { setIsGeneratingTechPack(false); } };
  const triggerMarketing = async (image: GeneratedImage) => { setIsMarketingLoading(true); setShowMarketingModal(true); try { const strategy = await generateMarketingStrategy(image.brand, []); setMarketingStrategy(strategy); } catch (e) { console.error(e); setShowMarketingModal(false); } finally { setIsMarketingLoading(false); } };
  const triggerVideo = async (image: GeneratedImage) => { setIsGeneratingVideo(true); try { const videoUrl = await generateVideo(image.url, image.prompt, image.brand); setGeneratedImages(prev => prev.map(img => img.id === image.id ? { ...img, videoUrl } : img)); } catch (e) { console.error(e); alert("Failed"); } finally { setIsGeneratingVideo(false); } };
  const triggerVariations = async (image: GeneratedImage) => {
    setIsGeneratingVariations(true);
    try {
        const vars = await generateVariations(image.url, image.prompt, image.brand);
        const newImages = vars.map(url => ({ ...image, id: generateId(), url, localUrl: url, timestamp: Date.now() }));
        setGeneratedImages(prev => [...newImages, ...prev]);
        if (user) { await Promise.all(newImages.map(async (img) => { try { const blob = await (await fetch(img.url)).blob(); await uploadFile(user.uid, blob, `var_${img.id}.png`, 'generated_editorial', { prompt: `VARIATION: ${img.prompt}`, brand: img.brand }, img.id); } catch(e) { console.error("Auto-save var failed", e); } })); refreshStorageUsage(); }
    } catch (e) { console.error(e); alert("Failed"); } finally { setIsGeneratingVariations(false); }
  };
  const triggerSimulateFabric = async (image: GeneratedImage, fabricDesc: string) => { setIsSimulatingFabric(true); try { const videoUrl = await simulateFabricMovement(image.url, image.prompt, image.brand, fabricDesc); setGeneratedImages(prev => prev.map(img => img.id === image.id ? { ...img, videoUrl } : img)); } catch (e) { console.error(e); alert("Failed"); } finally { setIsSimulatingFabric(false); } };
  const handleIterationTrigger = async (mode: 'EVOLVE' | 'MUTATE' | 'BREAK') => {
      if (!selectedImageId) return;
      const originalImage = generatedImages.find(i => i.id === selectedImageId);
      if (!originalImage) return;
      setIsIterating(true);
      try {
          const images = await generateEditorialImages({
            prompt: `${originalImage.prompt}.`, uploadedFiles: [], resolution: originalImage.resolution, aspectRatio: AspectRatio.PORTRAIT, brand: originalImage.brand,
            environment: environment, lighting: lighting, framing: framing, seed: Math.random(), iterationMode: mode, referenceImageId: originalImage.id
          });
          const newImages: GeneratedImage[] = images.map(url => ({ id: generateId(), url, localUrl: url, prompt: `Iteration (${mode}): ${originalImage.prompt}`, resolution: originalImage.resolution, timestamp: Date.now(), brand: originalImage.brand, type: 'editorial' }));
          setGeneratedImages((prev) => [...newImages, ...prev]);
          if (user) { await Promise.all(newImages.map(async (img) => { try { const blob = await (await fetch(img.url)).blob(); await uploadFile(user.uid, blob, `iter_${img.id}.png`, 'generated_editorial', { prompt: img.prompt, brand: img.brand, notes: `Iteration Mode: ${mode}` }, img.id); } catch(e) { console.error("Auto-save iteration failed", e); } })); refreshStorageUsage(); }
      } catch (e: any) { console.error(e); } finally { setIsIterating(false); }
  };

  const handleDownloadImage = async (image: GeneratedImage) => {
    if (!user) {
      const link = document.createElement('a'); link.href = image.url; link.download = `lumiere-${image.id}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link); return;
    }
    try { const url = await getAssetDownloadUrl(user.uid, image.id); window.open(url, '_blank'); } catch (e) { console.error("Download failed", e); const link = document.createElement('a'); link.href = image.url; link.download = `lumiere-${image.id}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
  };

  const handleStudioApply = async (prompt: string) => { if (!selectedImageId) return; setIsGenerating(true); try { const newUrl = await handleEditImage(selectedImageId, prompt); handleUpdateImage(selectedImageId, newUrl); setShowStudio(false); } catch (e: any) { console.error(e); } finally { setIsGenerating(false); } };
  const renderSelectInput = (label: string, value: string, setValue: (val: string) => void, options: string[], placeholder: string) => { const isCustom = !options.includes(value) && value !== 'RANDOM'; return ( <div className="relative group mb-2"> {isCustom ? ( <div className="relative animate-in fade-in duration-200"> <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} autoFocus className={`w-full p-2 pr-8 text-[10px] border rounded-sm outline-none font-mono ${inputClass}`} /> <button onClick={() => setValue('RANDOM')} className={`absolute right-2 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform ${textAccent}`} title="Reset to Random"><X size={12} /></button> </div> ) : ( <> <select value={value} onChange={(e) => { if (e.target.value === 'CUSTOM_INPUT') { setValue(''); } else { setValue(e.target.value); } }} className={`w-full p-2 text-[10px] border rounded-sm outline-none appearance-none cursor-pointer font-mono uppercase ${inputClass}`}> <option value="RANDOM" className="bg-[#111] text-gray-500">[ RANDOM {label.toUpperCase()} ]</option> {options.map((opt) => (<option key={opt} value={opt} className="bg-[#111] text-white">{opt}</option>))} <option value="CUSTOM_INPUT" className="bg-[#111] text-[#C5A059] font-bold tracking-widest">:: CUSTOM ::</option> </select> <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none ${textAccent}`} /> </> )} </div> ); };
  const renderSceneSelect = (label: string, value: string, setValue: (val: string) => void, enumObj: any, placeholder: string) => { const options = Object.values(enumObj).filter((k: any) => k !== 'RANDOM') as string[]; return renderSelectInput(label, value, setValue, options, placeholder); };

  if (authLoading) return <div className="flex items-center justify-center h-screen w-full bg-[#050505]"><Loader2 className="animate-spin text-[#C5A059]" size={32} /></div>;
  if (!user) return <AuthScreen onLogin={() => {}} />;

  return (
    <div className={`flex h-screen w-full overflow-hidden ${bgClass} font-sans selection:bg-pink-500 selection:text-white`}>
      
      {/* 1. LEFT SIDEBAR */}
      <aside className={`w-[340px] flex-shrink-0 flex flex-col h-full overflow-y-auto custom-scrollbar z-20 ${sidebarClass} transition-colors duration-500`}>
        <div className="p-6 space-y-8 pb-32">
          
          {/* STORAGE LOADER */}
          <div className="mb-2">
             <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-60">
                   <HardDrive size={10} />
                   <span>Storage</span>
                </div>
                <div className="text-[9px] font-mono">
                   {formatBytes(storageUsed)} <span className="opacity-50">/ 5 GB</span>
                </div>
             </div>
             <div className={`h-1 w-full rounded-full ${isDeRoche ? 'bg-gray-200' : 'bg-gray-800'}`}>
                <div 
                   className={`h-full rounded-full transition-all duration-500 ${isDeRoche ? 'bg-black' : 'bg-[#C5A059]'}`}
                   style={{ width: `${Math.min((storageUsed / STORAGE_LIMIT) * 100, 100)}%` }}
                ></div>
             </div>
          </div>

          {/* HEADER */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className={`text-3xl font-black uppercase tracking-tighter leading-none mb-1 ${textAccent} font-header`}>Lumière</h1>
                <p className="text-[9px] font-mono opacity-60 uppercase tracking-widest">{userProfile?.displayName || user.displayName || 'Architect'}</p>
              </div>
              <button onClick={() => setShowProfileModal(true)} className={`w-8 h-8 flex items-center justify-center border rounded-full transition-colors ${isDeRoche ? 'border-black hover:bg-black hover:text-white' : 'border-[#C5A059] hover:bg-[#C5A059] hover:text-black'}`}>
                {user.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover" /> : <Settings size={14} />}
              </button>
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
             <div className={labelClass}><div className="flex items-center gap-2"><Hexagon size={12} /> <span>Brand DNA (Logos)</span></div></div>
             <div className="grid grid-cols-2 gap-3">
               <label className={`block w-full aspect-square border border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/5 ${inputClass}`}>{deRocheLogo ? <img src={deRocheLogo.previewUrl} className="w-full h-full object-contain p-2" /> : <span className="text-[9px] opacity-50">+ DE ROCHE</span>}<input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, BrandArchetype.DE_ROCHE)} /></label>
               <label className={`block w-full aspect-square border border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/5 ${inputClass}`}>{chaosLogo ? <img src={chaosLogo.previewUrl} className="w-full h-full object-contain p-2" /> : <span className="text-[9px] opacity-50">+ CHAOS</span>}<input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, BrandArchetype.CHAOSCHICC)} /></label>
             </div>
          </section>

          {/* SECTION 3: CHROMATICS ENGINE */}
          <section>
            <div className={labelClass}><div className="flex items-center gap-2"><Palette size={12} /> <span>Chromatics Engine</span></div></div>
            <div className="flex gap-1 mb-3">{(['AUTO', 'BRAND', 'CUSTOM'] as const).map(mode => (<button key={mode} onClick={() => { setColorMode(mode); if(mode === 'AUTO') setSelectedColors([]); }} className={`flex-1 py-2 text-[8px] uppercase font-bold tracking-wider border rounded-sm transition-all ${colorMode === mode ? (isDeRoche ? 'bg-black text-white border-black' : 'bg-[#C5A059] text-black border-[#C5A059]') : (isDeRoche ? 'text-gray-400 border-gray-300 hover:bg-gray-100' : 'text-gray-500 border-gray-800 hover:text-[#C5A059]')}`}>{mode}</button>))}</div>
            <div className={`p-4 border rounded relative transition-all ${isDeRoche ? 'border-[#232222] bg-gray-50' : 'border-[#C5A059]/30 bg-black/40'}`}>
                {colorMode === 'AUTO' && (<div className="flex flex-col items-center justify-center h-20 opacity-50 text-center gap-2"><Sparkles size={16} /><p className="text-[9px] uppercase tracking-wider">AI will determine palette based on {brand} logic.</p></div>)}
                {colorMode === 'BRAND' && (<div className="space-y-3"><p className="text-[9px] uppercase tracking-widest opacity-50 mb-2 font-bold">Select {brand} Recipe:</p><div className="space-y-2">{(BRAND_RECIPES[brand] || []).map((recipe) => (<button key={recipe.name} onClick={() => setSelectedColors(recipe.colors)} className={`w-full flex items-center justify-between p-2 rounded border transition-all ${JSON.stringify(selectedColors) === JSON.stringify(recipe.colors) ? (isDeRoche ? 'border-black bg-white' : 'border-[#C5A059] bg-[#C5A059]/10') : 'border-transparent hover:bg-black/5'}`}><span className="text-[9px] font-bold uppercase">{recipe.name}</span><div className="flex gap-1">{recipe.colors.map(c => (<div key={c} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c }}></div>))}</div></button>))}</div></div>)}
                {colorMode === 'CUSTOM' && (<div className="space-y-4"><div><p className="text-[9px] uppercase tracking-widest opacity-50 mb-2 font-bold">Active Slots (Max 3):</p><div className="flex justify-between gap-2">{[0, 1, 2].map((i) => (<div key={i} className="flex-1 flex flex-col gap-1"><div className="relative w-full aspect-square border border-dashed rounded flex items-center justify-center overflow-hidden hover:border-solid transition-colors group" style={{ borderColor: isDeRoche ? '#ccc' : '#333', backgroundColor: (selectedColors && selectedColors[i]) ? selectedColors[i] : 'transparent' }}>{(selectedColors && selectedColors[i]) ? (<div className="w-full h-full relative group"><button onClick={() => handleColorRemove(i)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white"><X size={12} /></button></div>) : (<Plus size={12} className="opacity-20 group-hover:opacity-50" />)}{!(selectedColors && selectedColors[i]) && (<input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleColorAdd(e.target.value, i)} />)}</div><div className="text-[8px] font-mono text-center opacity-50 uppercase truncate">{(selectedColors && selectedColors[i]) ? selectedColors[i] : 'EMPTY'}</div></div>))}</div></div><div><p className="text-[9px] uppercase tracking-widest opacity-50 mb-2 font-bold">Quick Swatches (Pantone):</p><div className="flex gap-2 flex-wrap">{BRAND_PANTONES[brand].map((p) => (<button key={p.name} onClick={() => { const emptyIndex = selectedColors.findIndex(c => !c || c === ''); if (emptyIndex !== -1) { handleColorAdd(p.hex, emptyIndex); } else if (selectedColors.length < 3) { setSelectedColors([...selectedColors, p.hex]); } else { handleColorAdd(p.hex, 2); } }} className="w-8 h-8 rounded-full border border-white/20 transition-transform hover:scale-110 relative group" style={{ backgroundColor: p.hex }} title={p.name}><div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">{p.name}</div></button>))}</div></div></div>)}
            </div>
          </section>

          {/* SECTION 4: CASTING & AGENCY (UPDATED TABBED VIEW) */}
          <section>
             <div className={labelClass}>
                <div className="flex items-center gap-2"><Users size={12} /> <span>Casting Director</span></div>
             </div>
             
             {/* TABS */}
             <div className="flex gap-1 mb-3">
               <button 
                 onClick={() => { setCastingTab('AUTO'); setSelectedAgentModel(null); }}
                 className={`flex-1 py-2 text-[8px] uppercase font-bold tracking-wider border rounded-sm transition-all ${castingTab === 'AUTO' ? (isDeRoche ? 'bg-black text-white border-black' : 'bg-[#C5A059] text-black border-[#C5A059]') : 'opacity-50 border-transparent hover:opacity-100'}`}
               >
                 <RefreshCw size={10} className="inline mr-1"/> Auto-Cast
               </button>
               <button 
                 onClick={() => setCastingTab('AGENCY')}
                 className={`flex-1 py-2 text-[8px] uppercase font-bold tracking-wider border rounded-sm transition-all ${castingTab === 'AGENCY' ? (isDeRoche ? 'bg-black text-white border-black' : 'bg-[#C5A059] text-black border-[#C5A059]') : 'opacity-50 border-transparent hover:opacity-100'}`}
               >
                 <Star size={10} className="inline mr-1"/> Agency ({savedModels.length})
               </button>
             </div>

             {castingTab === 'AGENCY' ? (
               <div className={`p-3 border rounded-sm ${isDeRoche ? 'bg-gray-100 border-gray-300' : 'bg-black/40 border-[#C5A059]/30'}`}>
                  <div className="grid grid-cols-3 gap-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
                    {/* UPLOAD BUTTON */}
                    <label className="aspect-square border border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 opacity-60 hover:opacity-100 transition-all">
                       {isUploadingModel ? <RefreshCw className="animate-spin" size={14}/> : <Upload size={14} />}
                       <span className="text-[7px] mt-1 uppercase font-bold">Import</span>
                       <input type="file" accept="image/*" className="hidden" onChange={handleModelImport} />
                    </label>

                    {/* MODEL CARDS */}
                    {savedModels.map(model => (
                      <button 
                        key={model.id}
                        onClick={() => setSelectedAgentModel(model)}
                        className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${selectedAgentModel?.id === model.id ? (isDeRoche ? 'border-black' : 'border-[#C5A059]') : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={model.url} className="w-full h-full object-cover" />
                        {selectedAgentModel?.id === model.id && (
                          <div className={`absolute inset-0 flex items-center justify-center bg-black/40`}>
                            <Check size={16} className="text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-[8px] text-center opacity-50 uppercase font-mono">
                     {selectedAgentModel ? "Model Locked for Consistency" : "Select a model to lock face"}
                  </p>
               </div>
             ) : (
               <div className={`space-y-1 opacity-80 animate-in fade-in duration-300`}>
                  {renderSelectInput("Gender", castGender, setCastGender, CASTING_GENDERS, "e.g. Female")}
                  {renderSelectInput("Vibe", castVibe, setCastVibe, CASTING_VIBES, "e.g. Regal")}
                  {renderSelectInput("Hair", castHair, setCastHair, CASTING_HAIR, "e.g. Shaved")}
                  {renderSelectInput("Face", castFace, setCastFace, CASTING_FACE, "e.g. Alien")}
                  <div className="relative mt-2"><div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50"><Fingerprint size={10} /></div><input type="text" value={castDetails} onChange={(e) => setCastDetails(e.target.value)} placeholder="SPECIFIC MARKINGS / DETAILS..." className={`w-full py-2 pl-6 pr-2 text-[10px] border-b bg-transparent rounded-none focus:outline-none placeholder-opacity-50 ${isDeRoche ? 'border-gray-300 text-black placeholder-gray-400' : 'border-[#C5A059]/30 text-[#C5A059] placeholder-[#C5A059]/30'}`} /></div>
                  <div className="p-2 mt-2 text-[8px] text-center border border-dashed rounded opacity-50 font-mono">
                     AI will generate a unique face for every shot.
                  </div>
               </div>
             )}
          </section>

          {/* SECTION 5: SOURCE MATERIAL (UPDATED UI) */}
          <section>
             <div className={labelClass}><div className="flex items-center gap-2"><Layers size={12} /> <span>Source Material</span></div></div>
             <div className="grid grid-cols-2 gap-2">
                <UploadZone label="Mood" category="moodboard" files={uploadedFiles.filter(f => f.category === 'moodboard')} onAddFiles={(files) => setUploadedFiles([...uploadedFiles, ...files])} onRemoveFile={(id) => setUploadedFiles(uploadedFiles.filter(f => f.id !== id))} />
                <UploadZone label="Ref" category="reference" files={uploadedFiles.filter(f => f.category === 'reference')} onAddFiles={(files) => setUploadedFiles([...uploadedFiles, ...files])} onRemoveFile={(id) => setUploadedFiles(uploadedFiles.filter(f => f.id !== id))} />
             </div>
             
             {uploadedFiles.length > 0 && (
               <div className="space-y-3 mt-3 border-t border-dashed border-current/20 pt-3">
                  <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest opacity-70 mb-2">
                     <span>AI Interpretation Logic</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     {Object.values(SourceInterpretation).map((mode) => (
                        <button 
                           key={mode} 
                           onClick={() => setSourceInterpretation(sourceInterpretation === mode ? undefined : mode)} 
                           className={`
                              px-3 py-2 text-[8px] font-bold uppercase tracking-wider border rounded-sm transition-all truncate
                              ${sourceInterpretation === mode 
                                 ? (isDeRoche ? 'bg-black text-white border-black' : 'bg-[#C5A059] text-black border-[#C5A059]')
                                 : (isDeRoche ? 'bg-white text-gray-500 border-gray-300 hover:border-black hover:text-black' : 'bg-[#111] text-[#C5A059] border-[#C5A059]/30 hover:border-[#C5A059] hover:bg-[#C5A059]/10')
                              }
                           `}
                        >
                           {mode.replace(/_/g, ' ')}
                        </button>
                     ))}
                  </div>
                  
                  <div className="space-y-2">
                     <textarea 
                        value={sourceMaterialPrompt} 
                        onChange={(e) => setSourceMaterialPrompt(e.target.value)} 
                        placeholder="SPECIFIC INSTRUCTIONS (e.g. 'Use texture from Image A')..." 
                        className={`w-full h-16 p-2 text-[9px] border rounded-sm resize-none outline-none font-mono ${inputClass} ${isDeRoche ? 'bg-white' : 'bg-[#111]'}`} 
                     />
                     <div className={`p-2 rounded-sm border ${isDeRoche ? 'bg-white border-gray-200' : 'bg-[#111] border-[#C5A059]/20'}`}>
                        <div className="flex justify-between text-[8px] font-bold uppercase opacity-70 mb-2">
                           <span>Vibe Only</span>
                           <span>Strict Fidelity</span>
                        </div>
                        <input 
                           type="range" 
                           min="0" 
                           max="100" 
                           step="10" 
                           value={sourceFidelity} 
                           onChange={(e) => setSourceFidelity(Number(e.target.value))} 
                           className={`w-full h-1 bg-gray-500/30 rounded-lg appearance-none cursor-pointer ${isDeRoche ? '[&::-webkit-slider-thumb]:bg-black' : '[&::-webkit-slider-thumb]:bg-[#C5A059]'} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full`} 
                        />
                     </div>
                  </div>
               </div>
             )}
          </section>

          {/* SECTION 6: CREATIVE DIRECTION */}
          <PromptInput onGenerate={handleGenerate} onEnhance={handleEnhance} onInspire={handleGetInspiration} overridePrompt={promptOverride} isGenerating={isGenerating} loadingStep={loadingStep} isEnhancing={isEnhancing} isGettingInspiration={isGettingInspiration} useGrounding={useGrounding} setUseGrounding={setUseGrounding} brand={brand} />

          {/* SECTION 7: OUTPUT */}
          <section className="border-t border-dashed border-current opacity-80 pt-4">
              <div className={labelClass}><div className="flex items-center gap-2"><Sliders size={12} /> <span>Output Config</span></div></div>
              <div className="flex bg-[#111] rounded-sm p-1 border border-white/10 mb-3">
                  <button onClick={() => setImageMode(ImageMode.CINEMATIC)} className={`flex-1 py-1.5 text-[9px] font-bold uppercase transition-all rounded-sm flex items-center justify-center gap-2 ${imageMode === ImageMode.CINEMATIC ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}><Sparkles size={10} /> Editorial</button>
                  <button onClick={() => setImageMode(ImageMode.LOOKBOOK)} className={`flex-1 py-1.5 text-[9px] font-bold uppercase transition-all rounded-sm flex items-center justify-center gap-2 ${imageMode === ImageMode.LOOKBOOK ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}><Monitor size={10} /> Lookbook</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className={`w-full p-2 text-[9px] border rounded-sm outline-none appearance-none cursor-pointer uppercase ${inputClass}`}><option value={AspectRatio.PORTRAIT} className="bg-[#111]">Portrait (3:4)</option><option value={AspectRatio.LANDSCAPE} className="bg-[#111]">Landscape (16:9)</option><option value={AspectRatio.SQUARE} className="bg-[#111]">Square (1:1)</option><option value={AspectRatio.TALL} className="bg-[#111]">Mobile (9:16)</option></select>
                  <select value={resolution} onChange={(e) => setResolution(e.target.value as ImageResolution)} className={`w-full p-2 text-[9px] border rounded-sm outline-none appearance-none cursor-pointer uppercase ${inputClass}`}><option value={ImageResolution.RES_2K} className="bg-[#111]">2K Resolution</option><option value={ImageResolution.RES_4K} className="bg-[#111]">4K Resolution</option></select>
              </div>
          </section>

          {/* SIGN OUT */}
          <div className="pt-4 border-t border-dashed border-current opacity-80">
             <button 
               onClick={handleSignOut}
               className={`w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm hover:bg-red-900/20 hover:text-red-500 text-gray-500`}
             >
                <LogOut size={12} /> {user.isAnonymous ? "Exit Session" : "Log Out"}
             </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN GALLERY AREA */}
      <main className="flex-1 flex flex-col h-full relative z-10">
         {/* ARCHIVE CONTROLS HEADER */}
         <ArchiveControls 
           searchQuery={searchQuery}
           onSearchChange={setSearchQuery}
           filterBrand={galleryFilter}
           onFilterBrandChange={setGalleryFilter}
           sortBy={sortBy}
           onSortChange={setSortBy}
           showFavoritesOnly={showFavoritesOnly}
           onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
           isDeRoche={isDeRoche}
         />

         {/* GALLERY CONTENT */}
         <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {filteredAndSortedImages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                  <Filter size={48} className="mb-4" />
                  <p className="text-sm font-mono uppercase tracking-widest">No assets found.</p>
                  <p className="text-xs mt-2">Adjust filters or generate new concepts.</p>
               </div>
            ) : (
               /* Masonry-style Grid */
               <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                  {filteredAndSortedImages.map(img => (
                     <div key={img.id} className="break-inside-avoid">
                        <GeneratedImageCard 
                           image={img}
                           isSelected={comparisonImageId === img.id}
                           onToggleSelect={() => setComparisonImageId(comparisonImageId === img.id ? null : img.id)}
                           onOpenSidebar={() => setSelectedImageId(img.id)}
                           onRate={(r) => handleRateImage(img.id, r)}
                           onDownload={handleDownloadImage}
                        />
                     </div>
                  ))}
               </div>
            )}
         </div>
      </main>

      {/* 3. COLLECTION ARCHITECT */}
      <Suspense fallback={<div className="fixed bottom-8 left-8 bg-black/80 text-white p-4 rounded flex items-center gap-2 z-[9999]"><Loader2 className="animate-spin" /> Initializing Tldraw Engine...</div>}>
         <CollectionArchitect brand={brand} images={generatedImages} onOpenNarrative={setActiveLookForNarrative} onVisualizeLook={(look) => { setPromptOverride(`${look.coreItem} in ${look.material}. ${look.vibe} vibe. ${look.silhouette} silhouette.`); }} />
      </Suspense>
      
      <ChatBot brand={brand} />

      {/* MODALS */}
      {showApiKeyModal && <ApiKeyModal onSelect={handleApiKeySelect} />}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {showVibeCheck && <VibeCheck onClose={() => setShowVibeCheck(false)} onComplete={(b) => { setBrand(b); setShowVibeCheck(false); }} />}
      {selectedImageId && (<RightSidebar 
          selectedImage={generatedImages.find(i => i.id === selectedImageId) || null} 
          onClose={() => setSelectedImageId(null)} 
          onUpdateImage={handleUpdateImage} 
          onAddSketch={handleAddSketch} 
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
          onSaveAsModel={handleSaveAsModel}
      />)}
      {showMarketingModal && <MarketingModal strategy={marketingStrategy} isLoading={isMarketingLoading} brand={brand} onClose={() => setShowMarketingModal(false)} onVisualize={(p) => setPromptOverride(p)} />}
      {showTechPackModal && techPack && selectedImageId && (<Suspense fallback={<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 text-white"><Loader2 size={48} className="animate-spin mb-4" /><p>Compiling Technical Data...</p></div>}><TechPackModal techPack={techPack} image={generatedImages.find(i => i.id === selectedImageId)!} onClose={() => setShowTechPackModal(false)} /></Suspense>)}
      {comparisonImageId && selectedImageId && comparisonImageId !== selectedImageId && <ImageComparator image1={generatedImages.find(i => i.id === selectedImageId)!} image2={generatedImages.find(i => i.id === comparisonImageId)!} onClose={() => setComparisonImageId(null)} />}
      {activeLookForNarrative && <NarrativeEngine look={activeLookForNarrative} brand={brand} onClose={() => setActiveLookForNarrative(null)} onSendToProduction={(narrative) => { console.log("Narrative approved:", narrative); setActiveLookForNarrative(null); }} />}
      {showStudio && selectedImageId && <ImmersiveStudio image={generatedImages.find(i => i.id === selectedImageId)!} brand={brand} onClose={() => setShowStudio(false)} onApplyToImage={handleStudioApply} />}
      {showGuestExitModal && <GuestExitModal onClose={() => setShowGuestExitModal(false)} onConvertToUser={() => { setShowGuestExitModal(false); alert("Please link your account in the Profile settings (Coming Soon) or copy your data manually."); }} />}
    </div>
  );
};

export default App;
