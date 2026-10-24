/**
 * src/ui/components/ToastNotification.ts
 * Short, non-blocking message near the top of the screen. Never intercepts
 * touches, so it cannot block gameplay or menus.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DESIGN_TOKENS } from '../../config/designTokens';

export type ToastKind = 'success' | 'error' | 'info';

export class ToastNotification extends Container {
  private bg = new Graphics();
  private msgText: Text;
  private screenW = 360;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.visible = false;
    this.eventMode = 'none';
    this.addChild(this.bg);
    this.msgText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.type.body.family,
        fontSize: 13,
        fill: DESIGN_TOKENS.semantic.textInverse,
        fontWeight: '800',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 300,
      }),
    });
    this.msgText.anchor.set(0.5, 0.5);
    this.addChild(this.msgText);
  }

  public layout(screenWidth: number): void {
    this.screenW = screenWidth;
    this.x = screenWidth / 2;
    this.y = 64;
    this.msgText.style.wordWrapWidth = Math.min(screenWidth - 64, 320);
  }

  public show(message: string, kind: ToastKind = 'info', durationMs = 2600): void {
    if (this.timer) clearTimeout(this.timer);
    this.msgText.text = message;
    const w = Math.min(this.screenW - 32, this.msgText.width + 32);
    const h = Math.max(36, this.msgText.height + 20);
    const color =
      kind === 'success' ? DESIGN_TOKENS.semantic.success
      : kind === 'error' ? DESIGN_TOKENS.semantic.danger
      : DESIGN_TOKENS.colors.deepNavy;
    this.bg.clear()
      .roundRect(-w / 2, -h / 2 + 3, w, h, DESIGN_TOKENS.radii.md)
      .fill({ color: DESIGN_TOKENS.colors.navyShadow })
      .roundRect(-w / 2, -h / 2, w, h, DESIGN_TOKENS.radii.md)
      .fill({ color })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });
    this.visible = true;
    this.timer = setTimeout(() => {
      this.visible = false;
      this.timer = null;
    }, durationMs);
  }

  public override destroy(options?: Parameters<Container['destroy']>[0]): void {
    if (this.timer) clearTimeout(this.timer);
    super.destroy(options);
  }
}
