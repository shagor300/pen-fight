/**
 * src/rendering/RealPenRenderer.ts
 * 120-FPS Cached 8-Layer Photorealistic 3D Pen Renderer with World-Space Drop Shadows.
 *
 * Performance Optimization:
 * Pre-renders each pen's 8-layer 3D shaded body into an offscreen 2x Retina canvas cache
 * (`penBodyCache`). During gameplay, `renderPenToCanvas()` draws the world-space drop shadow
 * and blits the cached 2x Retina pen texture via `ctx.drawImage()`—eliminating per-frame
 * gradient/path allocations and delivering locked 60-120 FPS smoothness on mobile!
 */
import { PenConfig } from '../config/pensConfig';

export const PIXELS_PER_METER = 100;

const penBodyCache = new Map<string, { canvas: HTMLCanvasElement; padW: number; padH: number }>();

function getOrBuildPenBodySprite(
  pen: PenConfig,
  mode: 'real' | 'classic',
  level: number
): { canvas: HTMLCanvasElement; padW: number; padH: number } {
  const L = pen.lengthPx || (pen.dimensions ? pen.dimensions.lengthMeters * PIXELS_PER_METER : 154);
  const W = pen.widthPx || (pen.dimensions ? pen.dimensions.widthMeters * PIXELS_PER_METER : 14);
  const key = `${pen.id}_${mode}_lv${level}_${L}x${W}`;
  const cached = penBodyCache.get(key);
  if (cached) return cached;

  const dpr = 2; // 2x Retina supersampled cache
  const padW = L + 28;
  const padH = W + 28;

  const off = document.createElement('canvas');
  off.width = Math.ceil(padW * dpr);
  off.height = Math.ceil(padH * dpr);
  const ctx = off.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.translate(padW / 2, padH / 2);

  drawPenGeometry(ctx, pen, L, W, mode, level);

  const entry = { canvas: off, padW, padH };
  penBodyCache.set(key, entry);
  return entry;
}

function drawPenGeometry(
  ctx: CanvasRenderingContext2D,
  pen: PenConfig,
  L: number,
  W: number,
  mode: 'real' | 'classic',
  level: number
): void {
  const halfL = L / 2;
  const halfW = W / 2;

  const barrelColor = pen.colors.barrel || pen.colors.primary || '#e2e8f0';
  const capColor = pen.colors.cap || pen.colors.secondary || '#ea580c';
  const tipColor = pen.colors.tip || '#d97706';
  const gripColor = pen.colors.grip || '#cbd5e1';
  const clipColor = pen.colors.clip || capColor;
  const inkColor = pen.colors.ink || '#1e3a8a';
  const barrelLabel = pen.barrelText || pen.name.toUpperCase();
  const styleType = pen.styleType || 'ballpoint';

  if (mode === 'classic') {
    ctx.fillStyle = barrelColor;
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.78, -halfW, L * 0.78, W, 4);
    ctx.fill();

    ctx.fillStyle = gripColor;
    ctx.fillRect(halfL * 0.20, -halfW, L * 0.24, W);

    ctx.fillStyle = tipColor;
    ctx.beginPath();
    ctx.moveTo(halfL * 0.68, -halfW);
    ctx.lineTo(halfL, -2.0);
    ctx.lineTo(halfL, 2.0);
    ctx.lineTo(halfL * 0.68, halfW);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW - 1.4, L * 0.30, W + 2.8, 4);
    ctx.fill();

    ctx.fillStyle = clipColor;
    ctx.beginPath();
    ctx.roundRect(-halfL + 5, -halfW - 4.0, L * 0.22, 2.8, 1.4);
    ctx.fill();

    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, L * 0.88, W, 4);
    ctx.stroke();
    return;
  }

  // REAL 3D SHADED MODE
  if (styleType === 'fountain') {
    const barrelStartX = -halfL * 0.78;
    const coneStartX = halfL * 0.58;
    const barrelLen = coneStartX - barrelStartX;

    ctx.fillStyle = barrelColor;
    ctx.beginPath();
    ctx.roundRect(barrelStartX, -halfW, barrelLen, W, 4);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-4, -halfW, 4, W);

    ctx.fillStyle = gripColor;
    ctx.fillRect(halfL * 0.22, -halfW * 0.88, L * 0.18, W * 0.88);

    const nibGrad = ctx.createLinearGradient(coneStartX, -halfW, halfL, halfW);
    nibGrad.addColorStop(0, '#fef3c7');
    nibGrad.addColorStop(0.5, '#f59e0b');
    nibGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = nibGrad;
    ctx.beginPath();
    ctx.moveTo(coneStartX, -halfW * 0.65);
    ctx.lineTo(halfL - 9, -halfW * 0.82);
    ctx.lineTo(halfL, 0);
    ctx.lineTo(halfL - 9, halfW * 0.82);
    ctx.lineTo(coneStartX, halfW * 0.65);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(halfL - 12, 0);
    ctx.lineTo(halfL, 0);
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(halfL - 12, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    const capLen = L * 0.32;
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.roundRect(-halfL + 4, -halfW - 1.4, capLen, W + 2.8, 4);
    ctx.fill();

    ctx.fillStyle = clipColor;
    ctx.beginPath();
    ctx.roundRect(-halfL + 8, -halfW - 4.0, capLen * 0.76, 2.6, 1.3);
    ctx.fill();
  } else if (styleType === 'marker') {
    const bodyLen = L * 0.68;
    ctx.fillStyle = barrelColor;
    ctx.beginPath();
    ctx.roundRect(-bodyLen / 2, -halfW, bodyLen, W, 4);
    ctx.fill();

    ctx.fillStyle = capColor;
    ctx.fillRect(bodyLen / 2 - 12, -halfW, 4, W);

    const capW = L * 0.28;
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW - 1.2, capW, W + 2.4, 4);
    ctx.fill();

    ctx.fillStyle = clipColor;
    ctx.beginPath();
    ctx.roundRect(-halfL + 4, -halfW - 3.6, capW * 0.75, 2.6, 1.2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(bodyLen / 2, -halfW * 0.85);
    ctx.lineTo(halfL - 8, -halfW * 0.55);
    ctx.lineTo(halfL - 8, halfW * 0.55);
    ctx.lineTo(bodyLen / 2, halfW * 0.85);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = tipColor;
    ctx.beginPath();
    ctx.roundRect(halfL - 9, -halfW * 0.42, 9, W * 0.42, 2);
    ctx.fill();
  } else if (styleType === 'highlighter') {
    const bodyStartX = -halfL * 0.58;
    const bodyLen = L * 0.68;

    ctx.fillStyle = barrelColor;
    ctx.beginPath();
    ctx.roundRect(bodyStartX, -halfW, bodyLen, W, 5);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(bodyStartX + bodyLen, -halfW * 0.82);
    ctx.lineTo(halfL - 9, -halfW * 0.48);
    ctx.lineTo(halfL - 9, halfW * 0.48);
    ctx.lineTo(bodyStartX + bodyLen, halfW * 0.82);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(halfL - 9, -halfW * 0.42);
    ctx.lineTo(halfL, -halfW * 0.38);
    ctx.lineTo(halfL - 2, halfW * 0.42);
    ctx.lineTo(halfL - 9, halfW * 0.42);
    ctx.closePath();
    ctx.fill();

    const capLen = L * 0.26;
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW - 1.5, capLen, W + 3, 4);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-halfL + capLen - 4, -halfW - 1.5, 4, W + 3);
  } else if (styleType === '4colour') {
    const splitX = -halfL * 0.08;

    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.roundRect(-halfL + 6, -halfW, splitX - (-halfL + 6), W, 4);
    ctx.fill();

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-halfL + 3, 0, 3.2, 0, Math.PI * 2);
    ctx.stroke();

    const sliderColors = ['#3b82f6', '#ef4444', '#22c55e', '#1e293b'];
    const trackOffsets = [-halfW * 0.65, -halfW * 0.22, halfW * 0.22, halfW * 0.65];
    for (let i = 0; i < 4; i++) {
      const sy = trackOffsets[i];
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(-halfL + 14, sy - 1.2, L * 0.26, 2.4);
      const nubX = i === 0 ? -halfL + 26 : -halfL + 16;
      ctx.fillStyle = sliderColors[i];
      ctx.beginPath();
      ctx.roundRect(nubX, sy - 2.0, 9, 4.0, 1.5);
      ctx.fill();
    }

    const coneStartX = halfL * 0.64;
    ctx.fillStyle = barrelColor;
    ctx.beginPath();
    ctx.roundRect(splitX, -halfW, coneStartX - splitX, W, 3);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(splitX - 2, -halfW, 4, W);

    ctx.fillStyle = gripColor;
    ctx.fillRect(halfL * 0.18, -halfW, L * 0.24, W);

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(coneStartX, -halfW);
    ctx.lineTo(halfL - 3, -2.5);
    ctx.lineTo(halfL - 3, 2.5);
    ctx.lineTo(coneStartX, halfW);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = inkColor;
    ctx.beginPath();
    ctx.arc(halfL - 1.5, 0, 2.0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const barrelStartX = -halfL * 0.78;
    const coneStartX = halfL * 0.64;
    const barrelLen = coneStartX - barrelStartX;

    if (styleType === 'clicker' || styleType === 'metal') {
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW * 0.52, L * 0.12, W * 0.52, 2);
      ctx.fill();
    } else {
      ctx.fillStyle = capColor;
      ctx.beginPath();
      ctx.roundRect(-halfL + 2, -halfW * 0.78, L * 0.08, W * 0.78, 2);
      ctx.fill();
    }

    if (pen.transparent || pen.transparentBarrel) {
      const clearGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
      clearGrad.addColorStop(0, 'rgba(226, 232, 240, 0.82)');
      clearGrad.addColorStop(0.28, 'rgba(255, 255, 255, 0.52)');
      clearGrad.addColorStop(0.65, 'rgba(203, 213, 225, 0.56)');
      clearGrad.addColorStop(1, 'rgba(100, 116, 139, 0.85)');
      ctx.fillStyle = clearGrad;
      ctx.beginPath();
      ctx.roundRect(barrelStartX, -halfW, barrelLen, W, 3.5);
      ctx.fill();

      const inkTubeW = W * 0.38;
      ctx.fillStyle = inkColor;
      ctx.fillRect(barrelStartX + 12, -inkTubeW / 2, barrelLen * 0.72, inkTubeW);

      ctx.fillStyle = styleType === 'gel' ? '#f8fafc' : '#d97706';
      ctx.fillRect(barrelStartX + 6, -inkTubeW / 2, 6, inkTubeW);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(barrelStartX + 12 + barrelLen * 0.72, -inkTubeW / 2, 7, inkTubeW);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(barrelStartX + 4, -halfW * 0.35);
      ctx.lineTo(coneStartX - 4, -halfW * 0.35);
      ctx.stroke();
    } else {
      if (styleType === 'metal') {
        const metalBody = ctx.createLinearGradient(0, -halfW, 0, halfW);
        metalBody.addColorStop(0, '#e2e8f0');
        metalBody.addColorStop(0.3, '#94a3b8');
        metalBody.addColorStop(0.6, '#475569');
        metalBody.addColorStop(0.85, '#64748b');
        metalBody.addColorStop(1, '#334155');
        ctx.fillStyle = metalBody;
      } else {
        ctx.fillStyle = barrelColor;
      }
      ctx.beginPath();
      ctx.roundRect(barrelStartX, -halfW, barrelLen, W, 4);
      ctx.fill();

      if (styleType === 'metal') {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-3, -halfW, 5, W);
      }
    }

    const gripStartX = halfL * 0.16;
    const gripLen = L * 0.25;
    ctx.fillStyle = gripColor;
    ctx.beginPath();
    ctx.roundRect(gripStartX, -halfW - 0.5, gripLen, W + 1.0, 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.36)';
    ctx.lineWidth = 1.2;
    for (let gx = gripStartX + 3.5; gx < gripStartX + gripLen - 2; gx += 3.3) {
      ctx.beginPath();
      ctx.moveTo(gx, -halfW);
      ctx.lineTo(gx, halfW);
      ctx.stroke();
    }

    const metalCone = ctx.createLinearGradient(0, -halfW, 0, halfW);
    metalCone.addColorStop(0, '#fef3c7');
    metalCone.addColorStop(0.35, tipColor);
    metalCone.addColorStop(0.75, '#475569');
    metalCone.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = metalCone;
    ctx.beginPath();
    ctx.moveTo(coneStartX, -halfW * 0.92);
    ctx.lineTo(halfL - 3.5, -2.1);
    ctx.lineTo(halfL - 3.5, 2.1);
    ctx.lineTo(coneStartX, halfW * 0.92);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = inkColor;
    ctx.beginPath();
    ctx.arc(halfL - 1.6, 0, 1.9, 0, Math.PI * 2);
    ctx.fill();

    const capLen = L * 0.31;
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.roundRect(-halfL + 5, -halfW - 1.4, capLen, W + 2.8, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(-halfL + 10, -halfW - 2.6, capLen * 0.78, 2.4);
    ctx.fillStyle = clipColor;
    ctx.beginPath();
    ctx.roundRect(-halfL + 9, -halfW - 4.2, capLen * 0.78, 2.8, 1.5);
    ctx.fill();
  }

  ctx.save();
  ctx.font = '800 6.5px Nunito, sans-serif';
  ctx.fillStyle = (pen.transparent || pen.transparentBarrel || styleType === '4colour' || styleType === 'highlighter' || styleType === 'marker')
    ? 'rgba(30, 41, 59, 0.72)'
    : 'rgba(255, 255, 255, 0.78)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(barrelLabel, -L * 0.06, 0.5);
  ctx.restore();

  const cylGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
  cylGrad.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
  cylGrad.addColorStop(0.22, 'rgba(255, 255, 255, 0.54)');
  cylGrad.addColorStop(0.50, 'rgba(255, 255, 255, 0.0)');
  cylGrad.addColorStop(0.82, 'rgba(0, 0, 0, 0.25)');
  cylGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = cylGrad;
  ctx.beginPath();
  ctx.roundRect(-halfL + 2, -halfW, L * 0.88, W, 4);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.beginPath();
  ctx.roundRect(-halfL + 8, -halfW + 2.0, L * 0.76, 1.7, 1);
  ctx.fill();

  ctx.strokeStyle = 'rgba(43, 48, 42, 0.65)';
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.roundRect(-halfL + 2, -halfW, L * 0.88, W, 4);
  ctx.stroke();
}

export function renderPenToCanvas(
  ctx: CanvasRenderingContext2D,
  pen: PenConfig,
  worldX: number,
  worldY: number,
  angleRad: number,
  mode: 'real' | 'classic' = 'real',
  scale = 1.0,
  alpha = 1.0,
  level = 1
): void {
  const L = pen.lengthPx || (pen.dimensions ? pen.dimensions.lengthMeters * PIXELS_PER_METER : 154);
  const W = pen.widthPx || (pen.dimensions ? pen.dimensions.widthMeters * PIXELS_PER_METER : 14);
  const halfL = L / 2;
  const halfW = W / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // World-space drop shadow drawn BEFORE rotating the pen body
  if (mode === 'real' && scale > 0.75) {
    ctx.save();
    ctx.translate(worldX + 3.5, worldY + 6.5);
    ctx.scale(scale, scale);
    ctx.rotate(angleRad);
    ctx.fillStyle = 'rgba(20, 14, 8, 0.30)';
    ctx.beginPath();
    ctx.roundRect(-halfL - 1, -halfW - 0.5, L + 2, W + 1, halfW);
    ctx.fill();
    ctx.restore();
  }

  ctx.translate(worldX, worldY);
  ctx.scale(scale, scale);
  ctx.rotate(angleRad);

  const sprite = getOrBuildPenBodySprite(pen, mode, level);
  ctx.drawImage(
    sprite.canvas,
    -sprite.padW / 2,
    -sprite.padH / 2,
    sprite.padW,
    sprite.padH
  );

  ctx.restore();
}
