/**
 * src/ui/MainMenu.ts
 * Unique, Premium Game Application Home Screen.
 *
 * Design:
 * - Rich dark executive mahogany wood background (0x2E170A) with clean plank grooves.
 * - Top App Bar: Profile Avatar [ 👤 Lv.1 ] on the left; Sound Toggle [ 🔊 ] and Help [ ? ] on the right.
 * - Unique 3D Game Brand Logo: "PEN FIGHT" with dimensional depth and gold ribbon "★ PRO DESK COMBAT ★" (No ripped paper!).
 * - Live Floating Crossing 3D Pens (Orange Ballpoint & Blue Rollerball) with 60-120fps floating physics & collision sparks.
 * - PEN balance chip next to the profile; avatar shows the account level.
 * - Chunky Butter-Yellow [ ▷ Play ] button with account level / XP subtitle.
 * - Bottom Action Grid: [ 🏆 Leaderboard ], [ 📊 Stats ], [ ⚙️ Settings ], and [ 🎯 Daily Missions ].
 * - Clean version footer: Pen Fight Pro · v1.8.
 */
import { Container, Graphics, Text, TextStyle, Rectangle, Sprite } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { DESIGN_TOKENS } from '../config/designTokens';
import { WoodBackgroundRenderer } from '../rendering/WoodBackgroundRenderer';
import { ProgressionManager } from '../core/ProgressionManager';
import { PenChip } from './components/PenChip';
import { formatPen } from '../economy/EconomyEngine';
import { getEconomy } from '../economy/EconomyStorage';
import { soundManager } from '../audio/SoundAndHaptics';
import EventEmitter from 'eventemitter3';

export class MainMenu extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;
  private progression?: ProgressionManager;

  // Background & Desk Layers
  private bgContainer: Container;
  private bgSprite: Sprite;

  // Top App Bar
  private topBarContainer: Container;
  private avatarBtn: Container;
  private soundBtn: Container;
  private helpBtn: Container;
  private soundBtnText: Text;
  private penChip!: PenChip;
  private avatarLvText!: Text;
  private missionBadge!: Container;
  private missionBadgeText!: Text;

  // Brand Logo Container (Clean & Unique, no paper!)
  private logoContainer: Container;

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

    // 1. Executive Wood Background
    this.bgContainer = new Container();
    this.container.addChild(this.bgContainer);

    this.bgSprite = new Sprite();
    this.bgContainer.addChild(this.bgSprite);

    // 2. Top App Bar (Avatar, Sound, Help)
    this.topBarContainer = new Container();
    this.container.addChild(this.topBarContainer);

    this.avatarBtn = this.createAvatarButton();
    this.topBarContainer.addChild(this.avatarBtn);

    // PEN balance (tap to open Daily Missions)
    this.penChip = new PenChip({ height: 34, onTap: () => this.emit('open_missions') });
    this.topBarContainer.addChild(this.penChip);

    const { btn: soundBtn, text: soundTxt } = this.createSoundButton();
    this.soundBtn = soundBtn;
    this.soundBtnText = soundTxt;
    this.topBarContainer.addChild(this.soundBtn);

    this.helpBtn = this.createHelpButton();
    this.topBarContainer.addChild(this.helpBtn);

    // 3. Unique Brand Logo
    this.logoContainer = new Container();
    this.container.addChild(this.logoContainer);

    // 4. Floating Crossing Pens Artwork
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

    // 5. Giant Butter-Yellow Play Button
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
      fill: 0xC8B89E,
      fontWeight: 'bold',
    });
    this.subText = new Text({ text: 'Played 0', style: subStyle });
    this.subText.anchor.set(0.5, 0);
    this.container.addChild(this.subText);

    // 6. Bottom Action Cards & Feedback Button
    this.bottomCardsContainer = new Container();
    this.container.addChild(this.bottomCardsContainer);

    this.feedbackBtn = this.createMissionsButton();
    this.container.addChild(this.feedbackBtn);

    // 7. Version Footer
    const verStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 12,
      fill: 0x8A7C6A,
      fontWeight: 'bold',
    });
    this.versionText = new Text({ text: 'Pen Fight Pro · v1.8', style: verStyle });
    this.versionText.anchor.set(0.5, 1);
    this.container.addChild(this.versionText);

    this.buildPensGraphics();
    this.layout();
  }

  public show(): void {
    this.container.visible = true;
    this.updateStats();
    this.updateSoundIcon();
  }

  public hide(): void {
    this.container.visible = false;
  }

  public updateStats(): void {
    const eco = getEconomy();
    const acct = eco.getAccountProgress();
    this.subText.text = acct.maxed
      ? `Level ${acct.level} · Max`
      : `Level ${acct.level} · ${formatPen(acct.xpIntoLevel)}/${formatPen(acct.xpForNext)} XP`;
    this.avatarLvText.text = `${acct.level}`;
    const claimable = eco.getMissions().filter((m) => m.claimable).length + (eco.canClaimAllowance() ? 1 : 0);
    this.missionBadge.visible = claimable > 0;
    this.missionBadgeText.text = `${claimable}`;
    this.penChip.x = 36 + 19 + 10;
  }

  public updateSoundIcon(): void {
    const isMuted = soundManager.getMuted();
    this.soundBtnText.text = isMuted ? '🔇' : '🔊';
  }

  /**
   * Continuous 60-120fps Animation Loop.
   * Floating physics with sine & cosine harmonics for both crossing pens.
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

    this.drawExecutiveDesk(screenWidth, screenHeight);

    const isCompact = screenHeight < 720;
    const isVeryCompact = screenHeight < 620;

    // 1. Top Bar
    const topBarY = Math.max(16, isCompact ? 16 : Math.round(screenHeight * 0.035));
    this.topBarContainer.x = 0;
    this.topBarContainer.y = topBarY;

    this.avatarBtn.x = 36;
    this.avatarBtn.y = 18;

    this.penChip.x = 36 + 19 + 10;
    this.penChip.y = 18;

    this.soundBtn.x = screenWidth - 84;
    this.soundBtn.y = 18;

    this.helpBtn.x = screenWidth - 36;
    this.helpBtn.y = 18;

    // 2. Unique 3D Game Brand Logo
    const logoY = isVeryCompact ? 68 : (isCompact ? 82 : Math.max(94, Math.round(screenHeight * 0.13)));
    this.logoContainer.x = screenWidth / 2;
    this.logoContainer.y = logoY;
    const logoScale = isVeryCompact ? 0.78 : (isCompact ? 0.88 : 1.0);
    this.logoContainer.scale.set(logoScale);
    this.drawUniqueBrandLogo();

    // 3. Center Crossing Pens
    const pensCenterY = isVeryCompact ? 185 : (isCompact ? 222 : Math.max(255, Math.round(screenHeight * 0.37)));
    this.pensArtContainer.x = screenWidth / 2;
    this.pensArtContainer.y = pensCenterY;
    const pensScale = isVeryCompact ? 0.72 : (isCompact ? 0.85 : 1.0);
    this.pensArtContainer.scale.set(pensScale);
    this.drawMotionStreaks();

    // 4. Play Button & Subtitle
    const playH = isCompact ? 58 : 68;
    const playY = isVeryCompact ? 295 : (isCompact ? 340 : Math.max(415, Math.round(screenHeight * 0.60)));
    this.playBtnContainer.x = screenWidth / 2;
    this.playBtnContainer.y = playY;
    this.buildPlayButton(playH);

    this.subText.x = screenWidth / 2;
    this.subText.y = playY + playH + (isCompact ? 5 : 8);

    // 5. Bottom Action Cards (Leaderboard, Stats, Settings)
    const cardH = isCompact ? 58 : 68;
    const cardsY = isVeryCompact ? 395 : (isCompact ? 438 : playY + playH + 36);
    this.bottomCardsContainer.x = screenWidth / 2;
    this.bottomCardsContainer.y = cardsY;
    this.buildBottomCards(cardH);

    // 6. Feedback Button & Version Footer
    const versionY = screenHeight - (isCompact ? 12 : 16);
    this.versionText.x = screenWidth / 2;
    this.versionText.y = versionY;

    const feedbackH = isCompact ? 34 : 38;
    const feedbackY = Math.min(cardsY + cardH + (isCompact ? 10 : 16), versionY - feedbackH - 6);
    this.feedbackBtn.x = screenWidth / 2;
    this.feedbackBtn.y = feedbackY;

    this.updateStats();
    this.updateSoundIcon();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. EXECUTIVE DARK WALNUT WOOD DESK
  // ══════════════════════════════════════════════════════════════════════════
  private drawExecutiveDesk(w: number, h: number): void {
    this.bgSprite.texture = WoodBackgroundRenderer.getWoodTexture(w, h, 'walnut');
    this.bgSprite.width = w;
    this.bgSprite.height = h;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. UNIQUE 3D GAME BRAND LOGO
  // ══════════════════════════════════════════════════════════════════════════
  private drawUniqueBrandLogo(): void {
    this.logoContainer.removeChildren();

    // 3D Shadow Layer
    const shadowStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 56,
      fill: COLORS.navyShadow,
      stroke: { color: COLORS.navyShadow, width: 10 },
      fontWeight: 'bold',
      letterSpacing: 2.5,
    });
    const penShadow = new Text({ text: 'PEN ', style: shadowStyle });
    penShadow.anchor.set(1, 0.5);
    penShadow.x = -6;
    penShadow.y = 6;
    this.logoContainer.addChild(penShadow);

    const fightShadow = new Text({ text: 'FIGHT', style: shadowStyle });
    fightShadow.anchor.set(0, 0.5);
    fightShadow.x = -6;
    fightShadow.y = 6;
    this.logoContainer.addChild(fightShadow);

    // Front Crisp Layer (Cream "PEN" + Butter Yellow "FIGHT")
    const penStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 56,
      fill: COLORS.cardCream,
      stroke: { color: COLORS.navyBorder, width: 8 },
      fontWeight: 'bold',
      letterSpacing: 2.5,
    });
    const penText = new Text({ text: 'PEN ', style: penStyle });
    penText.anchor.set(1, 0.5);
    penText.x = -6;
    this.logoContainer.addChild(penText);

    const fightStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 56,
      fill: COLORS.butterYellow,
      stroke: { color: COLORS.navyBorder, width: 8 },
      fontWeight: 'bold',
      letterSpacing: 2.5,
    });
    const fightText = new Text({ text: 'FIGHT', style: fightStyle });
    fightText.anchor.set(0, 0.5);
    fightText.x = -6;
    this.logoContainer.addChild(fightText);

    // Gold Ribbon Pill Banner: "★ PRO DESK COMBAT ★"
    const pillW = 206;
    const pillH = 28;
    const pillY = 40;

    const pillShadow = new Graphics()
      .roundRect(-pillW / 2, pillY + 3, pillW, pillH, 14)
      .fill({ color: COLORS.navyShadow });
    this.logoContainer.addChild(pillShadow);

    const pillBg = new Graphics()
      .roundRect(-pillW / 2, pillY, pillW, pillH, 14)
      .fill({ color: 0xFDFBF5 })
      .stroke({ color: COLORS.navyBorder, width: 2.5 });
    this.logoContainer.addChild(pillBg);

    const bannerText = new Text({
      text: '★ PRO DESK COMBAT ★',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 11,
        fill: COLORS.navyBorder,
        fontWeight: '900',
        letterSpacing: 2,
      })
    });
    bannerText.anchor.set(0.5, 0.5);
    bannerText.x = 0;
    bannerText.y = pillY + pillH / 2;
    this.logoContainer.addChild(bannerText);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. CROSSING PENS ARTWORK & MOTION PHYSICS
  // ══════════════════════════════════════════════════════════════════════════
  private buildPensGraphics(): void {
    // 1. Orange Cheap Ballpoint (slanted upwards ~30 deg)
    const og = new Graphics();
    this.orangePenContainer.removeChildren();
    this.orangePenContainer.addChild(og);

    // Soft drop shadow
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

    this.baseOrangeRot = -0.52;
    this.orangePenContainer.rotation = this.baseOrangeRot;

    // 2. Blue Rollerball / Gel Pen (crosses over from top-left to bottom-right ~14 deg)
    const bg = new Graphics();
    this.bluePenContainer.removeChildren();
    this.bluePenContainer.addChild(bg);

    // Soft drop shadow
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

    this.baseBlueRot = 0.24;
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

    g.moveTo(-160, 96).lineTo(-80, 52).stroke({ color: 0xFFFFFF, width: 2.2, alpha: 0.35, cap: 'round' });
    g.moveTo(-140, 110).lineTo(-70, 72).stroke({ color: 0xFFFFFF, width: 1.8, alpha: 0.28, cap: 'round' });
    g.moveTo(-110, 118).lineTo(-45, 82).stroke({ color: 0xFFFFFF, width: 1.4, alpha: 0.22, cap: 'round' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. CHUNKY PLAY BUTTON
  // ══════════════════════════════════════════════════════════════════════════
  private buildPlayButton(btnH = 68): void {
    const btnW = Math.min(this.screenWidth - 44, 360);
    const btnR = DESIGN_TOKENS.radii.pill;
    const isCompact = btnH < 65;

    this.playBtnShadow.clear()
      .roundRect(-btnW / 2, DESIGN_TOKENS.shadows.buttonOffset, btnW, btnH, btnR)
      .fill({ color: DESIGN_TOKENS.colors.navyOutline });

    this.playBtnSurface.clear()
      .roundRect(-btnW / 2, 0, btnW, btnH, btnR)
      .fill({ color: DESIGN_TOKENS.colors.premiumGold })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thick });

    this.playBtnContent.removeChildren();

    const fontSize = isCompact ? 28 : 32;

    const playIcon = new Text({
      text: '▷',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize,
        fill: DESIGN_TOKENS.colors.navyOutline,
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
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize,
        fill: DESIGN_TOKENS.colors.navyOutline,
        fontWeight: 'bold',
        letterSpacing: 1,
      })
    });
    playLabel.anchor.set(0, 0.5);
    playLabel.x = 4;
    playLabel.y = btnH / 2 - 1;
    this.playBtnContent.addChild(playLabel);

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
  private buildBottomCards(cardH = 68): void {
    this.bottomCardsContainer.removeChildren();

    const totalW = Math.min(this.screenWidth - 40, 360);
    const gap = 12;
    const cardW = (totalW - gap * 2) / 3;
    const cardR = DESIGN_TOKENS.radii.md;
    const isCompact = cardH < 65;

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

      const shadow = new Graphics()
        .roundRect(-cardW / 2, DESIGN_TOKENS.shadows.cardOffset, cardW, cardH, cardR)
        .fill({ color: DESIGN_TOKENS.colors.navyOutline });
      card.addChild(shadow);

      const surface = new Graphics()
        .roundRect(-cardW / 2, 0, cardW, cardH, cardR)
        .fill({ color: DESIGN_TOKENS.colors.creamSurface })
        .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });
      card.addChild(surface);

      const icon = new Text({
        text: c.icon,
        style: new TextStyle({ fontSize: isCompact ? 20 : 22 })
      });
      icon.anchor.set(0.5, 0);
      icon.y = isCompact ? 6 : 8;
      surface.addChild(icon);

      const lbl = new Text({
        text: c.label,
        style: new TextStyle({
          fontFamily: DESIGN_TOKENS.typography.fontHeading,
          fontSize: isCompact ? 10.5 : 11.5,
          fill: DESIGN_TOKENS.colors.navyOutline,
          fontWeight: 'bold',
        })
      });
      lbl.anchor.set(0.5, 0);
      lbl.y = isCompact ? 35 : 40;
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

  private createMissionsButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const w = 168;
    const h = 36;
    const r = DESIGN_TOKENS.radii.sm;

    btn.addChild(
      new Graphics()
        .roundRect(-w / 2, 3, w, h, r)
        .fill({ color: DESIGN_TOKENS.colors.navyOutline }),
    );
    const surface = new Graphics()
      .roundRect(-w / 2, 0, w, h, r)
      .fill({ color: DESIGN_TOKENS.colors.premiumGold })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });
    btn.addChild(surface);

    const lbl = new Text({
      text: '🎯 Daily Missions',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: 13.5,
        fill: DESIGN_TOKENS.colors.navyOutline,
        fontWeight: 'bold',
      }),
    });
    lbl.anchor.set(0.5, 0.5);
    lbl.y = h / 2;
    surface.addChild(lbl);

    // Red count badge: something is ready to claim
    this.missionBadge = new Container();
    this.missionBadge.x = w / 2 - 6;
    this.missionBadge.y = 2;
    this.missionBadge.visible = false;
    this.missionBadge.addChild(
      new Graphics()
        .circle(0, 0, 10)
        .fill({ color: DESIGN_TOKENS.semantic.danger })
        .stroke({ color: 0xFFFFFF, width: 1.5 }),
    );
    this.missionBadgeText = new Text({
      text: '0',
      style: new TextStyle({ fontFamily: DESIGN_TOKENS.typography.fontHeading, fontSize: 11, fill: 0xFFFFFF, fontWeight: 'bold' }),
    });
    this.missionBadgeText.anchor.set(0.5, 0.5);
    this.missionBadge.addChild(this.missionBadgeText);
    btn.addChild(this.missionBadge);

    // 44px-tall touch area
    btn.hitArea = new Rectangle(-w / 2, -4, w, h + 12);

    btn.on('pointerdown', () => { surface.y = 2; });
    btn.on('pointerup', () => {
      surface.y = 0;
      soundManager.play('ui_click');
      this.emit('open_missions');
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });

    return btn;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6. TOP APP BAR (AVATAR, SOUND TOGGLE, HOW-TO-PLAY HELP)
  // ══════════════════════════════════════════════════════════════════════════
  private createAvatarButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const r = 19;
    const circle = new Graphics()
      .circle(0, 0, r)
      .fill({ color: DESIGN_TOKENS.colors.deepNavy })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });
    btn.addChild(circle);

    const icon = new Text({
      text: '👤',
      style: new TextStyle({ fontSize: 16 })
    });
    icon.anchor.set(0.5, 0.5);
    btn.addChild(icon);

    // Account level badge (replaces the old decorative dot)
    const lvBg = new Graphics()
      .circle(r * 0.74, r * 0.74, 9)
      .fill({ color: DESIGN_TOKENS.colors.premiumGold })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thin });
    btn.addChild(lvBg);
    this.avatarLvText = new Text({
      text: '1',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: 10.5,
        fill: DESIGN_TOKENS.colors.navyOutline,
        fontWeight: 'bold',
      }),
    });
    this.avatarLvText.anchor.set(0.5, 0.5);
    this.avatarLvText.x = r * 0.74;
    this.avatarLvText.y = r * 0.74;
    btn.addChild(this.avatarLvText);

    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      this.emit('open_stats');
    });

    return btn;
  }

  private createSoundButton(): { btn: Container; text: Text } {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const r = 19;
    const circle = new Graphics()
      .circle(0, 0, r)
      .fill({ color: DESIGN_TOKENS.colors.creamSurface })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });
    btn.addChild(circle);

    const txt = new Text({
      text: soundManager.getMuted() ? '🔇' : '🔊',
      style: new TextStyle({ fontSize: 16 })
    });
    txt.anchor.set(0.5, 0.5);
    btn.addChild(txt);

    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      const current = soundManager.getMuted();
      soundManager.setEnabled(current);
      txt.text = current ? '🔊' : '🔇';
      this.emit('sound_toggle', current);
    });

    return { btn, text: txt };
  }

  private createHelpButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const r = 19;
    const circle = new Graphics()
      .circle(0, 0, r)
      .fill({ color: DESIGN_TOKENS.colors.premiumGold })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });
    btn.addChild(circle);

    const txt = new Text({
      text: '?',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: 19,
        fill: DESIGN_TOKENS.colors.navyOutline,
        fontWeight: 'bold',
      })
    });
    txt.anchor.set(0.5, 0.5);
    txt.y = -1;
    btn.addChild(txt);

    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      this.emit('open_help');
    });

    return btn;
  }

  public destroy(): void {
    this.removeAllListeners();
    this.container.destroy({ children: true });
  }
}
