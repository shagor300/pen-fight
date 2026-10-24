/**
 * src/ui/components/ScreenScaffold.ts
 * Shared full-screen frame for destination screens (Match Setup, Missions,
 * Stats, Records): walnut desk background, header with Back button, title and
 * the PEN chip. Content is laid out by the screen under `scaffold.body`.
 *
 * The wood texture is re-fetched on every layout() so a resize can never
 * leave a sprite pointing at a destroyed cached texture.
 */
import { Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import { DESIGN_TOKENS } from '../../config/designTokens';
import { WoodBackgroundRenderer } from '../../rendering/WoodBackgroundRenderer';
import { IconButton } from './IconButton';
import { PenChip } from './PenChip';

export interface SafeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Read the device safe-area insets (notch, gesture bar). Falls back to 0. */
export function getSafeInsets(): SafeInsets {
  const zero: SafeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  try {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const out: SafeInsets = {
      top: parseFloat(cs.paddingTop) || 0,
      right: parseFloat(cs.paddingRight) || 0,
      bottom: parseFloat(cs.paddingBottom) || 0,
      left: parseFloat(cs.paddingLeft) || 0,
    };
    document.body.removeChild(probe);
    return out;
  } catch {
    return zero;
  }
}

export interface ScaffoldOptions {
  title: string;
  onBack: () => void;
  showPenChip?: boolean;
  onChipTap?: () => void;
}

export class ScreenScaffold {
  public container = new Container();
  /** Put screen content here. Origin = top-left of the screen. */
  public body = new Container();

  private bg = new Sprite();
  private header = new Container();
  private backBtn: IconButton;
  private titleShadow: Text;
  private titleText: Text;
  private chip: PenChip | null = null;

  /** Filled by layout(): where content may start / end and its width. */
  public contentTop = 0;
  public contentBottom = 0;
  public width = 0;
  public height = 0;
  public inset: number = DESIGN_TOKENS.space.s16;

  constructor(opts: ScaffoldOptions) {
    this.container.visible = false;
    this.container.addChild(this.bg);
    this.container.addChild(this.body);
    this.container.addChild(this.header);

    // Swallow touches so nothing underneath reacts.
    this.bg.eventMode = 'static';

    this.backBtn = new IconButton({
      size: DESIGN_TOKENS.touch.min,
      icon: '←',
      isCircular: true,
      bgColor: DESIGN_TOKENS.colors.premiumGold,
      onClick: opts.onBack,
    });
    this.header.addChild(this.backBtn);

    const mk = (fill: number): Text =>
      new Text({
        text: opts.title,
        style: new TextStyle({
          fontFamily: DESIGN_TOKENS.type.displayMedium.family,
          fontSize: 22,
          fill,
          fontWeight: 'bold',
          stroke: fill === DESIGN_TOKENS.colors.navyShadow ? { color: fill, width: 4 } : undefined,
        }),
      });
    this.titleShadow = mk(DESIGN_TOKENS.colors.navyShadow);
    this.titleShadow.anchor.set(0.5, 0.5);
    this.titleText = mk(DESIGN_TOKENS.colors.textOnDark);
    this.titleText.anchor.set(0.5, 0.5);
    this.header.addChild(this.titleShadow, this.titleText);

    if (opts.showPenChip !== false) {
      this.chip = new PenChip({ height: 32, onTap: opts.onChipTap });
      this.header.addChild(this.chip);
    }
  }

  public setTitle(title: string): void {
    this.titleText.text = title;
    this.titleShadow.text = title;
  }

  public show(): void {
    this.container.visible = true;
  }

  public hide(): void {
    this.container.visible = false;
  }

  public get visible(): boolean {
    return this.container.visible;
  }

  public layout(w: number, h: number): void {
    this.width = w;
    this.height = h;
    const safe = getSafeInsets();
    const S = DESIGN_TOKENS.space;
    this.inset = Math.max(S.s16, safe.left, safe.right);

    this.bg.texture = WoodBackgroundRenderer.getWoodTexture(w, h, 'walnut');
    this.bg.width = w;
    this.bg.height = h;

    const top = Math.max(S.s12, safe.top) + S.s4;
    const rowY = top + DESIGN_TOKENS.touch.min / 2;
    this.backBtn.x = this.inset + DESIGN_TOKENS.touch.min / 2;
    this.backBtn.y = rowY;

    this.titleShadow.x = w / 2;
    this.titleShadow.y = rowY + 2;
    this.titleText.x = w / 2;
    this.titleText.y = rowY;

    if (this.chip) {
      this.chip.x = w - this.inset - this.chip.chipWidth;
      this.chip.y = rowY;
    }

    this.contentTop = top + DESIGN_TOKENS.touch.min + S.s16;
    this.contentBottom = h - Math.max(S.s16, safe.bottom + S.s8);
  }

  /** Re-place the chip after its width changed (balance digits grew). */
  public refreshChip(): void {
    if (this.chip) this.chip.x = this.width - this.inset - this.chip.chipWidth;
  }
}
