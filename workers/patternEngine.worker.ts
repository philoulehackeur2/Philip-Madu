// --- MATH ENGINE ---
const MASTER_BLOCKS = {
  bodiceFront: [
    { x: 10, y: 0, tag: 'neck_high' }, { x: 70, y: 15, tag: 'shoulder_neck' },
    { x: 150, y: 40, tag: 'shoulder_tip' }, { x: 130, y: 180, tag: 'armhole_base' },
    { x: 150, y: 350, tag: 'waist_side' }, { x: 0, y: 370, tag: 'waist_cf' }
  ],
  sleeve: [
    { x: 150, y: 0, tag: 'cap_crown' }, { x: 280, y: 80, tag: 'bicep_back' },
    { x: 240, y: 450, tag: 'wrist_back' }, { x: 60, y: 450, tag: 'wrist_front' },
    { x: 20, y: 80, tag: 'bicep_front' }
  ],
  pantFront: [
    { x: 40, y: 0, tag: 'waist_side' }, { x: 140, y: 10, tag: 'waist_cf' },
    { x: 150, y: 120, tag: 'crotch_front' }, { x: 130, y: 600, tag: 'hem_inseam' },
    { x: 30, y: 600, tag: 'hem_outseam' }, { x: 10, y: 130, tag: 'hip' }
  ]
};

function transformPoints(points: any[], params: any, brand: string) {
  return points.map(p => {
      let newX = p.x;
      let newY = p.y;
      if (p.tag?.includes('side') || p.tag?.includes('shoulder') || p.tag?.includes('armhole') || p.tag?.includes('hip')) {
          const tensionFactor = (params.fitTension - 50) / 100;
          newX = newX * (1 + tensionFactor * 0.8);
      }
      if (p.tag?.includes('hem') || p.tag?.includes('waist') || p.tag?.includes('wrist')) {
           const gravityFactor = params.gravity / 100;
           newY = newY + (gravityFactor * 40);
      }
      if (params.distortion > 5) {
          const distFactor = params.distortion / 100;
          if (brand === 'DE_ROCHE') {
              if (p.tag?.includes('shoulder') || p.tag?.includes('hem')) {
                   newY -= distFactor * 30; newX += distFactor * 20;
              }
          } else {
              const noise = Math.sin(p.x * 0.1) * Math.cos(p.y * 0.1) * 40 * distFactor;
              newX += noise; newY += noise;
          }
      }
      return { x: newX, y: newY, tag: p.tag };
  });
}

function applyDeRocheLogic(points: any[], scaleY: number) {
  if (points.length === 0) return "";
  const pathData = points.map((p, index) => {
    const x = p.x; const y = p.y * scaleY; 
    return (index === 0 ? 'M' : 'L') + ' ' + x.toFixed(1) + ' ' + y.toFixed(1);
  }).join(" ");
  return pathData + " Z"; 
}

function applyChaosLogic(points: any[], scaleY: number, params: any) {
  if (points.length === 0) return "";
  let pathData = "M " + points[0].x + " " + (points[0].y * scaleY).toFixed(1);
  for (let i = 1; i < points.length; i++) {
    const curr = points[i]; const prev = points[i - 1];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) * scaleY / 2;
    const gravityOffset = (params.gravity / 100) * 50;
    const distOffset = (params.distortion / 100) * 60;
    const distDir = (i % 2 === 0 ? 1 : -1);
    const cpX = midX + (distOffset * distDir);
    const cpY = midY + gravityOffset;
    pathData += " Q " + cpX.toFixed(1) + " " + cpY.toFixed(1) + " " + curr.x + " " + (curr.y * scaleY).toFixed(1);
  }
  const last = points[points.length - 1];
  const first = points[0];
  const midX = (last.x + first.x) / 2;
  const midY = (last.y + first.y) * scaleY / 2;
  pathData += " Q " + midX + " " + (midY + (params.gravity/2)) + " " + first.x + " " + (first.y * scaleY).toFixed(1) + " Z";
  return pathData;
}

self.onmessage = (e: MessageEvent) => {
  const { look, brand, params } = e.data;
  const isDeRoche = brand === 'DE_ROCHE';
  const isPant = look.coreItem.toLowerCase().includes("pant") || look.coreItem.toLowerCase().includes("trouser");
  const scaleY = 1.15;
  const pieces = [];
  const offsetX = 100; const offsetY = 50;

  if (!isPant) {
      const rawFront = MASTER_BLOCKS.bodiceFront.map(p => ({ x: p.x + offsetX, y: p.y + offsetY, tag: p.tag }));
      const tFront = transformPoints(rawFront, params, brand);
      pieces.push({
          name: "Front Bodice", cut: isDeRoche ? "Cut 1" : "Cut 2",
          path: isDeRoche ? applyDeRocheLogic(tFront, scaleY) : applyChaosLogic(tFront, scaleY, params),
          rawPoints: tFront,
          grainline: { x: 100 + offsetX, y: 100 + offsetY, h: 200 },
          annotations: []
      });
      const rawSleeve = MASTER_BLOCKS.sleeve.map(p => ({ x: p.x + offsetX + 300, y: p.y + offsetY, tag: p.tag }));
      const tSleeve = transformPoints(rawSleeve, params, brand);
      pieces.push({
          name: "Sleeve", cut: "Cut 2",
          path: isDeRoche ? applyDeRocheLogic(tSleeve, scaleY) : applyChaosLogic(tSleeve, scaleY, params),
          rawPoints: tSleeve,
          grainline: { x: 450 + offsetX, y: 100 + offsetY, h: 300 },
          annotations: []
      });
  } else {
      const rawPant = MASTER_BLOCKS.pantFront.map(p => ({ x: p.x + offsetX + 100, y: p.y + offsetY, tag: p.tag }));
      const tPant = transformPoints(rawPant, params, brand);
      pieces.push({
          name: "Pant Front", cut: "Cut 2",
          path: isDeRoche ? applyDeRocheLogic(tPant, scaleY) : applyChaosLogic(tPant, scaleY, params),
          rawPoints: tPant,
          grainline: { x: 200 + offsetX, y: 200 + offsetY, h: 400 },
          annotations: []
      });
  }

  self.postMessage({ 
      styleName: look.coreItem + " (" + look.season + ")",
      brand, method: 'Parametric Vector Logic', pieces, params
  });
};