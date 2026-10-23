/**
 * src/ui/components/GameButton.ts
 * Reusable Tactile Neo-Brutalist 3D Button for PixiJS v8.
 *
 * Features:
 * - Solid 3D navy drop shadow with satisfying mechanical press feedback.
 * - Dynamic color theming (Gold hero, Action orange, Victory green, Cream neutral).
 * - Optional icon and subtext support.
 * - Pointerdown / pointerup / pointerupoutside lifecycle with safe event handling.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DESIGN_TOKENS } from '../../config/designTokens';
import { soundManager, SoundEffect } from '../../audio/SoundAndHaptics';

export interface GameButtonOptions {
  width?: number;
  height?: number;
  label: string;
  sublabel?: string;
  icon?: string;
  bgColor?: number;
  textColor?: number;
  fontSize?: number;
  radius?: number;
  shadowOffset?: number;
  soundName?: SoundEffect;
  disabled?: boolean;
  onClick?: () => void;
}

export class GameButton extends Container {
  private surface: Graphics;
  private shadow: Graphics;
  private labelText: Text;
  private subText?: Text;
  private iconText?: Text;

  private btnWidth: number;
  private btnHeight: number;
  private radius: number;
  private shadowOffset: number;
  private bgColor: number;
  private disabled = false;
  private onClickHandler?: () => void;
  private soundName: SoundEffect;

  constructor(options: GameButtonOptions) {
    super();

    this.btnWidth = options.width ?? 160;
    this.btnHeight = options.height ?? DESIGN_TOKENS.sizes.buttonHeightLg;
    this.radius = options.radius ?? DESIGN_TOKENS.radii.md;
    this.shadowOffset = options.shadowOffset ?? DESIGN_TOKENS.shadows.buttonOffset;
    this.bgColor = options.bgColor ?? DESIGN_TOKENS.colors.premiumGold;
    this.disabled = options.disabled ?? false;
    this.soundName = options.soundName ?? 'ui_click';
    this.onClickHandler = options.onClick;

    // 1. Solid 3D Drop Shadow
    this.shadow = new Graphics();
    this.addChild(this.shadow);

    // 2. Button Top Surface
    this.surface = new Graphics();
    this.addChild(this.surface);

    // 3. Label Text
    const textStyle = new TextStyle({
      fontFamily: DESIGN_TOKENS.typography.fontHeading,
      fontSize: options.fontSize ?? DESIGN_TOKENS.typography.sizes.titleSmall,
      fill: options.textColor ?? DESIGN_TOKENS.colors.navyOutline,
      fontWeight: 'bold',
      align: 'center',
    });
    this.labelText = new Text({ text: options.label, style: textStyle });
    this.labelText.anchor.set(0.5, 0.5);
    this.surface.addChild(this.labelText);

    // 4. Sublabel if provided
    if (options.sublabel) {
      const subStyle = new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontBody,
        fontSize: DESIGN_TOKENS.typography.sizes.bodySmall,
        fill: DESIGN_TOKENS.colors.textSecondary,
        fontWeight: 'bold',
      });
      this.subText = new Text({ text: options.sublabel, style: subStyle });
      this.subText.anchor.set(0.5, 0);
      this.surface.addChild(this.subText);
    }

    // 5. Icon if provided
    if (options.icon) {
      const iconStyle = new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: (options.fontSize ?? DESIGN_TOKENS.typography.sizes.titleSmall) + 2,
        fill: options.textColor ?? DESIGN_TOKENS.colors.navyOutline,
      });
      this.iconText = new Text({ text: options.icon, style: iconStyle });
      this.iconText.anchor.set(0.5, 0.5);
      this.surface.addChild(this.iconText);
    }

    this.draw();
    this.setupInteractivity();
  }

  public setLabel(text: string): void {
    this.labelText.text = text;
    this.draw();
  }

  public setDisabled(disabled: boolean): void {
    this.disabled = disabled;
    this.eventMode = disabled ? 'none' : 'static';
    this.cursor = disabled ? 'default' : 'pointer';
    this.alpha = disabled ? 0.6 : 1.0;
    this.draw();
  }

  public setDimensions(width: number, height: number): void {
    this.btnWidth = width;
    this.btnHeight = height;
    this.draw();
  }

  private draw(): void {
    const w = this.btnWidth;
    const h = this.btnHeight;
    const r = this.radius;
    const s = this.shadowOffset;
    const isDis = this.disabled;

    // Shadow
    this.shadow.clear();
    this.shadow
      .roundRect(-w / 2, s, w, h, r)
      .fill({ color: DESIGN_TOKENS.colors.navyShadow });

    // Surface
    this.surface.clear();
    this.surface
      .roundRect(-w / 2, 0, w, h, r)
      .fill({ color: isDis ? DESIGN_TOKENS.colors.creamMuted : this.bgColor })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thick });

    // Inner top highlight bevel
    this.surface
      .roundRect(-w / 2 + 3, 2, w - 6, h * 0.45, r - 2)
      .fill({ color: 0xFFFFFF, alpha: isDis ? 0.05 : 0.22 });

    // Positioning contents
    if (this.subText) {
      this.labelText.y = h * 0.38;
      this.subText.y = h * 0.62;
    } else {
      this.labelText.y = h * 0.5;
    }

    if (this.iconText) {
      this.iconText.x = -w * 0.32;
      this.iconText.y = h * 0.5;
      this.labelText.x = 8;
    } else {
      this.labelText.x = 0;
    }
  }

  private setupInteractivity(): void {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', (e) => {
      e.stopPropagation();
      if (this.disabled) return;
      this.surface.y = this.shadowOffset * 0.75;
      this.scale.set(DESIGN_TOKENS.motion.pressScale);
    });

    const release = () => {
      this.surface.y = 0;
      this.scale.set(1.0);
    };

    this.on('pointerup', (e) => {
      e.stopPropagation();
      if (this.disabled) return;
      release();
      soundManager.play(this.soundName);
      if (this.onClickHandler) this.onClickHandler();
    });

    this.on('pointerupoutside', release);
    this.on('pointercancel', release);
  }
}
