/**
 * src/ui/components/GameCard.ts
 * Reusable Tactile Container Card with 3D shadow and navy outline.
 * Used for modals, panels, preview stages, and action grids.
 */
import { Container, Graphics } from 'pixi.js';
import { DESIGN_TOKENS } from '../../config/designTokens';

export interface GameCardOptions {
  width: number;
  height: number;
  radius?: number;
  bgColor?: number;
  borderColor?: number;
  borderWidth?: number;
  shadowOffset?: number;
  hasTopHighlight?: boolean;
}

export class GameCard extends Container {
  public surface: Graphics;
  public shadow: Graphics;

  private cardWidth: number;
  private cardHeight: number;
  private radius: number;
  private bgColor: number;
  private borderColor: number;
  private borderWidth: number;
  private shadowOffset: number;
  private hasTopHighlight: boolean;

  constructor(options: GameCardOptions) {
    super();

    this.cardWidth = options.width;
    this.cardHeight = options.height;
    this.radius = options.radius ?? DESIGN_TOKENS.radii.xl;
    this.bgColor = options.bgColor ?? DESIGN_TOKENS.colors.creamSurface;
    this.borderColor = options.borderColor ?? DESIGN_TOKENS.colors.navyOutline;
    this.borderWidth = options.borderWidth ?? DESIGN_TOKENS.borders.thick;
    this.shadowOffset = options.shadowOffset ?? DESIGN_TOKENS.shadows.cardOffset;
    this.hasTopHighlight = options.hasTopHighlight ?? true;

    this.shadow = new Graphics();
    this.addChild(this.shadow);

    this.surface = new Graphics();
    this.addChild(this.surface);

    this.draw();
  }

  public resize(width: number, height: number): void {
    this.cardWidth = width;
    this.cardHeight = height;
    this.draw();
  }

  public setBgColor(color: number): void {
    this.bgColor = color;
    this.draw();
  }

  public draw(): void {
    const w = this.cardWidth;
    const h = this.cardHeight;
    const r = this.radius;
    const s = this.shadowOffset;

    // 3D Navy Shadow
    this.shadow.clear();
    this.shadow
      .roundRect(-w / 2, -h / 2 + s, w, h, r)
      .fill({ color: DESIGN_TOKENS.colors.navyShadow });

    // Surface
    this.surface.clear();
    this.surface
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill({ color: this.bgColor })
      .stroke({ color: this.borderColor, width: this.borderWidth });

    // Subtle top highlight catch
    if (this.hasTopHighlight) {
      this.surface
        .roundRect(-w / 2 + 4, -h / 2 + 3, w - 8, Math.min(24, h * 0.15), r - 2)
        .fill({ color: 0xFFFFFF, alpha: 0.16 });
    }
  }
}
