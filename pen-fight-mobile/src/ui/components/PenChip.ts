/**
 * src/ui/components/PenChip.ts
 * The one PEN currency display: gold pen-nib badge + thousands-separated
 * amount. Used on Home, tier selection, missions and results so the icon,
 * number format and spacing never drift between screens.
 *
 * Origin = left edge, vertical centre. The shown number always ends on the
 * persisted balance; the count-up is only decoration.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DESIGN_TOKENS } from '../../config/designTokens';
import { formatPen } from '../../economy/EconomyEngine';
import { getEconomy } from '../../economy/EconomyStorage';

/** Draw the pen-nib badge centred on (0,0) with outer radius `r`. */
export function drawPenNib(g: Graphics, r: number): void {
  g.circle(0, 0, r).fill({ color: DESIGN_TOKENS.colors.deepNavy });
  g.circle(0, 0, r).stroke({ color: DESIGN_TOKENS.semantic.pen, width: Math.max(1.5, r * 0.12) });
  const k = r / 14; // designed on a 14px radius
  // Nib body
  g.poly([0, -9 * k, 5.5 * k, -1 * k, 3.4 * k, 8 * k, -3.4 * k, 8 * k, -5.5 * k, -1 * k])
    .fill({ color: DESIGN_TOKENS.semantic.pen });
  // Slit and breather hole
  g.moveTo(0, 0.5 * k).lineTo(0, 8 * k).stroke({ color: DESIGN_TOKENS.colors.deepNavy, width: Math.max(1, 1.3 * k) });
  g.circle(0, -1.5 * k, 1.6 * k).fill({ color: DESIGN_TOKENS.colors.deepNavy });
}

export interface PenChipOptions {
  height?: number;
  /** Follow the economy balance automatically. Default true. */
  bind?: boolean;
  /** Called when the chip is tapped (e.g. open Missions). */
  onTap?: () => void;
}

export class PenChip extends Container {
  /** Set from the Reduce Motion setting. */
  public static reduceMotion = false;

  private bg = new Graphics();
  private nib = new Graphics();
  private amountText: Text;
  private unitText: Text;
  private chipH: number;
  private shown = 0;
  private raf = 0;
  private unsub: (() => void) | null = null;

  /** Current width in px (for layout by the parent). */
  public chipWidth = 0;

  constructor(opts: PenChipOptions = {}) {
    super();
    this.chipH = opts.height ?? 32;

    this.addChild(this.bg);
    this.addChild(this.nib);

    this.amountText = new Text({
      text: '0',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.type.currency.family,
        fontSize: Math.round(this.chipH * 0.5),
        fill: DESIGN_TOKENS.colors.textOnDark,
        fontWeight: 'bold',
      }),
    });
    this.amountText.anchor.set(0, 0.5);
    this.addChild(this.amountText);

    this.unitText = new Text({
      text: 'PEN',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.type.label.family,
        fontSize: Math.max(9, Math.round(this.chipH * 0.31)),
        fill: DESIGN_TOKENS.semantic.pen,
        fontWeight: '800',
        letterSpacing: 0.6,
      }),
    });
    this.unitText.anchor.set(0, 0.5);
    this.addChild(this.unitText);

    if (opts.onTap) {
      this.eventMode = 'static';
      this.cursor = 'pointer';
      this.on('pointerup', (e) => {
        e.stopPropagation();
        opts.onTap!();
      });
    }

    if (opts.bind !== false) {
      const eco = getEconomy();
      this.shown = eco.getBalance();
      this.unsub = eco.subscribe(() => this.setBalance(getEconomy().getBalance(), true));
    }
    this.render(this.shown);
  }

  /** Show `value`. With `animate` the number counts up/down briefly. */
  public setBalance(value: number, animate = false): void {
    this.cancelAnim();
    const from = this.shown;
    const to = Math.max(0, Math.round(value));
    if (!animate || PenChip.reduceMotion || from === to || typeof requestAnimationFrame !== 'function') {
      this.render(to);
      return;
    }
    const dur = DESIGN_TOKENS.motion.currencyCountUp * 1000;
    const t0 = performance.now();
    const step = (now: number): void => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      this.render(Math.round(from + (to - from) * eased));
      if (p < 1) this.raf = requestAnimationFrame(step);
      else this.render(to); // always end on the real value
    };
    this.raf = requestAnimationFrame(step);
  }

  private cancelAnim(): void {
    if (this.raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private render(value: number): void {
    this.shown = value;
    const h = this.chipH;
    this.amountText.text = formatPen(value);
    const padL = 3;
    const nibR = h / 2 - 3;
    const textX = padL + nibR * 2 + 8;
    this.amountText.x = textX;
    this.amountText.y = 0;
    this.unitText.x = textX + this.amountText.width + 4;
    this.unitText.y = 1;
    const w = Math.ceil(this.unitText.x + this.unitText.width + 12);
    this.chipWidth = w;

    this.bg.clear()
      .roundRect(0, -h / 2, w, h, h / 2)
      .fill({ color: DESIGN_TOKENS.colors.deepNavy })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });

    this.nib.clear();
    drawPenNib(this.nib, nibR);
    this.nib.x = padL + nibR;
    this.nib.y = 0;
  }

  public override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.cancelAnim();
    if (this.unsub) this.unsub();
    this.unsub = null;
    super.destroy(options);
  }
}
