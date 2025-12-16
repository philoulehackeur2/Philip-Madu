
import { PatternData } from '../types';

/**
 * Generates a standard ASCII DXF (R12/R14 compatible) string from PatternData.
 * This runs entirely in the browser.
 */
export const generateDXFContent = (pattern: PatternData): string => {
  const lines: string[] = [];

  // --- HELPER: DXF Group Code + Value ---
  const add = (code: number, value: string | number) => {
    lines.push(code.toString());
    lines.push(value.toString());
  };

  // --- HEADER SECTION ---
  add(0, "SECTION");
  add(2, "HEADER");
  add(9, "$ACADVER");
  add(1, "AC1009"); // R12 compatibility (Most widely supported for pattern CAD)
  add(9, "$INSUNITS");
  add(70, 4); // Millimeters
  add(0, "ENDSEC");

  // --- TABLES SECTION (Layers) ---
  add(0, "SECTION");
  add(2, "TABLES");
  add(0, "TABLE");
  add(2, "LAYER");
  
  // Define Layers: 1 (Cut), 8 (Grain), 14 (Sew/Internal)
  const layers = [
    { name: "CUT_LINE", color: 7, id: 1 }, // White/Black
    { name: "GRAIN_LINE", color: 1, id: 8 }, // Red
    { name: "INTERNAL", color: 3, id: 14 } // Green
  ];

  layers.forEach(l => {
    add(0, "LAYER");
    add(2, l.name);
    add(70, 0);
    add(62, l.color);
    add(6, "CONTINUOUS");
  });
  
  add(0, "ENDTAB");
  add(0, "ENDSEC");

  // --- ENTITIES SECTION ---
  add(0, "SECTION");
  add(2, "ENTITIES");

  // Iterate Pieces
  pattern.pieces.forEach((piece) => {
    if (!piece.rawPoints || piece.rawPoints.length === 0) return;

    // 1. CUT LINE (Polyline)
    add(0, "POLYLINE");
    add(8, "CUT_LINE"); // Layer 1 in AAMA usually maps to Cut
    add(66, 1); // Vertices follow
    add(10, 0); add(20, 0); add(30, 0); // Origin

    piece.rawPoints.forEach(pt => {
        add(0, "VERTEX");
        add(8, "CUT_LINE");
        add(10, pt.x);
        add(20, pt.y); // DXF is Y-Up usually, but pattern data is typically screen coords (Y-Down). 
                       // CAD usually expects Y-Up. We might need to invert Y if it comes out upside down.
                       // For now, we keep as is, user can flip in CAD.
        add(30, 0);
    });
    
    // Close loop (repeat first point)
    const first = piece.rawPoints[0];
    add(0, "VERTEX");
    add(8, "CUT_LINE");
    add(10, first.x);
    add(20, first.y);
    add(30, 0);

    add(0, "SEQEND");

    // 2. GRAINLINE (Line)
    if (piece.grainline) {
        add(0, "LINE");
        add(8, "GRAIN_LINE");
        add(10, piece.grainline.x);
        add(20, piece.grainline.y);
        add(30, 0);
        add(11, piece.grainline.x);
        add(21, piece.grainline.y + (piece.grainline.h || 100));
        add(31, 0);
    }
  });

  add(0, "ENDSEC");
  add(0, "EOF");

  return lines.join('\n');
};
