/**
 * src/ui/PenSelectorModal.ts
 * Warm, Tactile Neo-Brutalist Pen Showcase & Locker.
 * Restores the beloved previous best design with chunky 3D buttons, cream textured card,
 * 5-star segmented stat bars, level badge & XP bar, and 100% responsive pen switching.
 */
import { Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { PENS_ROSTER, PenSpec } from '../config/pensConfig';
import { ProgressionManager } from '../core/ProgressionManager';
import { COLORS } from '../config/gameConstants';
import { renderPenToCanvas, PIXELS_PER_METER } from '../rendering/RealPenRenderer';
import { soundManager } from '../audio/SoundAndHaptics';
import { themeManager, DESK_WOOD_THEMES } from './ThemeManager';
import EventEmitter from 'eventemitter3';

export type GameMode = 'VS_AI' | 'TWO_PLAYER';
export type AIDifficulty = 'easy' | 'normal' | 'hard';

export class PenSelectorModal extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;
  private progression: ProgressionManager;

  public selectedIndex = 0;
  public p1EquippedIndex = 0;
  public p2EquippedIndex = 1;
  private mode: GameMode = 'VS_AI';
  private difficulty: AIDifficulty = 'normal';

  // Visual Nodes
  private backdrop: Graphics;
  private cardContainer: Container;
  private cardSurface: Graphics;
  private cardContent: Container;

  // Header
  private closeBtn: Container;
  private modeTitleText: Text;

  // Center Pen Preview
  private stageBox: Graphics;
  private penPreviewContainer: Container;
  private previewSprite: Sprite | null = null;
  private prevBtn: Container;
  private nextBtn: Container;
  private dotsContainer: Container;

  // Identity & Progression
  private titleText: Text;
  private taglineText: Text;
  private levelBadgeContainer: Container;
  private levelBadgeText: Text;
  private xpBar: Graphics;
  private xpText: Text;
  private perkText: Text;

  // 5-Star Segmented Stats
  private statBarsContainer: Container;
  private skillBox: Container;
  private deskWoodBar: Container;

  // Action / Equip Row
  private bottomControlsContainer: Container;

  constructor(
    screenWidth: number,
    screenHeight: number,
    progression: ProgressionManager
  ) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.progression = progression;

    this.container = new Container();
    this.container.visible = false;

    // 1. Semi-translucent dark scrim backdrop
    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'default';
    this.backdrop.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hide();
      this.emit('back');
    });
    this.container.addChild(this.backdrop);

    // 2. Card Container
    this.cardContainer = new Container();
    this.cardContainer.eventMode = 'static';
    this.cardContainer.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(this.cardContainer);

    this.cardSurface = new Graphics();
    this.cardContainer.addChild(this.cardSurface);

    this.cardContent = new Container();
    this.cardContainer.addChild(this.cardContent);

    // 3. Close Button (‹ Back / ✕)
    this.closeBtn = this.createCloseButton();
    this.cardContent.addChild(this.closeBtn);

    this.modeTitleText = new Text({
      text: 'PICK YOUR PEN',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 16,
        fill: COLORS.textDark,
        fontWeight: 'bold',
        letterSpacing: 1.2,
      })
    });
    this.modeTitleText.anchor.set(0.5, 0.5);
    this.cardContent.addChild(this.modeTitleText);

    // 4. Center Pen Showcase Stage
    this.stageBox = new Graphics();
    this.cardContent.addChild(this.stageBox);

    this.penPreviewContainer = new Container();
    this.cardContent.addChild(this.penPreviewContainer);

    this.prevBtn = this.createNavButton('◀', () => this.prevPen());
    this.nextBtn = this.createNavButton('▶', () => this.nextPen());
    this.cardContent.addChild(this.prevBtn);
    this.cardContent.addChild(this.nextBtn);

    this.dotsContainer = new Container();
    this.cardContent.addChild(this.dotsContainer);

    // 5. Pen Identity (Name, Tagline)
    this.titleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 22,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    this.titleText.anchor.set(0.5, 0);
    this.cardContent.addChild(this.titleText);

    this.taglineText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 12.5,
        fill: COLORS.textMuted,
        fontWeight: '700',
        align: 'center',
      })
    });
    this.taglineText.anchor.set(0.5, 0);
    this.cardContent.addChild(this.taglineText);

    // 6. Level Badge & XP Bar
    this.levelBadgeContainer = new Container();
    this.levelBadgeText = new Text({
      text: 'Level 1  (+0% Bonus)',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 12,
        fill: 0x8C5200,
        fontWeight: 'bold',
      })
    });
    this.levelBadgeText.anchor.set(0.5, 0.5);
    this.levelBadgeContainer.addChild(this.levelBadgeText);
    this.cardContent.addChild(this.levelBadgeContainer);

    this.xpBar = new Graphics();
    this.cardContent.addChild(this.xpBar);

    this.xpText = new Text({
      text: '0 / 200 XP',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10.5,
        fill: 0x777777,
        fontWeight: 'bold',
      })
    });
    this.xpText.anchor.set(0.5, 0.5);
    this.cardContent.addChild(this.xpText);

    this.perkText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 11,
        fill: 0x1E7B6C,
        fontWeight: '700',
        fontStyle: 'italic',
      })
    });
    this.perkText.anchor.set(0.5, 0);
    this.cardContent.addChild(this.perkText);

    // 7. 5-Star Segmented Stat Bars
    this.statBarsContainer = new Container();
    this.cardContent.addChild(this.statBarsContainer);

    // 8. Skill Box
    this.skillBox = new Container();
    this.cardContent.addChild(this.skillBox);

    // 8b. Desk Wood Theme Selector
    this.deskWoodBar = new Container();
    this.cardContent.addChild(this.deskWoodBar);

    // 9. Bottom Action Buttons Container
    this.bottomControlsContainer = new Container();
    this.cardContent.addChild(this.bottomControlsContainer);

    this.layout();
  }

  public show(
    startIndex = 0,
    mode: GameMode = 'VS_AI',
    difficulty: AIDifficulty = 'normal'
  ): void {
    this.selectedIndex = Math.max(0, Math.min(PENS_ROSTER.length - 1, startIndex));
    this.p1EquippedIndex = this.selectedIndex;
    this.p2EquippedIndex = (this.selectedIndex + 1) % PENS_ROSTER.length;
    this.mode = mode;
    this.difficulty = difficulty;
    this.container.visible = true;

    this.layout();
    this.updateView();
  }

  public hide(): void {
    this.container.visible = false;
  }

  public prevPen(): void {
    soundManager.play('ui_click');
    this.selectedIndex = (this.selectedIndex - 1 + PENS_ROSTER.length) % PENS_ROSTER.length;
    this.updateView();
  }

  public nextPen(): void {
    soundManager.play('ui_click');
    this.selectedIndex = (this.selectedIndex + 1) % PENS_ROSTER.length;
    this.updateView();
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.backdrop.clear()
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: 0x0E131F, alpha: 0.72 });

    const cardW = Math.min(screenWidth - 24, 390);
    const cardH = Math.min(screenHeight - 24, 690);

    this.cardContainer.x = screenWidth / 2;
    this.cardContainer.y = screenHeight / 2;

    const r = 22;
    this.cardSurface.clear();
    // Deep 3D Navy Shadow
    this.cardSurface
      .roundRect(-cardW / 2, -cardH / 2 + 7, cardW, cardH, r)
      .fill({ color: COLORS.navyShadow });
    // Cream Surface
    this.cardSurface
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3.4 });

    const topY = -cardH / 2 + 16;

    // Header buttons
    this.closeBtn.x = -cardW / 2 + 24;
    this.closeBtn.y = topY + 14;

    this.modeTitleText.x = 0;
    this.modeTitleText.y = topY + 14;

    // Stage Box (Realistic Hardwood Showcase Stage)
    const stageW = cardW - 36;
    const stageH = 136;
    const stageY = topY + 38;

    this.drawStageBox(stageW, stageH, stageY);

    this.penPreviewContainer.x = 0;
    this.penPreviewContainer.y = stageY + stageH / 2;

    this.prevBtn.x = -stageW / 2 + 24;
    this.prevBtn.y = stageY + stageH / 2;

    this.nextBtn.x = stageW / 2 - 24;
    this.nextBtn.y = stageY + stageH / 2;

    this.dotsContainer.x = 0;
    this.dotsContainer.y = stageY + stageH - 12;

    // Identity texts
    const textY = stageY + stageH + 8;
    this.titleText.x = 0;
    this.titleText.y = textY;

    this.taglineText.x = 0;
    this.taglineText.y = textY + 26;

    // Progression bar
    const progY = textY + 46;
    this.levelBadgeContainer.x = 0;
    this.levelBadgeContainer.y = progY;

    this.xpBar.x = 0;
    this.xpBar.y = progY + 16;

    this.xpText.x = 0;
    this.xpText.y = progY + 16;

    this.perkText.x = 0;
    this.perkText.y = progY + 28;

    // 5-Star Segmented Stat Bars
    this.statBarsContainer.x = -cardW / 2 + 24;
    this.statBarsContainer.y = progY + 46;

    // Skill Inset Box
    this.skillBox.x = 0;
    this.skillBox.y = progY + 140;

    // Desk Wood Theme Selector
    this.deskWoodBar.x = 0;
    this.deskWoodBar.y = progY + 192;

    // Bottom Controls
    this.bottomControlsContainer.x = 0;
    this.bottomControlsContainer.y = cardH / 2 - 50;

    if (this.container.visible) {
      this.updateView();
    }
  }

  private updateView(): void {
    const pen = PENS_ROSTER[this.selectedIndex];
    const progress = this.progression.getProgress(pen.id);
    const xpInfo = this.progression.getXPForNextLevel(pen.id);
    const bonus = this.progression.getStatBonus(pen.id);

    this.modeTitleText.text = this.mode === 'VS_AI' ? 'PICK YOUR PEN · VS AI' : 'PICK YOUR PEN · 2 PLAYERS';
    this.titleText.text = pen.name;
    this.taglineText.text = pen.tagline || pen.description;

    // Level badge
    this.levelBadgeText.text = `Level ${progress.level}  (+${Math.round(bonus * 100)}% Bonus)`;
    const badgeW = this.levelBadgeText.width + 16;
    const badgeG = new Graphics()
      .roundRect(-badgeW / 2, -10, badgeW, 20, 10)
      .fill({ color: 0xFFE8BD })
      .stroke({ color: 0xD4A017, width: 1.5 });
    this.levelBadgeContainer.removeChildren();
    this.levelBadgeContainer.addChild(badgeG, this.levelBadgeText);

    // XP Bar
    const xpBarW = 200;
    const xpBarH = 12;
    this.xpBar.clear()
      .roundRect(-xpBarW / 2, -xpBarH / 2, xpBarW, xpBarH, 6)
      .fill({ color: 0xD5CCBE })
      .stroke({ color: 0xB5A898, width: 1.2 })
      .roundRect(-xpBarW / 2, -xpBarH / 2, xpBarW * Math.min(1, xpInfo.ratio), xpBarH, 6)
      .fill({ color: COLORS.mintGreen });

    this.xpText.text = progress.level >= 5 ? 'MAX LEVEL' : `${xpInfo.current} / ${xpInfo.needed} XP`;

    const perksByLevel = [
      'Base stats ready',
      'Unlocked: Neon Ink Trail & +2% stats',
      'Unlocked: Custom Barrel Sticker & +4% stats',
      'Unlocked: Golden Hit Sparks & +6% stats',
      'MAX: Master Golden Skin & +8% stats',
    ];
    this.perkText.text = perksByLevel[Math.min(perksByLevel.length - 1, progress.level - 1)];

    // Render Preview
    this.drawPreview(pen);

    // Render Dots
    this.drawDots();

    // Render 5-Star Segmented Stat Bars
    this.drawStatBars(pen);

    // Render Skill Box
    this.drawSkillBox(pen);

    // Render Desk Wood Selector
    this.drawDeskWoodBar();

    // Render Bottom Action Controls
    this.buildBottomControls();
  }

  private drawPreview(pen: PenSpec): void {
    if (this.previewSprite) {
      this.penPreviewContainer.removeChild(this.previewSprite);
      this.previewSprite.destroy();
      this.previewSprite = null;
    }

    const L = Math.ceil(pen.dimensions.lengthMeters * PIXELS_PER_METER);
    const W = Math.ceil(pen.dimensions.widthMeters * PIXELS_PER_METER);
    const pad = 36;
    const canvasW = L + pad * 2;
    const canvasH = W + pad * 2;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvasW;
    offscreen.height = canvasH;
    const ctx = offscreen.getContext('2d')!;

    // Render photorealistic 3D pen
    renderPenToCanvas(ctx, pen, canvasW / 2, canvasH / 2, 0, 'real');

    const texture = Texture.from(offscreen);
    texture.source.update();

    this.previewSprite = new Sprite(texture);
    this.previewSprite.anchor.set(0.5, 0.5);
    this.penPreviewContainer.addChild(this.previewSprite);
  }

  private drawDots(): void {
    this.dotsContainer.removeChildren();
    const count = PENS_ROSTER.length;
    const spacing = 16;
    const startX = -((count - 1) * spacing) / 2;

    for (let i = 0; i < count; i++) {
      const dot = new Graphics();
      const isSelected = i === this.selectedIndex;
      if (isSelected) {
        dot.roundRect(startX + i * spacing - 7, -3.5, 14, 7, 3.5)
          .fill({ color: COLORS.butterYellow })
          .stroke({ color: COLORS.navyBorder, width: 1.5 });
      } else {
        dot.circle(startX + i * spacing, 0, 3.5)
          .fill({ color: 0x999999 });
      }
      dot.eventMode = 'static';
      dot.cursor = 'pointer';
      dot.on('pointerdown', (e) => {
        e.stopPropagation();
        soundManager.play('ui_click');
        this.selectedIndex = i;
        this.updateView();
      });
      this.dotsContainer.addChild(dot);
    }
  }

  private drawStatBars(pen: PenSpec): void {
    this.statBarsContainer.removeChildren();

    const stats: [string, number][] = [
      ['Weight', pen.stats.weight],
      ['Speed', pen.stats.speed],
      ['Spin', pen.stats.spin],
      ['Grip', pen.stats.grip],
      ['Reach', pen.stats.reach],
    ];

    const rowH = 18;
    const labelStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 12,
      fill: COLORS.textDark,
      fontWeight: 'bold',
    });

    const cardW = Math.min(this.screenWidth - 24, 390);
    const totalW = cardW - 48;
    const starStartX = 58;
    const badgeW = 28;
    const gap = 5;
    const availableForBars = totalW - starStartX - badgeW - 10;
    const starW = Math.max(16, Math.floor((availableForBars - 4 * gap) / 5));

    const SKILL_COLORS: { fill: number; stroke: number; glow: string }[] = [
      { fill: 0xF59E0B, stroke: 0xD97706, glow: 'rgba(245,158,11,0.45)' },  // Weight: Amber
      { fill: 0x06B6D4, stroke: 0x0891B2, glow: 'rgba(6,182,212,0.45)' },   // Speed: Cyan
      { fill: 0x8B5CF6, stroke: 0x7C3AED, glow: 'rgba(139,92,246,0.45)' },  // Spin: Purple
      { fill: 0x10B981, stroke: 0x059669, glow: 'rgba(16,185,129,0.45)' },   // Grip: Emerald
      { fill: 0xF43F5E, stroke: 0xE11D48, glow: 'rgba(244,63,94,0.45)' },   // Reach: Crimson
    ];

    stats.forEach(([label, value], idx) => {
      const y = idx * rowH;

      const nameText = new Text({ text: label, style: labelStyle });
      nameText.x = 0;
      nameText.y = y;
      this.statBarsContainer.addChild(nameText);

      const color = SKILL_COLORS[idx];
      const starsG = new Graphics();
      for (let s = 1; s <= 5; s++) {
        const sx = starStartX + (s - 1) * (starW + gap);
        const isFilled = s <= value;
        starsG.roundRect(sx, y + 1, starW, 11, 3.5)
          .fill({ color: isFilled ? color.fill : 0xD8CFC2 })
          .stroke({ color: isFilled ? color.stroke : 0xBEB4A4, width: 1.2 });
      }
      this.statBarsContainer.addChild(starsG);

      // Numeric badge (X/5)
      const numBadge = new Text({
        text: `${value}/5`,
        style: new TextStyle({
          fontFamily: 'Nunito, sans-serif',
          fontSize: 10.5,
          fill: SKILL_COLORS[idx].fill,
          fontWeight: '800',
        })
      });
      numBadge.x = starStartX + 5 * (starW + gap) + 4;
      numBadge.y = y + 1;
      this.statBarsContainer.addChild(numBadge);
    });
  }

  private drawSkillBox(pen: PenSpec): void {
    this.skillBox.removeChildren();
    const boxW = Math.min(this.screenWidth - 24, 390) - 44;
    const boxH = 46;

    const bg = new Graphics()
      .roundRect(-boxW / 2, 0, boxW, boxH, 10)
      .fill({ color: 0xF3ECE0 })
      .stroke({ color: 0xDACDB8, width: 1.5 });
    this.skillBox.addChild(bg);

    const title = new Text({
      text: pen.skillName || 'Skill',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 11.5,
        fill: 0x92400E,
        fontWeight: 'bold',
      })
    });
    title.x = -boxW / 2 + 10;
    title.y = 5;
    this.skillBox.addChild(title);

    const desc = new Text({
      text: pen.skillDesc || 'Balanced gameplay performance.',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10.5,
        fill: COLORS.textDark,
        wordWrap: true,
        wordWrapWidth: boxW - 20,
      })
    });
    desc.x = -boxW / 2 + 10;
    desc.y = 22;
    this.skillBox.addChild(desc);
  }

  private drawStageBox(stageW: number, stageH: number, stageY: number): void {
    this.stageBox.clear();
    const woodTheme = themeManager.getNormalizedDeskTheme();

    let baseColor = 0x2A170E;
    let plankColors = [0x22120A, 0x2C180E, 0x24130B, 0x301B10];
    let grainColor = 0x140804;
    let grainAlpha = 0.35;
    let frameColor = 0x542E16;
    let rimColor = 0xD97706;
    let spotColor = 0xF59E0B;
    let spotAlpha = 0.12;

    if (woodTheme === 'oak') {
      baseColor = 0xB88448;
      plankColors = [0xC99658, 0xB37F43, 0xD09E60, 0xBD894B];
      grainColor = 0x784414;
      grainAlpha = 0.22;
      frameColor = 0x6D4527;
      rimColor = 0xEBBF87;
      spotColor = 0xFFFBEB;
      spotAlpha = 0.18;
    } else if (woodTheme === 'mahogany') {
      baseColor = 0x421612;
      plankColors = [0x4C1C18, 0x3B1310, 0x54201C, 0x3E1512];
      grainColor = 0x200705;
      grainAlpha = 0.40;
      frameColor = 0x5A201A;
      rimColor = 0xEEA28E;
      spotColor = 0xF87171;
      spotAlpha = 0.10;
    } else if (woodTheme === 'slate') {
      baseColor = 0x1A1D24;
      plankColors = [0x222630, 0x171920, 0x262A34, 0x1C1F28];
      grainColor = 0x0C0E12;
      grainAlpha = 0.50;
      frameColor = 0x2C323D;
      rimColor = 0x82A0C3;
      spotColor = 0x60A5FA;
      spotAlpha = 0.10;
    }

    // Outer desk plank base
    this.stageBox
      .roundRect(-stageW / 2, stageY, stageW, stageH, 16)
      .fill({ color: baseColor })
      .stroke({ color: frameColor, width: 3.2 });

    // 4 Horizontal Planks
    const plankH = (stageH - 8) / 4;
    for (let p = 0; p < 4; p++) {
      const py = stageY + 4 + p * plankH;
      const col = plankColors[p % plankColors.length];
      this.stageBox
        .rect(-stageW / 2 + 4, py, stageW - 8, plankH)
        .fill({ color: col });
      if (p > 0) {
        this.stageBox
          .rect(-stageW / 2 + 4, py - 0.5, stageW - 8, 1)
          .fill({ color: 0x000000, alpha: 0.35 });
      }
    }

    // Subtle wood grain lines across
    for (let gy = stageY + 12; gy < stageY + stageH - 8; gy += 14) {
      this.stageBox
        .rect(-stageW / 2 + 8, gy, stageW - 16, 1)
        .fill({ color: grainColor, alpha: grainAlpha });
    }

    // Warm radial spotlight glow in the center
    this.stageBox
      .ellipse(0, stageY + stageH / 2, stageW * 0.42, stageH * 0.38)
      .fill({ color: spotColor, alpha: spotAlpha });

    // Pen contact drop shadow on table surface
    this.stageBox
      .ellipse(0, stageY + stageH / 2 + 16, stageW * 0.35, 7)
      .fill({ color: 0x000000, alpha: 0.42 });

    // Inner brass/gold highlight rim
    this.stageBox
      .roundRect(-stageW / 2 + 3, stageY + 3, stageW - 6, stageH - 6, 13)
      .stroke({ color: rimColor, width: 1.2, alpha: 0.65 });
  }

  private drawDeskWoodBar(): void {
    this.deskWoodBar.removeChildren();
    const cardW = Math.min(this.screenWidth - 24, 390);
    const barW = cardW - 44;
    const currentTheme = themeManager.getNormalizedDeskTheme();

    const title = new Text({
      text: 'DESK WOOD',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 10,
        fill: 0x78716C,
        fontWeight: 'bold',
        letterSpacing: 0.8,
      })
    });
    title.x = -barW / 2;
    title.y = -8;
    this.deskWoodBar.addChild(title);

    const chipH = 25;
    const itemW = (barW - 12) / 4;
    const startX = -barW / 2 + itemW / 2;

    DESK_WOOD_THEMES.forEach((theme, idx) => {
      const isSel = currentTheme === theme.id;
      const chip = new Container();
      chip.x = startX + idx * (itemW + 4);
      chip.y = 12;

      // Drop shadow for selected
      if (isSel) {
        const shadow = new Graphics()
          .roundRect(-itemW / 2, -chipH / 2 + 2, itemW, chipH, 8)
          .fill({ color: 0x1E293B, alpha: 0.25 });
        chip.addChild(shadow);
      }

      // Chip surface
      const surface = new Graphics()
        .roundRect(-itemW / 2, -chipH / 2, itemW, chipH, 8)
        .fill({ color: isSel ? 0xFFFDF8 : 0xEDE5D8 })
        .stroke({ color: isSel ? theme.accent : 0xDACDB8, width: isSel ? 2.2 : 1.2 });
      chip.addChild(surface);

      // Wood Color Swatch Circle
      const swatch = new Graphics()
        .circle(-itemW / 2 + 10, 0, 4.5)
        .fill({ color: theme.color })
        .stroke({ color: 0x000000, width: 1, alpha: 0.25 });
      chip.addChild(swatch);

      // Label
      const txt = new Text({
        text: theme.label,
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 9.5,
          fill: isSel ? 0x1E293B : 0x57534E,
          fontWeight: isSel ? 'bold' : '600',
        })
      });
      txt.anchor.set(0, 0.5);
      txt.x = -itemW / 2 + 18;
      txt.y = 0;
      chip.addChild(txt);

      chip.eventMode = 'static';
      chip.cursor = 'pointer';
      chip.on('pointerdown', async () => {
        soundManager.play('ui_click');
        await themeManager.setDeskTheme(theme.id);
        const cardW = Math.min(this.screenWidth - 24, 390);
        const cardH = Math.min(this.screenHeight - 24, 690);
        const topY = -cardH / 2 + 16;
        const stageW = cardW - 36;
        const stageH = 136;
        const stageY = topY + 38;
        this.drawStageBox(stageW, stageH, stageY);
        this.drawDeskWoodBar();
      });

      this.deskWoodBar.addChild(chip);
    });
  }

  private buildBottomControls(): void {
    this.bottomControlsContainer.removeChildren();
    const cardW = Math.min(this.screenWidth - 24, 390);

    if (this.mode === 'VS_AI') {
      // Difficulty row + Giant Butter Yellow FIGHT! Button
      const diffW = cardW - 44;
      const diffH = 28;
      const diffContainer = new Container();
      diffContainer.y = -36;

      const diffs: AIDifficulty[] = ['easy', 'normal', 'hard'];
      const diffColors: Record<AIDifficulty, { active: number; shadow: number }> = {
        easy:   { active: 0x38BDF8, shadow: 0x0284C7 },
        normal: { active: 0xFBBF24, shadow: 0xD97706 },
        hard:   { active: 0xF43F5E, shadow: 0xBE123C },
      };
      const itemW = diffW / 3;

      diffs.forEach((d, idx) => {
        const isSel = this.difficulty === d;
        const btn = new Container();
        btn.x = -diffW / 2 + idx * itemW + itemW / 2;

        const colors = diffColors[d];
        // 3D shadow for active state
        if (isSel) {
          const shadow = new Graphics()
            .roundRect(-itemW / 2 + 2, -diffH / 2 + 3, itemW - 4, diffH, 14)
            .fill({ color: colors.shadow });
          btn.addChild(shadow);
        }

        const surface = new Graphics()
          .roundRect(-itemW / 2 + 2, -diffH / 2, itemW - 4, diffH, 14)
          .fill({ color: isSel ? colors.active : 0xEFE8D8 })
          .stroke({ color: COLORS.navyBorder, width: isSel ? 2.4 : 1.2 });
        btn.addChild(surface);

        const txt = new Text({
          text: d.toUpperCase(),
          style: new TextStyle({
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 11,
            fill: COLORS.textDark,
            fontWeight: 'bold',
          })
        });
        txt.anchor.set(0.5, 0.5);
        btn.addChild(txt);

        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.on('pointerdown', () => {
          soundManager.play('ui_click');
          this.difficulty = d;
          this.buildBottomControls();
        });
        diffContainer.addChild(btn);
      });
      this.bottomControlsContainer.addChild(diffContainer);

      // Fight Button
      const btnW = cardW - 44;
      const btnH = 48;
      const fightBtn = this.createActionButton(btnW, btnH, '▷ FIGHT!', COLORS.butterYellow, () => {
        soundManager.play('flick');
        this.emit('start_fight', {
          penIndex: this.selectedIndex,
          mode: 'VS_AI',
          difficulty: this.difficulty,
          look: 'real',
          mirror: false,
          equalLevels: true,
        });
      });
      this.bottomControlsContainer.addChild(fightBtn);

    } else {
      // 2-Player mode: Equip P1, Equip P2, Start Match
      const btnW = (cardW - 54) / 2;
      const btnH = 40;

      const isP1 = this.p1EquippedIndex === this.selectedIndex;
      const isP2 = this.p2EquippedIndex === this.selectedIndex;

      const p1Btn = this.createActionButton(
        btnW,
        btnH,
        isP1 ? '✓ P1 READY' : 'EQUIP P1',
        isP1 ? COLORS.mintGreen : COLORS.cardCream,
        () => {
          soundManager.play('ui_click');
          this.p1EquippedIndex = this.selectedIndex;
          this.updateView();
        }
      );
      p1Btn.x = -cardW / 4;
      p1Btn.y = -26;
      this.bottomControlsContainer.addChild(p1Btn);

      const p2Btn = this.createActionButton(
        btnW,
        btnH,
        isP2 ? '✓ P2 READY' : 'EQUIP P2',
        isP2 ? COLORS.skyBlue : COLORS.cardCream,
        () => {
          soundManager.play('ui_click');
          this.p2EquippedIndex = this.selectedIndex;
          this.updateView();
        }
      );
      p2Btn.x = cardW / 4;
      p2Btn.y = -26;
      this.bottomControlsContainer.addChild(p2Btn);

      const startBtn = this.createActionButton(
        cardW - 44,
        46,
        '▷ START MATCH',
        COLORS.butterYellow,
        () => {
          soundManager.play('flick');
          this.emit('start_fight', {
            penIndex: this.p1EquippedIndex,
            mode: 'TWO_PLAYER',
            difficulty: 'normal',
            look: 'real',
            mirror: this.p1EquippedIndex === this.p2EquippedIndex,
            equalLevels: true,
          });
        }
      );
      startBtn.y = 22;
      this.bottomControlsContainer.addChild(startBtn);
    }
  }

  private createNavButton(label: string, onClick: () => void): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const r = 18;
    const shadow = new Graphics()
      .circle(0, 3, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .circle(0, 0, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });
    btn.addChild(surface);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 13,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    txt.anchor.set(0.5, 0.5);
    surface.addChild(txt);

    btn.on('pointerdown', () => { surface.y = 2; });
    btn.on('pointerup', () => {
      surface.y = 0;
      onClick();
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });
    return btn;
  }

  private createActionButton(
    w: number,
    h: number,
    label: string,
    bgColor: number,
    onClick: () => void
  ): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const r = 15;
    const shadow = new Graphics()
      .roundRect(-w / 2, 4, w, h, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-w / 2, 0, w, h, r)
      .fill({ color: bgColor })
      .stroke({ color: COLORS.navyBorder, width: 2.6 });
    btn.addChild(surface);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 15,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    txt.anchor.set(0.5, 0.5);
    txt.y = h / 2;
    surface.addChild(txt);

    btn.on('pointerdown', () => { surface.y = 2.5; });
    btn.on('pointerup', () => {
      surface.y = 0;
      onClick();
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });
    return btn;
  }

  private createCloseButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const r = 14;
    const shadow = new Graphics()
      .circle(0, 2, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .circle(0, 0, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });
    btn.addChild(surface);

    const txt = new Text({
      text: '✕',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 12,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    txt.anchor.set(0.5, 0.5);
    surface.addChild(txt);

    btn.on('pointerdown', () => { surface.y = 1.5; });
    btn.on('pointerup', () => {
      surface.y = 0;
      soundManager.play('ui_click');
      this.hide();
      this.emit('back');
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });
    return btn;
  }
}

function Flora(d: string): number {
  if (d === 'easy') return 0xF0ECE1;
  if (d === 'normal') return 0xEAE1D2;
  return 0xE2D7C4;
}
