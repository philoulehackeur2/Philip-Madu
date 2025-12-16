import { create } from 'zustand';
import { BrandArchetype, GeneratedImage, UploadedFile } from './types';

interface AppState {
  // Global State
  brand: BrandArchetype;
  isGenerating: boolean;
  loadingStep: string;
  generatedImages: GeneratedImage[];
  uploadedFiles: UploadedFile[];
  selectedImageId: string | null;
  comparisonImageId: string | null;
  useGrounding: boolean;

  // Actions
  setBrand: (b: BrandArchetype) => void;
  setIsGenerating: (status: boolean) => void;
  setLoadingStep: (step: string) => void;
  setGeneratedImages: (images: GeneratedImage[] | ((prev: GeneratedImage[]) => GeneratedImage[])) => void;
  addGeneratedImage: (image: GeneratedImage) => void;
  updateGeneratedImage: (id: string, updates: Partial<GeneratedImage>) => void;
  setUploadedFiles: (files: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => void;
  addUploadedFiles: (files: UploadedFile[]) => void;
  removeUploadedFile: (id: string) => void;
  setSelectedImageId: (id: string | null) => void;
  setComparisonImageId: (id: string | null) => void;
  setUseGrounding: (use: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  brand: BrandArchetype.DE_ROCHE,
  isGenerating: false,
  loadingStep: '',
  generatedImages: [],
  uploadedFiles: [],
  selectedImageId: null,
  comparisonImageId: null,
  useGrounding: false,

  setBrand: (b) => set({ brand: b }),
  setIsGenerating: (status) => set({ isGenerating: status }),
  setLoadingStep: (step) => set({ loadingStep: step }),
  
  setGeneratedImages: (input) => set((state) => ({ 
    generatedImages: typeof input === 'function' ? input(state.generatedImages) : input 
  })),
  
  addGeneratedImage: (image) => set((state) => ({ 
    generatedImages: [image, ...state.generatedImages] 
  })),
  
  updateGeneratedImage: (id, updates) => set((state) => ({
    generatedImages: state.generatedImages.map((img) => img.id === id ? { ...img, ...updates } : img)
  })),
  
  setUploadedFiles: (input) => set((state) => ({
      uploadedFiles: typeof input === 'function' ? input(state.uploadedFiles) : input
  })),
  
  addUploadedFiles: (files) => set((state) => ({ uploadedFiles: [...state.uploadedFiles, ...files] })),
  
  removeUploadedFile: (id) => set((state) => ({ uploadedFiles: state.uploadedFiles.filter(f => f.id !== id) })),
  
  setSelectedImageId: (id) => set({ selectedImageId: id }),
  setComparisonImageId: (id) => set({ comparisonImageId: id }),
  setUseGrounding: (use) => set({ useGrounding: use }),
}));
