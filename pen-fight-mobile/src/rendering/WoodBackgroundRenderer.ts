/**
 * src/rendering/WoodBackgroundRenderer.ts
 * High-Fidelity 2x Retina Cached Wood Background Renderer.
 *
 * Renders the signature "Premium Dark Walnut" school desk surface with:
 * - Satin-finished dark walnut multi-planks (#2B160E base).
 * - Organic procedural wood grain fibers with subtle knots.
 * - Soft studio vignette (warm amber radial highlight at center, darkened edges).
 * - Zero-allocation cached canvas pattern for locked 60-120 FPS performance.
 */
import { Texture } from 'pixi.js';
import { DESIGN_TOKENS } from '../config/designTokens';

export class WoodBackgroundRenderer {
  private static cachedTexture: Texture | null = null;
  private static cachedWidth = 0;
  private static cachedHeight = 0;
  private static cachedStyle = '';

  /**
   * Generates or returns a cached Pixi Texture of the premium wood surface.
   */
  public static getWoodTexture(
    width: number,
    height: number,
    style: 'walnut' | 'honey_birch' | 'teak' = 'walnut'
  ): Texture {
    const w = Math.max(64, Math.round(width));
    const h = Math.max(64, Math.round(height));
    const key = `${w}x${h}_${style}`;

    if (this.cachedTexture && this.cachedStyle === key) {
      return this.cachedTexture;
    }

    if (this.cachedTexture) {
      this.cachedTexture.destroy(true);
      this.cachedTexture = null;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    this.renderWoodSurface(ctx, w, h, style);

    this.cachedTexture = Texture.from(canvas);
    this.cachedWidth = w;
    this.cachedHeight = h;
    this.cachedStyle = key;

    return this.cachedTexture;
  }

  /**
   * Directly draws the wood surface onto any HTML5 Canvas 2D context.
   */
  public static renderWoodSurface(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    style: 'walnut' | 'honey_birch' | 'teak' = 'walnut'
  ): void {
    ctx.save();

    // 1. Color Palette Definitions
    let baseColor: string;
    let plankTones: string[];
    let seamColor: string;
    let grainColor: string;
    let knotColor: string;
    let highlightColor: string;

    if (style === 'honey_birch') {
      // Scandinavian Blonde Birch (used in preview showcases)
      baseColor = '#D8BA93';
      plankTones = ['#DBBD96', '#D4B38C', '#DEC099', '#D1B088', '#D6B790'];
      seamColor = 'rgba(75, 42, 14, 0.22)';
      grainColor = 'rgba(110, 68, 28, 0.12)';
      knotColor = 'rgba(90, 52, 18, 0.25)';
      highlightColor = 'rgba(255, 250, 235, 0.22)';
    } else if (style === 'teak') {
      // Warm Classic Teak
      baseColor = '#C08E52';
      plankTones = ['#C49256', '#BD8A4E', '#C8965A', '#B9864A', '#C18F53'];
      seamColor = 'rgba(50, 28, 8, 0.28)';
      grainColor = 'rgba(85, 48, 16, 0.16)';
      knotColor = 'rgba(70, 38, 12, 0.32)';
      highlightColor = 'rgba(255, 238, 195, 0.20)';
    } else {
      // Signature Premium Dark Walnut
      baseColor = '#2B160E';
      plankTones = ['#2E180F', '#27130B', '#331B11', '#25120A', '#2D170E'];
      seamColor = 'rgba(12, 5, 2, 0.65)';
      grainColor = 'rgba(16, 7, 3, 0.38)';
      knotColor = 'rgba(10, 4, 2, 0.55)';
      highlightColor = 'rgba(215, 140, 65, 0.10)';
    }

    // 2. Base Fill
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // 3. Multi-Plank Vertical Sections
    const plankCount = Math.max(3, Math.round(w / 90));
    const plankW = w / plankCount;

    for (let p = 0; p < plankCount; p++) {
      const px = p * plankW;
      const tone = plankTones[p % plankTones.length];

      // Subtle vertical tone gradient
      const grad = ctx.createLinearGradient(px, 0, px + plankW, 0);
      grad.addColorStop(0, tone);
      grad.addColorStop(0.5, style === 'walnut' ? '#351D12' : tone);
      grad.addColorStop(1, tone);

      ctx.fillStyle = grad;
      ctx.fillRect(px, 0, plankW, h);

      // Plank Seam (Dark incision + Light bevel catch)
      if (p > 0) {
        ctx.fillStyle = seamColor;
        ctx.fillRect(px - 1, 0, 1.8, h);
        ctx.fillStyle = highlightColor;
        ctx.fillRect(px + 0.8, 0, 1, h);
      }
    }

    // 4. Fine Organic Grain Fibers
    ctx.strokeStyle = grainColor;
    ctx.lineWidth = 1.0;
    for (let gx = 4; gx < w; gx += 8) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      const waveAmp = 2.5 + (gx % 5);
      const waveFreq = 0.015 + (gx % 3) * 0.005;

      for (let y = 0; y <= h; y += 24) {
        const offset = Math.sin(y * waveFreq) * waveAmp;
        ctx.lineTo(gx + offset, y);
      }
      ctx.stroke();
    }

    // 5. Restrained Realistic Wood Knots
    const knotPositions = [
      { x: w * 0.22, y: h * 0.28, r: 18 },
      { x: w * 0.78, y: h * 0.68, r: 22 },
      { x: w * 0.45, y: h * 0.82, r: 15 },
    ];

    for (const knot of knotPositions) {
      ctx.save();
      ctx.translate(knot.x, knot.y);
      ctx.fillStyle = knotColor;

      ctx.beginPath();
      ctx.ellipse(0, 0, knot.r * 0.4, knot.r, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Knot rings
      ctx.strokeStyle = knotColor;
      ctx.lineWidth = 0.9;
      for (let ring = 1.6; ring <= 3.2; ring += 0.8) {
        ctx.beginPath();
        ctx.ellipse(0, 0, knot.r * 0.4 * ring, knot.r * ring, 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Studio Lighting: Radial Amber Warmth at Center
    const centerGrad = ctx.createRadialGradient(
      w * 0.5, h * 0.38, w * 0.1,
      w * 0.5, h * 0.38, Math.max(w, h) * 0.75
    );
    centerGrad.addColorStop(0, style === 'walnut' ? 'rgba(253, 230, 138, 0.09)' : 'rgba(255, 255, 255, 0.14)');
    centerGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
    centerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.42)'); // Subtle edge vignette
    ctx.fillStyle = centerGrad;
    ctx.fillRect(0, 0, w, h);

    // 7. Micro Top Edge Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, 0, w, 2.5);

    ctx.restore();
  }

  /**
   * Clears the cached texture when resizing or theme switching occurs.
   */
  public static clearCache(): void {
    if (this.cachedTexture) {
      this.cachedTexture.destroy(true);
      this.cachedTexture = null;
      this.cachedStyle = '';
    }
  }
}
