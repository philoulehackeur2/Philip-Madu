

import { BrandArchetype, CollectionLook, PatternData, PatternPiece, Point, PatternAnnotation, DesignParameters } from '../types';

// --- CONSTANTS ---
const MEN_HEIGHT_BASE = 190;

// --- STEP 1: DEFINE MASTER BLOCKS (Parametric Coordinates) ---
// Base coordinate system relative to Center Front/Back (x=0) or Grainline.
const MASTER_BLOCKS = {
  bodiceFront: [
    { x: 10, y: 0, tag: 'neck_high' },
    { x: 70, y: 15, tag: 'shoulder_neck' },
    { x: 150, y: 40, tag: 'shoulder_tip' },
    { x: 130, y: 180, tag: 'armhole_base' }, // High sensitivity to Fit
    { x: 150, y: 350, tag: 'waist_side' },   // High sensitivity to Fit
    { x: 0, y: 370, tag: 'waist_cf' }
  ],
  sleeve: [
    { x: 150, y: 0, tag: 'cap_crown' },
    { x: 280, y: 80, tag: 'bicep_back' },
    { x: 240, y: 450, tag: 'wrist_back' },
    { x: 60, y: 450, tag: 'wrist_front' },
    { x: 20, y: 80, tag: 'bicep_front' }
  ],
  pantFront: [
    { x: 40, y: 0, tag: 'waist_side' },
    { x: 140, y: 10, tag: 'waist_cf' },
    { x: 150, y: 120, tag: 'crotch_front' },
    { x: 130, y: 600, tag: 'hem_inseam' }, // High sensitivity to Gravity
    { x: 30, y: 600, tag: 'hem_outseam' },
    { x: 10, y: 130, tag: 'hip' }
  ]
};

// --- STEP 2: DYNAMIC TRANSFORMATION ENGINES ---

// Applies live "Elastic" modifiers to points before path generation
const transformPoints = (points: Point[], params: DesignParameters, brand: BrandArchetype): Point[] => {
    return points.map(p => {
        let newX = p.x;
        let newY = p.y;

        // 1. FIT TENSION (Ease)
        // Affects horizontal width, especially at armhole, waist, hips.
        // 0 = Skin Tight (-10% width), 50 = Standard, 100 = Oversized (+40% width)
        if (p.tag?.includes('side') || p.tag?.includes('shoulder_tip') || p.tag?.includes('armhole') || p.tag?.includes('bicep') || p.tag?.includes('hip')) {
            const tensionFactor = (params.fitTension - 50) / 100; // -0.5 to 0.5
            // De Roche prefers tighter, Chaos prefers looser, but user overrides.
            // Scale X away from center (0)
            newX = newX * (1 + tensionFactor * 0.8);
        }

        // 2. GRAVITY (Drape)
        // Affects vertical length and curve depth.
        // 0 = Stiff/Anti-Gravity, 100 = Fluid/Drooping
        if (p.tag?.includes('hem') || p.tag?.includes('waist') || p.tag?.includes('wrist')) {
             const gravityFactor = params.gravity / 100;
             newY = newY + (gravityFactor * 40); // Drop lengths
        }

        // 3. DISTORTION (Chaos/Shift)
        // De Roche: Architectural Shift (Angular)
        // Chaos: Random Noise (Organic)
        if (params.distortion > 5) {
            const distFactor = params.distortion / 100;
            if (brand === BrandArchetype.DE_ROCHE) {
                // Architectural Shift: Move points on grid-like vectors
                if (p.tag?.includes('shoulder') || p.tag?.includes('hem')) {
                     newY -= distFactor * 30; // Sharp angles
                     newX += distFactor * 20;
                }
            } else {
                // Chaos Noise: Random displacement
                // Deterministic random based on coordinates to avoid flickering loop if possible, 
                // but for "Live" feeling, simple math sin/cos based on index is better for stability unless "Glitch" mode.
                // We'll use a pseudo-random offset based on x+y
                const noise = Math.sin(p.x * 0.1) * Math.cos(p.y * 0.1) * 40 * distFactor;
                newX += noise;
                newY += noise;
            }
        }

        return { x: newX, y: newY, tag: p.tag };
    });
};

const applyDeRocheLogic = (points: Point[], scaleY: number): string => {
  if (points.length === 0) return "";
  // De Roche: Linear connection (L)
  const pathData = points.map((p, index) => {
    const x = p.x;
    const y = p.y * scaleY; 
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return pathData + " Z"; 
};

const applyChaosLogic = (points: Point[], scaleY: number, params: DesignParameters): string => {
  if (points.length === 0) return "";

  // Chaos: Bezier Curves (Q) affected by Gravity and Distortion
  let pathData = `M ${points[0].x} ${(points[0].y * scaleY).toFixed(1)}`;

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    const prev = points[i - 1];
    
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) * scaleY / 2;
    
    // Control Point calculation
    // Gravity pulls control points down (sagging)
    const gravityOffset = (params.gravity / 100) * 50;
    
    // Distortion adds wild curves
    const distOffset = (params.distortion / 100) * 60;
    const distDir = (i % 2 === 0 ? 1 : -1);

    const cpX = midX + (distOffset * distDir);
    const cpY = midY + gravityOffset + (Math.random() * distOffset); // Add subtle jitter if live

    pathData += ` Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${curr.x} ${(curr.y * scaleY).toFixed(1)}`;
  }
  
  // Close loop
  const last = points[points.length - 1];
  const first = points[0];
  const midX = (last.x + first.x) / 2;
  const midY = (last.y + first.y) * scaleY / 2;
  pathData += ` Q ${midX} ${midY + (params.gravity/2)} ${first.x} ${(first.y * scaleY).toFixed(1)} Z`;

  return pathData;
};

// --- HELPER: SCALING ---
const getScaleFactor = (look: CollectionLook): number => {
  return 1.15; // Base height scale
};

// --- MAIN GENERATOR ---

export const generatePattern = (look: CollectionLook, brand: BrandArchetype, params?: DesignParameters): PatternData => {
  const activeParams = params || { fitTension: 50, gravity: 20, distortion: 0 }; // Default values if none provided
  const isDeRoche = brand === BrandArchetype.DE_ROCHE;
  const isPant = look.coreItem.toLowerCase().includes("pant") || look.coreItem.toLowerCase().includes("trouser");
  
  const scaleY = getScaleFactor(look);
  
  const pieces: PatternPiece[] = [];
  const offsetX = 100;
  const offsetY = 50;

  // 1. GENERATE BODICE / MAIN PANEL
  if (!isPant) {
    // Front Panel
    const rawFront = [...MASTER_BLOCKS.bodiceFront].map(p => ({ x: p.x + offsetX, y: p.y + offsetY, tag: p.tag }));
    const transformedFront = transformPoints(rawFront, activeParams, brand);
    
    const frontPath = isDeRoche 
        ? applyDeRocheLogic(transformedFront, scaleY) 
        : applyChaosLogic(transformedFront, scaleY, activeParams);
    
    pieces.push({
      name: "Front Bodice",
      cut: isDeRoche ? "Cut 1 on Fold" : "Cut 2 (Bias)",
      path: frontPath,
      rawPoints: transformedFront,
      grainline: { x: 100 + offsetX, y: 100 + offsetY, h: 200 },
      annotations: [
        { 
          id: "a1", x: 150 + offsetX, y: 40 + offsetY, 
          title: "Shoulder Point", 
          description: `Angle: ${activeParams.distortion > 30 ? 'Displaced' : 'Standard'}. Ease: ${activeParams.fitTension}%`, 
          source: isDeRoche ? "Armstrong" : "Nakamichi"
        }
      ]
    });

    // Sleeve
    const rawSleeve = [...MASTER_BLOCKS.sleeve].map(p => ({ x: p.x + offsetX + 300, y: p.y + offsetY, tag: p.tag }));
    const transformedSleeve = transformPoints(rawSleeve, activeParams, brand);

    const sleevePath = isDeRoche 
        ? applyDeRocheLogic(transformedSleeve, scaleY) 
        : applyChaosLogic(transformedSleeve, scaleY, activeParams);

    pieces.push({
      name: "Sleeve",
      cut: "Cut 2",
      path: sleevePath,
      rawPoints: transformedSleeve,
      grainline: { x: 450 + offsetX, y: 100 + offsetY, h: 300 },
      annotations: [
         {
             id: "s1", x: 450 + offsetX, y: 0 + offsetY,
             title: "Cap Height",
             description: `Dynamic calculation based on armhole delta.`,
             source: "Armstrong"
         }
      ]
    });
  } else {
    // Pant Panel
    const rawPant = [...MASTER_BLOCKS.pantFront].map(p => ({ x: p.x + offsetX + 100, y: p.y + offsetY, tag: p.tag }));
    const transformedPant = transformPoints(rawPant, activeParams, brand);

    const pantPath = isDeRoche 
        ? applyDeRocheLogic(transformedPant, scaleY) 
        : applyChaosLogic(transformedPant, scaleY, activeParams);
    
    pieces.push({
        name: "Pant Front",
        cut: "Cut 2",
        path: pantPath,
        rawPoints: transformedPant,
        grainline: { x: 200 + offsetX, y: 200 + offsetY, h: 400 },
        annotations: [
            { id: "p1", x: 250 + offsetX, y: 120 + offsetY, title: "Crotch Extension", description: "Standard Hips / 4 - 1cm", source: "Armstrong"}
        ]
    });
  }

  return {
    styleName: `${look.coreItem} (${look.season})`,
    brand,
    method: 'Parametric Vector Logic',
    pieces,
    fabricYield: "1.8m (60\" Width)",
    params: activeParams
  };
};