
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { PatternData, PatternPiece } from '../types';
import { Printer, FileJson, Download } from 'lucide-react';
import { generateDXFContent } from '../services/dxfService';

interface TiledPDFGeneratorProps {
  patternData: PatternData;
}

export const TiledPDFGenerator: React.FC<TiledPDFGeneratorProps> = ({ patternData }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // --- CONFIGURATION ---
  const PAGE_FORMAT = 'a4'; // or 'letter'
  const DPI = 72; // jsPDF default
  const MM_TO_PT = 2.83465; 
  
  // Dimensions in MM
  const PAGE_WIDTH = 210; 
  const PAGE_HEIGHT = 297;
  const MARGIN = 10;
  const OVERLAP = 15;
  const PRINTABLE_WIDTH = PAGE_WIDTH - (MARGIN * 2);
  const PRINTABLE_HEIGHT = PAGE_HEIGHT - (MARGIN * 2);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    // 1. Initialize Document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: PAGE_FORMAT
    });

    // 2. Add Cover Sheet with Calibration Square
    doc.setFontSize(20);
    doc.text(`LUMIÈRE PATTERN: ${patternData.styleName}`, MARGIN, 30);
    doc.setFontSize(12);
    doc.text(`Brand: ${patternData.brand}`, MARGIN, 40);
    doc.text(`Pieces: ${patternData.pieces.length}`, MARGIN, 50);
    
    // Calibration Square (5cm x 5cm)
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(MARGIN, 70, 50, 50);
    doc.setFontSize(8);
    doc.text("CALIBRATION SQUARE: 5cm x 5cm", MARGIN, 125);
    doc.text("Measure this square after printing to ensure scale.", MARGIN, 130);

    // 3. Process Each Piece
    patternData.pieces.forEach((piece, pIdx) => {
       if (!piece.rawPoints || piece.rawPoints.length === 0) return;

       // Calculate Bounding Box
       const xs = piece.rawPoints.map(p => p.x);
       const ys = piece.rawPoints.map(p => p.y);
       const minX = Math.min(...xs);
       const maxX = Math.max(...xs);
       const minY = Math.min(...ys);
       const maxY = Math.max(...ys);
       
       const width = maxX - minX;
       const height = maxY - minY;

       // Calculate Grid Matrix
       // How many pages do we need horizontally and vertically?
       // Effective width per page is PRINTABLE_WIDTH - OVERLAP (except first page)
       // Actually simpler: We step by (PRINTABLE_WIDTH - OVERLAP)
       const strideX = PRINTABLE_WIDTH - OVERLAP;
       const strideY = PRINTABLE_HEIGHT - OVERLAP;

       const cols = Math.ceil(width / strideX);
       const rows = Math.ceil(height / strideY);

       // Render Grid
       for (let r = 0; r < rows; r++) {
         for (let c = 0; c < cols; c++) {
            doc.addPage();
            
            // Draw Page Info
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Piece: ${piece.name} | Row: ${r+1}/${rows} Col: ${c+1}/${cols}`, MARGIN, MARGIN - 2);
            
            // Define Clipping Region (The Printable Area)
            // Note: jsPDF clipping is complex, we simulate by translation and strict bounding.
            // We transform the coordinate system so the specific chunk of the pattern aligns with the page.
            
            // Save context
            doc.saveGraphicsState();

            // Create a clipping rectangle for the safe area
            doc.rect(MARGIN, MARGIN, PRINTABLE_WIDTH, PRINTABLE_HEIGHT, 'S'); // Draw border of printable area
            
            // Translate origin to inside the margin
            // And Shift the pattern so the current grid cell is at (0,0)
            const shiftX = (c * strideX) + minX;
            const shiftY = (r * strideY) + minY;
            
            // Translate context
            // We want (shiftX, shiftY) of the pattern to appear at (MARGIN, MARGIN) of the page
            const transX = MARGIN - shiftX;
            const transY = MARGIN - shiftY;
            
            // Draw the Pattern Geometry
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(1.0); // Thicker cut line
            
            // Manually constructing path string for jsPDF
            const pathData = piece.rawPoints.map((p, i) => {
               const px = p.x + transX;
               const py = p.y + transY;
               // Simple bounding check optimization could go here
               return { op: i === 0 ? 'm' : 'l', c: [px, py] };
            });

            // Draw lines
            pathData.forEach((cmd, i) => {
               if (i === 0) doc.moveTo(cmd.c[0], cmd.c[1]);
               else doc.lineTo(cmd.c[0], cmd.c[1]);
            });
            doc.closePath();
            doc.stroke();

            // Draw Grainline
            const gx = piece.grainline.x + transX;
            const gy = piece.grainline.y + transY;
            const gh = (piece.grainline.h || 0) * SCALE;
            doc.setDrawColor(255, 0, 0); // Red for grainline
            doc.setLineWidth(0.5);
            doc.line(gx, gy, gx, gy + gh);
            
            // Restore context
            doc.restoreGraphicsState();

            // --- ALIGNMENT MARKERS (Diamonds) ---
            // Draw diamonds in the overlap zones
            doc.setDrawColor(0, 0, 255);
            doc.setLineWidth(0.2);
            
            // Right Marker (if not last col)
            if (c < cols - 1) {
               const mx = MARGIN + PRINTABLE_WIDTH - (OVERLAP / 2);
               const my = MARGIN + (PRINTABLE_HEIGHT / 2);
               drawDiamond(doc, mx, my);
            }
            // Left Marker (if not first col)
            if (c > 0) {
               const mx = MARGIN + (OVERLAP / 2);
               const my = MARGIN + (PRINTABLE_HEIGHT / 2);
               drawDiamond(doc, mx, my);
            }
            // Bottom Marker (if not last row)
            if (r < rows - 1) {
               const mx = MARGIN + (PRINTABLE_WIDTH / 2);
               const my = MARGIN + PRINTABLE_HEIGHT - (OVERLAP / 2);
               drawDiamond(doc, mx, my);
            }
            // Top Marker (if not first row)
            if (r > 0) {
               const mx = MARGIN + (PRINTABLE_WIDTH / 2);
               const my = MARGIN + (OVERLAP / 2);
               drawDiamond(doc, mx, my);
            }
         }
       }
    });

    doc.save(`${patternData.styleName.replace(/\s/g, '_')}_A4_Tiled.pdf`);
    setIsGenerating(false);
  };

  const drawDiamond = (doc: jsPDF, x: number, y: number) => {
     const size = 3;
     doc.line(x, y - size, x + size, y);
     doc.line(x + size, y, x, y + size);
     doc.line(x, y + size, x - size, y);
     doc.line(x - size, y, x, y - size);
     // Crosshair
     doc.line(x - size, y, x + size, y);
     doc.line(x, y - size, x, y + size);
  };
  
  const SCALE = 1.0; 

  // --- DXF TRIGGER (Client-Side) ---
  const handleDXFDownload = () => {
     try {
        const dxfContent = generateDXFContent(patternData);
        const blob = new Blob([dxfContent], { type: 'application/dxf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${patternData.styleName}.dxf`;
        a.click();
        window.URL.revokeObjectURL(url);
     } catch (e) {
         console.error("DXF generation failed", e);
         alert("Failed to generate DXF file.");
     }
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={generatePDF}
        disabled={isGenerating}
        className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2"
      >
        {isGenerating ? "Tiling..." : <><Printer size={14} /> Print (A4)</>}
      </button>
      
      <button 
        onClick={handleDXFDownload}
        className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest bg-[#232222] text-white border border-gray-600 hover:bg-black flex items-center justify-center gap-2"
        title="Export to Clo3D (DXF-AAMA)"
      >
        <FileJson size={14} /> CAD / DXF
      </button>
    </div>
  );
};
