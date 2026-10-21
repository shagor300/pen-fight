/**
 * StatsModal.ts
 * Skeuomorphic Player Statistics modal matching the school desk aesthetic.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { ProgressionManager } from '../core/ProgressionManager';
import EventEmitter from 'eventemitter3';

export class StatsModal extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;
  private progression: ProgressionManager;

  private backdrop: Graphics;
  private cardContainer: Container;

  constructor(
    screenWidth: number,
    screenHeight: number,
    progression: ProgressionManager,
  ) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.progression = progression;

    this.container = new Container();
    this.container.visible = false;

    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.backdrop.on('pointerdown', () => this.hide());
    this.container.addChild(this.backdrop);

    this.cardContainer = new Container();
    this.container.addChild(this.cardContainer);

    this.layout();
  }

  public show(): void {
    this.container.visible = true;
    this.renderStats();
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
      this.renderStats();
    }
  }

  private renderStats(): void {
    this.cardContainer.removeChildren();

    const stats = this.progression.getStats();
    const cardW = Math.min(this.screenWidth - 40, 360);
    const cardH = 380;
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
    const title = new Text({ text: '📊 Career Stats', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.y = -cardH / 2 + 22;
    card.addChild(title);

    // Stats Grid
    const items = [
      { label: 'Played Matches', val: `${stats.matches}`, color: COLORS.butterYellow },
      { label: 'Win Rate', val: `${stats.winRate}%`, color: COLORS.mintGreen },
      { label: 'Total Wins', val: `${stats.wins}`, color: COLORS.skyBlue },
      { label: 'Best Streak', val: `${stats.bestStreak} 🔥`, color: COLORS.peachOrange },
    ];

    const gridW = cardW - 44;
    const itemW = (gridW - 14) / 2;
    const itemH = 78;
    const startX = -gridW / 2;
    const startY = -cardH / 2 + 74;

    items.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = startX + col * (itemW + 14);
      const by = startY + row * (itemH + 14);

      const box = new Graphics()
        .roundRect(bx, by, itemW, itemH, 14)
        .fill({ color: 0xF7F2E4 })
        .stroke({ color: COLORS.navyBorder, width: 2 });
      card.addChild(box);

      const valStyle = new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 22,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      });
      const valText = new Text({ text: item.val, style: valStyle });
      valText.anchor.set(0.5, 0);
      valText.x = bx + itemW / 2;
      valText.y = by + 12;
      card.addChild(valText);

      const lblStyle = new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 12,
        fill: COLORS.textMuted,
        fontWeight: 'bold',
      });
      const lblText = new Text({ text: item.label, style: lblStyle });
      lblText.anchor.set(0.5, 0);
      lblText.x = bx + itemW / 2;
      lblText.y = by + 46;
      card.addChild(lblText);
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
      text: 'Got it',
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

    closeBtn.y = cardH / 2 - 70;
    card.addChild(closeBtn);

    closeBtn.on('pointerdown', () => {
      btnSurface.y = 3;
    });
    closeBtn.on('pointerup', () => {
      btnSurface.y = 0;
      this.hide();
    });
    closeBtn.on('pointerupoutside', () => {
      btnSurface.y = 0;
    });
  }
}
