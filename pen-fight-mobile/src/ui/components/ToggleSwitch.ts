/**
 * src/ui/components/ToggleSwitch.ts
 * Reusable Tactile Toggle Capsule Switch with sliding knob for PixiJS v8.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DESIGN_TOKENS } from '../../config/designTokens';
import { soundManager } from '../../audio/SoundAndHaptics';

export interface ToggleSwitchOptions {
  width: number;
  height?: number;
  label: string;
  initialValue?: boolean;
  onToggle?: (value: boolean) => void;
}

export class ToggleSwitch extends Container {
  private bgGraphics: Graphics;
  private labelText: Text;
  private switchTrack: Graphics;
  private switchKnob: Graphics;

  private switchWidth: number;
  private switchHeight: number;
  private value = false;
  private onToggleCallback?: (val: boolean) => void;

  constructor(options: ToggleSwitchOptions) {
    super();

    this.switchWidth = options.width;
    this.switchHeight = options.height ?? 30;
    this.value = options.initialValue ?? false;
    this.onToggleCallback = options.onToggle;

    this.bgGraphics = new Graphics();
    this.addChild(this.bgGraphics);

    const textStyle = new TextStyle({
      fontFamily: DESIGN_TOKENS.typography.fontHeading,
      fontSize: 11,
      fill: DESIGN_TOKENS.colors.navyOutline,
      fontWeight: 'bold',
    });
    this.labelText = new Text({ text: options.label, style: textStyle });
    this.labelText.anchor.set(0, 0.5);
    this.addChild(this.labelText);

    this.switchTrack = new Graphics();
    this.addChild(this.switchTrack);

    this.switchKnob = new Graphics();
    this.addChild(this.switchKnob);

    this.draw();
    this.setupInteractivity();
  }

  public setValue(val: boolean): void {
    if (this.value === val) return;
    this.value = val;
    this.draw();
  }

  public getValue(): boolean {
    return this.value;
  }

  private draw(): void {
    const w = this.switchWidth;
    const h = this.switchHeight;
    const r = DESIGN_TOKENS.radii.sm;

    // Card background
    this.bgGraphics.clear();
    this.bgGraphics
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill({ color: this.value ? 0xDCFCE7 : DESIGN_TOKENS.colors.creamSecondary })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.normal });

    // Label on left
    this.labelText.x = -w / 2 + 10;
    this.labelText.y = 0;

    // Capsule switch track on right
    const trackW = 32;
    const trackH = 18;
    const trackX = w / 2 - trackW - 8;
    const trackY = -trackH / 2;

    this.switchTrack.clear();
    this.switchTrack
      .roundRect(trackX, trackY, trackW, trackH, trackH / 2)
      .fill({ color: this.value ? DESIGN_TOKENS.colors.victoryGreen : 0xD1D5DB })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: 1.6 });

    // Sliding knob
    const knobR = trackH / 2 - 2;
    const knobX = this.value ? trackX + trackW - knobR - 2.5 : trackX + knobR + 2.5;
    const knobY = 0;

    this.switchKnob.clear();
    this.switchKnob
      .circle(knobX, knobY, knobR)
      .fill({ color: 0xFFFFFF })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: 1.4 });
  }

  private setupInteractivity(): void {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      this.value = !this.value;
      this.draw();
      if (this.onToggleCallback) this.onToggleCallback(this.value);
    });
  }
}
