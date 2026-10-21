/**
 * RealPenRenderer.ts
 * 8-Layer Photorealistic Procedural Pen Renderer with World-Space Drop Shadows.
 */
import { PenConfig } from '../config/pensConfig';

export const PIXELS_PER_METER = 100;

export function renderPenToCanvas(
  ctx: CanvasRenderingContext2D,
  pen: PenConfig,
  worldX: number,
  worldY: number,
  angleRad: number,
  mode: 'real' | 'classic',
  scale = 1.0,
  alpha = 1.0,
): void {
  const L = (pen.dimensions ? pen.dimensions.lengthMeters * PIXELS_PER_METER : pen.lengthPx) || 150;
  const W = (pen.dimensions ? pen.dimensions.widthMeters * PIXELS_PER_METER : pen.widthPx) || 14;
  const halfL = L / 2;
  const halfW = W / 2;

  const primaryColor = pen.colors.primary || pen.colors.barrel || '#e2e8f0';
  const secondaryColor = pen.colors.secondary || pen.colors.cap || '#ea580c';
  const tipColor = pen.colors.tip || '#d97706';
  const gripColor = pen.colors.grip || '#cbd5e1';
  const inkColor = pen.colors.ink || '#1e3a8a';
  const barrelLabel = pen.barrelText || pen.name || 'PEN';

  ctx.save();
  ctx.globalAlpha = alpha;

  // =========================================================================
  // LAYER 1: WORLD-SPACE SOFT DROP SHADOW (Does NOT invert when pen spins!)
  // =========================================================================
  if (mode === 'real' && scale > 0.85) {
    ctx.save();
    ctx.translate(worldX + 5, worldY + 8);
    ctx.scale(scale, scale);
    ctx.rotate(angleRad);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
    ctx.filter = 'blur(4px)';
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, L, W, halfW);
    ctx.fill();
    ctx.restore();
  }

  // Transform into pen local rotated coordinate system
  ctx.translate(worldX, worldY);
  ctx.scale(scale, scale);
  ctx.rotate(angleRad);

  if (mode === 'classic') {
    // CLASSIC MODE: Crisp vector cartoon style with bold dark outline
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.78, -halfW, L * 0.78, W, 5);
    ctx.fill();

    ctx.fillStyle = gripColor;
    ctx.fillRect(halfL * 0.25, -halfW, L * 0.22, W);

    ctx.fillStyle = secondaryColor;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW - 1.5, L * 0.32, W + 3, 4);
    ctx.fill();

    ctx.fillStyle = tipColor;
    ctx.beginPath();
    ctx.moveTo(halfL * 0.78, -halfW);
    ctx.lineTo(halfL, -2);
    ctx.lineTo(halfL, 2);
    ctx.lineTo(halfL * 0.78, halfW);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, L, W, 5);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // =========================================================================
  // REAL MODE: 8-LAYER PHOTOREALISTIC PROCEDURAL 3D SHADING
  // =========================================================================

  // LAYER 2: TRANSLUCENT OR METALLIC OUTER BARREL BASE
  const barrelLen = L * 0.76;
  const barrelStartX = -halfL * 0.76;

  if (pen.transparent || pen.transparentBarrel) {
    // Clear plastic casing with glass highlights
    const clearGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
    clearGrad.addColorStop(0, 'rgba(226, 232, 240, 0.75)');
    clearGrad.addColorStop(0.3, 'rgba(248, 250, 252, 0.42)');
    clearGrad.addColorStop(0.7, 'rgba(203, 213, 225, 0.48)');
    clearGrad.addColorStop(1, 'rgba(100, 116, 139, 0.78)');
    ctx.fillStyle = clearGrad;
    ctx.beginPath();
    ctx.roundRect(barrelStartX, -halfW, barrelLen, W, 4);
    ctx.fill();

    // LAYER 3: INNER VISIBLE INK REFILL TUBE & BRASS ADAPTER
    const inkTubeW = W * 0.36;
    ctx.fillStyle = inkColor;
    ctx.fillRect(barrelStartX + 10, -inkTubeW / 2, barrelLen * 0.68, inkTubeW);
    // Brass refill holder
    ctx.fillStyle = '#D97706';
    ctx.fillRect(barrelStartX + 10 + barrelLen * 0.68, -inkTubeW / 2, 8, inkTubeW);
  } else {
    // Opaque lacquered / metallic cylindrical body
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(barrelStartX, -halfW, barrelLen, W, 4);
    ctx.fill();
  }

  // Barrel micro-label ("GEL 0.5", "BALL 0.7", etc.)
  ctx.save();
  ctx.font = 'bold 6.5px Nunito, sans-serif';
  ctx.fillStyle = (pen.transparent || pen.transparentBarrel) ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.65)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(barrelLabel, -L * 0.05, 0);
  ctx.restore();

  // LAYER 4: GROOVED RUBBER GRIP WITH MICRO-RIDGES
  const gripStartX = halfL * 0.18;
  const gripLen = L * 0.24;
  ctx.fillStyle = gripColor;
  ctx.beginPath();
  ctx.roundRect(gripStartX, -halfW - 0.6, gripLen, W + 1.2, 2);
  ctx.fill();

  // Draw tactile rubber ridges
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.lineWidth = 1.2;
  for (let gx = gripStartX + 3; gx < gripStartX + gripLen - 2; gx += 3.2) {
    ctx.beginPath();
    ctx.moveTo(gx, -halfW);
    ctx.lineTo(gx, halfW);
    ctx.stroke();
  }

  // LAYER 5: METALLIC CONE & PRECISION NIB (+X Tip)
  const coneStartX = halfL * 0.66;
  const metalGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
  metalGrad.addColorStop(0, '#F8FAFC');
  metalGrad.addColorStop(0.35, tipColor);
  metalGrad.addColorStop(0.7, '#475569');
  metalGrad.addColorStop(1, '#CBD5E1');

  ctx.fillStyle = metalGrad;
  ctx.beginPath();
  ctx.moveTo(coneStartX, -halfW * 0.92);
  ctx.lineTo(halfL - 3, -2.2);
  ctx.lineTo(halfL - 3, 2.2);
  ctx.lineTo(coneStartX, halfW * 0.92);
  ctx.closePath();
  ctx.fill();

  // Tungsten ballpoint micro-tip
  ctx.fillStyle = inkColor;
  ctx.beginPath();
  ctx.arc(halfL - 1.5, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // LAYER 6: 3D CAP, POCKET CLIP & END PLUG (-X Cap)
  const capLen = L * 0.32;
  ctx.fillStyle = secondaryColor;
  ctx.beginPath();
  ctx.roundRect(-halfL, -halfW - 1.5, capLen, W + 3, 4);
  ctx.fill();

  // Raised Pocket Clip with its own mini shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-halfL + 6, -halfW - 2.8, capLen * 0.78, 2.5);
  ctx.fillStyle = tipColor;
  ctx.beginPath();
  ctx.roundRect(-halfL + 5, -halfW - 4.2, capLen * 0.78, 2.8, 1.5);
  ctx.fill();

  // LAYER 7: CYLINDRICAL 3D SHADING OVERLAY (Top highlight -> bottom core shadow)
  const cylGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
  cylGrad.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
  cylGrad.addColorStop(0.22, 'rgba(255, 255, 255, 0.52)');
  cylGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
  cylGrad.addColorStop(0.82, 'rgba(0, 0, 0, 0.28)');
  cylGrad.addColorStop(1, 'rgba(0, 0, 0, 0.48)');
  ctx.fillStyle = cylGrad;
  ctx.beginPath();
  ctx.roundRect(-halfL, -halfW, L * 0.9, W, 4);
  ctx.fill();

  // LAYER 8: CRISP SPECULAR GLINT (Classroom fluorescent light reflection strip)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
  ctx.beginPath();
  ctx.roundRect(-halfL + 4, -halfW + 2.2, L * 0.82, 1.8, 1);
  ctx.fill();

  ctx.restore();
}
