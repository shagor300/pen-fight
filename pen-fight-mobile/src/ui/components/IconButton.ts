/**
 * src/ui/components/IconButton.ts
 * Reusable Tactile Icon Button for PixiJS v8.
 * Used for Back ⇦, Close ✕, Sound 🔊, Help ?, and Settings ⚙️.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DESIGN_TOKENS } from '../../config/designTokens';
import { soundManager, SoundEffect } from '../../audio/SoundAndHaptics';

export interface IconButtonOptions {
  size?: number;
  icon: string;
  isCircular?: boolean;
  bgColor?: number;
  textColor?: number;
  fontSize?: number;
  soundName?: SoundEffect;
  onClick?: () => void;
}

export class IconButton extends Container {
  private surface: Graphics;
  private shadow: Graphics;
  private iconText: Text;

  private size: number;
  private isCircular: boolean;
  private bgColor: number;
  private onClickHandler?: () => void;
  private soundName: SoundEffect;

  constructor(options: IconButtonOptions) {
    super();

    this.size = options.size ?? DESIGN_TOKENS.sizes.iconButtonMd;
    this.isCircular = options.isCircular ?? false;
    this.bgColor = options.bgColor ?? DESIGN_TOKENS.colors.creamSurface;
    this.soundName = options.soundName ?? 'ui_click';
    this.onClickHandler = options.onClick;

    this.shadow = new Graphics();
    this.addChild(this.shadow);

    this.surface = new Graphics();
    this.addChild(this.surface);

    const style = new TextStyle({
      fontFamily: DESIGN_TOKENS.typography.fontHeading,
      fontSize: options.fontSize ?? Math.round(this.size * 0.48),
      fill: options.textColor ?? DESIGN_TOKENS.colors.navyOutline,
      fontWeight: 'bold',
      align: 'center',
    });
    this.iconText = new Text({ text: options.icon, style });
    this.iconText.anchor.set(0.5, 0.5);
    this.surface.addChild(this.iconText);

    this.draw();
    this.setupInteractivity();
  }

  public setIcon(icon: string): void {
    this.iconText.text = icon;
  }

  public setBgColor(color: number): void {
    this.bgColor = color;
    this.draw();
  }

  private draw(): void {
    const s = this.size;
    const offset = DESIGN_TOKENS.shadows.sm;
    const r = this.isCircular ? s / 2 : DESIGN_TOKENS.radii.sm;

    this.shadow.clear();
    if (this.isCircular) {
      this.shadow
        .circle(0, offset, r)
        .fill({ color: DESIGN_TOKENS.colors.navyShadow });
    } else {
      this.shadow
        .roundRect(-s / 2, -s / 2 + offset, s, s, r)
        .fill({ color: DESIGN_TOKENS.colors.navyShadow });
    }

    this.surface.clear();
    if (this.isCircular) {
      this.surface
        .circle(0, 0, r)
        .fill({ color: this.bgColor })
        .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.normal });
      // Inner highlight
      this.surface
        .circle(0, -r * 0.35, r * 0.45)
        .fill({ color: 0xFFFFFF, alpha: 0.18 });
    } else {
      this.surface
        .roundRect(-s / 2, -s / 2, s, s, r)
        .fill({ color: this.bgColor })
        .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.normal });
      // Inner highlight
      this.surface
        .roundRect(-s / 2 + 2, -s / 2 + 2, s - 4, s * 0.4, r - 2)
        .fill({ color: 0xFFFFFF, alpha: 0.18 });
    }
  }

  private setupInteractivity(): void {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', (e) => {
      e.stopPropagation();
      this.surface.y = 2;
      this.scale.set(DESIGN_TOKENS.motion.pressScale);
    });

    const release = () => {
      this.surface.y = 0;
      this.scale.set(1.0);
    };

    this.on('pointerup', (e) => {
      e.stopPropagation();
      release();
      soundManager.play(this.soundName);
      if (this.onClickHandler) this.onClickHandler();
    });

    this.on('pointerupoutside', release);
    this.on('pointercancel', release);
  }
}
