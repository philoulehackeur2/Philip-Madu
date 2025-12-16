

export enum ImageResolution {
  RES_1K = '1K',
  RES_2K = '2K',
  RES_4K = '4K'
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '16:9',
  TALL = '9:16'
}

export enum BrandArchetype {
  DE_ROCHE = 'DE_ROCHE',
  CHAOSCHICC = 'CHAOSCHICC'
}

export enum ImageMode {
  LOOKBOOK = 'LOOKBOOK',
  CINEMATIC = 'CINEMATIC'
}

export enum EnvironmentPreset {
  NEUTRAL_STUDIO = 'NEUTRAL_STUDIO',
  BRUTALIST_STUDIO = 'BRUTALIST_STUDIO',
  EVIL_STUDIO = 'EVIL_STUDIO',
  ATELIER = 'ATELIER',
  SCULPTURE_WORKSHOP = 'SCULPTURE_WORKSHOP',
  FRANCE_COURTYARD = 'FRANCE_COURTYARD',
  BRUTALIST_MUSEUM = 'BRUTALIST_MUSEUM',
  URBAN_ALLEY = 'URBAN_ALLEY',
  FOGGY_FOREST = 'FOGGY_FOREST',
  SEASIDE_CLIFF = 'SEASIDE_CLIFF',
  RANDOM = 'RANDOM'
}

export enum LightingPreset {
  SOFT_DIFFUSE = 'SOFT_DIFFUSE',
  HARD_SCULPTURAL = 'HARD_SCULPTURAL',
  TOP_LIGHT = 'TOP_LIGHT',
  CINEMATIC = 'CINEMATIC',
  RIM_LIGHT = 'RIM_LIGHT',
  COLORED_GELS = 'COLORED_GELS',
  GOLDEN_HOUR = 'GOLDEN_HOUR',
  FOG_GREY = 'FOG_GREY',
  HARSH_SUN = 'HARSH_SUN',
  CLOUDY = 'CLOUDY',
  SODIUM_VAPOR = 'SODIUM_VAPOR',
  NEON = 'NEON',
  RANDOM = 'RANDOM'
}

export enum FramingPreset {
  FULL_BODY = 'FULL_BODY',
  THREE_QUARTER = 'THREE_QUARTER',
  HALF_BODY = 'HALF_BODY',
  CLOSE_UP = 'CLOSE_UP',
  FABRIC_DETAIL = 'FABRIC_DETAIL',
  MOTION_BLUR = 'MOTION_BLUR',
  SLOW_PAN = 'SLOW_PAN',
  WALK_CYCLE = 'WALK_CYCLE',
  RANDOM = 'RANDOM'
}

export enum SourceInterpretation {
  COLORS = 'COLORS',
  TEXTURES = 'TEXTURES',
  SILHOUETTE = 'SILHOUETTE',
  ACCESSORY = 'ACCESSORY',
  STYLE_DNA = 'STYLE_DNA',
  FULL_INTEGRATION = 'FULL_INTEGRATION',
  LOOSE = 'LOOSE',
  BLEND_50_50 = 'BLEND_50_50'
}

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
  category: 'moodboard' | 'inspiration' | 'brand' | 'logo' | 'reference';
}

export interface GeneratedImage {
  id: string;
  url: string; // Data URL
  prompt: string;
  modelPrompt?: string; // Specific casting description
  resolution: ImageResolution;
  timestamp: number;
  brand: BrandArchetype;
  type: 'editorial' | 'marketing';
  caption?: string;
  location?: string;
  videoUrl?: string; // URL for the generated Veo video
  mode?: ImageMode; // Track which mode created this image
  rating?: number; // 1-5 Star rating
  collections?: string[]; // User-defined tags/collections
  
  // New Metadata for reproduction
  seed?: number;
  environment?: string;
  lighting?: string;
  framing?: string;
  
  // Look Data for Pattern Cutter
  lookData?: CollectionLook;
  
  // Grounding Data
  groundingSources?: { title: string; uri: string }[];
}

export interface MarketingStrategy {
  title: string;
  description: string;
  tactics: string[];
}

export interface BOMItem {
  placement: string;
  item: string;
  supplier: string;
  consumption: string;
}

export interface PointOfMeasure {
  point: string;
  spec: string; // measurement in cm/in
  tolerance: string;
}

export interface TechPack {
  garmentName: string;
  season: string;
  fabricComposition: string;
  colorPalette: string[];
  constructionDetails: string[]; // Stitch types, seam allowances
  fitNotes: string;
  billOfMaterials: BOMItem[];
  measurements: PointOfMeasure[];
  flatSketchUrl?: string; // New field for the generated flat drawing
}

export interface ModelPreset {
  id: string;
  name: string;
  description: string;
  brand: BrandArchetype;
}

// --- NEW ENGINE TYPES ---

export interface CollectionLook {
  id: string;
  season: string;
  number: number;
  coreItem: string; // e.g., "Denim Jacket"
  silhouette: string; // e.g., "Oversized Boxy"
  material: string; // e.g., "14oz Raw Denim"
  vibe: string;
  transformation?: string; // The "Evolution Verb" (e.g., Fused, Eroded)
  status: 'DRAFT' | 'GENERATED';
  prompt_scene?: string; // Selected scene context
}

export interface PatternMetric {
  label: string;
  value: string;
  formula?: string; // For De Roche
  warning?: string; // For Chaos
}

export interface NarrativeData {
  headline: string;
  technicalDescription: string;
  mood: string;
}

export interface DesignSession {
  id: string;
  mode: BrandArchetype;
  lookId?: string;
  imageUrl?: string; // Base64 or URL
  narrative?: NarrativeData;
  patternData?: {
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    biasCut: boolean;
  };
}

export type HarmonyRule = 'ANALOGOUS' | 'TRIAD' | 'SPLIT_COMPLEMENTARY' | 'MONOCHROMATIC';

// --- PATTERN ENGINE TYPES ---
export interface PatternAnnotation {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  source: 'Armstrong' | 'Nakamichi' | 'Industrial';
}

export interface Point {
  x: number;
  y: number;
  tag?: string;
}

export interface PatternPiece {
  name: string;
  cut: string;
  path: string; // SVG path string
  rawPoints?: Point[]; // Parametric vector points
  sewPath?: string; // Optional sew line (dashed)
  grainline: { x: number; y: number; h?: number; w?: number };
  notches?: { x: number; y: number }[];
  annotations: PatternAnnotation[];
}

export interface PatternData {
  styleName: string;
  brand: BrandArchetype;
  method: 'Standard Block' | 'Sculptural Draping' | 'Technical Utility' | 'Parametric Vector Logic';
  pieces: PatternPiece[];
  fabricYield: string;
  params?: DesignParameters;
}

export interface DesignParameters {
  fitTension: number; // 0-100 (Ease)
  gravity: number;    // 0-100 (Drape)
  distortion: number; // 0-100 (Chaos/Shift)
}