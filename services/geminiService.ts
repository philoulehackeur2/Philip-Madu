
import { GoogleGenAI, Type, Content, Part } from "@google/genai";
import { ImageResolution, AspectRatio, UploadedFile, BrandArchetype, MarketingStrategy, TechPack, ImageMode, EnvironmentPreset, LightingPreset, FramingPreset, SourceInterpretation, ModelPreset, CollectionLook, PatternMetric, GenerationParams } from "../types";
import { constructEvolutionaryPrompt as _constructEvolutionaryPrompt } from './mutationEngine';
import { generateMarketingStrategy as _generateMarketingStrategy, groundPromptWithSearch as _groundPromptWithSearch, BRAND_CONTEXT } from './strategicIntelligence';

// RE-EXPORT for App.tsx compatibility
export const constructEvolutionaryPrompt = _constructEvolutionaryPrompt;
export const generateMarketingStrategy = _generateMarketingStrategy;
export const groundPromptWithSearch = _groundPromptWithSearch;

// --- VTON MEGA PROMPT TEMPLATE ---
const VTON_PROMPT_TEMPLATE = `
**ROLE:**
You are the **Vertex AI VTON Technologist**. Your goal is to generate the precise JSON parameters required to drive the Virtual Try-On API.

**INPUT DATA:**
* **User Request:** "{user_style_request}"
* **Garment Analysis:** (See Image 2)
* **Model Analysis:** (See Image 1)

**TASK:**
Analyze the inputs and generate the configurations.

**OUTPUT FORMAT (JSON ONLY):**
{
  "prompt": "A photorealistic high-fidelity shot of a [GENDER] model wearing [DETAILED_GARMENT_DESCRIPTION]. The model has [HAIR_COLOR] hair and [SKIN_TONE] skin. Lighting matches the original source. 8k resolution, highly detailed texture.",
  "subjectDescription": "A [GENDER] with [HAIR_STYLE], [BODY_TYPE], standing in [POSE_DESCRIPTION].",
  "negativePrompt": "deformed, blurry, cartoon, illustration, low quality, pixelated, extra limbs, distorted face, changing face, changing background",
  "guidanceScale": 60
}

**RULES:**
1. **Garment Accuracy:** The \`prompt\` must describe the garment using specific fashion terminology (e.g., instead of "red shirt," use "crimson silk chiffon blouse with bishop sleeves").
2. **Identity Lock:** The \`subjectDescription\` must strictly describe the physical attributes of the source model to reinforce the ID lock.
3. **Photography Style:** Always include "photorealistic, 8k, highly detailed".
`;

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
const CHAOS_SUBGENRES = ["Neo-Expressionism", "Glitch Baroque", "Industrial Trash", "Cyber-Rot", "Vandalized Rococo", "Francis Bacon's Cages", "Acid Rave", "Flesh & Metal"];
const CHAOS_TEXTURES = ["Burnt velvet", "Spray-painted lace", "Oil slick on asphalt", "Ripped billboard paper", "Rusted chainmail", "Melting plastic", "Blood-stained silk", "Duct tape patchwork"];

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
  [LightingPreset.NEON]: "Nighttime Neon. Illuminated by neon signs (pink, blue, green). Dark textures catch the colored light.",
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
  vibes: ["dissociated", "manic", "regal", "feral", "haughty", "melancholic", "sleep-deprived", "transcendent"],
  deRoche: {
    hair: ["severe architectural bob", "completely shaved head", "slicked back wet look", "long straight severe center part", "geometric spherical afro"],
    face: ["high sharp cheekbones", "strong square jawline", "no makeup, raw skin", "very pale porcelain skin", "deep rich onyx skin"]
  },
  chaos: {
    hair: ["messy DIY mullet", "jagged uneven chop", "liberty spikes", "greasy matted straggles", "regrowth roots bleached ends"],
    face: ["smudged heavy eyeliner", "gold tooth cap", "sweat sheen feverish", "bleeding lipstick", "scar through eyebrow"]
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

// Robust Base64 extraction with fallback for CORS/Auth issues
export const getBase64FromUrl = async (url: string): Promise<{ base64: string, mimeType: string }> => {
  if (!url) throw new Error("URL is empty");

  // 1. Data URL
  if (url.startsWith('data:')) {
    const base64 = url.split(',')[1];
    const mimeType = url.substring(url.indexOf(':') + 1, url.indexOf(';'));
    return { base64, mimeType };
  }

  // 2. Blob URL (Local)
  if (url.startsWith('blob:')) {
     try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Blob fetch failed');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve({ base64: reader.result.split(',')[1], mimeType: blob.type });
                } else {
                    reject(new Error("Failed to read blob"));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
     } catch (e) {
         console.warn("Blob fetch failed, falling back to image method", e);
     }
  }

  // 3. Remote URL - Try Fetch with CORS mode, fallback to Image
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) throw new Error(`Fetch failed with status: ${response.status}`);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1];
        resolve({ base64, mimeType: blob.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    console.warn("Standard fetch failed, attempting Image fallback for CORS/Cache:", error);
    
    // 4. Fallback: HTMLImageElement
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if(!ctx) { reject(new Error("Canvas context failed")); return; }
            try {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL("image/png");
                resolve({
                    base64: dataUrl.split(',')[1],
                    mimeType: 'image/png'
                });
            } catch (e) {
                reject(new Error("Image loaded but Canvas tainted. CORS restricted image."));
            }
        };
        img.onerror = () => reject(new Error(`Failed to load image resource (CORS/Network).`));
        img.src = url;
    });
  }
};

// --- VIRTUAL TRY-ON (VTON) MODULE ---

interface VTONParameters {
  prompt: string;
  subjectDescription: string;
  negativePrompt: string;
  guidanceScale: number;
}

export const generateVTONParameters = async (modelBase64: string, garmentBase64: string, userRequest: string): Promise<VTONParameters> => {
  const ai = getClient();
  const finalPrompt = VTON_PROMPT_TEMPLATE.replace("{user_style_request}", userRequest || "Create a high-fashion editorial");

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: modelBase64 } }, // Image 1 (Model)
        { inlineData: { mimeType: 'image/png', data: garmentBase64 } }, // Image 2 (Garment)
        { text: finalPrompt }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING },
          subjectDescription: { type: Type.STRING },
          negativePrompt: { type: Type.STRING },
          guidanceScale: { type: Type.NUMBER }
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as VTONParameters;
  }
  throw new Error("Failed to generate VTON parameters");
};

export const executeVirtualTryOn = async (modelUrl: string, garmentUrl: string, userRequest: string): Promise<string> => {
  const ai = getClient();
  
  // 1. Fetch Images
  const [modelImg, garmentImg] = await Promise.all([
    getBase64FromUrl(modelUrl),
    getBase64FromUrl(garmentUrl)
  ]);

  // 2. Generate Parameters (The "Technologist" Step)
  const vtonParams = await generateVTONParameters(modelImg.base64, garmentImg.base64, userRequest);

  // 3. Execute VTON Simulation (Using Gemini 1.5 Pro to proxy the Vertex Vision API behavior)
  // We use the strict parameters generated to guide the model.
  const simulationPrompt = `
    [VIRTUAL TRY-ON EXECUTION]
    ${vtonParams.subjectDescription}
    WEARING: ${vtonParams.prompt}
    
    SOURCE IMAGES PROVIDED:
    1. MODEL (Reference for Identity/Face/Pose)
    2. GARMENT (Reference for Texture/Style)
    
    MANDATE:
    - RETAIN the facial identity and bone structure of Image 1 EXACTLY.
    - APPLY the garment from Image 2 onto the model in Image 1.
    - High fidelity, 8k resolution.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview', // High fidelity model for VTON
    contents: {
      parts: [
        { inlineData: { mimeType: modelImg.mimeType, data: modelImg.base64 } },
        { inlineData: { mimeType: garmentImg.mimeType, data: garmentImg.base64 } },
        { text: simulationPrompt }
      ]
    },
    config: {
      imageConfig: { aspectRatio: '3:4', imageSize: '2K' } // Vertical portrait for fashion
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.data) {
      return base64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType);
    }
  }
  throw new Error("VTON Generation failed");
};

// --- FACE GEOMETRY SCANNER (NEW MODULE) ---
// Analyzes the reference image to create a strict biometric text map
export const scanFaceGeometry = async (base64: string, mimeType: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Fast inference
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: `
            PERFORM A BIOMETRIC FACE SCAN.
            Output a dense, comma-separated list of physical traits for this person to assist a 3D modeler in recreating them.
            Focus strictly on:
            1. Bone Structure (Jawline width, Cheekbone prominence/height, Chin shape, Face shape)
            2. Eyes (Canthal tilt, shape, spacing, eyelid crease, eyebrow arch)
            3. Nose (Bridge width, Tip shape, Nostril flare, Length)
            4. Mouth (Lip fullness, Cupid's bow shape, Philtrum depth, Commisure angle)
            5. Skin/Identity (Undertone, Freckles, Texture, Moles, Age markers)
            
            Do not describe clothing, lighting or background. ONLY THE BIOMETRICS.
          `}
        ]
      }
    });
    return response.text || "";
  } catch (e) {
    console.warn("Face scan failed", e);
    return "";
  }
};

// ... existing auth exports ...
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
  sourceFidelity = 30,
  imageMode = ImageMode.CINEMATIC,
  referenceModelUrl
}: GenerationParams): Promise<string[]> => {
  const ai = getClient();
  const brandInfo = BRAND_CONTEXT[brand];
  const isDeRoche = brand === BrandArchetype.DE_ROCHE;

  const envDesc = ENVIRONMENT_DESCRIPTIONS[environment as EnvironmentPreset] || environment;
  const lightDesc = LIGHTING_DESCRIPTIONS[lighting as LightingPreset] || lighting;
  
  const randomTexture = isDeRoche ? getRandom(DE_ROCHE_TEXTURES) : getRandom(CHAOS_TEXTURES);
  const artAdjectives = ["Dadaist", "Constructivist", "Baroque", "Cybernetic", "Paleolithic", "Surrealist", "Brutalist"];
  const abstractNouns = ["Decay", "Geometry", "Hysteria", "Silence", "Glitch", "Echo", "Mutation"];
  const bizarrePairing = `${getRandom(artAdjectives)} ${getRandom(abstractNouns)}`;
  
  const parts: any[] = [];
  let faceInstruction = "";
  let finalModelDescription = modelPrompt || generateRandomModelProfile(brand);

  // --- 1. HANDLE THE FACE (SCANNER MODULE INTEGRATION) ---
  if (referenceModelUrl) {
      console.log("🔒 LOCKING FACE IDENTITY:", referenceModelUrl);
      
      try {
          // Fetch and convert the model image
          const { base64, mimeType } = await getBase64FromUrl(referenceModelUrl);
          
          // Push the Model Image FIRST
          parts.push({ inlineData: { mimeType, data: base64 } });
          
          // Instruction - If we have explicit biometrics in the modelPrompt, use them.
          // Otherwise, we rely on the image + strict instructions.
          // NOTE: The `modelPrompt` passed here might already contain the biometric text if available from the Store.
          
          faceInstruction = `
          [CRITICAL MANDATE: FACE REPLICATION]
          - The first image provided above is the REFERENCE MODEL.
          - You MUST generate a subject with the EXACT same facial features, bone structure, and ethnicity.
          - IGNORE the hair and clothing from the reference image; only copy the FACE.
          
          *** REPLICATION RULES ***
          1. Match the eye shape, nose bridge, and lip fullness exactly.
          2. Match distinctive skin features (moles, texture) from the reference.
          3. Do not "beautify" or "average" the face. Keep unique irregularities.
          4. Ensure the lighting on the face matches the scene, but do not alter the bone structure.
          `;
          
          // Override model prompt to reinforce this
          finalModelDescription = `The specific model shown in the first reference image. ${modelPrompt || ''}`;
      } catch (e) {
          console.warn("Could not load reference model, proceeding without face lock.", e);
      }
  }

  // --- 2. Add Standard Uploads (Moodboard/References) ---
  uploadedFiles.forEach(file => {
    parts.push({ inlineData: { mimeType: file.mimeType, data: file.base64 } });
  });

  if (logoBase64) {
    parts.push({ inlineData: { mimeType: 'image/png', data: logoBase64 } });
    parts.push({ text: "BRAND LOGO: Integrate this logo naturally." });
  }

  // --- 3. Construct Prompt ---
  const isLookbook = imageMode === ImageMode.LOOKBOOK;
  let finalEnv = envDesc;
  let finalLight = lightDesc;

  if (isLookbook) {
      if (environment === EnvironmentPreset.RANDOM) finalEnv = ENVIRONMENT_DESCRIPTIONS[EnvironmentPreset.NEUTRAL_STUDIO];
      if (lighting === LightingPreset.RANDOM) finalLight = LIGHTING_DESCRIPTIONS[LightingPreset.SOFT_DIFFUSE];
      finalEnv += " Clean, minimal, non-distracting background.";
      finalLight += " Even, bright, commercial lighting.";
  }

  let colorContext = colorPalette ? `PALETTE: ${colorPalette}.` : `PALETTE: Signature ${brandInfo.name}.`;
  if (customHexColors && customHexColors.length > 0) colorContext = `PALETTE: STRICTLY USE [${customHexColors.join(', ')}].`;

  const refinedPrompt = `
    ${faceInstruction}
    
    [PHOTOGRAPHIC DIRECTIVE]: Create a ${isLookbook ? 'clean, high-definition FASHION LOOKBOOK' : `hyper-realistic ${isMarketingMockup ? 'marketing campaign' : 'editorial fashion'}`} photograph.
    
    [SETTING] ${finalEnv}. ${!isLookbook ? `Texture: ${randomTexture}. Atmosphere: ${bizarrePairing}.` : ''} ${customScenePrompt || ''}
    [LIGHTING] ${finalLight}. ${!isLookbook ? `Tone: ${getRandom(MODEL_FEATURES.vibes).toUpperCase()}.` : ''}.
    [SUBJECT] ${finalModelDescription}
    [FASHION] Concept: ${injectSynonyms(prompt)}. Brand: ${brandInfo.name}. ${colorContext}.
    [TECH] ${isLookbook ? 'Phase One IQ4 150MP. Aperture f/8. Sharp focus.' : 'Phase One IQ4 150MP. Kodak Portra 400.'}
    
    ${iterationMode !== 'NONE' ? `MODE: ${iterationMode}. Refine, Mutate, or Break the concept.` : ''}
    ${uploadedFiles.length > 0 ? `SOURCE MATERIAL: Use additional images for style guidance only. Fidelity: ${sourceFidelity}%. Interpretation: ${sourceInterpretation || 'VIBE'}.` : ''}
    ${learningContext.length > 0 ? `[INTELLIGENT REFINEMENT]: ${learningContext.slice(-3).join('; ')}` : ''}
    
    *** EXECUTION RULES ***
    ${referenceModelUrl ? "- PRIORITY: The face must match the Reference Model provided." : ""}
    - PHOTOGRAPHY: Raw 150MP output. ${isLookbook ? 'Commercial clarity.' : ''}
    - SKIN: EXTREME REALISM. Visible pores, vellus hair. NO AI SMOOTHING.
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

// ... keep existing edit, variation, video, etc. functions ...
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
