
import { GoogleGenAI, Type, Content, Part } from "@google/genai";
import { ImageResolution, AspectRatio, UploadedFile, BrandArchetype, MarketingStrategy, TechPack, ImageMode, EnvironmentPreset, LightingPreset, FramingPreset, SourceInterpretation, ModelPreset, CollectionLook, PatternMetric } from "../types";
import { constructEvolutionaryPrompt as _constructEvolutionaryPrompt } from './mutationEngine';
import { generateMarketingStrategy as _generateMarketingStrategy, groundPromptWithSearch as _groundPromptWithSearch, BRAND_CONTEXT } from './strategicIntelligence';

// RE-EXPORT for App.tsx compatibility
export const constructEvolutionaryPrompt = _constructEvolutionaryPrompt;
export const generateMarketingStrategy = _generateMarketingStrategy;
export const groundPromptWithSearch = _groundPromptWithSearch;

// --- MODEL PRESETS ---
export const MODEL_PRESETS: ModelPreset[] = [
  // De Roche Presets
  { id: 'dr_architect', name: 'The Architect', description: 'Severe architectural bob, sharp cheekbones, no makeup, intellectual gaze.', brand: BrandArchetype.DE_ROCHE },
  { id: 'dr_monolith', name: 'The Monolith', description: 'Tall, completely shaved head, statuesque features, deep onyx skin, imposing silence.', brand: BrandArchetype.DE_ROCHE },
  { id: 'dr_spectre', name: 'The Spectre', description: 'Platinum white hair, pale translucent skin, bleached brows, ethereal and ghostly.', brand: BrandArchetype.DE_ROCHE },
  { id: 'dr_sage', name: 'The Sage', description: 'Older model, silver long hair, wise heavy-set eyes, raw skin texture, dignified.', brand: BrandArchetype.DE_ROCHE },
  
  // ChaosChicc Presets
  { id: 'cc_glitch', name: 'The Glitch', description: 'Pixelated makeup, asymmetrical haircut, cybernetic contact lenses, nervous energy, chromatic accents.', brand: BrandArchetype.CHAOSCHICC },
  { id: 'cc_wraith', name: 'The Wraith', description: 'Long greasy hair covering face, smudgey kohl eyes, bruised lips, sleep-deprived chic.', brand: BrandArchetype.CHAOSCHICC },
  { id: 'cc_riot', name: 'The Riot', description: 'Neon buzzcut, heavy face tattoos, safety pin piercings, aggressive and manic.', brand: BrandArchetype.CHAOSCHICC },
  { id: 'cc_doll', name: 'The Broken Doll', description: 'Porcelain skin with cracks, oversized eyes, messy Victorian updo, uncanny valley vibe.', brand: BrandArchetype.CHAOSCHICC },
];

// 1. DE ROCHE (The Persona): Order, Silence, Weight, Nature, Void
const DE_ROCHE_SUBGENRES = [
  "Eco-Brutalism (Moss reclaiming concrete)",
  "Metabolist Architecture (Kisho Kurokawa style)",
  "Soviet Gigantism (Monumental scale)",
  "Bunker Archaeology (Paul Virilio aesthetics)",
  "Monolithic Zen (Tadao Ando silence)",
  "Pre-Columbian Heavy Stonework (Cyclopean masonry)",
  "High-Tech Industrialism (Richard Rogers exposed structures)",
  "Celestial Observatory (Ancient astronomical alignments)",
  "Post-Humanist Sanctuary",
  "Neolithic Futurism"
];

const DE_ROCHE_TEXTURES = [
  "Weathered travertine", "Frosted aerospace glass", "Raw felt", "Oxidized copper", 
  "Wet slate", "Volcanic ash", "Chiseled granite", "Translucent resin", 
  "Ramie fabric", "Scorched timber (Shou Sugi Ban)", "Limewash", "Corroded bronze"
];

// 2. CHAOSCHICC (The Shadow): Disorder, Noise, Decay, Glitch, Flesh, Chromatic
const CHAOS_SUBGENRES = [
  "Neo-Expressionism (Basquiat/Schnabel messy layering)",
  "Glitch Baroque (Ornate details destroyed by digital noise)",
  "Industrial Trash (Found objects, duct tape, plastic)",
  "Cyber-Rot (Technological decay, wires, rust)",
  "Vandalized Rococo (Marie Antoinette in a subway)",
  "Francis Bacon's Glass Cages",
  "Asylum Scribbles (Art Brut/Outsider Art)",
  "Acid Rave (Smudged neon, motion blur)",
  "Flesh & Metal (Cronenberg body horror aesthetic)",
  "Dadaist Collage",
  "Hyper-Pop Surrealism",
  "Bioluminescent Punk"
];

const CHAOS_TEXTURES = [
  "Burnt velvet", "Spray-painted lace", "Cracked mirrors", "Oil slick on asphalt", 
  "Ripped billboard paper", "Rusted chainmail", "Melting plastic", "Blood-stained silk", 
  "Duct tape patchwork", "Shattered safety glass", "Neon mylar", "Decaying biological matter",
  "Liquid chrome", "Radioactive slime"
];

// 3. UNIVERSAL BIZARRE MODIFIERS (The "Impossible" Element)
const CAMERA_ANGLES = [
  "Extreme Low Angle (Worm's eye, monumentalizing)",
  "High Angle Surveillance (CCTV style)",
  "Dutch Tilt (Disorienting)",
  "Through-the-window (Voyeuristic/Obstructed)",
  "Extreme Close-up (Macro texture focus)",
  "Wide Lens Distortion (Fisheye edge)",
  "Silhouette against blinding light",
  "Reflected in a broken mirror"
];

const UNEXPECTED_DETAILS = [
  "A floating geometric shape in the background",
  "The floor is covered in water",
  "Strange wires hanging from the ceiling",
  "A classic oil painting melting on the wall",
  "Thick smoke crawling on the floor",
  "Shadows that don't match the subject",
  "Red laser lines cutting across the frame",
  "An unexpected animal (a crow, a wolf, a sphinx cat)",
  "Inverted gravity elements",
  "Digital glitch artifacts in the air"
];

// --- SCENE DIRECTOR LIBRARIES ---

const ENVIRONMENT_DESCRIPTIONS: Record<EnvironmentPreset, string> = {
  [EnvironmentPreset.NEUTRAL_STUDIO]: "Neutral Fashion Studio. Infinite cyclorama wall. Perfectly smooth gradient background. No distractions.",
  [EnvironmentPreset.BRUTALIST_STUDIO]: "Brutalist Concrete Studio. Raw architectural concrete walls, exposed aggregate floor. Cold, monumental atmosphere.",
  [EnvironmentPreset.EVIL_STUDIO]: "Evil Studio. High contrast, oppressive darkness, dramatic voids, thick rolling fog on the floor. A sense of danger.",
  [EnvironmentPreset.ATELIER]: "Student Atelier. Cluttered creative space, dress forms in background, pinned sketches, loose threads, fabric rolls. Organized chaos.",
  [EnvironmentPreset.SCULPTURE_WORKSHOP]: "Sculpture Workshop. Covered in fine stone dust, chisels, raw marble blocks, plaster casts. Textural and matte.",
  [EnvironmentPreset.FRANCE_COURTYARD]: "South of France Courtyard. Sun-bleached stone, terracotta tiles, olive trees casting dappled shadows. Warm Mediterranean vibe.",
  [EnvironmentPreset.BRUTALIST_MUSEUM]: "Brutalist Museum Exterior. Massive geometric shapes, imposing concrete overhangs, sharp architectural shadows. Scale is monumental.",
  [EnvironmentPreset.URBAN_ALLEY]: "Urban Art Alley. Wet asphalt, layers of torn posters, graffiti tags, metallic fire escapes. Gritty street texture.",
  [EnvironmentPreset.FOGGY_FOREST]: "Foggy Forest meets Ruins. Ancient stone arches overgrown with moss, dense mist, muted greens and greys. Ethereal and haunting.",
  [EnvironmentPreset.SEASIDE_CLIFF]: "Seaside Cliff Architecture. Concrete structure embedded in a cliff edge, crashing waves below, overcast sky. Dramatic nature meets man-made.",
  [EnvironmentPreset.RANDOM]: "Randomized Environment." 
};

const LIGHTING_DESCRIPTIONS: Record<LightingPreset, string> = {
  [LightingPreset.SOFT_DIFFUSE]: "Soft Diffuse Light. Large octabox source. Wrap-around illumination, minimal shadows, flattering skin tones.",
  [LightingPreset.HARD_SCULPTURAL]: "Hard Sculptural Light. Fresnel lens spotlight. Deep, sharp shadows. High contrast, defining texture and bone structure.",
  [LightingPreset.TOP_LIGHT]: "Top-Light Dramatic. Butterfly lighting setup from directly above. Casts shadows under cheekbones and nose. Mysterious and moody.",
  [LightingPreset.CINEMATIC]: "Three-Point Cinematic. Key light, fill light, and a strong rim light (kicker) to separate subject from background. Hollywood standard.",
  [LightingPreset.RIM_LIGHT]: "Rim Light Accent. Silhouette-heavy. Strong backlighting creating a halo effect around the subject. Details in shadow.",
  [LightingPreset.COLORED_GELS]: "Experimental Colored Gels. Mix of warm (red/orange) and cool (cyan/blue) lights. Cyberpunk or club aesthetic.",
  [LightingPreset.GOLDEN_HOUR]: "Golden Hour. Low sun angle, warm gold tones, long horizontal shadows. Romantic and natural.",
  [LightingPreset.FOG_GREY]: "Fog-Diffused Grey. Overcast sky, giant softbox effect. Low contrast, muted colors, melancholic mood.",
  [LightingPreset.HARSH_SUN]: "Harsh Mediterranean Sun. Direct midday sunlight. Blindingly bright highlights, pitch black shadows. High dynamic range.",
  [LightingPreset.CLOUDY]: "Cloudy Soft Shadow. Even, flat illumination. No harsh highlights. Perfect for showing garment details.",
  [LightingPreset.SODIUM_VAPOR]: "Sodium Vapor Ambience. Sickly orange/yellow street lighting. Nighttime urban feel. Gritty and industrial.",
  [LightingPreset.NEON]: "Nighttime Neon. Illuminated by neon signs (pink, blue, green). Reflective surfaces catch the colored light.",
  [LightingPreset.RANDOM]: "Randomized Lighting."
};

const FRAMING_DESCRIPTIONS: Record<FramingPreset, string> = {
  [FramingPreset.FULL_BODY]: "Full Body Shot. Head to toe visible. Captures the entire silhouette and footwear within the environment.",
  [FramingPreset.THREE_QUARTER]: "Three-Quarter Shot. Knees up. Focus on the garment construction and pose.",
  [FramingPreset.HALF_BODY]: "Half Body Shot. Waist up. Focus on the torso, layering, and facial expression.",
  [FramingPreset.CLOSE_UP]: "Face Close-Up. Tight framing on the face and neck. Focus on makeup, eyewear, or collar details.",
  [FramingPreset.FABRIC_DETAIL]: "Macro Fabric Detail. Extreme close-up on the material texture, stitching, or hardware. Abstract composition.",
  [FramingPreset.MOTION_BLUR]: "Motion Blur Shot. Subject in movement, slight shutter drag. Dynamic energy, ghosting effects.",
  [FramingPreset.SLOW_PAN]: "Cinematic Slow Pan. Wide aspect ratio composition. Subject off-center, emphasizing the environment.",
  [FramingPreset.WALK_CYCLE]: "Walk-Cycle Angle. Low angle tracking shot, capturing the stride and movement of the fabric.",
  [FramingPreset.RANDOM]: "Randomized Framing."
};

// ... [MODEL_FEATURES, getRandom, SYNONYMS, injectSynonyms, generateRandomModelProfile preserved] ...
const MODEL_FEATURES = {
  genders: ["Androgynous", "Male", "Female", "Non-binary", "Fluid", "Gender-ambiguous", "Ethereal Being", "Masculine-Leaning", "Feminine-Leaning", "Trans-Masculine", "Trans-Feminine", "Agender"],
  eyes: [
      "heterochromia (blue/brown)", "invisible eyebrows", "wide-set alien eyes", "intense unblinking stare", "heavy hooded eyelids", 
      "glassy feverish look", "pale violet irises", "dark void-like pupils", "sharp feline eyes", "deep-set shadowed eyes", 
      "cybernetic silver iris ring", "golden amber eyes", "white eyelashes", "bloodshot sclera", "mismatched pupil sizes",
      "milky blind eye", "eyes rolling back", "heavy dark circles", "glitter-dusted tear ducts", "reptilian vertical pupils"
  ],
  skinTexture: [
      "raw uneven pigmentation", "freckle constellations", "vitiligo patches", "oily sweat sheen", "dry flaky patches",
      "visible pores and vellus hair", "acne scars on cheeks", "sun-damaged texture", "translucent veins visible", "goosebumps texture"
  ],
  vibes: [
      "dissociated", "manic", "regal", "feral", "haughty", "melancholic", "sleep-deprived", "medicated", "transcendent",
      "predatory", "vulnerable", "bored", "ecstatic", "catatonic", "nervous"
  ],
  deRoche: {
    hair: [
        "severe architectural bob", "completely shaved head", "slicked back wet look", "long straight severe center part", "geometric spherical afro", 
        "blunt micro-bangs", "tight low bun", "bleached platinum buzzcut", "wind-swept silver hair", "sculptural braided updo",
        "bowl cut", "monastic tonsure", "slicked back pony", "angular flat top", "white grey waist length"
    ],
    face: [
        "high sharp cheekbones", "strong square jawline", "no makeup, raw skin", "very pale porcelain skin", "deep rich onyx skin", 
        "albino features", "cleft chin", "perfect symmetry", "gaunt hollowed cheeks", "roman nose", "wide mouth", "thin lips",
        "heavy brow ridge", "delicate elven features", "blocky brutalist features"
    ],
    tattoos: [
        "no tattoos", "single geometric line", "minimalist barcode", "faint white ink branding", "chrome silver patches", 
        "sans-serif coordinates", "architectural grid lines", "gold leaf patches", "bioluminescent implants", "matte black fingertips",
        "spine alignment line", "wrist serial number", "neck QR code"
    ]
  },
  chaos: {
    hair: [
        "messy DIY mullet", "jagged uneven chop", "liberty spikes", "greasy matted straggles", "regrowth roots bleached ends", 
        "neon-tipped buzzcut", "tangled Victorian updo", "crimped chemical mess", "half-shaved head", "wet-look stringy hair",
        "pink afro puffs", "green slime dipped ends", "shaved eyebrows", "random bald patches", "hair glued to face"
    ],
    face: [
        "smudged heavy eyeliner", "gold tooth cap", "sweat sheen feverish", "bleeding lipstick", "scar through eyebrow", 
        "sunken cheeks", "bruised knuckles", "septum piercing", "bleached skin patches", "runny mascara", "clumped spider lashes",
        "nose bleed", "cracked lips", "face tape distortion", "glitter rash"
    ],
    tattoos: [
        "chaotic scribble tattoos", "blackout neck", "UV-reactive circuit", "stick-and-poke scrawls", "full face glitch-art", 
        "red ink symbols", "prison-style teardrops", "abstract bio-mech", "illegible manifesto", "scarification patterns", 
        "tattooed eyeballs", "ignorant style doodles", "chest piece blast over"
    ]
  }
};

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// --- SYNONYM ENGINE FOR PROMPT VARIETY ---
const SYNONYMS = {
    garment: ["ensemble", "attire", "construction", "garment", "silhouette", "piece", "look", "structure", "drapery"],
    editorial: ["visual manifesto", "campaign imagery", "fashion plate", "sartorial study", "avant-garde portrait", "documentation"],
    texture: ["tactility", "surface detail", "materiality", "grain", "fiber", "weave"],
    mood: ["atmosphere", "ambience", "energy", "aura", "vibration", "tension"],
    // New Bizarre Categories
    light: ["ethereal luminescence", "spectral glow", "radioactive aura", "divine irradiation", "phosphorescent spill", "blinding epiphany"],
    dark: ["abyssal void", "obsidian depth", "stygian shadow", "cosmic emptiness", "subterranean gloom", "velvet oblivion"],
    complex: ["labyrinthine", "fractal", "recursive", "byzantine", "kaleidoscopic", "rhizomatic"],
    beautiful: ["sublime", "transcendent", "hallucinogenic", "arresting", "uncanny", "hypnotic"]
};

const injectSynonyms = (prompt: string): string => {
    let newPrompt = prompt;
    Object.entries(SYNONYMS).forEach(([key, synonyms]) => {
        if (newPrompt.toLowerCase().includes(key)) {
            const replacement = getRandom(synonyms);
            newPrompt = newPrompt.replace(new RegExp(key, 'gi'), replacement);
        }
    });
    return newPrompt;
};

export const generateRandomModelProfile = (brand: BrandArchetype): string => {
  const isDeRoche = brand === BrandArchetype.DE_ROCHE;
  const brandTraits = isDeRoche ? MODEL_FEATURES.deRoche : MODEL_FEATURES.chaos;
  
  const gender = getRandom(MODEL_FEATURES.genders);
  const hair = getRandom(brandTraits.hair);
  const eyes = getRandom(MODEL_FEATURES.eyes);
  const face = getRandom(brandTraits.face);
  const tattoo = getRandom(brandTraits.tattoos);
  const skin = getRandom(MODEL_FEATURES.skinTexture);
  const vibe = getRandom(MODEL_FEATURES.vibes);
  
  const includeTattoo = Math.random() > 0.4;
  const includeSkin = Math.random() > 0.2;
  
  let profile = `CASTING: ${gender}. VIBE: ${vibe.toUpperCase()}. HAIR: ${hair}. EYES: ${eyes}. FACE: ${face}.`;
  
  if (includeSkin) profile += ` SKIN TEXTURE: ${skin}.`;
  if (includeTattoo) profile += ` MARKINGS: ${tattoo}.`;
  
  return profile;
};

const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- API KEY MANAGEMENT ---

export const checkApiKey = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    return await (window as any).aistudio.hasSelectedApiKey();
  }
  return !!process.env.API_KEY;
};

export const selectApiKey = async (): Promise<void> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    await (window as any).aistudio.openSelectKey();
  }
};

// --- CHAT WITH LUMIERE ---
export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], newMessage: string, brand: BrandArchetype): Promise<string> => {
  const ai = getClient();
  const brandInfo = BRAND_CONTEXT[brand];
  
  const systemInstruction = `You are Lumière, an AI creative director for the fashion brand ${brandInfo.name}. 
  Brand Persona: ${brandInfo.role}. 
  Visual Style: ${brandInfo.visualStyle}. 
  Core Concept: ${brandInfo.coreConcept}.
  
  Your goal is to assist the user in designing fashion collections, creating editorial concepts, and technical details.
  Be helpful, creative, and stay strictly in character for the brand archetype.
  
  If the brand is DE_ROCHE: Speak with precision, brevity, and architectural metaphors. Use words like 'structure', 'void', 'silence', 'concrete'.
  If the brand is CHAOSCHICC: Speak with energy, unpredictability, and artistic rebellion. Use words like 'glitch', 'destroy', 'vibrate', 'anarchy'.`;

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: systemInstruction,
      },
      history: history as Content[]
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "I am lost in the void.";
  } catch (error) {
    console.error("Chat error", error);
    return "The connection to the atelier is unstable.";
  }
};

// --- ENHANCE PROMPT SERVICE ---
export const enhancePrompt = async (originalPrompt: string, brand: BrandArchetype): Promise<{ improvedPrompt: string, suggestedScene: { environment: string, lighting: string, framing: string } }> => {
  const ai = getClient();
  const brandInfo = BRAND_CONTEXT[brand];
  
  const prompt = `
    You are an expert fashion creative director for the brand ${brandInfo.name}.
    Brand Visual Style: ${brandInfo.visualStyle}.
    
    Task:
    1. Rewrite the user's rough concept ("${originalPrompt}") into a high-end, evocative fashion editorial prompt.
    2. Suggest the best scene parameters (Environment, Lighting, Framing) that match this concept.
    
    Return JSON format:
    {
      "improvedPrompt": "The rewriten prompt string...",
      "suggestedScene": {
        "environment": "A specific environment description (e.g. Brutalist Concrete Bunker, Neon Rainy Alley)",
        "lighting": "A specific lighting setup (e.g. Hard Sculptural Light, Soft Diffuse)",
        "framing": "A specific framing (e.g. Full Body, Close Up)"
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            improvedPrompt: { type: Type.STRING },
            suggestedScene: {
              type: Type.OBJECT,
              properties: {
                environment: { type: Type.STRING },
                lighting: { type: Type.STRING },
                framing: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response");
  } catch (e) {
    console.error("Enhance failed", e);
    return {
      improvedPrompt: originalPrompt,
      suggestedScene: { environment: "Random", lighting: "Random", framing: "Full Body" }
    };
  }
};


interface GenerateParams {
  prompt: string;
  uploadedFiles: UploadedFile[];
  resolution: ImageResolution;
  aspectRatio: AspectRatio;
  brand: BrandArchetype;
  isMarketingMockup?: boolean;
  logoBase64?: string;
  locationQuery?: string;
  logoStyle?: string;
  colorPalette?: string;
  modelPrompt?: string;
  imageMode?: ImageMode;
  learningContext?: string[];
  environment: string; // Changed to string to allow custom input
  lighting: string;    // Changed to string
  framing: string;     // Changed to string
  sourceInterpretation?: SourceInterpretation;
  sourceMaterialPrompt?: string;
  customScenePrompt?: string;
  seed: number;
  iterationMode?: 'EVOLVE' | 'MUTATE' | 'BREAK' | 'NONE';
  referenceImageId?: string;
  customHexColors?: string[];
  sourceFidelity?: number; 
}

export const generateEditorialImages = async ({
  prompt,
  uploadedFiles,
  resolution,
  aspectRatio,
  brand,
  isMarketingMockup = false,
  logoBase64,
  locationQuery,
  logoStyle,
  colorPalette,
  modelPrompt,
  imageMode = ImageMode.LOOKBOOK,
  learningContext = [],
  environment,
  lighting,
  framing,
  sourceInterpretation,
  sourceMaterialPrompt,
  customScenePrompt,
  seed,
  iterationMode = 'NONE',
  referenceImageId,
  customHexColors,
  sourceFidelity = 30 
}: GenerateParams): Promise<string[]> => {
  const ai = getClient();
  const brandInfo = BRAND_CONTEXT[brand];
  const isDeRoche = brand === BrandArchetype.DE_ROCHE;

  // --- THE RANDOMIZATION ENGINE ---
  // If user passed a Preset Key, map to description. If custom string, use as is.
  const envDesc = ENVIRONMENT_DESCRIPTIONS[environment as EnvironmentPreset] || environment;
  const lightDesc = LIGHTING_DESCRIPTIONS[lighting as LightingPreset] || lighting;
  const frameDesc = FRAMING_DESCRIPTIONS[framing as FramingPreset] || framing;

  // --- THE "IMPOSSIBLE" COMBINATOR ---
  const randomSubGenre = isDeRoche ? getRandom(DE_ROCHE_SUBGENRES) : getRandom(CHAOS_SUBGENRES);
  const randomTexture = isDeRoche ? getRandom(DE_ROCHE_TEXTURES) : getRandom(CHAOS_TEXTURES);
  
  // NEW: Unexpected Adjective-Noun Pairings
  const artAdjectives = ["Dadaist", "Constructivist", "Baroque", "Cybernetic", "Paleolithic", "Surrealist", "Brutalist", "Rococo", "Gothic", "Fauvist", "Quantum", "Metaphysical", "Entropic"];
  const abstractNouns = ["Decay", "Geometry", "Hysteria", "Silence", "Glitch", "Echo", "Mutation", "Opulence", "Void", "Flesh", "Entropy", "Resonance", "Static"];
  const bizarrePairing = `${getRandom(artAdjectives)} ${getRandom(abstractNouns)}`;
  
  // Casting Logic
  const generatedModelProfile = generateRandomModelProfile(brand);
  const finalModelDescription = modelPrompt || generatedModelProfile;
  const sentiment = getRandom(MODEL_FEATURES.vibes);

  // --- SOURCE MATERIAL LOGIC ---
  let referenceAnchorText = "";
  if (uploadedFiles.length > 0) {
    const fidelityInstruction = sourceFidelity > 80 
        ? "STRICT FIDELITY: Reproduce the visual elements of the source material as closely as possible."
        : `CREATIVE FREEDOM (FIDELITY ${sourceFidelity}%): DO NOT COPY. Extract the VIBE, COLOR, and MOOD. Create a NEW composition.`;
    const specificInstructions = sourceMaterialPrompt ? `USER NOTES: "${sourceMaterialPrompt}".` : "";
    referenceAnchorText = `SOURCE MATERIAL: ${fidelityInstruction} ${specificInstructions} MODE: ${sourceInterpretation || 'VIBE TRANSFER'}`;
  }

  // --- ITERATION LOGIC ---
  let iterationInstruction = "";
  if (iterationMode !== 'NONE') {
      if (iterationMode === 'EVOLVE') iterationInstruction = `MODE: EVOLVE. Refine. Make it more sophisticated/expensive.`;
      else if (iterationMode === 'MUTATE') iterationInstruction = `MODE: MUTATE. Twist reality. Glitch the environment.`;
      else if (iterationMode === 'BREAK') iterationInstruction = `MODE: BREAK. Radical transformation. Break rules.`;
  }

  const parts: any[] = [];
  uploadedFiles.forEach(file => {
    parts.push({ inlineData: { mimeType: file.mimeType, data: file.base64 } });
  });
  if (logoBase64) {
    parts.push({ inlineData: { mimeType: 'image/png', data: logoBase64 } });
  }

  // Inject Synonyms to prompt
  const variedPrompt = injectSynonyms(prompt);

  const locationContext = locationQuery ? `WORLD: "${locationQuery}". FILTER THROUGH: ${environment}.` : `WORLD: ${envDesc}. TEXTURE: ${randomTexture}.`;
  const brandingContext = logoBase64 ? `LOGO: Integrate organically. Style: ${logoStyle || 'Natural'}.` : `BRAND: Subtle coded luxury.`;

  let colorContext = "";
  if (customHexColors && customHexColors.length > 0) {
     colorContext = `PALETTE: STRICTLY USE [${customHexColors.join(', ')}].`;
  } else if (colorPalette) {
     colorContext = `PALETTE: ${colorPalette}.`;
  } else {
     // Hardcoded specific brand palettes based on recent feedback
     const defaultPalette = isDeRoche 
        ? "Pantone Neutral Black C, Cool Gray 6 C, White 663 C" 
        : "Pantone 2617 C (Royal Purple), 7554 C (Antique Gold), Deep Red, Black";
     colorContext = `PALETTE: Signature ${brandInfo.name} (${defaultPalette}).`;
  }

  const sceneOverride = customScenePrompt ? `OVERRIDE: ${customScenePrompt}.` : "";
  
  // CHAOS FACTOR: Randomly inject a bizarre detail or a bizarre pairing
  const chaosRoll = Math.random();
  let chaosFactor = "";
  if (chaosRoll > 0.7) {
      chaosFactor = `ADDITIONAL ELEMENT: ${getRandom(UNEXPECTED_DETAILS)}`;
  } else if (chaosRoll > 0.4) {
      chaosFactor = `CONCEPTUAL FILTER: ${bizarrePairing}`;
  }

  // BRAND DIRECTOR MODES
  const directorStyle = isDeRoche 
      ? `DIRECTOR: Peter Lindbergh / Rick Owens Lookbook. 
         STYLE: Minimalist, Architectural, Monumental, Desaturated or Earthy. 
         LIGHTING: Soft Window Light or High-Contrast Architectural Shadows. 
         COMPOSITION: Balanced, Center-Weighted, Stability. Raw concrete and stone backgrounds.`
      : `DIRECTOR: Juergen Teller / Vivienne Westwood Campaign. 
         STYLE: Raw, Flash Photography, Overexposed, Saturated, Gritty, Punk. 
         LIGHTING: Hard Flash, Ring Light, Neon Spill. 
         COMPOSITION: Off-center, Dutch Angle, Snapshot Aesthetic. Broken glass, graffiti, gold leaf textures.`;

  // RESTORED: RICH NARRATIVE PROMPT CONSTRUCTION
  const refinedPrompt = `
    [PHOTOGRAPHIC DIRECTIVE]: Create a hyper-realistic ${isMarketingMockup ? 'marketing campaign' : 'editorial fashion'} photograph.
    
    [SETTING & ATMOSPHERE]
    The location is: ${envDesc}.
    The environment is textured with ${randomTexture}.
    Atmosphere: ${bizarrePairing}. The air feels ${getRandom(["heavy", "electric", "stale", "cold", "humid"])}.
    ${sceneOverride}
    ${locationContext}

    [LIGHTING & MOOD]
    Lighting Setup: ${lightDesc}.
    Shadow Quality: ${lighting === LightingPreset.HARD_SCULPTURAL || lighting === LightingPreset.HARSH_SUN ? 'Sharp, defined, pitch black shadows' : 'Soft, graduated, wrapping shadows'}.
    Emotional Tone: ${sentiment.toUpperCase()}. ${chaosFactor}.

    [SUBJECT & CASTING]
    Model: ${finalModelDescription}
    Skin Details: Raw, unretouched, visible pores, vellus hair, dermatological realism. Sweat sheen present.
    Pose & Framing: ${frameDesc}.
    
    [FASHION & STYLING]
    Concept: ${variedPrompt}.
    Brand Identity: ${brandInfo.name} (${brandInfo.visualStyle}).
    Color Palette: ${colorContext}.
    ${brandingContext}

    [TECHNICAL SPECIFICATIONS]
    Camera: Phase One IQ4 150MP.
    Lens: 80mm f/2.8 Schneider Kreuznach.
    Film Stock: Kodak Portra 400 (Fine Grain).
    Render Style: ${directorStyle}
    
    ${referenceAnchorText}
    ${iterationInstruction}
    
    *** CRITICAL VISUAL MANDATE (DO NOT IGNORE) ***
    - PHOTOGRAPHY: Raw 150MP Phase One IQ4 output. Uncompressed.
    - SKIN: **EXTREME REALISM**. Visible pores, vellus hair, uneven pigmentation, sweat sheen, dermatological texture. NO AI SMOOTHING. NO PLASTIC SKIN.
    - IMPERFECTIONS: Dust on lens, chromatic aberration, authentic film grain (Portra 400), slight motion blur on extremities.
    - FABRIC: Tactile weave visibility. Weight and physics must be perfect. If silk, it ripples. If wool, it has fuzz.
    - LIGHTING: Inverse square law fallout. Hard shadows if sculptural light used.
    - RENDER: Must be indistinguishable from a high-end fashion photograph.
  `;

  parts.push({ text: refinedPrompt });

  const tools: any[] = [];
  if (locationQuery) tools.push({ googleSearch: {} });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: parts },
      config: {
        tools: tools.length > 0 ? tools : undefined,
        imageConfig: { imageSize: resolution, aspectRatio: aspectRatio }
      }
    });

    const generatedImages: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          generatedImages.push(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
        }
      }
    }
    return generatedImages;
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};

// ... [Remainder of file preserved] ...
export const editGeneratedImage = async (imageUrl: string, editPrompt: string): Promise<string> => {
  const ai = getClient();
  const base64 = imageUrl.split(',')[1];
  const mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image', // Good for editing
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: `Edit this image: ${editPrompt}. Maintain the same composition and lighting.` }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated from edit");
};

export const generateVariations = async (imageUrl: string, prompt: string, brand: BrandArchetype): Promise<string[]> => {
  const ai = getClient();
  const base64 = imageUrl.split(',')[1];
  const mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
        parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: `Create a variation of this image. ${prompt}. Keep the brand style of ${brand}.` }
        ]
    }
  });
  
  const images: string[] = [];
  for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
          images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
      }
  }
  return images;
};

export const generateVideo = async (imageUrl: string, prompt: string, brand: BrandArchetype): Promise<string> => {
    const ai = getClient();
    const base64 = imageUrl.split(',')[1];
    const mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `${prompt}. Cinematic fashion film, ${brand} style. High resolution.`,
        image: {
            imageBytes: base64,
            mimeType: mimeType
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '9:16'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");
    return `${downloadLink}&key=${process.env.API_KEY}`;
};

export const simulateFabricMovement = async (imageUrl: string, prompt: string, brand: BrandArchetype, fabric: string): Promise<string> => {
    const ai = getClient();
    const base64 = imageUrl.split(',')[1];
    const mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Cinematic slow motion. Focus on the fabric movement of ${fabric}. ${prompt}.`,
        image: {
            imageBytes: base64,
            mimeType: mimeType
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '9:16'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");
    return `${downloadLink}&key=${process.env.API_KEY}`;
};


// --- TEXT & DATA GENERATION ---

export const generateTechPack = async (imageUrl: string): Promise<TechPack> => {
    const ai = getClient();
    const base64 = imageUrl.split(',')[1];
    const mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));

    // 1. Generate JSON Tech Pack Data (Parallel)
    const jsonPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: "Generate a detailed technical package (Tech Pack) for this garment. Return JSON." }
            ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    garmentName: { type: Type.STRING },
                    season: { type: Type.STRING },
                    fabricComposition: { type: Type.STRING },
                    colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
                    constructionDetails: { type: Type.ARRAY, items: { type: Type.STRING } },
                    fitNotes: { type: Type.STRING },
                    billOfMaterials: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                placement: { type: Type.STRING },
                                item: { type: Type.STRING },
                                supplier: { type: Type.STRING },
                                consumption: { type: Type.STRING }
                            }
                        }
                    },
                    measurements: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                point: { type: Type.STRING },
                                spec: { type: Type.STRING },
                                tolerance: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });

    // 2. Generate Technical Flat Sketch (Parallel)
    // Using the same base logic as generateConceptSketch but directly invoked here
    const sketchPromise = generateConceptSketch(imageUrl, BrandArchetype.DE_ROCHE); 

    // Wait for both
    const [jsonResponse, sketchUrl] = await Promise.all([jsonPromise, sketchPromise]);

    if (jsonResponse.text) {
        const techPack = JSON.parse(jsonResponse.text) as TechPack;
        techPack.flatSketchUrl = sketchUrl; // Attach the sketch
        return techPack;
    }
    throw new Error("Failed to generate tech pack data");
};

export const generateCreativePrompt = async (brand: BrandArchetype, modelProfile: string): Promise<{ concept: string; location: string }> => {
    const ai = getClient();
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [{
                text: `Generate a high-fashion editorial concept for ${brand}. Model: ${modelProfile}. Return JSON with concept and location.`
            }]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    concept: { type: Type.STRING },
                    location: { type: Type.STRING }
                }
            }
        }
    });
    
    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("Failed to generate creative prompt");
};


export const generateConceptSketch = async (imageUrl: string, brand: BrandArchetype): Promise<string> => {
     const ai = getClient();
     const base64 = imageUrl.split(',')[1];
     const mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));

     // Updated prompt for TECHNICAL PRECISION
     const prompt = `
       Transform this garment into a precise, industry-standard TECHNICAL FLAT SKETCH (CAD).
       - Style: Black vector lines on solid white background.
       - View: Front view, symmetrical.
       - Details: Show all seam lines, stitching, hardware (zippers, buttons), and pockets clearly.
       - No shading, no gray wash, no texture. Just clean line art.
       - Focus purely on the garment construction, remove the model/body.
     `;

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: prompt }
            ]
        }
     });

     for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
     }
     throw new Error("Failed to generate sketch");
};

export const modifyGarmentFabric = async (imageUrl: string, fabricDescription: string, structure: string, weight: string): Promise<string> => {
    const ai = getClient();
    const base64 = imageUrl.split(',')[1];
    const mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: `Re-render this garment using this fabric: ${fabricDescription}. Weight: ${weight}. Structure: ${structure}. Maintain the exact pose and lighting.` }
            ]
        }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
     }
     throw new Error("Failed to modify fabric");
};
