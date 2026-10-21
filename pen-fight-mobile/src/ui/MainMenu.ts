/**
 * MainMenu.ts
 * Playful Skeuomorphic Mobile Game UI with Wooden Desk Texture, Chunky Rounded Buttons,
 * Navy Blue Outlines, Butter Yellow Accents, Faux-3D Shadows, and Cartoon Typography.
 * Replicates the original reference game (shunneklabs.app) home screen 1:1.
 */
import { Container, Graphics, Sprite, Text, TextStyle, Assets, Rectangle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { ProgressionManager } from '../core/ProgressionManager';
import { soundManager } from '../audio/SoundAndHaptics';
import EventEmitter from 'eventemitter3';

export class MainMenu extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;
  private progression?: ProgressionManager;

  // Visual Nodes
  private bgContainer: Container;
  private deskSprite: Sprite | null = null;
  private fallbackDesk: Graphics;

  private helpBtn: Container;
  private titleContainer: Container;
  private pensArtContainer: Container;
  private playBtnContainer: Container;
  private playBtnSurface: Graphics;
  private playBtnShadow: Graphics;
  private playBtnContent: Container;
  private subText: Text;
  private bottomCardsContainer: Container;
  private versionText: Text;

  // Starburst sparkle animation timer
  private sparkleAngle = 0;
  private starburstG: Graphics;

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

    // 1. Background layer
    this.bgContainer = new Container();
    this.container.addChild(this.bgContainer);

    this.fallbackDesk = new Graphics();
    this.bgContainer.addChild(this.fallbackDesk);

    // Try loading photorealistic wood texture
    this.loadDeskTexture();

    // 2. Help Button (?) in top-right
    this.helpBtn = this.createHelpButton();
    this.container.addChild(this.helpBtn);

    // 3. Title Logo ("Pen Fight - THE SCHOOL DESK SERIES")
    this.titleContainer = new Container();
    this.container.addChild(this.titleContainer);

    // 4. Center Crossing 3D Pens with Golden Starburst
    this.pensArtContainer = new Container();
    this.starburstG = new Graphics();
    this.pensArtContainer.addChild(this.starburstG);
    this.container.addChild(this.pensArtContainer);

    // 5. Giant Butter Yellow "Play" Button
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
      fill: COLORS.textMuted,
      fontWeight: 'bold',
    });
    this.subText = new Text({ text: 'Played 11', style: subStyle });
    this.subText.anchor.set(0.5, 0);
    this.container.addChild(this.subText);

    // 6. Bottom 3 Cards: Leaderboard, Stats, Settings
    this.bottomCardsContainer = new Container();
    this.container.addChild(this.bottomCardsContainer);

    // 7. Footer
    const verStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 12,
      fill: 0x8A8172,
      fontWeight: 'bold',
    });
    this.versionText = new Text({ text: 'v1.2.4 · 8541db7', style: verStyle });
    this.versionText.anchor.set(0.5, 1);
    this.container.addChild(this.versionText);

    this.layout();
    this.buildUI();
  }

  private async loadDeskTexture(): Promise<void> {
    try {
      const tex = await Assets.load('/assets/desks/desk-old.webp');
      if (tex && !this.deskSprite) {
        this.deskSprite = new Sprite(tex);
        this.bgContainer.addChild(this.deskSprite);
        this.layoutBackground();
      }
    } catch {
      // Fallback procedural wood is already in place
    }
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
      this.subText.text = `Played ${this.progression.getTotalMatchesPlayed()}`;
    }
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.layoutBackground();

    // Help button
    this.helpBtn.x = screenWidth - 36;
    this.helpBtn.y = Math.max(34, screenHeight * 0.05);

    // Title
    this.titleContainer.x = screenWidth / 2;
    this.titleContainer.y = Math.max(76, screenHeight * 0.12);

    // Center Pens Artwork
    this.pensArtContainer.x = screenWidth / 2;
    this.pensArtContainer.y = Math.max(240, screenHeight * 0.38);

    // Play Button & Subtitle
    const playY = Math.max(440, screenHeight * 0.63);
    this.playBtnContainer.x = screenWidth / 2;
    this.playBtnContainer.y = playY;

    this.subText.x = screenWidth / 2;
    this.subText.y = playY + 84;

    // Bottom Action Cards
    this.bottomCardsContainer.x = screenWidth / 2;
    this.bottomCardsContainer.y = playY + 118;

    // Version Footer
    this.versionText.x = screenWidth / 2;
    this.versionText.y = screenHeight - 14;

    this.buildUI();
  }

  private layoutBackground(): void {
    const w = this.screenWidth;
    const h = this.screenHeight;

    // Draw rich, warm skeuomorphic wooden desk background with plank gradients
    this.fallbackDesk.clear();
    this.fallbackDesk.rect(0, 0, w, h).fill({ color: 0x986B3E });

    // Vertical plank lines & soft highlights
    const plankWidth = Math.max(80, w / 4);
    for (let x = 0; x < w; x += plankWidth) {
      this.fallbackDesk.rect(x, 0, 2, h).fill({ color: 0x6E4522, alpha: 0.35 });
      this.fallbackDesk.rect(x + 2, 0, plankWidth - 4, h).fill({ color: 0xB8854E, alpha: 0.12 });
    }

    // Classroom desk doodle markings (tic-tac-toe at top right)
    this.drawClassroomDoodles(this.fallbackDesk, w, h);

    if (this.deskSprite) {
      this.deskSprite.width = w;
      this.deskSprite.height = h;
    }
  }

  private drawClassroomDoodles(g: Graphics, w: number, h: number): void {
    // Tic-Tac-Toe in top-right
    const tx = w - 85;
    const ty = Math.max(40, h * 0.06);
    const size = 36;
    g.moveTo(tx + 12, ty).lineTo(tx + 12, ty + size).stroke({ color: 0x4A2E14, width: 1.5, alpha: 0.25 });
    g.moveTo(tx + 24, ty).lineTo(tx + 24, ty + size).stroke({ color: 0x4A2E14, width: 1.5, alpha: 0.25 });
    g.moveTo(tx, ty + 12).lineTo(tx + size, ty + 12).stroke({ color: 0x4A2E14, width: 1.5, alpha: 0.25 });
    g.moveTo(tx, ty + 24).lineTo(tx + size, ty + 24).stroke({ color: 0x4A2E14, width: 1.5, alpha: 0.25 });

    // Faint circles and scratches
    g.circle(tx + 18, ty + 18, 4).stroke({ color: 0x4A2E14, width: 1.5, alpha: 0.25 });
    g.moveTo(tx + 2, ty + 2).lineTo(tx + 10, ty + 10).stroke({ color: 0x4A2E14, width: 1.5, alpha: 0.25 });
    g.moveTo(tx + 10, ty + 2).lineTo(tx + 2, ty + 10).stroke({ color: 0x4A2E14, width: 1.5, alpha: 0.25 });
  }

  private buildUI(): void {
    this.buildTitle();
    this.buildCrossingPensArt();
    this.buildPlayButton();
    this.buildBottomCards();
  }

  // ── 1. Title Logo ──────────────────────────────────────────────────
  private buildTitle(): void {
    this.titleContainer.removeChildren();

    // 3D Shadow Container
    const shadowContainer = new Container();
    shadowContainer.y = 6;
    this.titleContainer.addChild(shadowContainer);

    // Front Title Container
    const frontContainer = new Container();
    this.titleContainer.addChild(frontContainer);

    const titleStyleShadow = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 54,
      fill: COLORS.navyShadow,
      stroke: { color: COLORS.navyShadow, width: 9 },
      fontWeight: 'bold',
      letterSpacing: 2,
    });

    const penShadow = new Text({ text: 'Pen ', style: titleStyleShadow });
    penShadow.anchor.set(1, 0.5);
    penShadow.x = -6;
    shadowContainer.addChild(penShadow);

    const fightShadow = new Text({ text: 'Fight', style: titleStyleShadow });
    fightShadow.anchor.set(0, 0.5);
    fightShadow.x = -6;
    shadowContainer.addChild(fightShadow);

    // Front Text
    const penStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 54,
      fill: COLORS.cardCream,
      stroke: { color: COLORS.navyBorder, width: 8 },
      fontWeight: 'bold',
      letterSpacing: 2,
    });
    const penText = new Text({ text: 'Pen ', style: penStyle });
    penText.anchor.set(1, 0.5);
    penText.x = -6;
    frontContainer.addChild(penText);

    const fightStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 54,
      fill: COLORS.butterYellow,
      stroke: { color: COLORS.navyBorder, width: 8 },
      fontWeight: 'bold',
      letterSpacing: 2,
    });
    const fightText = new Text({ text: 'Fight', style: fightStyle });
    fightText.anchor.set(0, 0.5);
    fightText.x = -6;
    frontContainer.addChild(fightText);

    // "THE SCHOOL DESK SERIES" Pill Badge
    const badgeW = 210;
    const badgeH = 28;
    const badgeR = 9999;
    const badgeY = 40;

    const badgeShadow = new Graphics()
      .roundRect(-badgeW / 2, badgeY + 2.5, badgeW, badgeH, badgeR)
      .fill({ color: COLORS.navyShadow });
    this.titleContainer.addChild(badgeShadow);

    const badgeSurface = new Graphics()
      .roundRect(-badgeW / 2, badgeY, badgeW, badgeH, badgeR)
      .fill({ color: 0xFDF8EC })
      .stroke({ color: COLORS.navyBorder, width: 2.5 });
    this.titleContainer.addChild(badgeSurface);

    const badgeTextStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 11,
      fill: COLORS.navyBorder,
      fontWeight: '800',
      letterSpacing: 2,
    });
    const badgeText = new Text({ text: 'THE SCHOOL DESK SERIES', style: badgeTextStyle });
    badgeText.anchor.set(0.5, 0.5);
    badgeText.y = badgeY + badgeH / 2;
    this.titleContainer.addChild(badgeText);
  }

  // ── 2. Help Button (?) ─────────────────────────────────────────────
  private createHelpButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const r = 23;

    // 3D Shadow
    const shadow = new Graphics()
      .circle(0, 4, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    // Surface
    const body = new Graphics()
      .circle(0, 0, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3.5 });
    btn.addChild(body);

    const qText = new Text({
      text: '?',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 26,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    qText.anchor.set(0.5, 0.5);
    qText.y = -1;
    body.addChild(qText);

    btn.on('pointerdown', () => { body.y = 3; });
    btn.on('pointerup', () => {
      body.y = 0;
      this.emit('open_help');
    });
    btn.on('pointerupoutside', () => { body.y = 0; });

    return btn;
  }

  // ── 3. Crossing Pens Artwork (Matches ref_or_app1_t00s.png) ──────────
  private buildCrossingPensArt(): void {
    this.starburstG.clear();
    const g = this.starburstG;

    // 1. Soft pen drop shadows on wooden desk
    g.ellipse(10, 30, 130, 14).fill({ color: 0x1A140E, alpha: 0.28 });
    g.ellipse(-15, -15, 120, 12).fill({ color: 0x1A140E, alpha: 0.24 });

    // 2. Orange Ballpoint Pen (slanted upwards from bottom-left to top-right ~30°)
    // Tail end plug (Orange)
    g.moveTo(-150, 68).lineTo(-142, 63)
      .stroke({ color: 0xC2410C, width: 10, cap: 'round' });

    // Clear acrylic hexagonal barrel
    g.moveTo(-140, 62).lineTo(30, -32)
      .stroke({ color: 0xE2E8F0, width: 12, cap: 'round', alpha: 0.85 });
    // Thin internal blue ink reservoir tube
    g.moveTo(-130, 56).lineTo(20, -26)
      .stroke({ color: 0x2563EB, width: 3, cap: 'round' });
    // Acrylic barrel top specular reflection
    g.moveTo(-138, 59).lineTo(25, -30)
      .stroke({ color: 0xFFFFFF, width: 3, cap: 'round', alpha: 0.7 });

    // Orange collar / cap front
    g.moveTo(30, -32).lineTo(50, -44)
      .stroke({ color: 0xEA580C, width: 12, cap: 'round' });
    // Brass nib & ball
    g.moveTo(50, -44).lineTo(62, -51)
      .stroke({ color: 0xF59E0B, width: 5, cap: 'round' });
    g.circle(63, -52, 2.5).fill({ color: 0x1E293B });

    // 3. Blue Gel Pen (slanted downwards from top-left to bottom-right ~-15°)
    // Translucent grey/clear body
    g.moveTo(-110, -30).lineTo(60, 0)
      .stroke({ color: 0xCBD5E1, width: 14, cap: 'round', alpha: 0.9 });
    // Internal dark blue ink core
    g.moveTo(-90, -26).lineTo(40, -3)
      .stroke({ color: 0x1E3A8A, width: 4.5, cap: 'round' });
    // Blue pocket clip
    g.moveTo(-105, -36).lineTo(-45, -26)
      .stroke({ color: 0x2563EB, width: 4, cap: 'round' });

    // Textured blue rubber grip with rings
    g.moveTo(60, 0).lineTo(115, 10)
      .stroke({ color: 0x1D4ED8, width: 15, cap: 'round' });
    for (let gx = 65; gx <= 110; gx += 9) {
      const gy = (gx - 60) * (10 / 55);
      g.circle(gx, gy, 7.5).stroke({ color: 0x1E40AF, width: 1.5, alpha: 0.6 });
    }

    // Stainless steel conical nose cone & rollerball
    g.moveTo(115, 10).lineTo(135, 14)
      .stroke({ color: 0xE2E8F0, width: 8, cap: 'round' });
    g.circle(137, 14.5, 3).fill({ color: 0x475569 });

    // 4. Golden Starburst Radiance at impact intersection (x: 40, y: -5)
    const cx = 38;
    const cy = -6;
    const spikes = 8;
    const innerR = 12;
    const outerR = 36;

    g.circle(cx, cy, 28).fill({ color: 0xFFE082, alpha: 0.45 });
    g.circle(cx, cy, 15).fill({ color: 0xFFF9C4, alpha: 0.85 });

    for (let i = 0; i < spikes; i++) {
      const angle = (i * Math.PI) / (spikes / 2) + this.sparkleAngle;
      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const x2 = cx + Math.cos(angle) * outerR;
      const y2 = cy + Math.sin(angle) * outerR;
      g.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: 0xFAD24B, width: 3.2, cap: 'round' });
    }
  }

  // ── 4. Play Button ─────────────────────────────────────────────────
  private buildPlayButton(): void {
    const btnW = Math.min(this.screenWidth - 44, 370);
    const btnH = 74;
    const btnR = 9999;

    // Faux-3D Bottom Shadow
    this.playBtnShadow.clear()
      .roundRect(-btnW / 2, 7, btnW, btnH, btnR)
      .fill({ color: COLORS.navyShadow });

    // Surface
    this.playBtnSurface.clear()
      .roundRect(-btnW / 2, 0, btnW, btnH, btnR)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: COLORS.navyBorder, width: 3.8 });

    // Inner Content: ▷ Play
    this.playBtnContent.removeChildren();

    const playIcon = new Text({
      text: '▷',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 36,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    playIcon.anchor.set(1, 0.5);
    playIcon.x = -8;
    playIcon.y = btnH / 2 - 1;
    this.playBtnContent.addChild(playIcon);

    const playLabel = new Text({
      text: 'Play',
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 34,
        fill: COLORS.textDark,
        fontWeight: 'bold',
        letterSpacing: 1,
      })
    });
    playLabel.anchor.set(0, 0.5);
    playLabel.x = 2;
    playLabel.y = btnH / 2 - 1;
    this.playBtnContent.addChild(playLabel);

    // Interactive Tactile Press Physics
    this.playBtnContainer.eventMode = 'static';
    this.playBtnContainer.cursor = 'pointer';

    this.playBtnContainer.on('pointerdown', () => {
      this.playBtnSurface.y = 4;
    });
    this.playBtnContainer.on('pointerup', () => {
      this.playBtnSurface.y = 0;
      this.emit('play_click');
    });
    this.playBtnContainer.on('pointerupoutside', () => {
      this.playBtnSurface.y = 0;
    });
  }

  // ── 5. Bottom 3 Action Cards (Leaderboard / Stats / Settings) ───────
  private buildBottomCards(): void {
    this.bottomCardsContainer.removeChildren();

    const totalW = Math.min(this.screenWidth - 44, 370);
    const gap = 12;
    const cardW = (totalW - gap * 2) / 3;
    const cardH = 74;
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
      card.hitArea = new Rectangle(-cardW / 2, 0, cardW, cardH + 6);

      // 3D Shadow
      const shadow = new Graphics()
        .roundRect(-cardW / 2, 5, cardW, cardH, cardR)
        .fill({ color: COLORS.navyShadow });
      card.addChild(shadow);

      // Surface
      const surface = new Graphics()
        .roundRect(-cardW / 2, 0, cardW, cardH, cardR)
        .fill({ color: COLORS.cardCream })
        .stroke({ color: COLORS.navyBorder, width: 3 });
      card.addChild(surface);

      // Icon
      const icon = new Text({
        text: c.icon,
        style: new TextStyle({ fontSize: 24 })
      });
      icon.anchor.set(0.5, 0);
      icon.y = 10;
      surface.addChild(icon);

      // Label
      const lbl = new Text({
        text: c.label,
        style: new TextStyle({
          fontFamily: 'Fredoka, Nunito, sans-serif',
          fontSize: 12,
          fill: COLORS.textDark,
          fontWeight: 'bold',
        })
      });
      lbl.anchor.set(0.5, 0);
      lbl.y = 44;
      surface.addChild(lbl);

      // Tactile Press Animation
      card.on('pointerdown', () => { surface.y = 3; });
      card.on('pointerup', () => {
        surface.y = 0;
        soundManager.play('ui_click');
        c.onClick();
      });
      card.on('pointerupoutside', () => { surface.y = 0; });

      this.bottomCardsContainer.addChild(card);
    });
  }
}
