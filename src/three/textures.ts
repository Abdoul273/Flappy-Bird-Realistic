import * as THREE from 'three';
import type { BirdSkinDef, PipeThemeDef } from '../game/shop';

export interface ProceduralTextureSet {
  featherMap: THREE.CanvasTexture;
  featherBump: THREE.CanvasTexture;
  pipeAlbedo: THREE.CanvasTexture;
  pipeBump: THREE.CanvasTexture;
  pipeRoughness: THREE.CanvasTexture;
  brassBump: THREE.CanvasTexture;
  terrainAlbedo: THREE.CanvasTexture;
  terrainBump: THREE.CanvasTexture;
  waterBump: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  softGlow: THREE.CanvasTexture;
  repaintBirdSkin: (skin: BirdSkinDef) => void;
  repaintPipeTheme: (theme: PipeThemeDef) => void;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function configureTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  return tex;
}

function drawFeatherAlbedo(
  ctx: CanvasRenderingContext2D,
  top: string,
  mid: string,
  deep: string
): void {
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, top);
  grad.addColorStop(0.48, mid);
  grad.addColorStop(1, deep);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const rows = 16;
  const cols = 12;
  const cellW = 512 / cols;
  const cellH = 512 / rows;
  for (let r = -1; r <= rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const offsetX = (r % 2) * (cellW * 0.5);
      const cx = c * cellW + offsetX;
      const cy = r * cellH;
      const lightAlpha = 0.08 + (((r * 13 + c * 29) % 9) / 9) * 0.14;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, cellW * 0.56, cellH * 0.85, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${lightAlpha.toFixed(3)})`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(10, 14, 22, 0.28)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 250, 235, 0.34)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - cellH * 0.65);
      ctx.lineTo(cx, cy + cellH * 0.65);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawPipeAlbedo(
  ctx: CanvasRenderingContext2D,
  dark: string,
  mid: string,
  bright: string
): void {
  const pGrad = ctx.createLinearGradient(0, 0, 512, 0);
  pGrad.addColorStop(0, dark);
  pGrad.addColorStop(0.28, mid);
  pGrad.addColorStop(0.5, bright);
  pGrad.addColorStop(0.72, mid);
  pGrad.addColorStop(1, dark);
  ctx.fillStyle = pGrad;
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 2) {
    ctx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.036)' : 'rgba(0,0,0,0.045)';
    ctx.fillRect(0, y, 512, 1);
  }

  for (const bandY of [128, 256, 384]) {
    ctx.fillStyle = 'rgba(8, 14, 18, 0.36)';
    ctx.fillRect(0, bandY - 2, 512, 4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fillRect(0, bandY + 2, 512, 2);
  }

  for (let i = 0; i < 600; i++) {
    const rx = (i * 197) % 512;
    const ry = (i * 311) % 512;
    const rad = 1 + (i % 4);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 255, 255, 0.065)' : 'rgba(8, 12, 16, 0.095)';
    ctx.beginPath();
    ctx.arc(rx, ry, rad, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Sculpted Bird Feather-Barb Albedo + Bump
  const [fCanvas, fCtx] = makeCanvas(512, 512);
  const [fbCanvas, fbCtx] = makeCanvas(512, 512);

  drawFeatherAlbedo(fCtx, '#f7c547', '#e89624', '#9e4510');

  fbCtx.fillStyle = '#7a7a7a';
  fbCtx.fillRect(0, 0, 512, 512);
  const rows = 16;
  const cols = 12;
  const cellW = 512 / cols;
  const cellH = 512 / rows;
  for (let r = -1; r <= rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const offsetX = (r % 2) * (cellW * 0.5);
      const cx = c * cellW + offsetX;
      const cy = r * cellH;
      fbCtx.save();
      const bGrad = fbCtx.createRadialGradient(cx, cy - cellH * 0.15, 2, cx, cy, cellW * 0.6);
      bGrad.addColorStop(0, '#ededed');
      bGrad.addColorStop(0.7, '#9a9a9a');
      bGrad.addColorStop(1, '#343434');
      fbCtx.fillStyle = bGrad;
      fbCtx.beginPath();
      fbCtx.ellipse(cx, cy, cellW * 0.54, cellH * 0.82, 0, 0, Math.PI * 2);
      fbCtx.fill();
      fbCtx.restore();
    }
  }

  const featherMap = configureTexture(fCanvas, true, 2, 2, maxAnisotropy);
  const featherBump = configureTexture(fbCanvas, false, 2, 2, maxAnisotropy);

  // 2. Industrial Cast-Steel / Architectural Pipe Albedo, Bump & Roughness
  const [pCanvas, pCtx] = makeCanvas(512, 512);
  const [pbCanvas, pbCtx] = makeCanvas(512, 512);
  const [prCanvas, prCtx] = makeCanvas(512, 512);

  drawPipeAlbedo(pCtx, '#165336', '#237a4e', '#2b935d');

  pbCtx.fillStyle = '#808080';
  pbCtx.fillRect(0, 0, 512, 512);
  prCtx.fillStyle = '#525252';
  prCtx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 2) {
    const v = 120 + ((y * 53) % 24);
    pbCtx.fillStyle = `rgb(${v},${v},${v})`;
    pbCtx.fillRect(0, y, 512, 1);
  }
  for (const bandY of [128, 256, 384]) {
    pbCtx.fillStyle = '#363636';
    pbCtx.fillRect(0, bandY - 2, 512, 4);
    prCtx.fillStyle = '#a8a8a8';
    prCtx.fillRect(0, bandY - 5, 512, 10);
  }
  for (let i = 0; i < 650; i++) {
    const rx = (i * 197) % 512;
    const ry = (i * 311) % 512;
    const rad = 1 + (i % 4);
    prCtx.fillStyle = i % 2 === 0 ? 'rgba(180,180,180,0.16)' : 'rgba(40,40,40,0.12)';
    prCtx.fillRect(rx, ry, rad * 2, rad);
  }

  const pipeAlbedo = configureTexture(pCanvas, true, 1, 2, maxAnisotropy);
  const pipeBump = configureTexture(pbCanvas, false, 1, 2, maxAnisotropy);
  const pipeRoughness = configureTexture(prCanvas, false, 1, 2, maxAnisotropy);

  // 3. Machined Brushed Brass Bump
  const [brCanvas, brCtx] = makeCanvas(256, 256);
  brCtx.fillStyle = '#808080';
  brCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y++) {
    const shade = 112 + ((y * 73) % 34);
    brCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    brCtx.fillRect(0, y, 256, 1);
  }
  const brassBump = configureTexture(brCanvas, false, 2, 1, maxAnisotropy);

  // 4. Lush Alpine Valley Grass / Moss Terrain Albedo + Bump
  const [tCanvas, tCtx] = makeCanvas(512, 512);
  const [tbCanvas, tbCtx] = makeCanvas(512, 512);

  tCtx.fillStyle = '#3b6434';
  tCtx.fillRect(0, 0, 512, 512);
  tbCtx.fillStyle = '#787878';
  tbCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3200; i++) {
    const x = (i * 173 + (i % 19) * 11) % 512;
    const y = (i * 251 + (i % 13) * 17) % 512;
    const w = 3 + (i % 14);
    const h = 3 + ((i * 7) % 14);
    const tone = i % 5;
    if (tone === 0) tCtx.fillStyle = 'rgba(84, 128, 56, 0.26)';
    else if (tone === 1) tCtx.fillStyle = 'rgba(43, 82, 41, 0.28)';
    else if (tone === 2) tCtx.fillStyle = 'rgba(104, 134, 62, 0.20)';
    else if (tone === 3) tCtx.fillStyle = 'rgba(66, 94, 48, 0.25)';
    else tCtx.fillStyle = 'rgba(92, 82, 54, 0.16)';
    tCtx.fillRect(x, y, w, h);

    const bv = 90 + (i % 75);
    tbCtx.fillStyle = `rgba(${bv},${bv},${bv},0.35)`;
    tbCtx.fillRect(x, y, w, h);
  }

  const terrainAlbedo = configureTexture(tCanvas, true, 12, 12, maxAnisotropy);
  const terrainBump = configureTexture(tbCanvas, false, 12, 12, maxAnisotropy);

  // 5. Shimmering River Water Ripple Bump
  const [wCanvas, wCtx] = makeCanvas(512, 512);
  wCtx.fillStyle = '#808080';
  wCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 380; i++) {
    const x = (i * 137) % 512;
    const y = (i * 223) % 512;
    const rx = 24 + (i % 46);
    const ry = 4 + (i % 8);
    const g = wCtx.createRadialGradient(x, y, 1, x, y, rx);
    g.addColorStop(0, i % 2 === 0 ? 'rgba(235,235,235,0.28)' : 'rgba(30,30,30,0.25)');
    g.addColorStop(1, 'rgba(128,128,128,0)');
    wCtx.save();
    wCtx.translate(x, y);
    wCtx.scale(1, ry / rx);
    wCtx.fillStyle = g;
    wCtx.beginPath();
    wCtx.arc(0, 0, rx, 0, Math.PI * 2);
    wCtx.fill();
    wCtx.restore();
  }
  const waterBump = configureTexture(wCanvas, false, 18, 6, maxAnisotropy);

  // 6. Soft Radial Contact Shadow Disc
  const [csCanvas, csCtx] = makeCanvas(128, 128);
  const csGrad = csCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
  csGrad.addColorStop(0, 'rgba(6, 14, 18, 0.72)');
  csGrad.addColorStop(0.55, 'rgba(6, 14, 18, 0.28)');
  csGrad.addColorStop(1, 'rgba(6, 14, 18, 0)');
  csCtx.fillStyle = csGrad;
  csCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(csCanvas);
  contactShadow.needsUpdate = true;

  // 7. Soft Radial Glow
  const [sgCanvas, sgCtx] = makeCanvas(128, 128);
  const sgGrad = sgCtx.createRadialGradient(64, 64, 2, 64, 64, 62);
  sgGrad.addColorStop(0, 'rgba(255, 250, 230, 1)');
  sgGrad.addColorStop(0.35, 'rgba(255, 224, 150, 0.5)');
  sgGrad.addColorStop(1, 'rgba(255, 200, 120, 0)');
  sgCtx.fillStyle = sgGrad;
  sgCtx.fillRect(0, 0, 128, 128);
  const softGlow = new THREE.CanvasTexture(sgCanvas);
  softGlow.colorSpace = THREE.SRGBColorSpace;
  softGlow.needsUpdate = true;

  return {
    featherMap,
    featherBump,
    pipeAlbedo,
    pipeBump,
    pipeRoughness,
    brassBump,
    terrainAlbedo,
    terrainBump,
    waterBump,
    contactShadow,
    softGlow,
    repaintBirdSkin: (skin: BirdSkinDef) => {
      drawFeatherAlbedo(fCtx, skin.dorsalTop, skin.dorsalMid, skin.dorsalDeep);
      featherMap.needsUpdate = true;
    },
    repaintPipeTheme: (theme: PipeThemeDef) => {
      drawPipeAlbedo(pCtx, theme.enamelDark, theme.enamelMid, theme.enamelBright);
      pipeAlbedo.needsUpdate = true;
    },
    dispose: () => {
      featherMap.dispose();
      featherBump.dispose();
      pipeAlbedo.dispose();
      pipeBump.dispose();
      pipeRoughness.dispose();
      brassBump.dispose();
      terrainAlbedo.dispose();
      terrainBump.dispose();
      waterBump.dispose();
      contactShadow.dispose();
      softGlow.dispose();
    },
  };
}
