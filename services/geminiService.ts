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

// --- TEXTURE & GENRE LISTS (Shortened for brevity but preserved logic) ---
const DE_ROCHE_SUBGENRES = ["Eco-Brutalism", "Metabolist Architecture", "Soviet Gigantism", "Bunker Archaeology", "Monolithic Zen", "High-Tech Industrialism"];
const DE_ROCHE_TEXTURES = ["Weathered travertine", "Frosted aerospace glass", "Raw felt", "Oxidized copper", "Wet slate", "Volcanic ash", "Chiseled granite", "Translucent resin", "Ramie fabric", "Scorched timber"];
const CHAOS_SUBGENRES = ["Neo-Expressionism", "Glitch Baroque", "Industrial Trash", "Cyber-Rot", "Vandalized Rococo", "Francis Bacon's Glass Cages", "Acid Rave", "Flesh & Metal"];
const CHAOS_TEXTURES = ["Burnt velvet", "Spray-painted lace", "Cracked mirrors", "Oil slick on asphalt", "Ripped billboard paper", "Rusted chainmail", "Melting plastic", "Blood-stained silk", "Duct tape patchwork"];

const UNEXPECTED_DETAILS = [
  "A floating geometric shape in the background", "The floor is covered in water", "Strange wires hanging from the ceiling",
  "A classic oil painting melting on the wall", "Thick smoke crawling on the floor", "Shadows that don't match the subject",
  "Red laser lines cutting across the frame", "An unexpected animal (a crow, a wolf, a sphinx cat)", "Inverted gravity elements", "Digital glitch artifacts in the air"
];

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

const MODEL_FEATURES = {
  genders: ["Androgynous", "Male", "Female", "Non-binary", "Fluid", "Gender-ambiguous", "Ethereal Being", "Masculine-Leaning", "Feminine-Leaning"],
  eyes: ["heterochromia", "invisible eyebrows", "wide-set alien eyes", "intense unblinking stare", "heavy hooded eyelids", "glassy feverish look"],
  skinTexture: ["raw uneven pigmentation", "freckle constellations", "vitiligo patches", "oily sweat sheen", "dry flaky patches", "visible pores"],
  vibes: ["dissociated", "manic", "regal", "feral", "haughty", "melancholic", "sleep-deprived", "transcendent"],
  deRoche: {
    hair: ["severe architectural bob", "completely shaved head", "slicked back wet look", "long straight severe center part", "geometric spherical afro"],
    face: ["high sharp cheekbones", "strong square jawline", "no makeup, raw skin", "very pale porcelain skin", "deep rich onyx skin"],
    tattoos: ["no tattoos", "single geometric line", "minimalist barcode", "faint white ink branding", "chrome silver patches"]
  },
  chaos: {
    hair: ["messy DIY mullet", "jagged uneven chop", "liberty spikes", "greasy matted straggles", "regrowth roots bleached ends"],
    face: ["smudged heavy eyeliner", "gold tooth cap", "sweat sheen feverish", "bleeding lipstick", "scar through eyebrow"],
    tattoos: ["chaotic scribble tattoos", "blackout neck", "UV-reactive circuit", "stick-and-poke scrawls", "full face glitch-art"]
  }
};

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const SYNONYMS = {
    garment: ["ensemble", "attire", "construction", "garment", "silhouette", "piece", "look"],
    editorial: ["visual manifesto", "campaign imagery", "fashion plate", "sartorial study"],
    texture: ["tactility", "surface detail", "materiality", "grain"],
    mood: ["atmosphere", "ambience", "energy", "aura", "tension"]
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
  return `CASTING: ${getRandom(MODEL_FEATURES.genders)}. VIBE: ${getRandom(MODEL_FEATURES.vibes)}. HAIR: ${getRandom(brandTraits.hair)}. FACE: ${getRandom(brandTraits.face)}.`;
};

const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- UTILS: BLOB URL MANAGEMENT ---
// Reduces memory pressure by using Blob URLs instead of Base64 strings.

const base64ToBlobUrl = (base64Data: string, mimeType: string = 'image/png'): string => {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
};

const getBase64FromUrl = async (url: string): Promise<{ base64: string, mimeType: string }> => {
  if (url.startsWith('data:')) {
    const base64 = url.split(',')[1];
    const mimeType = url.substring(url.indexOf(':') + 1, url.indexOf(';'));
    return { base64, mimeType };
  }
  // Assume Blob URL or Remote URL
  const response = await fetch(url);
  const blob = await response.blob();
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1];
      resolve({ base64, mimeType: blob.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

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

export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], newMessage: string, brand: BrandArchetype): Promise<string> => {
  const ai = getClient();
  const brandInfo = BRAND_CONTEXT[brand];
  
  const systemInstruction = `You are Lumière, an AI creative director for the fashion brand ${brandInfo.name}. 
  Brand Persona: ${brandInfo.role}. 
  Your goal is to assist the user in designing fashion collections.
  If the brand is DE_ROCHE: Speak with precision, brevity, and architectural metaphors.
  If the brand is CHAOSCHICC: Speak with energy, unpredictability, and artistic rebellion.`;

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction },
      history: history as Content[]
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "I am lost in the void.";
  } catch (error) {
    console.error("Chat error", error);
    return "The connection to the atelier is unstable.";
  }
};

export const enhancePrompt = async (originalPrompt: string, brand: BrandArchetype): Promise<{ improvedPrompt: string, suggestedScene: { environment: string, lighting: string, framing: string } }> => {
  const ai = getClient();
  const brandInfo = BRAND_CONTEXT[brand];
  
  const prompt = `
    You are an expert fashion creative director for ${brandInfo.name}.
    Rewrite the user's concept ("${originalPrompt}") into a high-end fashion editorial prompt.
    Suggest scene parameters (Environment, Lighting, Framing).
    Return JSON: { "improvedPrompt": "...", "suggestedScene": { "environment": "...", "lighting": "...", "framing": "..." } }
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
              properties: { environment: { type: Type.STRING }, lighting: { type: Type.STRING }, framing: { type: Type.STRING } }
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
    return { improvedPrompt: originalPrompt, suggestedScene: { environment: "Random", lighting: "Random", framing: "Full Body" } };
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
  environment: string; 
  lighting: string;    
  framing: string;     
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
  learningContext = [],
  environment,
  lighting,
  framing,
  sourceInterpretation,
  sourceMaterialPrompt,
  customScenePrompt,
  iterationMode = 'NONE',
  customHexColors,
  sourceFidelity = 30 
}: GenerateParams): Promise<string[]> => {
  const ai = getClient();
  const brandInfo = BRAND_CONTEXT[brand];
  const isDeRoche = brand === BrandArchetype.DE_ROCHE;

  const envDesc = ENVIRONMENT_DESCRIPTIONS[environment as EnvironmentPreset] || environment;
  const lightDesc = LIGHTING_DESCRIPTIONS[lighting as LightingPreset] || lighting;
  const frameDesc = FRAMING_DESCRIPTIONS[framing as FramingPreset] || framing;

  const randomTexture = isDeRoche ? getRandom(DE_ROCHE_TEXTURES) : getRandom(CHAOS_TEXTURES);
  const artAdjectives = ["Dadaist", "Constructivist", "Baroque", "Cybernetic", "Paleolithic", "Surrealist", "Brutalist"];
  const abstractNouns = ["Decay", "Geometry", "Hysteria", "Silence", "Glitch", "Echo", "Mutation"];
  const bizarrePairing = `${getRandom(artAdjectives)} ${getRandom(abstractNouns)}`;
  
  const finalModelDescription = modelPrompt || generateRandomModelProfile(brand);
  const sentiment = getRandom(MODEL_FEATURES.vibes);

  let referenceAnchorText = "";
  if (uploadedFiles.length > 0) {
    const fidelityInstruction = sourceFidelity > 80 
        ? "STRICT FIDELITY: Reproduce visual elements closely."
        : `CREATIVE FREEDOM (FIDELITY ${sourceFidelity}%): Extract the VIBE.`;
    const specificInstructions = sourceMaterialPrompt ? `USER NOTES: "${sourceMaterialPrompt}".` : "";
    referenceAnchorText = `SOURCE MATERIAL: ${fidelityInstruction} ${specificInstructions} MODE: ${sourceInterpretation || 'VIBE TRANSFER'}`;
  }

  let iterationInstruction = "";
  if (iterationMode !== 'NONE') {
      iterationInstruction = `MODE: ${iterationMode}. Refine, Mutate, or Break the concept based on this directive.`;
  }

  let learningInstruction = "";
  if (learningContext && learningContext.length > 0) {
      learningInstruction = `[INTELLIGENT REFINEMENT]: Incorporate: ${learningContext.slice(-3).join('; ')}`;
  }

  const parts: any[] = [];
  uploadedFiles.forEach(file => {
    parts.push({ inlineData: { mimeType: file.mimeType, data: file.base64 } });
  });
  if (logoBase64) {
    parts.push({ inlineData: { mimeType: 'image/png', data: logoBase64 } });
  }

  const variedPrompt = injectSynonyms(prompt);
  const locationContext = locationQuery ? `WORLD: "${locationQuery}". FILTER THROUGH: ${environment}.` : `WORLD: ${envDesc}. TEXTURE: ${randomTexture}.`;
  
  let colorContext = colorPalette ? `PALETTE: ${colorPalette}.` : `PALETTE: Signature ${brandInfo.name}.`;
  if (customHexColors && customHexColors.length > 0) colorContext = `PALETTE: STRICTLY USE [${customHexColors.join(', ')}].`;

  const chaosFactor = Math.random() > 0.4 ? `CONCEPTUAL FILTER: ${bizarrePairing}` : "";

  const refinedPrompt = `
    [PHOTOGRAPHIC DIRECTIVE]: Create a hyper-realistic ${isMarketingMockup ? 'marketing campaign' : 'editorial fashion'} photograph.
    
    [SETTING] ${envDesc}. Texture: ${randomTexture}. Atmosphere: ${bizarrePairing}. ${customScenePrompt || ''}
    [LIGHTING] ${lightDesc}. Tone: ${sentiment.toUpperCase()}. ${chaosFactor}.
    [SUBJECT] ${finalModelDescription}
    [FASHION] Concept: ${variedPrompt}. Brand: ${brandInfo.name}. ${colorContext}.
    [TECH] Phase One IQ4 150MP. Kodak Portra 400.
    ${referenceAnchorText}
    ${iterationInstruction}
    ${learningInstruction}
    
    *** VISUAL MANDATE ***
    - PHOTOGRAPHY: Raw 150MP output.
    - SKIN: EXTREME REALISM. Visible pores, vellus hair, sweat. NO AI SMOOTHING.
    - IMPERFECTIONS: Chromatic aberration, film grain.
    - LIGHTING: Inverse square law fallout.
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
          // OPTIMIZATION: Convert Base64 directly to Blob URL
          const blobUrl = base64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType || 'image/png');
          generatedImages.push(blobUrl);
        }
      }
    }
    return generatedImages;
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};

export const editGeneratedImage = async (imageUrl: string, editPrompt: string): Promise<string> => {
  const ai = getClient();
  const { base64, mimeType } = await getBase64FromUrl(imageUrl);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image', 
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: `Edit this image: ${editPrompt}. Maintain the same composition and lighting.` }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.data) {
      return base64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType);
    }
  }
  throw new Error("No image generated from edit");
};

export const generateVariations = async (imageUrl: string, prompt: string, brand: BrandArchetype): Promise<string[]> => {
  const ai = getClient();
  const { base64, mimeType } = await getBase64FromUrl(imageUrl);
  
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
      if (part.inlineData && part.inlineData.data) {
          images.push(base64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType));
      }
  }
  return images;
};

export const generateVideo = async (imageUrl: string, prompt: string, brand: BrandArchetype): Promise<string> => {
    const ai = getClient();
    const { base64, mimeType } = await getBase64FromUrl(imageUrl);

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
    const { base64, mimeType } = await getBase64FromUrl(imageUrl);

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

export const generateConceptSketch = async (imageUrl: string, brand: BrandArchetype): Promise<string> => {
     const ai = getClient();
     const { base64, mimeType } = await getBase64FromUrl(imageUrl);

     const prompt = `
       Transform this garment into a precise, industry-standard TECHNICAL FLAT SKETCH (CAD).
       - Style: Black vector lines on solid white background.
       - View: Front view, symmetrical.
       - Details: Show all seam lines, stitching, hardware, pockets clearly.
       - No shading, no gray wash. Clean line art.
       - Focus purely on the garment construction.
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
        if (part.inlineData && part.inlineData.data) {
            return base64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType);
        }
     }
     throw new Error("Failed to generate sketch");
};

export const modifyGarmentFabric = async (imageUrl: string, fabricDescription: string, structure: string, weight: string): Promise<string> => {
    const ai = getClient();
    const { base64, mimeType } = await getBase64FromUrl(imageUrl);

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
        if (part.inlineData && part.inlineData.data) {
            return base64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType);
        }
     }
     throw new Error("Failed to modify fabric");
};

export const generateTechPack = async (imageUrl: string): Promise<TechPack> => {
    const ai = getClient();
    const { base64, mimeType } = await getBase64FromUrl(imageUrl);

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

    const sketchPromise = generateConceptSketch(imageUrl, BrandArchetype.DE_ROCHE); 
    const [jsonResponse, sketchUrl] = await Promise.all([jsonPromise, sketchPromise]);

    if (jsonResponse.text) {
        const techPack = JSON.parse(jsonResponse.text) as TechPack;
        techPack.flatSketchUrl = sketchUrl; 
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