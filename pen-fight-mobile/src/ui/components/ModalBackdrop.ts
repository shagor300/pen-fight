/**
 * src/ui/components/ModalBackdrop.ts
 * Reusable Fullscreen Dark Scrim for PixiJS v8 Modals.
 * Safely stops event propagation to prevent touch bleed-through to underlying layers.
 */
import { Container, Graphics } from 'pixi.js';
import { DESIGN_TOKENS } from '../../config/designTokens';

export class ModalBackdrop extends Container {
  private scrim: Graphics;
  private onDismissHandler?: () => void;

  constructor(width: number, height: number, onDismiss?: () => void) {
    super();

    this.onDismissHandler = onDismiss;
    this.scrim = new Graphics();
    this.addChild(this.scrim);

    this.resize(width, height);
    this.setupInteractivity();
  }

  public resize(width: number, height: number): void {
    this.scrim.clear();
    this.scrim
      .rect(0, 0, width, height)
      .fill({
        color: DESIGN_TOKENS.overlay.scrimColor,
        alpha: DESIGN_TOKENS.overlay.scrimAlpha,
      });
  }

  private setupInteractivity(): void {
    this.eventMode = 'static';
    this.cursor = this.onDismissHandler ? 'pointer' : 'default';

    this.on('pointerdown', (e) => {
      e.stopPropagation();
      if (this.onDismissHandler) {
        this.onDismissHandler();
      }
    });
  }
}
