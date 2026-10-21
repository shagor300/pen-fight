/**
 * PenSelectorModal.ts
 * 8-Pen Showcase with 5-star stat bars, XP progress bar, level unlocks, and equip buttons.
 * PRD §6: 8 Pens, 5 Stats & XP Progression System.
 */
import { Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { ALL_PENS, PenConfig } from '../config/pensConfig';
import { ProgressionManager } from '../core/ProgressionManager';
import { COLORS } from '../config/gameConstants';
import { renderPenToCanvas, PIXELS_PER_METER } from '../rendering/RealPenRenderer';
import EventEmitter from 'eventemitter3';

export class PenSelectorModal extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;
  private progression: ProgressionManager;

  private selectedIndex = 0;
  private p1EquippedIndex = 0;
  private p2EquippedIndex = 0;

  // Visual Nodes
  private backdrop: Graphics;
  private card: Graphics;
  private penPreviewContainer: Container;
  private previewSprite: Sprite | null = null;
  private penGraphics: Graphics;
  private shadowGraphics: Graphics;

  private titleText: Text;
  private descText: Text;
  private levelBadgeText: Text;
  private xpText: Text;
  private xpBar: Graphics;
  private perksText: Text;

  private statBarsContainer: Container;
  private equipP1Btn: Container;
  private equipP2Btn: Container;
  private closeBtn: Container;
  private prevBtn: Container;
  private nextBtn: Container;
  private dotsContainer: Container;

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

    // Dark backdrop
    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'default';
    this.backdrop.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(this.backdrop);

    // Main Card
    this.card = new Graphics();
    this.container.addChild(this.card);

    // Pen Preview Stage
    this.penPreviewContainer = new Container();
    this.shadowGraphics = new Graphics();
    this.penGraphics = new Graphics();
    this.penPreviewContainer.addChild(this.shadowGraphics);
    this.penPreviewContainer.addChild(this.penGraphics);
    this.container.addChild(this.penPreviewContainer);

    // Title & Info
    this.titleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 22,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      }),
    });
    this.titleText.anchor.set(0.5, 0);
    this.container.addChild(this.titleText);

    this.descText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 13,
        fill: 0x555555,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 320,
      }),
    });
    this.descText.anchor.set(0.5, 0);
    this.container.addChild(this.descText);

    // Level & XP
    this.levelBadgeText = new Text({
      text: 'Lv. 1',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 14,
        fill: COLORS.accent,
        fontWeight: 'bold',
      }),
    });
    this.levelBadgeText.anchor.set(0.5, 0);
    this.container.addChild(this.levelBadgeText);

    this.xpBar = new Graphics();
    this.container.addChild(this.xpBar);

    this.xpText = new Text({
      text: '0 / 200 XP',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 11,
        fill: 0x666666,
      }),
    });
    this.xpText.anchor.set(0.5, 0.5);
    this.container.addChild(this.xpText);

    this.perksText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 11,
        fill: 0x2A9D8F,
        fontStyle: 'italic',
      }),
    });
    this.perksText.anchor.set(0.5, 0);
    this.container.addChild(this.perksText);

    // Stat bars
    this.statBarsContainer = new Container();
    this.container.addChild(this.statBarsContainer);

    // Navigation arrows & Dots
    this.prevBtn = this.createNavButton('◀', () => this.prevPen());
    this.nextBtn = this.createNavButton('▶', () => this.nextPen());
    this.container.addChild(this.prevBtn);
    this.container.addChild(this.nextBtn);

    this.dotsContainer = new Container();
    this.container.addChild(this.dotsContainer);

    // Equip Buttons
    this.equipP1Btn = this.createActionButton('P1 EQUIP', COLORS.accent, () => {
      this.p1EquippedIndex = this.selectedIndex;
      this.updateView();
      this.emit('equip_p1', this.selectedIndex);
    });
    this.equipP2Btn = this.createActionButton('P2 EQUIP', 0x3A86FF, () => {
      this.p2EquippedIndex = this.selectedIndex;
      this.updateView();
      this.emit('equip_p2', this.selectedIndex);
    });
    this.container.addChild(this.equipP1Btn);
    this.container.addChild(this.equipP2Btn);

    // Close button
    this.closeBtn = this.createCloseButton();
    this.container.addChild(this.closeBtn);

    this.layout();
    this.updateView();
  }

  private createNavButton(label: string, onClick: () => void): Container {
    const btn = new Container();
    const bg = new Graphics()
      .circle(0, 0, 18)
      .fill({ color: COLORS.woodMid, alpha: 0.8 })
      .stroke({ color: COLORS.cream, width: 1.5 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 14,
        fill: COLORS.white,
      }),
    });
    txt.anchor.set(0.5, 0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  private createActionButton(label: string, color: number, onClick: () => void): Container {
    const btn = new Container();
    const bg = new Graphics()
      .roundRect(-65, -18, 130, 36, 18)
      .fill({ color })
      .stroke({ color: COLORS.white, width: 1.5 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 13,
        fill: COLORS.white,
        fontWeight: 'bold',
      }),
    });
    txt.anchor.set(0.5, 0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  private createCloseButton(): Container {
    const btn = new Container();
    const bg = new Graphics()
      .circle(0, 0, 15)
      .fill({ color: 0x333333, alpha: 0.8 });
    btn.addChild(bg);

    const txt = new Text({
      text: '✕',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 14,
        fill: COLORS.white,
      }),
    });
    txt.anchor.set(0.5, 0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hide();
    });
    return btn;
  }

  public show(p1Index = 0, p2Index = 0): void {
    this.p1EquippedIndex = p1Index;
    this.p2EquippedIndex = p2Index;
    this.selectedIndex = p1Index;
    this.container.visible = true;
    this.updateView();
  }

  public hide(): void {
    this.container.visible = false;
    this.emit('closed', { p1: this.p1EquippedIndex, p2: this.p2EquippedIndex });
  }

  private prevPen(): void {
    this.selectedIndex = (this.selectedIndex - 1 + ALL_PENS.length) % ALL_PENS.length;
    this.updateView();
  }

  private nextPen(): void {
    this.selectedIndex = (this.selectedIndex + 1) % ALL_PENS.length;
    this.updateView();
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.backdrop.clear()
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: 0x000000, alpha: 0.7 });

    const cardW = Math.min(screenWidth - 32, 400);
    const cardH = Math.min(screenHeight - 40, 680);
    const cardX = (screenWidth - cardW) / 2;
    const cardY = (screenHeight - cardH) / 2;

    this.card.clear()
      .roundRect(cardX, cardY, cardW, cardH, 20)
      .fill({ color: COLORS.cream })
      .stroke({ color: COLORS.woodMid, width: 4 });

    this.closeBtn.x = cardX + cardW - 22;
    this.closeBtn.y = cardY + 22;

    this.titleText.x = screenWidth / 2;
    this.titleText.y = cardY + 20;

    this.descText.x = screenWidth / 2;
    this.descText.y = cardY + 52;

    this.penPreviewContainer.x = screenWidth / 2;
    this.penPreviewContainer.y = cardY + 120;

    this.prevBtn.x = cardX + 35;
    this.prevBtn.y = cardY + 120;

    this.nextBtn.x = cardX + cardW - 35;
    this.nextBtn.y = cardY + 120;

    this.dotsContainer.x = screenWidth / 2;
    this.dotsContainer.y = cardY + 165;

    this.levelBadgeText.x = screenWidth / 2;
    this.levelBadgeText.y = cardY + 185;

    this.xpBar.x = screenWidth / 2;
    this.xpBar.y = cardY + 215;

    this.xpText.x = screenWidth / 2;
    this.xpText.y = cardY + 215;

    this.perksText.x = screenWidth / 2;
    this.perksText.y = cardY + 230;

    this.statBarsContainer.x = cardX + 30;
    this.statBarsContainer.y = cardY + 258;

    this.equipP1Btn.x = screenWidth / 2 - 75;
    this.equipP1Btn.y = cardY + cardH - 35;

    this.equipP2Btn.x = screenWidth / 2 + 75;
    this.equipP2Btn.y = cardY + cardH - 35;
  }

  private updateView(): void {
    const pen = ALL_PENS[this.selectedIndex];
    const progress = this.progression.getProgress(pen.id);
    const xpInfo = this.progression.getXPForNextLevel(pen.id);
    const bonus = this.progression.getStatBonus(pen.id);

    this.titleText.text = pen.name;
    this.descText.text = pen.description;

    // Level & XP
    this.levelBadgeText.text = `Level ${progress.level}  (+${Math.round(bonus * 100)}% Bonus)`;
    this.xpText.text = progress.level >= 5 ? 'MAX LEVEL' : `${xpInfo.current} / ${xpInfo.needed} XP`;

    // Render XP Bar
    const barW = 220;
    const barH = 14;
    this.xpBar.clear()
      .roundRect(-barW / 2, -barH / 2, barW, barH, 7)
      .fill({ color: 0xDCD6CD })
      .stroke({ color: 0xAAAAAA, width: 1 })
      .roundRect(-barW / 2, -barH / 2, barW * Math.min(1, xpInfo.ratio), barH, 7)
      .fill({ color: COLORS.victory });

    // Perks info
    const perksByLevel = [
      'Base stats',
      'Unlocked: Neon Ink Trail & +2% stats',
      'Unlocked: Custom Sticker & +4% stats',
      'Unlocked: Golden Hit Sparks & +6% stats',
      'MAX: Master Golden Skin & +8% stats',
    ];
    this.perksText.text = perksByLevel[progress.level - 1];

    // Draw Pen Preview
    this.drawPreview(pen);

    // Draw Dots
    this.drawDots();

    // Draw 5-Star Stat Bars
    this.drawStatBars(pen);

    // Update Equip Button Labels
    const p1Label = this.equipP1Btn.children[1] as Text;
    const p2Label = this.equipP2Btn.children[1] as Text;

    p1Label.text = this.p1EquippedIndex === this.selectedIndex ? '✓ P1 EQUIPPED' : 'EQUIP P1';
    p2Label.text = this.p2EquippedIndex === this.selectedIndex ? '✓ P2 EQUIPPED' : 'EQUIP P2';
  }

  private drawPreview(pen: PenConfig): void {
    if (this.previewSprite) {
      this.penPreviewContainer.removeChild(this.previewSprite);
      this.previewSprite.destroy();
      this.previewSprite = null;
    }

    const L = Math.ceil(pen.dimensions.lengthMeters * PIXELS_PER_METER);
    const W = Math.ceil(pen.dimensions.widthMeters * PIXELS_PER_METER);
    const pad = 24;
    const canvasW = L + pad * 2;
    const canvasH = W + pad * 2;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvasW;
    offscreen.height = canvasH;
    const ctx = offscreen.getContext('2d')!;

    // 8-layer photorealistic rendering
    renderPenToCanvas(ctx, pen, canvasW / 2, canvasH / 2, 0, 'real');

    const texture = Texture.from(offscreen);
    this.previewSprite = new Sprite(texture);
    this.previewSprite.anchor.set(0.5, 0.5);
    this.penPreviewContainer.addChild(this.previewSprite);
  }

  private drawDots(): void {
    const dc = this.dotsContainer;
    dc.removeChildren();

    const dotCount = ALL_PENS.length;
    const spacing = 14;
    const startX = -((dotCount - 1) * spacing) / 2;

    for (let i = 0; i < dotCount; i++) {
      const dot = new Graphics();
      const isSelected = i === this.selectedIndex;
      dot.circle(startX + i * spacing, 0, isSelected ? 5 : 3.5)
        .fill({ color: isSelected ? COLORS.accent : 0xBBBBBB });
      dot.eventMode = 'static';
      dot.cursor = 'pointer';
      dot.on('pointerdown', (e) => {
        e.stopPropagation();
        this.selectedIndex = i;
        this.updateView();
      });
      dc.addChild(dot);
    }
  }

  private drawStatBars(pen: PenConfig): void {
    const sc = this.statBarsContainer;
    sc.removeChildren();

    const stats: [string, number][] = [
      ['Weight', pen.stats.weight],
      ['Speed', pen.stats.speed],
      ['Spin', pen.stats.spin],
      ['Grip', pen.stats.grip],
      ['Reach', pen.stats.reach],
    ];

    const rowH = 26;
    const labelStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 13,
      fill: COLORS.textDark,
    });

    stats.forEach(([label, value], idx) => {
      const y = idx * rowH;

      // Stat Name
      const nameText = new Text({ text: label, style: labelStyle });
      nameText.x = 0;
      nameText.y = y;
      sc.addChild(nameText);

      // Star Bars (1-10 internal scale mapped to 1-5 stars)
      const starsValue = Math.min(5, Math.max(1, Math.round(value / 2)));
      const starsG = new Graphics();
      const starStartX = 90;
      const starW = 26;
      const starGap = 6;

      for (let s = 1; s <= 5; s++) {
        const sx = starStartX + (s - 1) * (starW + starGap);
        const isFilled = s <= starsValue;
        starsG.roundRect(sx, y + 2, starW, 14, 4)
          .fill({ color: isFilled ? COLORS.accent : 0xE0D8CE })
          .stroke({ color: isFilled ? 0xCC6000 : 0xC0B8AE, width: 1 });
      }

      sc.addChild(starsG);
    });
  }
}
