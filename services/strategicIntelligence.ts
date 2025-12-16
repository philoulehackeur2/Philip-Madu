
import { GoogleGenAI, Type } from "@google/genai";
import { BrandArchetype, MarketingStrategy, UploadedFile } from '../types';

// --- BRAND KNOWLEDGE BASE ---
export const BRAND_CONTEXT = {
  [BrandArchetype.DE_ROCHE]: {
    name: "De Roche",
    role: "The Persona",
    visualStyle: "Brutalist architecture meets Zen minimalism. Stone, mountain symbolism, calligraphic minimalism. Raw concrete tones + metallic accents. Pantone Cool Gray 6 C, Neutral Black C. Raw skin textures.",
    coreConcept: "Uniforms for the soul. Intellectual belonging and 'Tribal' quiet luxury."
  },
  [BrandArchetype.CHAOSCHICC]: {
    name: "ChaosChicc",
    role: "The Shadow",
    visualStyle: "Wild, chaotic, chromatic, unpredictable. Experimental silhouettes, punk, art brut, outsider art, surrealism. Pantone 2617 C Royal Purple, 7554 C Antique Gold. Scratched film textures, broken mirrors.",
    coreConcept: "Royal madness never dies. Cultural rebellion. Vibrational color."
  }
};

const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateMarketingStrategy = async (brand: BrandArchetype, assets: UploadedFile[]): Promise<MarketingStrategy> => {
    const ai = getClient();
    
    const parts: any[] = [];
    if (assets.length > 0) {
        parts.push({ inlineData: { mimeType: assets[0].mimeType, data: assets[0].base64 }});
    }
    
    // Thinking Mode Prompt
    const prompt = `
      Analyze this visual asset (if provided) and the brand identity of ${brand} (${BRAND_CONTEXT[brand].coreConcept}).
      Develop a comprehensive, high-level marketing strategy.
      
      Think deeply about:
      1. The target audience psychology for this specific archetype.
      2. Unconventional guerrilla marketing tactics suitable for ${brand}.
      3. A cryptic but compelling campaign title.
      4. A narrative description that sells the emotion, not just the clothes.
      
      Return the result as a JSON object with:
      - title (string)
      - description (string)
      - tactics (array of strings)
    `;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: { parts },
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tactics: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    });

    if (response.text) {
        return JSON.parse(response.text) as MarketingStrategy;
    }
    throw new Error("Failed to generate strategy");
};

export const groundPromptWithSearch = async (originalPrompt: string, brand: BrandArchetype): Promise<{ refinedPrompt: string, sources: { title: string, uri: string }[] }> => {
  const ai = getClient();
  const brandInfo = BRAND_CONTEXT[brand];
  
  const searchPrompt = `
    You are a high-fashion Creative Director.
    TASK: Research the concept "${originalPrompt}" using Google Search.
    GOAL: Find real-world visual details, location specifics, current fashion trends, or cultural references that match this concept.
    
    OUTPUT: Rewrite the concept into a highly detailed, photorealistic image generation prompt for the brand "${brandInfo.name}" (${brandInfo.visualStyle}).
    Include specific details found in your search (e.g., specific street names, architectural materials, trending color combinations, lighting conditions).
    
    The output should be ONLY the refined prompt text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', 
      contents: { parts: [{ text: searchPrompt }] },
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const refinedPrompt = response.text || originalPrompt;
    
    const sources: { title: string, uri: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return { refinedPrompt, sources };
  } catch (error) {
    console.warn("Grounding failed, using original prompt", error);
    return { refinedPrompt: originalPrompt, sources: [] };
  }
};
