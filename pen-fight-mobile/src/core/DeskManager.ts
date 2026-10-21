/**
 * DeskManager.ts
 * Manages the desk visuals: wooden texture, bounds, shrinking,
 * and the red-dashed warning lines.
 */
import { Container, Graphics } from 'pixi.js';
import {
  DESK_WIDTH,
  DESK_HEIGHT,
  SHRINK_PERCENT,
  COLORS,
} from '../config/gameConstants';

export interface DeskBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export class DeskManager {
  public container: Container;
  private deskGraphics: Graphics;
  private woodGrainGraphics: Graphics;
  private warningGraphics: Graphics;
  private edgeGraphics: Graphics;

  private baseWidth: number;
  private baseHeight: number;
  private currentScale = 1;
  private shrinkCount = 0;

  /** Current live bounds (in px, world coords) */
  public bounds: DeskBounds;

  constructor(screenWidth: number, screenHeight: number) {
    // Scale desk to fit screen width with padding
    const padding = 30;
    const scaleToFit = Math.min(
      (screenWidth - padding * 2) / DESK_WIDTH,
      (screenHeight * 0.65) / DESK_HEIGHT,
    );
    this.baseWidth = DESK_WIDTH * scaleToFit;
    this.baseHeight = DESK_HEIGHT * scaleToFit;

    this.container = new Container();

    // Drop shadow under the desk
    const shadow = new Graphics()
      .roundRect(-8, -4, this.baseWidth + 16, this.baseHeight + 16, 14)
      .fill({ color: 0x000000, alpha: 0.3 });
    this.container.addChild(shadow);

    // Wood desk surface
    this.deskGraphics = new Graphics();
    this.container.addChild(this.deskGraphics);

    // Wood grain lines
    this.woodGrainGraphics = new Graphics();
    this.container.addChild(this.woodGrainGraphics);

    // Desk edge (border)
    this.edgeGraphics = new Graphics();
    this.container.addChild(this.edgeGraphics);

    // Warning dashed lines
    this.warningGraphics = new Graphics();
    this.warningGraphics.visible = false;
    this.container.addChild(this.warningGraphics);

    // Position desk centered horizontally, upper area of screen
    this.container.x = (screenWidth - this.baseWidth) / 2;
    this.container.y = screenHeight * 0.12;

    this.bounds = this.calculateBounds();
    this.draw();
  }

  private calculateBounds(): DeskBounds {
    const w = this.baseWidth * this.currentScale;
    const h = this.baseHeight * this.currentScale;
    const offsetX = (this.baseWidth - w) / 2;
    const offsetY = (this.baseHeight - h) / 2;
    const left = this.container.x + offsetX;
    const top = this.container.y + offsetY;
    return {
      left,
      right: left + w,
      top,
      bottom: top + h,
      width: w,
      height: h,
      centerX: left + w / 2,
      centerY: top + h / 2,
    };
  }

  public deskStyle: 'clean' | 'old_school' = 'clean';

  public setStyle(style: 'clean' | 'old_school'): void {
    if (this.deskStyle !== style) {
      this.deskStyle = style;
      this.draw();
    }
  }

  private draw(): void {
    const w = this.baseWidth * this.currentScale;
    const h = this.baseHeight * this.currentScale;
    const offsetX = (this.baseWidth - w) / 2;
    const offsetY = (this.baseHeight - h) / 2;

    const isOldSchool = this.deskStyle === 'old_school';
    const surfaceColor = isOldSchool ? 0xC8894A : COLORS.woodLight;

    // ── Desk surface ────────────────────────────────────
    this.deskGraphics.clear()
      .roundRect(offsetX, offsetY, w, h, 10)
      .fill({ color: surfaceColor });

    // ── Wood grain texture lines ────────────────────────
    const wg = this.woodGrainGraphics;
    wg.clear();
    const grainSpacing = 28;
    for (let y = offsetY + 15; y < offsetY + h - 5; y += grainSpacing) {
      wg.moveTo(offsetX + 8, y);
      for (let x = offsetX + 28; x < offsetX + w - 8; x += 20) {
        const wavyY = y + Math.sin(x * 0.02 + y * 0.1) * 2.5;
        wg.lineTo(x, wavyY);
      }
      const grainAlpha = isOldSchool ? 0.09 : (0.06 + Math.random() * 0.04);
      wg.stroke({ color: COLORS.woodDark, width: 1, alpha: grainAlpha });
    }

    // Add some darker knot spots
    for (let i = 0; i < 3; i++) {
      const kx = offsetX + w * 0.2 + (i * 0.3) * w * 0.7;
      const ky = offsetY + h * 0.2 + (i * 0.25) * h * 0.7;
      wg.ellipse(kx, ky, 14, 5)
        .fill({ color: COLORS.woodMid, alpha: isOldSchool ? 0.22 : 0.15 });
    }

    // ── Old School Desk Doodles & Carvings ────────────────
    if (isOldSchool) {
      // 1. Compass scratch circle (top right)
      const cx = offsetX + w * 0.78;
      const cy = offsetY + h * 0.28;
      wg.circle(cx, cy, 26)
        .stroke({ color: 0x5C381E, width: 1.5, alpha: 0.35 });
      wg.moveTo(cx, cy - 26).lineTo(cx, cy + 26)
        .stroke({ color: 0x5C381E, width: 1, alpha: 0.3 });
      wg.moveTo(cx - 26, cy).lineTo(cx + 26, cy)
        .stroke({ color: 0x5C381E, width: 1, alpha: 0.3 });

      // 2. Tic-Tac-Toe carved scratches (bottom left)
      const tx = offsetX + w * 0.18;
      const ty = offsetY + h * 0.72;
      wg.moveTo(tx - 15, ty - 5).lineTo(tx + 15, ty - 5)
        .stroke({ color: 0x5C381E, width: 1.5, alpha: 0.4 });
      wg.moveTo(tx - 15, ty + 5).lineTo(tx + 15, ty + 5)
        .stroke({ color: 0x5C381E, width: 1.5, alpha: 0.4 });
      wg.moveTo(tx - 5, ty - 15).lineTo(tx - 5, ty + 15)
        .stroke({ color: 0x5C381E, width: 1.5, alpha: 0.4 });
      wg.moveTo(tx + 5, ty - 15).lineTo(tx + 5, ty + 15)
        .stroke({ color: 0x5C381E, width: 1.5, alpha: 0.4 });

      // Tiny carved 'X' and 'O'
      wg.moveTo(tx - 11, ty - 11).lineTo(tx - 7, ty - 7)
        .stroke({ color: 0x5C381E, width: 1.2, alpha: 0.4 });
      wg.circle(tx + 9, ty + 9, 3)
        .stroke({ color: 0x5C381E, width: 1.2, alpha: 0.4 });

      // 3. Ruler / pencil scratches
      wg.moveTo(offsetX + w * 0.4, offsetY + 25)
        .lineTo(offsetX + w * 0.65, offsetY + 32)
        .stroke({ color: 0x5C381E, width: 1, alpha: 0.35 });
    }

    // ── Desk edge border ────────────────────────────────
    this.edgeGraphics.clear()
      .roundRect(offsetX, offsetY, w, h, 10)
      .stroke({ color: COLORS.deskEdge, width: 4 })
      .roundRect(offsetX + 3, offsetY + 3, w - 6, h - 6, 8)
      .stroke({ color: isOldSchool ? 0xD4B072 : 0xE8C88A, width: 1, alpha: 0.4 });
  }

  /** Show warning dashed lines for upcoming shrink */
  showShrinkWarning(): void {
    const nextScale = this.currentScale - SHRINK_PERCENT;
    const nextW = this.baseWidth * nextScale;
    const nextH = this.baseHeight * nextScale;
    const offsetX = (this.baseWidth - nextW) / 2;
    const offsetY = (this.baseHeight - nextH) / 2;

    const wg = this.warningGraphics;
    wg.clear();

    // Draw dashed rectangle at future bounds
    const dashLen = 10;
    const gapLen = 6;
    const sides = [
      { x1: offsetX, y1: offsetY, x2: offsetX + nextW, y2: offsetY },
      { x1: offsetX + nextW, y1: offsetY, x2: offsetX + nextW, y2: offsetY + nextH },
      { x1: offsetX + nextW, y1: offsetY + nextH, x2: offsetX, y2: offsetY + nextH },
      { x1: offsetX, y1: offsetY + nextH, x2: offsetX, y2: offsetY },
    ];

    for (const side of sides) {
      const dx = side.x2 - side.x1;
      const dy = side.y2 - side.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len;
      const uy = dy / len;

      let pos = 0;
      let isDash = true;
      while (pos < len) {
        const segLen = isDash ? dashLen : gapLen;
        const end = Math.min(pos + segLen, len);
        if (isDash) {
          wg.moveTo(side.x1 + ux * pos, side.y1 + uy * pos)
            .lineTo(side.x1 + ux * end, side.y1 + uy * end)
            .stroke({ color: COLORS.danger, width: 2.5, alpha: 0.8 });
        }
        pos = end;
        isDash = !isDash;
      }
    }

    wg.visible = true;
  }

  /** Hide warning lines */
  hideShrinkWarning(): void {
    this.warningGraphics.visible = false;
  }

  /** Animate desk shrinking by SHRINK_PERCENT */
  shrink(duration = 600): Promise<void> {
    return new Promise((resolve) => {
      this.shrinkCount++;
      const targetScale = 1 - this.shrinkCount * SHRINK_PERCENT;
      const startScale = this.currentScale;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3);

        this.currentScale = startScale + (targetScale - startScale) * eased;
        this.bounds = this.calculateBounds();
        this.draw();

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.hideShrinkWarning();
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  /** Reset desk to full size */
  reset(): void {
    this.shrinkCount = 0;
    this.currentScale = 1;
    this.bounds = this.calculateBounds();
    this.draw();
    this.hideShrinkWarning();
  }

  /** Get the desk center in world pixels */
  getCenter(): { x: number; y: number } {
    return {
      x: this.bounds.centerX,
      y: this.bounds.centerY,
    };
  }
}
