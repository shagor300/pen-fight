/**
 * src/ui/components/ConfirmModal.ts
 * One short confirmation dialog for the whole game (leave match, reset
 * progress, ...). Cancel sits on the left, the confirming action on the
 * right, with a clear gap so a destructive tap is never an accident.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DESIGN_TOKENS } from '../../config/designTokens';
import { GameButton } from './GameButton';

export interface ConfirmOptions {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export class ConfirmModal {
  public container = new Container();
  private screenW: number;
  private screenH: number;
  private backdrop = new Graphics();
  private card = new Container();
  private current: ConfirmOptions | null = null;

  constructor(screenWidth: number, screenHeight: number) {
    this.screenW = screenWidth;
    this.screenH = screenHeight;
    this.container.visible = false;

    this.backdrop.eventMode = 'static'; // swallow touches behind the dialog
    this.container.addChild(this.backdrop);
    this.container.addChild(this.card);
    this.layout(screenWidth, screenHeight);
  }

  public get isOpen(): boolean {
    return this.container.visible;
  }

  public open(opts: ConfirmOptions): void {
    this.current = opts;
    this.container.visible = true;
    this.render();
  }

  public close(): void {
    this.container.visible = false;
    this.current = null;
  }

  /** Android back: same as Cancel. */
  public cancel(): void {
    const c = this.current;
    this.close();
    if (c?.onCancel) c.onCancel();
  }

  public layout(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
    this.backdrop.clear().rect(0, 0, w, h).fill({ color: DESIGN_TOKENS.overlay.scrimColor, alpha: DESIGN_TOKENS.overlay.scrimAlpha });
    this.card.x = w / 2;
    this.card.y = h / 2;
    if (this.container.visible) this.render();
  }

  private render(): void {
    const o = this.current;
    if (!o) return;
    this.card.removeChildren();

    const S = DESIGN_TOKENS.space;
    const w = Math.min(this.screenW - 2 * S.s24, 340);

    const title = new Text({
      text: o.title,
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.type.headline.family,
        fontSize: DESIGN_TOKENS.type.headline.size,
        fill: DESIGN_TOKENS.colors.textPrimary,
        fontWeight: 'bold',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: w - 2 * S.s24,
      }),
    });
    title.anchor.set(0.5, 0);

    const body = new Text({
      text: o.body,
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.type.body.family,
        fontSize: DESIGN_TOKENS.type.body.size,
        fill: DESIGN_TOKENS.colors.textSecondary,
        fontWeight: '700',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: w - 2 * S.s24,
        lineHeight: 20,
      }),
    });
    body.anchor.set(0.5, 0);

    const btnH = DESIGN_TOKENS.touch.comfortable;
    const h = S.s24 + title.height + S.s12 + body.height + S.s24 + btnH + S.s24;

    const shadow = new Graphics()
      .roundRect(-w / 2, -h / 2 + DESIGN_TOKENS.shadows.cardOffset, w, h, DESIGN_TOKENS.radii.lg)
      .fill({ color: DESIGN_TOKENS.colors.navyShadow });
    const surface = new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, DESIGN_TOKENS.radii.lg)
      .fill({ color: DESIGN_TOKENS.colors.creamSurface })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thick });
    this.card.addChild(shadow, surface);

    let y = -h / 2 + S.s24;
    title.y = y;
    this.card.addChild(title);
    y += title.height + S.s12;
    body.y = y;
    this.card.addChild(body);
    y += body.height + S.s24;

    const gap = S.s12;
    const bw = (w - 2 * S.s24 - gap) / 2;

    const cancelBtn = new GameButton({
      width: bw,
      height: btnH,
      label: o.cancelLabel ?? 'Cancel',
      bgColor: DESIGN_TOKENS.colors.creamSecondary,
      fontSize: 15,
      onClick: () => this.cancel(),
    });
    cancelBtn.x = -bw / 2 - gap / 2;
    cancelBtn.y = y;

    const okBtn = new GameButton({
      width: bw,
      height: btnH,
      label: o.confirmLabel,
      bgColor: o.danger ? DESIGN_TOKENS.semantic.danger : DESIGN_TOKENS.colors.premiumGold,
      textColor: o.danger ? DESIGN_TOKENS.semantic.textInverse : DESIGN_TOKENS.colors.navyOutline,
      fontSize: 15,
      onClick: () => {
        const cb = o.onConfirm;
        this.close();
        cb();
      },
    });
    okBtn.x = bw / 2 + gap / 2;
    okBtn.y = y;

    this.card.addChild(cancelBtn, okBtn);
  }
}
