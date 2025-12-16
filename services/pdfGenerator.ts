
import jsPDF from 'jspdf';
import { PatternData } from '../types';

export const exportPatternToPDF = (pattern: PatternData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a0'
  });

  const MARGIN = 20;
  let cursorY = MARGIN;

  doc.setFont("courier", "bold");
  doc.setFontSize(40);
  doc.text(pattern.brand.replace('_', ' '), MARGIN, cursorY + 20);
  
  doc.setFontSize(24);
  doc.setFont("courier", "normal");
  cursorY += 50;
  doc.text(`STYLE: ${pattern.styleName.toUpperCase()}`, MARGIN, cursorY);
  cursorY += 15;
  doc.text(`METHOD: ${pattern.method.toUpperCase()}`, MARGIN, cursorY);
  
  cursorY += 40;
  doc.setFontSize(18);
  doc.text("ENGINEERING NOTES:", MARGIN, cursorY);
  cursorY += 15;
  doc.setFontSize(14);
  pattern.pieces.forEach(p => {
    p.annotations.forEach(a => {
      doc.text(`[${p.name}] ${a.title}: ${a.description} (${a.source})`, MARGIN, cursorY);
      cursorY += 10;
    });
  });

  doc.addPage();
  doc.setFontSize(10);
  doc.text("VECTOR OUTPUT: 1:1 SCALE", MARGIN, MARGIN);

  const SCALE = 1.0; 
  const OFFSET_X = 50;
  const OFFSET_Y = 50;

  pattern.pieces.forEach((piece, index) => {
    if (index > 0 && index % 2 === 0) {
      doc.addPage();
    }
    const yShift = (index % 2) * 500;
    doc.setDrawColor(0, 0, 0); 
    doc.setLineWidth(0.5); 

    doc.text(`PIECE: ${piece.name.toUpperCase()}`, OFFSET_X, OFFSET_Y + yShift - 10);
    doc.text(`CUT: ${piece.cut.toUpperCase()}`, OFFSET_X, OFFSET_Y + yShift - 5);

    if (piece.rawPoints && piece.rawPoints.length > 0) {
        for (let i = 0; i < piece.rawPoints.length; i++) {
            const p1 = piece.rawPoints[i];
            const p2 = piece.rawPoints[(i + 1) % piece.rawPoints.length];
            
            doc.line(
                p1.x * SCALE + OFFSET_X, 
                p1.y * SCALE + OFFSET_Y + yShift, 
                p2.x * SCALE + OFFSET_X, 
                p2.y * SCALE + OFFSET_Y + yShift
            );
        }
    }

    doc.setDrawColor(255, 0, 0);
    const gx = piece.grainline.x * SCALE + OFFSET_X;
    const gy = piece.grainline.y * SCALE + OFFSET_Y + yShift;
    const gh = (piece.grainline.h || 0) * SCALE;
    doc.line(gx, gy, gx, gy + gh);
    
    doc.setDrawColor(0,0,0);
  });

  doc.save(`${pattern.styleName.replace(/ /g, '_')}_Vector_Pattern.pdf`);
};
