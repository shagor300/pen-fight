/**
 * HowToPlayModal.ts
 * "How to Play" instructions modal triggered by the (?) help button.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { DESIGN_TOKENS } from '../config/designTokens';
import { soundManager } from '../audio/SoundAndHaptics';
import EventEmitter from 'eventemitter3';

export class HowToPlayModal extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;

  private backdrop: Graphics;
  private cardContainer: Container;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.container = new Container();
    this.container.visible = false;

    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.backdrop.on('pointertap', () => this.hide());
    this.container.addChild(this.backdrop);

    this.cardContainer = new Container();
    this.cardContainer.eventMode = 'static';
    this.cardContainer.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(this.cardContainer);

    this.layout();
  }

  public show(): void {
    this.container.visible = true;
    this.renderContent();
  }

  public hide(): void {
    this.container.visible = false;
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.backdrop.clear()
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: 0x121820, alpha: 0.65 });

    this.cardContainer.x = screenWidth / 2;
    this.cardContainer.y = screenHeight / 2;

    if (this.container.visible) {
      this.renderContent();
    }
  }

  private renderContent(): void {
    for (const c of this.cardContainer.removeChildren()) c.destroy({ children: true });

    const cardW = Math.min(this.screenWidth - 40, 370);
    const cardH = 430;
    const r = 22;

    // 3D Shadow
    const shadow = new Graphics()
      .roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, r)
      .fill({ color: COLORS.navyShadow });
    this.cardContainer.addChild(shadow);

    // Card Surface
    const card = new Graphics()
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3.5 });
    this.cardContainer.addChild(card);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: 26,
      fill: COLORS.textDark,
      fontWeight: 'bold',
    });
    const title = new Text({ text: '📖 How to Play', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.y = -cardH / 2 + 20;
    card.addChild(title);

    // Steps
    const steps = [
      { icon: '🎯', title: 'Aim & Pull', desc: 'Touch your pen and pull backwards to set angle and power.' },
      { icon: '🌡️', title: 'Thermometer Bar', desc: 'Watch the 4-color gauge. Green is gentle, red is max power.' },
      { icon: '🔄', title: 'Add Spin', desc: 'Grab near the tip or cap to trigger a spinning whip strike.' },
      { icon: '⚠️', title: 'Desk Shrinks', desc: 'On turns 15, 19, 23 & 27 the desk border closes in!' }
    ];

    let startY = -cardH / 2 + 66;
    steps.forEach((s) => {
      const row = new Container();
      row.y = startY;

      const badge = new Graphics()
        .roundRect(-cardW / 2 + 18, 0, 44, 44, 12)
        .fill({ color: 0xF7F2E4 })
        .stroke({ color: COLORS.navyBorder, width: 2 });
      row.addChild(badge);

      const icon = new Text({
        text: s.icon,
        style: new TextStyle({ fontSize: 20 })
      });
      icon.anchor.set(0.5, 0.5);
      icon.x = -cardW / 2 + 40;
      icon.y = 22;
      row.addChild(icon);

      const stTitle = new Text({
        text: s.title,
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 16,
          fill: COLORS.textDark,
          fontWeight: 'bold',
        })
      });
      stTitle.x = -cardW / 2 + 72;
      stTitle.y = 2;
      row.addChild(stTitle);

      const stDesc = new Text({
        text: s.desc,
        style: new TextStyle({
          fontFamily: 'Nunito, sans-serif',
          fontSize: 12,
          fill: COLORS.textMuted,
          fontWeight: 'bold',
          wordWrap: true,
          wordWrapWidth: cardW - 100,
        })
      });
      stDesc.x = -cardW / 2 + 72;
      stDesc.y = 22;
      row.addChild(stDesc);

      card.addChild(row);
      startY += 62;
    });

    // Close Button
    const closeBtn = new Container();
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';

    const btnW = cardW - 50;
    const btnH = 50;
    const btnR = 9999;

    const btnShadow = new Graphics()
      .roundRect(-btnW / 2, 4, btnW, btnH, btnR)
      .fill({ color: COLORS.navyShadow });
    closeBtn.addChild(btnShadow);

    const btnSurface = new Graphics()
      .roundRect(-btnW / 2, 0, btnW, btnH, btnR)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: COLORS.navyBorder, width: 3 });
    closeBtn.addChild(btnSurface);

    const btnText = new Text({
      text: "Let's Play!",
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 18,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    btnText.anchor.set(0.5, 0.5);
    btnText.y = btnH / 2;
    btnSurface.addChild(btnText);

    closeBtn.y = cardH / 2 - 62;
    card.addChild(closeBtn);

    closeBtn.on('pointerdown', () => {
      btnSurface.y = 3;
    });
    closeBtn.on('pointerup', () => {
      btnSurface.y = 0;
      soundManager.play('ui_click');
      this.hide();
    });
    closeBtn.on('pointerupoutside', () => {
      btnSurface.y = 0;
    });
  }

  public destroy(): void {
    this.removeAllListeners();
    this.container.destroy({ children: true });
  }
}
