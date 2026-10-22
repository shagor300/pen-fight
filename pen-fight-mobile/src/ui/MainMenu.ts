/**
 * src/ui/MainMenu.ts
 * 100% Authentic Home Screen replicating shunneklabs.app reference (Image 3).
 *
 * Features:
 * - Rich, warm deep mahogany desk wood (0x381E0C) with plank grooves, subtle wood grain, and realistic doodles.
 * - Scattered realistic curled yellow pencil shavings with graphite core.
 * - Pinned ripped notebook paper header with blue horizontal rulings, red vertical margin, and masking tape strips.
 * - Student desk clock icon [ ⏱️ ✏️ ] pinned to header.
 * - Chunky 3D "Pen Fight" cartoon logo + "THE SCHOOL DESK SERIES" pill banner.
 * - REALISTIC 3D CROSSING PENS (Orange Ballpoint & Blue Gel Pen) with CONTINUOUS LIVE FLOATING ANIMATION:
 *   - Continuous bobbing (sine & cosine floating physics)
 *   - Tilting angle oscillation
 *   - Pulsing golden starburst collision spark with rotation
 *   - Trailing motion blur speed streaks
 * - Giant Butter-Yellow [ ▷ Play ] button with "Played X" match count.
 * - Bottom action cards: [ 🏆 Leaderboard ], [ 📊 Stats ], [ ⚙️ Settings ], and [ ✉️ Feedback ].
 * - Version footer: v1.5.4 · 52c2e5f.
 */
import { Container, Graphics, Text, TextStyle, Rectangle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { ProgressionManager } from '../core/ProgressionManager';
import { soundManager } from '../audio/SoundAndHaptics';
import EventEmitter from 'eventemitter3';

export class MainMenu extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;
  private progression?: ProgressionManager;

  // Background & Desk Layers
  private bgContainer: Container;
  private deskGraphics: Graphics;
  private pencilShavingsGraphics: Graphics;

  // Taped Ripped Notebook Header
  private headerContainer: Container;
  private avatarBtn: Container;
  private menuBtn: Container;

  // Floating Crossing Pens
  private pensArtContainer: Container;
  private orangePenContainer: Container;
  private bluePenContainer: Container;
  private sparkburstContainer: Container;
  private motionStreaksGraphics: Graphics;

  // Animation Physics State
  private animTime = 0;
  private baseOrangeY = 0;
  private baseOrangeRot = -0.52; // ~-30 degrees
  private baseBlueY = 0;
  private baseBlueRot = 0.24;   // ~14 degrees

  // Action Buttons
  private playBtnContainer: Container;
  private playBtnSurface: Graphics;
  private playBtnShadow: Graphics;
  private playBtnContent: Container;
  private subText: Text;
  private bottomCardsContainer: Container;
  private feedbackBtn: Container;
  private versionText: Text;

  constructor(
    screenWidth: number,
    screenHeight: number,
    progression?: ProgressionManager
  ) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.progression = progression;

    this.container = new Container();

    // 1. Desk Background & Details
    this.bgContainer = new Container();
    this.container.addChild(this.bgContainer);

    this.deskGraphics = new Graphics();
    this.bgContainer.addChild(this.deskGraphics);

    this.pencilShavingsGraphics = new Graphics();
    this.bgContainer.addChild(this.pencilShavingsGraphics);

    // 2. Taped Ripped Notebook Header
    this.headerContainer = new Container();
    this.container.addChild(this.headerContainer);

    this.avatarBtn = this.createAvatarButton();
    this.headerContainer.addChild(this.avatarBtn);

    this.menuBtn = this.createMenuDotsButton();
    this.headerContainer.addChild(this.menuBtn);

    // 3. Floating Crossing Pens Artwork
    this.pensArtContainer = new Container();
    this.container.addChild(this.pensArtContainer);

    this.motionStreaksGraphics = new Graphics();
    this.pensArtContainer.addChild(this.motionStreaksGraphics);

    this.orangePenContainer = new Container();
    this.pensArtContainer.addChild(this.orangePenContainer);

    this.bluePenContainer = new Container();
    this.pensArtContainer.addChild(this.bluePenContainer);

    this.sparkburstContainer = new Container();
    this.pensArtContainer.addChild(this.sparkburstContainer);

    // 4. Giant Butter-Yellow Play Button
    this.playBtnContainer = new Container();
    this.playBtnShadow = new Graphics();
    this.playBtnSurface = new Graphics();
    this.playBtnContent = new Container();
    this.playBtnContainer.addChild(this.playBtnShadow);
    this.playBtnContainer.addChild(this.playBtnSurface);
    this.playBtnSurface.addChild(this.playBtnContent);
    this.container.addChild(this.playBtnContainer);

    // Played X subtitle
    const subStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 14,
      fill: 0xBAAFA1,
      fontWeight: 'bold',
    });
    this.subText = new Text({ text: 'Played 0', style: subStyle });
    this.subText.anchor.set(0.5, 0);
    this.container.addChild(this.subText);

    // 5. Bottom Action Cards & Feedback Button
    this.bottomCardsContainer = new Container();
    this.container.addChild(this.bottomCardsContainer);

    this.feedbackBtn = this.createFeedbackButton();
    this.container.addChild(this.feedbackBtn);

    // 6. Version Footer
    const verStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 12,
      fill: 0x827768,
      fontWeight: 'bold',
    });
    this.versionText = new Text({ text: 'v1.5.4 · 52c2e5f', style: verStyle });
    this.versionText.anchor.set(0.5, 1);
    this.container.addChild(this.versionText);

    this.buildPensGraphics();
    this.layout();
  }

  public show(): void {
    this.container.visible = true;
    this.updateStats();
  }

  public hide(): void {
    this.container.visible = false;
  }

  public updateStats(): void {
    if (this.progression) {
      const count = this.progression.getTotalMatchesPlayed();
      this.subText.text = `Played ${count}`;
    }
  }

  /**
   * Continuous 60-120fps Animation Loop.
   * Gives the two crossing pens a smooth, realistic floating/hovering physics motion.
   */
  public update(dt: number): void {
    if (!this.container.visible) return;

    this.animTime += dt;
    const t = this.animTime;

    // Smooth floating harmonic oscillation
    const orangeBob = Math.sin(t * 2.2) * 5;
    const orangeTilt = Math.sin(t * 1.5) * 0.035;
    this.orangePenContainer.y = this.baseOrangeY + orangeBob;
    this.orangePenContainer.rotation = this.baseOrangeRot + orangeTilt;

    const blueBob = Math.cos(t * 2.5) * 4.5;
    const blueTilt = Math.cos(t * 1.8) * 0.03;
    this.bluePenContainer.y = this.baseBlueY + blueBob;
    this.bluePenContainer.rotation = this.baseBlueRot + blueTilt;

    // Pulsing golden starburst spark at intersection
    const sparkPulse = 0.92 + Math.sin(t * 4.6) * 0.16;
    this.sparkburstContainer.scale.set(sparkPulse);
    this.sparkburstContainer.rotation += dt * 0.6;

    // Motion streaks gentle shimmer
    this.motionStreaksGraphics.alpha = 0.78 + Math.sin(t * 3.2) * 0.2;
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.drawMahoganyDesk(screenWidth, screenHeight);
    this.drawPencilShavings(screenWidth, screenHeight);

    // 1. Taped Ripped Notebook Paper Header
    const headerW = Math.min(screenWidth - 16, 388);
    const headerH = 158;
    this.headerContainer.x = screenWidth / 2;
    this.headerContainer.y = Math.max(16, screenHeight * 0.024);
    this.drawRippedNotebookHeader(headerW, headerH);

    // 2. Center Crossing Pens
    const pensCenterY = Math.max(260, screenHeight * 0.39);
    this.pensArtContainer.x = screenWidth / 2;
    this.pensArtContainer.y = pensCenterY;
    this.drawMotionStreaks();

    // 3. Play Button & Subtitle
    const playY = Math.max(450, screenHeight * 0.64);
    this.playBtnContainer.x = screenWidth / 2;
    this.playBtnContainer.y = playY;
    this.buildPlayButton();

    this.subText.x = screenWidth / 2;
    this.subText.y = playY + 76;

    // 4. Bottom Action Cards: Leaderboard, Stats, Settings
    const cardsY = playY + 112;
    this.bottomCardsContainer.x = screenWidth / 2;
    this.bottomCardsContainer.y = cardsY;
    this.buildBottomCards();

    // 5. Feedback button (aligned right below Settings)
    const totalW = Math.min(this.screenWidth - 40, 360);
    const gap = 12;
    const cardW = (totalW - gap * 2) / 3;
    const rightCardCenterX = totalW / 2 - cardW / 2;

    this.feedbackBtn.x = screenWidth / 2 + rightCardCenterX;
    this.feedbackBtn.y = cardsY + 84;

    // 6. Footer
    this.versionText.x = screenWidth / 2;
    this.versionText.y = screenHeight - 14;

    this.updateStats();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. DESK BACKGROUND & PENCIL SHAVINGS
  // ══════════════════════════════════════════════════════════════════════════
  private drawMahoganyDesk(w: number, h: number): void {
    const g = this.deskGraphics;
    g.clear();

    // Rich dark walnut/mahogany hardwood base matching Image 3
    g.rect(0, 0, w, h).fill({ color: 0x381E0C });

    // Vertical plank grooves with subtle bevel highlight
    const plankW = Math.max(86, w / 4.2);
    for (let x = 0; x < w; x += plankW) {
      // Dark recess groove
      g.rect(x, 0, 2.5, h).fill({ color: 0x1E0F06, alpha: 0.65 });
      // Soft plank highlight
      g.rect(x + 2.5, 0, plankW - 3.5, h).fill({ color: 0x4D2A12, alpha: 0.16 });
      // Subtle wood grain streaks
      g.rect(x + plankW * 0.35, 0, 1.2, h).fill({ color: 0x221107, alpha: 0.28 });
      g.rect(x + plankW * 0.72, 0, 1.2, h).fill({ color: 0x4A2810, alpha: 0.22 });
    }

    // Classroom desk carvings (pencil scratches, compass circle, faint tic-tac-toe)
    // Compass scratch
    g.circle(w * 0.16, h * 0.74, 22).stroke({ color: 0x1E0F06, width: 1.2, alpha: 0.35 });
    // Tic-Tac-Toe carving near bottom-left
    const tx = w * 0.12;
    const ty = h * 0.88;
    g.moveTo(tx + 8, ty).lineTo(tx + 8, ty + 24).stroke({ color: 0x1E0F06, width: 1.2, alpha: 0.35 });
    g.moveTo(tx + 16, ty).lineTo(tx + 16, ty + 24).stroke({ color: 0x1E0F06, width: 1.2, alpha: 0.35 });
    g.moveTo(tx, ty + 8).lineTo(tx + 24, ty + 8).stroke({ color: 0x1E0F06, width: 1.2, alpha: 0.35 });
    g.moveTo(tx, ty + 16).lineTo(tx + 24, ty + 16).stroke({ color: 0x1E0F06, width: 1.2, alpha: 0.35 });

    // Dark ink stain near right edge matching Image 3
    g.ellipse(w * 0.88, h * 0.62, 14, 20).fill({ color: 0x1A202C, alpha: 0.42 });
    g.circle(w * 0.86, h * 0.65, 5).fill({ color: 0x1A202C, alpha: 0.35 });
  }

  private drawPencilShavings(w: number, h: number): void {
    const g = this.pencilShavingsGraphics;
    g.clear();

    // 1. Two curled yellow shavings at top-right (near title)
    this.drawCurledShaving(g, w * 0.88, h * 0.41, 14, 0.4);
    this.drawCurledShaving(g, w * 0.82, h * 0.43, 11, -0.6);

    // 2. Curled shaving at bottom-left
    this.drawCurledShaving(g, w * 0.10, h * 0.95, 15, 0.8);
  }

  private drawCurledShaving(g: Graphics, cx: number, cy: number, r: number, rot: number): void {
    // Soft shadow
    g.ellipse(cx + 2, cy + 3, r * 0.9, r * 0.6).fill({ color: 0x1A0E06, alpha: 0.35 });

    // Fan-like scalloped yellow wooden ring with graphite core
    g.beginPath();
    g.arc(cx, cy, r, rot, rot + Math.PI * 1.3);
    g.stroke({ color: 0xFACC15, width: 5.5, cap: 'round' });

    // Inner natural wood facet
    g.beginPath();
    g.arc(cx, cy, r - 2.5, rot + 0.1, rot + Math.PI * 1.2);
    g.stroke({ color: 0xFEF08A, width: 2.2, cap: 'round' });

    // Dark graphite core lead edge
    g.beginPath();
    g.arc(cx, cy, r - 5, rot + 0.2, rot + Math.PI * 1.1);
    g.stroke({ color: 0x334155, width: 2.4, cap: 'round' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. TAPED RIPPED NOTEBOOK PAPER HEADER
  // ══════════════════════════════════════════════════════════════════════════
  private drawRippedNotebookHeader(w: number, h: number): void {
    const cc = this.headerContainer;
    // Clear dynamic drawn background
    const bg = new Graphics();
    cc.addChildAt(bg, 0);

    // 1. Soft paper drop shadow onto desk
    bg.rect(-w / 2, 4, w, h - 4).fill({ color: 0x140B04, alpha: 0.45 });

    // 2. Cream Notebook Paper with Jagged Torn Bottom
    bg.beginPath();
    bg.moveTo(-w / 2, 0);
    bg.lineTo(w / 2, 0);
    bg.lineTo(w / 2, h - 16);

    // Jagged rip at bottom edge
    const ripStep = 18;
    for (let x = w / 2; x >= -w / 2; x -= ripStep) {
      const ripY = (h - 16) + (Math.sin(x * 0.14) * 5 + ((x % 36 === 0) ? 6 : -4));
      bg.lineTo(x, ripY);
    }
    bg.lineTo(-w / 2, h - 16);
    bg.closePath();
    bg.fill({ color: 0xFDFBF7 });

    // 3. Horizontal Light Blue Notebook Lines
    for (let y = 34; y < h - 18; y += 22) {
      bg.moveTo(-w / 2 + 12, y).lineTo(w / 2 - 12, y)
        .stroke({ color: 0x93C5FD, width: 1.2, alpha: 0.45 });
    }

    // 4. Red Margin Line on Left & Punch Holes
    const marginX = -w / 2 + 38;
    bg.moveTo(marginX, 0).lineTo(marginX, h - 14)
      .stroke({ color: 0xF87171, width: 1.4, alpha: 0.55 });

    // 3 Loose-leaf binder hole punch rings
    const punchX = -w / 2 + 18;
    bg.circle(punchX, 34, 4.5).fill({ color: 0x381E0C }).stroke({ color: 0x221107, width: 1.2 });
    bg.circle(punchX, 78, 4.5).fill({ color: 0x381E0C }).stroke({ color: 0x221107, width: 1.2 });
    bg.circle(punchX, 122, 4.5).fill({ color: 0x381E0C }).stroke({ color: 0x221107, width: 1.2 });

    // 5. White Semi-translucent Masking Tape Strips pinning paper to desk
    this.drawMaskingTape(bg, -w / 2 + 60, -8, 54, 18, -0.15);
    this.drawMaskingTape(bg, w / 2 - 60, -8, 54, 18, 0.15);

    // 6. Student Desk & Clock Square Badge pinned with tape in center
    const badgeW = 76;
    const badgeH = 76;
    const badgeY = 32;

    // Shadow
    bg.roundRect(-badgeW / 2, badgeY + 4, badgeW, badgeH, 16)
      .fill({ color: 0xCBD5E1, alpha: 0.65 });
    // Surface
    bg.roundRect(-badgeW / 2, badgeY, badgeW, badgeH, 16)
      .fill({ color: 0xFFFFFF })
      .stroke({ color: 0x2B333E, width: 3 });

    // Clock & Crossing Pens Illustration inside badge
    this.drawDeskClockIllustration(bg, 0, badgeY + badgeH / 2);

    // Masking tape strip pinning the badge
    this.drawMaskingTape(bg, 0, badgeY - 6, 42, 14, 0);

    // 7. Chunky 3D "Pen Fight" cartoon logo
    this.drawCartoonLogo(cc, 0, badgeY + badgeH + 34);

    // 8. "THE SCHOOL DESK SERIES" Pill Banner
    const pillW = 214;
    const pillH = 26;
    const pillY = badgeY + badgeH + 62;

    bg.roundRect(-pillW / 2, pillY + 3, pillW, pillH, 13)
      .fill({ color: COLORS.navyShadow });
    bg.roundRect(-pillW / 2, pillY, pillW, pillH, 13)
      .fill({ color: 0xFFFDF8 })
      .stroke({ color: COLORS.navyBorder, width: 2.4 });

    const bannerText = new Text({
      text: 'THE SCHOOL DESK SERIES',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10.5,
        fill: COLORS.navyBorder,
        fontWeight: '800',
        letterSpacing: 1.8,
      })
    });
    bannerText.anchor.set(0.5, 0.5);
    bannerText.x = 0;
    bannerText.y = pillY + pillH / 2;
    cc.addChild(bannerText);

    // Position Header Buttons
    this.avatarBtn.x = -w / 2 + 36;
    this.avatarBtn.y = 26;

    this.menuBtn.x = w / 2 - 36;
    this.menuBtn.y = 26;
  }

  private drawDeskClockIllustration(g: Graphics, cx: number, cy: number): void {
    // Student wooden desk
    g.roundRect(cx - 24, cy + 8, 48, 8, 3).fill({ color: 0xFDE047 }).stroke({ color: 0x2B333E, width: 2 });
    g.rect(cx - 18, cy + 16, 4, 10).fill({ color: 0x2B333E });
    g.rect(cx + 14, cy + 16, 4, 10).fill({ color: 0x2B333E });

    // Little crossed pens
    g.moveTo(cx - 16, cy + 8).lineTo(cx + 6, cy - 14).stroke({ color: 0x3B82F6, width: 5.5, cap: 'round' });
    g.moveTo(cx - 16, cy + 8).lineTo(cx + 6, cy - 14).stroke({ color: 0x1E3A8A, width: 1.8, cap: 'round' });

    g.moveTo(cx + 16, cy + 8).lineTo(cx - 6, cy - 14).stroke({ color: 0xEA580C, width: 5.5, cap: 'round' });
    g.moveTo(cx + 16, cy + 8).lineTo(cx - 6, cy - 14).stroke({ color: 0x9A3412, width: 1.8, cap: 'round' });

    // Clock face
    g.circle(cx, cy - 8, 14).fill({ color: 0xFFFFFF }).stroke({ color: 0x2B333E, width: 2.2 });
    g.circle(cx, cy - 8, 2).fill({ color: 0x2B333E });
    g.moveTo(cx, cy - 8).lineTo(cx, cy - 15).stroke({ color: 0x2B333E, width: 1.8, cap: 'round' });
    g.moveTo(cx, cy - 8).lineTo(cx + 5, cy - 8).stroke({ color: 0xEF4444, width: 1.6, cap: 'round' });
  }

  private drawMaskingTape(g: Graphics, x: number, y: number, w: number, h: number, rot: number): void {
    // Tape shadow
    g.roundRect(x - w / 2, y + 1.5, w, h, 2)
      .fill({ color: 0x1E130B, alpha: 0.18 });

    // Semi-translucent textured masking tape
    g.roundRect(x - w / 2, y, w, h, 2)
      .fill({ color: 0xFAF6E9, alpha: 0.88 })
      .stroke({ color: 0xDCD5C0, width: 1, alpha: 0.6 });
  }

  private drawCartoonLogo(parent: Container, cx: number, cy: number): void {
    const logoCont = new Container();
    logoCont.x = cx;
    logoCont.y = cy;

    // 3D Shadow layer
    const shadowStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 52,
      fill: COLORS.navyShadow,
      stroke: { color: COLORS.navyShadow, width: 9 },
      fontWeight: 'bold',
      letterSpacing: 2,
    });
    const penShadow = new Text({ text: 'Pen ', style: shadowStyle });
    penShadow.anchor.set(1, 0.5);
    penShadow.x = -4;
    penShadow.y = 5;
    logoCont.addChild(penShadow);

    const fightShadow = new Text({ text: 'Fight', style: shadowStyle });
    fightShadow.anchor.set(0, 0.5);
    fightShadow.x = -4;
    fightShadow.y = 5;
    logoCont.addChild(fightShadow);

    // Front crisp layer
    const penStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 52,
      fill: COLORS.cardCream,
      stroke: { color: COLORS.navyBorder, width: 8 },
      fontWeight: 'bold',
      letterSpacing: 2,
    });
    const penText = new Text({ text: 'Pen ', style: penStyle });
    penText.anchor.set(1, 0.5);
    penText.x = -4;
    logoCont.addChild(penText);

    const fightStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 52,
      fill: COLORS.butterYellow,
      stroke: { color: COLORS.navyBorder, width: 8 },
      fontWeight: 'bold',
      letterSpacing: 2,
    });
    const fightText = new Text({ text: 'Fight', style: fightStyle });
    fightText.anchor.set(0, 0.5);
    fightText.x = -4;
    logoCont.addChild(fightText);

    parent.addChild(logoCont);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. REALISTIC CROSSING PENS ARTWORK & MOTION PHYSICS
  // ══════════════════════════════════════════════════════════════════════════
  private buildPensGraphics(): void {
    // 1. Orange Cheap Ballpoint (slanted upwards ~30 deg)
    const og = new Graphics();
    this.orangePenContainer.removeChildren();
    this.orangePenContainer.addChild(og);

    // Soft realistic drop shadow under orange pen
    og.ellipse(10, 24, 110, 10).fill({ color: 0x140B04, alpha: 0.32 });

    // Tail end cap plug (Orange)
    og.roundRect(-138, -6, 14, 12, 3).fill({ color: 0xEA580C }).stroke({ color: 0x9A3412, width: 1.4 });

    // Hexagonal crystal acrylic barrel
    og.roundRect(-124, -6.5, 172, 13, 3).fill({ color: 0xE2E8F0, alpha: 0.82 }).stroke({ color: 0x94A3B8, width: 1.2 });

    // Top specular highlight along acrylic barrel
    og.roundRect(-122, -5.5, 168, 3, 1.5).fill({ color: 0xFFFFFF, alpha: 0.75 });

    // Internal dark blue ink core cartridge
    og.roundRect(-116, -1.8, 154, 3.6, 1.8).fill({ color: 0x1D4ED8 });

    // Front nose cone collar (Orange)
    og.beginPath();
    og.moveTo(48, -6.5);
    og.lineTo(66, -3.5);
    og.lineTo(66, 3.5);
    og.lineTo(48, 6.5);
    og.closePath();
    og.fill({ color: 0xEA580C });
    og.stroke({ color: 0x9A3412, width: 1.4 });

    // Brass nib & ballpoint
    og.beginPath();
    og.moveTo(66, -3);
    og.lineTo(76, -1.2);
    og.lineTo(76, 1.2);
    og.lineTo(66, 3);
    og.closePath();
    og.fill({ color: 0xF59E0B }).stroke({ color: 0xB45309, width: 1.2 });
    og.circle(77.5, 0, 2).fill({ color: 0x1E293B });

    this.baseOrangeRot = -0.52; // ~-30°
    this.orangePenContainer.rotation = this.baseOrangeRot;

    // 2. Blue Rollerball / Gel Pen (crosses over from top-left to bottom-right ~14 deg)
    const bg = new Graphics();
    this.bluePenContainer.removeChildren();
    this.bluePenContainer.addChild(bg);

    // Soft drop shadow under blue pen
    bg.ellipse(8, 22, 115, 11).fill({ color: 0x140B04, alpha: 0.35 });

    // Translucent grey/smoke barrel
    bg.roundRect(-120, -7.5, 142, 15, 4).fill({ color: 0xCBD5E1, alpha: 0.9 }).stroke({ color: 0x64748B, width: 1.4 });

    // Dark blue ink core inside
    bg.roundRect(-108, -2.5, 118, 5, 2.5).fill({ color: 0x1E3A8A });

    // Pocket clip on left
    bg.roundRect(-115, -12, 52, 4.5, 2).fill({ color: 0x2563EB }).stroke({ color: 0x1E40AF, width: 1.2 });

    // Ribbed textured Blue Rubber Grip
    bg.roundRect(22, -8.5, 58, 17, 3.5).fill({ color: 0x1D4ED8 }).stroke({ color: 0x1E3A8A, width: 1.6 });
    for (let gx = 28; gx <= 74; gx += 7) {
      bg.rect(gx, -7.5, 2.5, 15).fill({ color: 0x1E40AF, alpha: 0.7 });
    }

    // Stainless steel nose cone
    bg.beginPath();
    bg.moveTo(80, -7);
    bg.lineTo(102, -2.2);
    bg.lineTo(102, 2.2);
    bg.lineTo(80, 7);
    bg.closePath();
    bg.fill({ color: 0xE2E8F0 }).stroke({ color: 0x94A3B8, width: 1.4 });

    // Steel tungsten rollerball tip
    bg.circle(104, 0, 2.8).fill({ color: 0x334155 });

    this.baseBlueRot = 0.24; // ~14°
    this.bluePenContainer.rotation = this.baseBlueRot;

    // 3. Golden Starburst Spark at collision intersection point
    const sg = new Graphics();
    this.sparkburstContainer.removeChildren();
    this.sparkburstContainer.addChild(sg);

    const spikes = 8;
    const innerR = 8;
    const outerR = 26;
    sg.circle(0, 0, 20).fill({ color: 0xFFE082, alpha: 0.5 });
    sg.circle(0, 0, 10).fill({ color: 0xFFFFFF, alpha: 0.95 });

    for (let i = 0; i < spikes; i++) {
      const angle = (i * Math.PI) / (spikes / 2);
      const x1 = Math.cos(angle) * innerR;
      const y1 = Math.sin(angle) * innerR;
      const x2 = Math.cos(angle) * outerR;
      const y2 = Math.sin(angle) * outerR;
      sg.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: 0xFACC15, width: 3.2, cap: 'round' });
    }

    this.sparkburstContainer.x = 42;
    this.sparkburstContainer.y = -8;
  }

  private drawMotionStreaks(): void {
    const g = this.motionStreaksGraphics;
    g.clear();

    // Subtle white-grey speed streaks trailing the orange pen flick
    g.moveTo(-160, 96).lineTo(-80, 52).stroke({ color: 0xFFFFFF, width: 2.2, alpha: 0.35, cap: 'round' });
    g.moveTo(-140, 110).lineTo(-70, 72).stroke({ color: 0xFFFFFF, width: 1.8, alpha: 0.28, cap: 'round' });
    g.moveTo(-110, 118).lineTo(-45, 82).stroke({ color: 0xFFFFFF, width: 1.4, alpha: 0.22, cap: 'round' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. CHUNKY PLAY BUTTON
  // ══════════════════════════════════════════════════════════════════════════
  private buildPlayButton(): void {
    const btnW = Math.min(this.screenWidth - 44, 360);
    const btnH = 68;
    const btnR = 9999;

    // 3D Shadow
    this.playBtnShadow.clear()
      .roundRect(-btnW / 2, 6, btnW, btnH, btnR)
      .fill({ color: COLORS.navyShadow });

    // Butter Yellow Surface
    this.playBtnSurface.clear()
      .roundRect(-btnW / 2, 0, btnW, btnH, btnR)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: COLORS.navyBorder, width: 3.6 });

    // Icon & Label
    this.playBtnContent.removeChildren();

    const playIcon = new Text({
      text: '▷',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 32,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    playIcon.anchor.set(1, 0.5);
    playIcon.x = -6;
    playIcon.y = btnH / 2 - 1;
    this.playBtnContent.addChild(playIcon);

    const playLabel = new Text({
      text: 'Play',
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 32,
        fill: COLORS.textDark,
        fontWeight: 'bold',
        letterSpacing: 1,
      })
    });
    playLabel.anchor.set(0, 0.5);
    playLabel.x = 4;
    playLabel.y = btnH / 2 - 1;
    this.playBtnContent.addChild(playLabel);

    // Tactile Press Physics
    this.playBtnContainer.eventMode = 'static';
    this.playBtnContainer.cursor = 'pointer';

    this.playBtnContainer.on('pointerdown', () => {
      this.playBtnSurface.y = 3.5;
    });
    this.playBtnContainer.on('pointerup', () => {
      this.playBtnSurface.y = 0;
      soundManager.play('flick');
      this.emit('play_click');
    });
    this.playBtnContainer.on('pointerupoutside', () => {
      this.playBtnSurface.y = 0;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. BOTTOM ACTION CARDS & FEEDBACK
  // ══════════════════════════════════════════════════════════════════════════
  private buildBottomCards(): void {
    this.bottomCardsContainer.removeChildren();

    const totalW = Math.min(this.screenWidth - 40, 360);
    const gap = 12;
    const cardW = (totalW - gap * 2) / 3;
    const cardH = 68;
    const cardR = 18;

    const cards = [
      {
        id: 'leaderboard',
        label: 'Leaderboard',
        icon: '🏆',
        onClick: () => this.emit('open_leaderboard')
      },
      {
        id: 'stats',
        label: 'Stats',
        icon: '📊',
        onClick: () => this.emit('open_stats')
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: '⚙️',
        onClick: () => this.emit('open_settings')
      }
    ];

    const startX = -totalW / 2;

    cards.forEach((c, idx) => {
      const card = new Container();
      card.x = startX + idx * (cardW + gap) + cardW / 2;
      card.eventMode = 'static';
      card.cursor = 'pointer';
      card.hitArea = new Rectangle(-cardW / 2, 0, cardW, cardH + 5);

      // 3D Shadow
      const shadow = new Graphics()
        .roundRect(-cardW / 2, 5, cardW, cardH, cardR)
        .fill({ color: COLORS.navyShadow });
      card.addChild(shadow);

      // Cream Surface
      const surface = new Graphics()
        .roundRect(-cardW / 2, 0, cardW, cardH, cardR)
        .fill({ color: COLORS.cardCream })
        .stroke({ color: COLORS.navyBorder, width: 2.8 });
      card.addChild(surface);

      // Icon
      const icon = new Text({
        text: c.icon,
        style: new TextStyle({ fontSize: 22 })
      });
      icon.anchor.set(0.5, 0);
      icon.y = 8;
      surface.addChild(icon);

      // Label
      const lbl = new Text({
        text: c.label,
        style: new TextStyle({
          fontFamily: 'Fredoka, Nunito, sans-serif',
          fontSize: 11,
          fill: COLORS.textDark,
          fontWeight: 'bold',
        })
      });
      lbl.anchor.set(0.5, 0);
      lbl.y = 40;
      surface.addChild(lbl);

      card.on('pointerdown', () => { surface.y = 2.5; });
      card.on('pointerup', () => {
        surface.y = 0;
        soundManager.play('ui_click');
        c.onClick();
      });
      card.on('pointerupoutside', () => { surface.y = 0; });

      this.bottomCardsContainer.addChild(card);
    });
  }

  private createFeedbackButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const w = 104;
    const h = 34;
    const r = 12;

    const shadow = new Graphics()
      .roundRect(-w / 2, 3, w, h, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-w / 2, 0, w, h, r)
      .fill({ color: 0xFDFBF5 })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });
    btn.addChild(surface);

    const icon = new Text({
      text: '✉',
      style: new TextStyle({ fontSize: 13, fill: COLORS.textDark, fontWeight: 'bold' })
    });
    icon.anchor.set(1, 0.5);
    icon.x = -3;
    icon.y = h / 2;
    surface.addChild(icon);

    const lbl = new Text({
      text: 'Feedback',
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 11.5,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    lbl.anchor.set(0, 0.5);
    lbl.x = 2;
    lbl.y = h / 2;
    surface.addChild(lbl);

    btn.on('pointerdown', () => { surface.y = 2; });
    btn.on('pointerup', () => {
      surface.y = 0;
      soundManager.play('ui_click');
      this.emit('open_feedback');
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });

    return btn;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6. HEADER BUTTONS
  // ══════════════════════════════════════════════════════════════════════════
  private createAvatarButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const r = 18;
    const circle = new Graphics()
      .circle(0, 0, r)
      .fill({ color: 0x334155 })
      .stroke({ color: 0x1E293B, width: 2.4 });
    btn.addChild(circle);

    // Profile icon
    const icon = new Text({
      text: '👤',
      style: new TextStyle({ fontSize: 16 })
    });
    icon.anchor.set(0.5, 0.5);
    btn.addChild(icon);

    // Orange notification badge dot on top-right
    const dot = new Graphics()
      .circle(r * 0.72, -r * 0.72, 4.2)
      .fill({ color: 0xF97316 })
      .stroke({ color: 0xFFFFFF, width: 1.5 });
    btn.addChild(dot);

    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      this.emit('open_stats');
    });

    return btn;
  }

  private createMenuDotsButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const r = 18;
    const circle = new Graphics()
      .circle(0, 0, r)
      .fill({ color: 0xE2E8F0 })
      .stroke({ color: 0x334155, width: 2.4 });
    btn.addChild(circle);

    const dots = new Text({
      text: '···',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 20,
        fill: 0x334155,
        fontWeight: 'bold',
      })
    });
    dots.anchor.set(0.5, 0.5);
    dots.y = -2;
    btn.addChild(dots);

    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      this.emit('open_settings');
    });

    return btn;
  }
}
