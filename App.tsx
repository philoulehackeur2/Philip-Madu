
import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { 
  Camera, Lock, Unlock, Dice5, ChevronDown, 
  Users, Palette, Layers, 
  Monitor, Sliders, RefreshCw,
  X, Type, Hexagon, Fingerprint, Filter, Loader2, Sparkles, Plus,
  LogOut, Settings, HardDrive, Mail, UserCheck, ArrowRight, ShieldCheck,
  Star, Upload, Check, AlertTriangle, KeyRound, Globe
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
  generateCreativePrompt,
  getBase64FromUrl
} from './services/geminiService';
import { 
  uploadFile, getAssetDownloadUrl, getUserStorageUsage, 
  uploadGeneratedAsset, fetchUserAssets, updateAssetRating
} from './services/storageService';
import { updateUserProfile } from './services/userService';

// Firebase Imports
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './contexts/AuthContext';
import { useAppStore } from './store'; // GLOBAL STATE

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
import { ModelRecruiterModal } from './components/ModelRecruiterModal';
import { CastingDirector } from './components/CastingDirector';
import { TryOnModal } from './components/TryOnModal';

// Lazy Load Heavy Components
const TechPackModal = lazy(() => import('./components/TechPackModal').then(module => ({ default: module.TechPackModal })));
const CollectionArchitect = lazy(() => import('./components/CollectionArchitect').then(module => ({ default: module.CollectionArchitect })));

const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

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

// --- AUTH COMPONENTS ---
type AuthView = 'SPLASH' | 'MEMBER_LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  const { signInWithGoogle, signInGuest } = useAuth();
  const [view, setView] = useState<AuthView>('SPLASH');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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
        if (err.code === 'auth/invalid-credential') {
            setError("Invalid email or password.");
        } else {
            setError("Login failed. Please try again.");
        }
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address above.");
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("Reset link sent to " + email);
      setTimeout(() => setView('MEMBER_LOGIN'), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
      setIsLoading(true);
      try { await signInWithGoogle(); } catch(e) { setError("Google Sign In Failed. Popup closed?"); } finally { setIsLoading(false); }
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
           <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-300 bg-[#111] p-8 border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xs font-bold uppercase tracking-widest">Identify Yourself</h2>
                 <button onClick={() => setView('SPLASH')} className="text-gray-500 hover:text-white" title="Back to Home"><X size={14}/></button>
              </div>
              
              <button onClick={handleGoogle} className="w-full py-3 bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#444] flex items-center justify-center gap-3 transition-colors">
                 <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                 Continue with Google
              </button>
              
              <div className="flex items-center gap-2 opacity-30 my-4">
                 <div className="h-px bg-white flex-1"></div>
                 <span className="text-[9px]">OR</span>
                 <div className="h-px bg-white flex-1"></div>
              </div>

              <form onSubmit={handleMemberLogin} className="space-y-3">
                 <input type="email" placeholder="EMAIL" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-xs focus:border-white outline-none placeholder-gray-600 text-white"/>
                 <input type="password" placeholder="PASSWORD" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-xs focus:border-white outline-none placeholder-gray-600 text-white"/>
                 
                 <div className="flex justify-end">
                    <button type="button" onClick={() => setView('FORGOT_PASSWORD')} className="text-[9px] text-gray-500 hover:text-white uppercase tracking-wider transition-colors">
                       Forgot Password?
                    </button>
                 </div>

                 <button type="submit" disabled={isLoading} className="w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors">
                    {isLoading ? "Verifying..." : "Login"}
                 </button>
              </form>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                 <button onClick={() => setView('REGISTER')} className="text-[9px] uppercase tracking-widest text-gray-400 hover:text-white underline decoration-gray-700 underline-offset-4">
                    New? Create an Account
                 </button>
              </div>

              {error && <div className="text-red-500 text-[10px] uppercase text-center mt-2">{error}</div>}
              {successMsg && <div className="text-green-500 text-[10px] uppercase text-center mt-2">{successMsg}</div>}
           </div>
        )}

        {view === 'REGISTER' && (
            <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-300 bg-[#111] p-8 border border-white/10 shadow-2xl">
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

        {view === 'FORGOT_PASSWORD' && (
            <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-300 bg-[#111] p-8 border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
                       <KeyRound size={14} /> Recovery Protocol
                    </h2>
                    <button onClick={() => setView('MEMBER_LOGIN')} className="text-gray-500 hover:text-white" title="Back"><X size={14}/></button>
                </div>
                <p className="text-[10px] text-gray-400 mb-2 font-mono">
                   Enter your registered email address to receive a secure password reset link.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-3">
                    <input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-xs focus:border-white outline-none placeholder-gray-600 text-white"/>
                    <button type="submit" disabled={isLoading} className="w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors">
                        {isLoading ? "Sending Protocol..." : "Send Reset Link"}
                    </button>
                </form>
                {error && <div className="text-red-500 text-[10px] uppercase text-center mt-2">{error}</div>}
                {successMsg && <div className="text-green-500 text-[10px] uppercase text-center mt-2">{successMsg}</div>}
            </div>
        )}

      </div>
      
      <div className="absolute bottom-6 text-[9px] text-gray-700 font-mono">
         SYSTEM v4.2.0 // DUAL ENGINE
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- AUTH STATE ---
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  
  // --- GLOBAL STORE ---
  const { savedModels, loadModels, selectedModelId, selectModel } = useAppStore();

  // --- APP STATE ---
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGuestExitModal, setShowGuestExitModal] = useState(false);
  
  // Storage State
  const [storageUsed, setStorageUsed] = useState(0);
  
  // BRAND & IDENTITY
  const [brand, setBrand] = useState<BrandArchetype>(BrandArchetype.DE_ROCHE);
  const [generationMode, setGenerationMode] = useState<'EDITORIAL' | 'CAMPAIGN'>('EDITORIAL');
  const [deRocheLogo, setDeRocheLogo] = useState<UploadedFile | null>(null);
  const [chaosLogo, setChaosLogo] = useState<UploadedFile | null>(null);
  
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

  // Casting & Config
  const [castingTab, setCastingTab] = useState<'AUTO' | 'AGENCY'>('AUTO');
  const [recruitingImage, setRecruitingImage] = useState<GeneratedImage | null>(null); 
  const [tryOnImage, setTryOnImage] = useState<GeneratedImage | null>(null); 
  
  const [learningContext, setLearningContext] = useState<string[]>([]);
  const [castGender, setCastGender] = useState('RANDOM');
  const [castVibe, setCastVibe] = useState('RANDOM');
  const [castHair, setCastHair] = useState('RANDOM');
  const [castFace, setCastFace] = useState('RANDOM');
  const [castDetails, setCastDetails] = useState('');
  
  // Chromatic Lab
  const [colorMode, setColorMode] = useState<'AUTO' | 'BRAND' | 'CUSTOM'>('AUTO');
  const [selectedColors, setSelectedColors] = useState<string[]>([]); 
  
  const [sourceFidelity, setSourceFidelity] = useState<number>(50);
  const [sourceInterpretation, setSourceInterpretation] = useState<SourceInterpretation | undefined>(SourceInterpretation.BLEND_50_50);
  const [sourceMaterialPrompt, setSourceMaterialPrompt] = useState('');
  const [useGrounding, setUseGrounding] = useState(false);
  
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [resolution, setResolution] = useState<ImageResolution>(ImageResolution.RES_2K);
  
  // Set Design
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

  // --- HISTORY LOADING ---
  const loadUserGenerations = useCallback(async () => {
    if (!user) return;
    try {
      const assets = await fetchUserAssets(user.uid, 'generated_editorial');
      const loadedImages: GeneratedImage[] = assets.map(asset => {
         let prompt = asset.prompt || "";
         if (!prompt && asset.aiSummary) {
             const parts = asset.aiSummary.split('|');
             if (parts.length > 0) prompt = parts[0].replace('Prompt:', '').trim();
         }
         
         return {
             id: asset.id,
             url: asset.downloadUrl,
             localUrl: asset.downloadUrl,
             storagePath: asset.storagePath,
             prompt: prompt || "Untitled Creation",
             resolution: ImageResolution.RES_2K,
             timestamp: asset.uploadedAt?.toMillis() || Date.now(),
             brand: asset.brandArchetype || BrandArchetype.DE_ROCHE,
             type: 'editorial',
             rating: asset.rating || 0 
         };
      });
      
      if (loadedImages.length > 0) {
          setGeneratedImages(loadedImages);
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, [user]);

  // --- STORAGE & MODELS UPDATE LOGIC ---
  const refreshStorageUsage = useCallback(async () => {
    if (user) {
      const usage = await getUserStorageUsage(user.uid);
      setStorageUsed(usage);
      await loadModels();
    }
  }, [user, loadModels]);

  useEffect(() => {
    if (user) {
        refreshStorageUsage();
        loadUserGenerations();
    }
  }, [user, refreshStorageUsage, loadUserGenerations]);

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

  // --- DYNAMIC STYLES (DUAL CONCEPT RESTORED) ---
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
    setRecruitingImage(image);
  };

  const handleRecruitSuccess = async () => {
      setRecruitingImage(null);
      await loadModels(); // Update global store
      await refreshStorageUsage();
      setCastingTab('AGENCY'); 
  };

  const handleTryOnSuccess = async (newUrl: string) => {
      if (!tryOnImage) return;
      const newImage: GeneratedImage = {
          ...tryOnImage,
          id: generateId(),
          url: newUrl,
          localUrl: newUrl,
          timestamp: Date.now(),
          prompt: `VIRTUAL FITTING: ${tryOnImage.prompt}`,
          type: 'editorial',
          brand: tryOnImage.brand,
          resolution: tryOnImage.resolution
      };
      setGeneratedImages(prev => [newImage, ...prev]);
      
      if (user) {
          try {
              const blob = await (await fetch(newUrl)).blob();
              await uploadGeneratedAsset(user.uid, blob, newImage.prompt, brand);
              refreshStorageUsage();
          } catch(e) { console.error("Auto-save fit failed", e); }
      }
  };

  const handleRateImage = useCallback(async (id: string, rating: number) => {
    setGeneratedImages(prev => prev.map(img => img.id === id ? { ...img, rating } : img));
    if (user) {
        try {
            await updateAssetRating(user.uid, id, rating);
        } catch (e) {
            console.error("Failed to save rating", e);
        }
    }
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
  }, [user]);

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
  const handleGetInspiration = async () => { setIsGettingInspiration(true); try { const castingStr = `Gender: ${castGender}, Vibe: ${castVibe}`; const { concept } = await generateCreativePrompt(brand, castingStr); setPromptOverride(concept); return concept; } catch (e) { console.error(e); return ""; } finally { setIsGettingInspiration(false); } };
  const handleEnhance = async (currentPrompt: string) => { if (!currentPrompt) return ""; setIsEnhancing(true); try { const result = await enhancePrompt(currentPrompt, brand); if (result.suggestedScene) { if (result.suggestedScene.environment) setEnvironment(result.suggestedScene.environment); if (result.suggestedScene.lighting) setLighting(result.suggestedScene.lighting); if (result.suggestedScene.framing) setFraming(result.suggestedScene.framing); } return result.improvedPrompt || ""; } catch (e) { console.error(e); return ""; } finally { setIsEnhancing(false); } };
  
  // --- CORE GENERATION FUNCTION ---
  const handleGenerate = async (finalPrompt: string) => {
    if (!finalPrompt.trim() && uploadedFiles.length === 0) {
      alert("Please enter a concept or upload reference images.");
      return;
    }
    
    if (user && storageUsed >= STORAGE_LIMIT) {
       alert(`Storage Limit Reached (${formatBytes(storageUsed)} / 5GB). Please delete old assets.`);
       return;
    }

    setIsGenerating(true);
    setLoadingStep('INITIALIZING');

    // 1. CASTING & SCENE
    const castingDetails = `Gender: ${castGender}, Vibe: ${castVibe}, Hair: ${castHair}, Face: ${castFace}. ${castDetails}`;
    
    let effectiveCasting = castingDetails;
    let referenceModelUrl = undefined;
    
    if (castingTab === 'AGENCY' && selectedModelId) {
        const model = savedModels.find(m => m.id === selectedModelId);
        if (model) {
            setLoadingStep('LOCKING IDENTITY');
            effectiveCasting = `IDENTITY LOCK: ${model.name}. ${model.biometricData ? 'BIOMETRICS APPLIED.' : ''}`;
            referenceModelUrl = model.url;
        }
    }

    // 2. SCENE COMPOSITION
    let scenePrompt = "";
    if (customScenePrompt) {
        scenePrompt = customScenePrompt;
    } else {
        scenePrompt = `Environment: ${environment}. Lighting: ${lighting}. Framing: ${framing}.`;
    }

    // 3. COLOR PALETTE
    let colorPrompt = "";
    if (colorMode === 'BRAND') {
        const palettes = BRAND_RECIPES[brand];
        const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];
        colorPrompt = `Color Palette: ${randomPalette.name} (${randomPalette.colors.join(', ')}).`;
    } else if (colorMode === 'CUSTOM') {
        const activeColors = selectedColors.filter(c => c);
        if (activeColors.length > 0) colorPrompt = `Color Palette: ${activeColors.join(', ')}.`;
    }

    // 4. LEARNING CONTEXT
    let contextPrompt = "";
    if (learningContext.length > 0) {
        contextPrompt = `Style Reference History: ${learningContext.join(' | ')}.`;
    }

    try {
      setLoadingStep('FABRICATING');
      
      // Determine Logo based on ACTIVE BRAND
      let logoToUse = null;
      if (brand === BrandArchetype.DE_ROCHE && deRocheLogo) logoToUse = deRocheLogo.base64;
      if (brand === BrandArchetype.CHAOSCHICC && chaosLogo) logoToUse = chaosLogo.base64;

      const newImageUrls = await generateEditorialImages({
        prompt: finalPrompt,
        uploadedFiles,
        resolution,
        aspectRatio,
        brand,
        modelPrompt: effectiveCasting,
        logoBase64: logoToUse || undefined,
        environment: environment,
        lighting: lighting,
        framing: framing,
        colorPalette: colorPrompt,
        customScenePrompt: customScenePrompt,
        seed: isSeedLocked ? seed : Math.random(),
        learningContext: learningContext,
        sourceInterpretation: sourceInterpretation,
        sourceMaterialPrompt: sourceMaterialPrompt,
        sourceFidelity: sourceFidelity,
        referenceModelUrl: referenceModelUrl,
        locationQuery: useGrounding ? finalPrompt : undefined,
        imageMode: generationMode === 'CAMPAIGN' ? ImageMode.LOOKBOOK : ImageMode.CINEMATIC
      });

      const newImages: GeneratedImage[] = newImageUrls.map(url => ({
        id: generateId(),
        url,
        localUrl: url,
        prompt: finalPrompt,
        modelPrompt: effectiveCasting,
        resolution,
        timestamp: Date.now(),
        brand,
        type: 'editorial',
        environment: environment,
        lighting: lighting,
        framing: framing,
        lookData: {
            id: generateId(),
            season: 'SS25',
            number: 1,
            coreItem: finalPrompt.split(' ')[0] || 'Garment',
            silhouette: 'Tailored',
            material: 'Cotton',
            vibe: castVibe,
            status: 'GENERATED'
        }
      }));
      
      setGeneratedImages(prev => [...newImages, ...prev]);
      
      if (user) {
         setLoadingStep('ARCHIVING');
         for (const img of newImages) {
             const blob = await (await fetch(img.url)).blob();
             await uploadGeneratedAsset(user.uid, blob, finalPrompt, brand);
         }
         refreshStorageUsage();
      }

    } catch (error) {
      console.error("Generation failed", error);
      alert("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
      setLoadingStep('');
    }
  };

  // --- ACTIONS ---
  const handleUpdateImage = (id: string, newUrl: string) => {
    setGeneratedImages(prev => prev.map(img => img.id === id ? { ...img, url: newUrl } : img));
  };
  
  const handleAddSketch = (originalImage: GeneratedImage, sketchUrl: string) => {
     const sketchImage: GeneratedImage = {
         ...originalImage,
         id: generateId(),
         url: sketchUrl,
         prompt: `TECHNICAL SKETCH: ${originalImage.prompt}`,
         type: 'editorial',
         timestamp: Date.now()
     };
     setGeneratedImages(prev => [sketchImage, ...prev]);
  };

  const handleEditStart = async (id: string, prompt: string) => {
     const img = generatedImages.find(i => i.id === id);
     if (!img) throw new Error("Image not found");
     return await editGeneratedImage(img.url, prompt, img.storagePath);
  };
  
  const handleGenerateVariations = async (image: GeneratedImage) => {
      setIsGeneratingVariations(true);
      try {
          const urls = await generateVariations(image.url, image.prompt, image.brand, image.storagePath);
          const newImages = urls.map(u => ({
              ...image,
              id: generateId(),
              url: u,
              timestamp: Date.now(),
              prompt: `VARIATION: ${image.prompt}`
          }));
          setGeneratedImages(prev => [...newImages, ...prev]);
      } catch (e) {
          console.error(e);
          alert("Failed to generate variations");
      } finally {
          setIsGeneratingVariations(false);
      }
  };

  const handleGenerateVideo = async (image: GeneratedImage) => {
      setIsGeneratingVideo(true);
      try {
          const videoUrl = await generateVideo(image.url, image.prompt, image.brand, image.storagePath);
          setGeneratedImages(prev => prev.map(img => img.id === image.id ? { ...img, videoUrl } : img));
      } catch (e) {
          console.error(e);
          alert("Failed to generate video");
      } finally {
          setIsGeneratingVideo(false);
      }
  };
  
  const handleSimulateFabric = async (image: GeneratedImage, fabric: string) => {
      setIsSimulatingFabric(true);
      try {
          const videoUrl = await simulateFabricMovement(image.url, image.prompt, image.brand, fabric, image.storagePath);
          setGeneratedImages(prev => prev.map(img => img.id === image.id ? { ...img, videoUrl } : img));
      } catch (e) {
          console.error(e);
          alert("Failed to simulate fabric");
      } finally {
          setIsSimulatingFabric(false);
      }
  };

  const handleMarketingStrategy = async (image: GeneratedImage) => {
    setIsMarketingLoading(true);
    setShowMarketingModal(true);
    try {
        const strategy = await generateMarketingStrategy(image.brand, [{ 
            id: image.id, 
            base64: await getBase64FromUrl(image.url, image.storagePath).then(r => r.base64), 
            mimeType: 'image/png', 
            file: new File([], 'placeholder'), 
            previewUrl: '', 
            category: 'reference' 
        }]);
        setMarketingStrategy(strategy);
    } catch (e) {
        console.error(e);
    } finally {
        setIsMarketingLoading(false);
    }
  };

  const handleGenerateTechPack = async (image: GeneratedImage) => {
    setIsGeneratingTechPack(true);
    setShowTechPackModal(true);
    try {
       const pack = await generateTechPack(image.url, image.storagePath);
       setTechPack(pack);
    } catch (e) {
       console.error(e);
       alert("Failed to generate Tech Pack");
       setShowTechPackModal(false);
    } finally {
       setIsGeneratingTechPack(false);
    }
  };

  if (!user && authLoading) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center text-white">
              <Loader2 className="animate-spin" />
          </div>
      );
  }

  if (!user && !authLoading) {
     return <AuthScreen onLogin={() => {}} />;
  }

  if (user && !userProfile) {
     return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin"/> Syncing Profile...</div>;
  }

  if (showVibeCheck && userProfile && !userProfile.isGuest && userProfile.createdAt && (Date.now() - userProfile.createdAt.toMillis() < 60000)) {
     return <VibeCheck onClose={() => setShowVibeCheck(false)} onComplete={async (b) => {
         setBrand(b);
         if (user) await updateUserProfile(user.uid, { brandArchetype: b });
     }} />;
  }

  const selectedImage = generatedImages.find(img => img.id === selectedImageId) || null;
  const comparisonImage = generatedImages.find(img => img.id === comparisonImageId) || null;

  return (
    <div className={`min-h-screen w-full flex font-mono transition-colors duration-500 ${bgClass} ${textAccent}`}>
      
      {/* 1. LEFT SIDEBAR (Redesigned Modules) */}
      <div className={`w-[360px] h-screen overflow-y-auto custom-scrollbar p-6 flex flex-col gap-8 flex-shrink-0 z-20 shadow-2xl ${sidebarClass}`}>
        
        {/* HEADER */}
        <div className="group relative cursor-pointer mb-2" onClick={() => setShowProfileModal(true)}>
            <h1 className="text-2xl font-black tracking-tighter uppercase font-header leading-none">
                LUMIÈRE
            </h1>
            <div className="text-[9px] tracking-[0.4em] opacity-40 uppercase">System v4.3 // Modular</div>
        </div>

        {/* MODULE 1: IDENTITY & STRATEGY */}
        <section>
            <div className={labelClass}><div className="flex items-center gap-2"><Hexagon size={12} /> <span>Brand Identity</span></div></div>
            
            {/* Dual Archetype Toggle */}
            <div className="flex mb-2">
                 <button 
                    onClick={() => setBrand(BrandArchetype.DE_ROCHE)} 
                    className={`flex-1 py-3 text-[9px] font-bold uppercase border transition-all ${brand === BrandArchetype.DE_ROCHE ? 'bg-black text-white border-black' : 'opacity-50 border-gray-400'}`}
                 >
                    De Roche
                 </button>
                 <button 
                    onClick={() => setBrand(BrandArchetype.CHAOSCHICC)} 
                    className={`flex-1 py-3 text-[9px] font-bold uppercase border transition-all ${brand === BrandArchetype.CHAOSCHICC ? 'bg-[#C5A059] text-black border-[#C5A059]' : 'opacity-50 border-gray-400'}`}
                 >
                    Chaos
                 </button>
            </div>

            {/* Campaign Mode */}
            <div className="flex mb-3">
                 <button 
                    onClick={() => setGenerationMode('EDITORIAL')} 
                    className={`flex-1 py-2 text-[8px] font-bold uppercase border-b-2 transition-all ${generationMode === 'EDITORIAL' ? (isDeRoche ? 'border-black opacity-100' : 'border-[#C5A059] opacity-100') : 'border-transparent opacity-40'}`}
                 >
                    Editorial
                 </button>
                 <button 
                    onClick={() => setGenerationMode('CAMPAIGN')} 
                    className={`flex-1 py-2 text-[8px] font-bold uppercase border-b-2 transition-all ${generationMode === 'CAMPAIGN' ? (isDeRoche ? 'border-black opacity-100' : 'border-[#C5A059] opacity-100') : 'border-transparent opacity-40'}`}
                 >
                    Campaign
                 </button>
            </div>

            {/* Logo Upload (Clean) */}
            <div className={`p-2 border border-dashed rounded flex items-center gap-3 ${isDeRoche ? 'border-gray-400' : 'border-[#C5A059]/50'}`}>
                <div className="w-10 h-10 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                    {(brand === BrandArchetype.DE_ROCHE && deRocheLogo) ? <img src={deRocheLogo.previewUrl} className="w-full h-full object-cover"/> : 
                     (brand === BrandArchetype.CHAOSCHICC && chaosLogo) ? <img src={chaosLogo.previewUrl} className="w-full h-full object-cover"/> : 
                     <Upload size={12} className="opacity-50"/>}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleLogoUpload(e, brand)} />
                </div>
                <div className="flex-1">
                    <div className="text-[8px] font-bold uppercase">Upload Insignia</div>
                    <div className="text-[7px] opacity-60">PNG / Transparent Recommended</div>
                </div>
            </div>
        </section>

        {/* MODULE 2: CHROMATIC LAB */}
        <section>
             <div className={labelClass}><div className="flex items-center gap-2"><Palette size={12} /> <span>Chromatic Lab</span></div></div>
             <div className="flex gap-1 mb-2">
                 {['AUTO', 'BRAND', 'CUSTOM'].map(m => (
                     <button key={m} onClick={() => setColorMode(m as any)} className={`flex-1 py-2 text-[8px] font-bold uppercase border rounded-sm transition-all ${colorMode === m ? (isDeRoche ? 'bg-black text-white border-black' : 'bg-[#C5A059] text-black border-[#C5A059]') : 'opacity-50 border-transparent hover:opacity-100'}`}>
                         {m}
                     </button>
                 ))}
             </div>
             {colorMode === 'CUSTOM' && (
                 <div className="grid grid-cols-5 gap-1 animate-in fade-in duration-300">
                     {[0,1,2,3,4].map(i => (
                         <div key={i} className="relative aspect-square border border-dashed rounded-sm overflow-hidden group">
                             <input type="color" value={selectedColors[i] || '#000000'} onChange={(e) => handleColorAdd(e.target.value, i)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                             <div className="w-full h-full" style={{ backgroundColor: selectedColors[i] || 'transparent' }}></div>
                             {selectedColors[i] && <button onClick={() => handleColorRemove(i)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 text-white"><X size={10}/></button>}
                             {!selectedColors[i] && <div className="absolute inset-0 flex items-center justify-center opacity-30"><Plus size={10}/></div>}
                         </div>
                     ))}
                 </div>
             )}
             {colorMode === 'BRAND' && (
                 <div className="p-2 border rounded-sm text-[9px] font-mono opacity-70 flex items-center gap-2">
                     <div className={`w-3 h-3 rounded-full ${isDeRoche ? 'bg-[#A7A8AA]' : 'bg-[#4F2170]'}`}></div>
                     Using {brand === BrandArchetype.DE_ROCHE ? 'De Roche' : 'ChaosChicc'} Palette.
                 </div>
             )}
        </section>

        {/* MODULE 3: VISUAL ENGINEERING (The Core) */}
        <div className="flex-1 flex flex-col min-h-[250px]">
            <PromptInput 
              onGenerate={handleGenerate}
              onEnhance={handleEnhance}
              onInspire={handleGetInspiration}
              overridePrompt={promptOverride}
              isGenerating={isGenerating}
              loadingStep={loadingStep}
              isEnhancing={isEnhancing}
              isGettingInspiration={isGettingInspiration}
              useGrounding={useGrounding}
              setUseGrounding={setUseGrounding}
              brand={brand}
            />
            
            <div className="mt-4">
               <UploadZone 
                 label="Visual References (Moodboard)" 
                 category="inspiration" 
                 files={uploadedFiles} 
                 onAddFiles={(newFiles) => setUploadedFiles(prev => [...prev, ...newFiles])} 
                 onRemoveFile={(id) => setUploadedFiles(prev => prev.filter(f => f.id !== id))} 
               />
            </div>
        </div>

        {/* MODULE 4: CASTING */}
        <CastingDirector 
           brand={brand}
           castGender={castGender} setCastGender={setCastGender}
           castVibe={castVibe} setCastVibe={setCastVibe}
           castHair={castHair} setCastHair={setCastHair}
           castFace={castFace} setCastFace={setCastFace}
           castDetails={castDetails} setCastDetails={setCastDetails}
           activeTab={castingTab} onTabChange={setCastingTab}
        />
        
        {/* MODULE 5: SET DESIGN (Bottom Anchored) */}
        <section className="pt-4 border-t border-dashed border-gray-500/30">
            <div className={labelClass}><div className="flex items-center gap-2"><Monitor size={12} /> <span>Set Design</span></div></div>
            <div className="grid grid-cols-2 gap-2 mb-2">
                <button onClick={randomizeScene} className={`col-span-2 py-2 text-[9px] uppercase font-bold border rounded-sm flex items-center justify-center gap-2 hover:bg-white/10 ${isDeRoche ? 'border-gray-300' : 'border-[#C5A059]/30'}`}>
                    <Dice5 size={12} /> Randomize Scene
                </button>
                <div className="relative group">
                     <select value={environment} onChange={(e) => setEnvironment(e.target.value)} className={`w-full p-2 text-[9px] border rounded-sm outline-none appearance-none font-mono uppercase ${inputClass}`}>
                        <option value="RANDOM">Env: Random</option>
                        {Object.values(EnvironmentPreset).filter(k => k !== 'RANDOM').map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
                     </select>
                </div>
                <div className="relative group">
                     <select value={lighting} onChange={(e) => setLighting(e.target.value)} className={`w-full p-2 text-[9px] border rounded-sm outline-none appearance-none font-mono uppercase ${inputClass}`}>
                        <option value="RANDOM">Light: Random</option>
                        {Object.values(LightingPreset).filter(k => k !== 'RANDOM').map(l => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
                     </select>
                </div>
            </div>
            
            <div className="relative mt-2">
                <input 
                   type="text" 
                   value={customScenePrompt} 
                   onChange={(e) => setCustomScenePrompt(e.target.value)} 
                   placeholder="CUSTOM SCENE DETAILS..."
                   className={`w-full py-2 px-2 text-[10px] border-b bg-transparent rounded-none focus:outline-none placeholder-opacity-50 font-mono uppercase ${isDeRoche ? 'border-gray-300 text-black placeholder-gray-400' : 'border-[#C5A059]/30 text-[#C5A059] placeholder-[#C5A059]/30'}`} 
                />
            </div>

            <div className="flex gap-2 mt-3">
               <div className={`flex-1 flex items-center justify-between p-2 border rounded-sm ${inputClass}`}>
                  <span className="text-[9px] uppercase font-bold opacity-70">SEED LOCK</span>
                  <button onClick={() => setIsSeedLocked(!isSeedLocked)} className={isSeedLocked ? 'text-green-500' : 'opacity-30'}>
                     {isSeedLocked ? <Lock size={12}/> : <Unlock size={12}/>}
                  </button>
               </div>
               <div className={`flex-1 flex items-center justify-between p-2 border rounded-sm ${inputClass}`}>
                   <span className="text-[9px] uppercase font-bold opacity-70">RES</span>
                   <select value={resolution} onChange={(e) => setResolution(e.target.value as ImageResolution)} className="bg-transparent text-[9px] font-bold outline-none uppercase">
                       <option value={ImageResolution.RES_1K}>1K</option>
                       <option value={ImageResolution.RES_2K}>2K</option>
                       <option value={ImageResolution.RES_4K} disabled={!hasApiKey}>4K {hasApiKey ? '' : '(LOCKED)'}</option>
                   </select>
               </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
                <button 
                    onClick={handleSignOut} 
                    className="opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2 text-[9px] font-bold uppercase" 
                    title={user?.isAnonymous ? "Exit Guest Session" : "Sign Out"}
                >
                    <LogOut size={10} /> Logout
                </button>
                {!hasApiKey && <button onClick={() => setShowApiKeyModal(true)} className="text-[8px] opacity-50 hover:opacity-100 hover:underline">Unlock 4K</button>}
            </div>
        </section>

      </div>

      {/* 2. MAIN GALLERY AREA */}
      <div className={`flex-1 h-screen flex flex-col relative ${bgClass}`}>
         <ArchiveControls 
           searchQuery={searchQuery} onSearchChange={setSearchQuery}
           filterBrand={galleryFilter} onFilterBrandChange={setGalleryFilter}
           sortBy={sortBy} onSortChange={setSortBy}
           showFavoritesOnly={showFavoritesOnly} onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
           isDeRoche={isDeRoche}
         />

         <div className="flex-1 overflow-y-auto p-4