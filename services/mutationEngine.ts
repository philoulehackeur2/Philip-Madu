
import { BrandArchetype, CollectionLook } from '../types';

export const TRANSFORMATION_VERBS = {
  [BrandArchetype.DE_ROCHE]: ["CEMENTED", "FUSED", "SCULPTED", "ANODIZED", "RIVETED", "PLANAR", "ENCASED"],
  [BrandArchetype.CHAOSCHICC]: ["ERODED", "TWISTED", "LIQUIFIED", "GLITCHED", "OXIDIZED", "RIPPED", "MUTATED"]
};

const EVOLUTION_PROTOCOLS = {
  [BrandArchetype.DE_ROCHE]: {
    logic: "Architectural Hack",
    modifiers: [
      "treat wool like reinforced concrete",
      "remove all drape for structural rigidity",
      "inverted prism silhouette",
      "sharp trapezoid lapels",
      "hidden closure void styling",
      "high-density bonding agent",
      "zero-ease fit",
      "monolithic block construction"
    ]
  },
  [BrandArchetype.CHAOSCHICC]: {
    logic: "Entropy Process",
    modifiers: [
      "treat denim like decaying flesh",
      "heat-gun manipulation for bubbling texture",
      "topographical scarring",
      "spiral drape via extreme grainline rotation",
      "chemical erosion of hems",
      "gold foil layering over torn fabric",
      "parasitic volume attachment",
      "slash and spread distortion"
    ]
  }
};

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const constructEvolutionaryPrompt = (look: CollectionLook, brand: BrandArchetype): string => {
   const protocol = EVOLUTION_PROTOCOLS[brand];
   const brandVerbs = TRANSFORMATION_VERBS[brand];
   
   // Use specific verb if selected, otherwise random
   const activeVerb = look.transformation || getRandom(brandVerbs);
   const randomModifier = getRandom(protocol.modifiers);

   // DNA Injection
   const evolutionInstruction = `
     *** EVOLUTIONARY DIRECTIVE (${protocol.logic}) ***
     DO NOT generate a standard ${look.coreItem}.
     TRANSFORMATION: The ${look.material} must be ${activeVerb.toUpperCase()}.
     LOGIC: ${randomModifier}.
     SILHOUETTE: ${look.silhouette}, but evolved through the physics of ${brand === BrandArchetype.DE_ROCHE ? 'Brutalist Architecture' : 'Biological Decay'}.
   `;

   return `
     ITEM: ${look.coreItem}
     MATERIAL: ${look.material}
     VIBE: ${look.vibe}
     ${evolutionInstruction}
     SCENE: ${look.prompt_scene || 'Void'}
   `;
};
