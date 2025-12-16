
import { create } from 'zustand';
import { SavedModel } from './types';
import { fetchMyModels, saveModelToAgency } from './services/storageService';

interface AppState {
  savedModels: SavedModel[];
  selectedModelId: string | null;
  isLoadingModels: boolean;
  loadModels: () => Promise<void>;
  addModel: (model: SavedModel) => void;
  selectModel: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  savedModels: [],
  selectedModelId: null,
  isLoadingModels: false,
  
  loadModels: async () => {
     set({ isLoadingModels: true });
     try {
       const models = await fetchMyModels();
       set({ savedModels: models });
     } catch (e) {
       console.error("Failed to load models:", e);
     } finally {
       set({ isLoadingModels: false });
     }
  },
  
  addModel: (m) => set((state) => ({ savedModels: [m, ...state.savedModels] })),
  
  selectModel: (id) => set({ selectedModelId: id }),
}));
    