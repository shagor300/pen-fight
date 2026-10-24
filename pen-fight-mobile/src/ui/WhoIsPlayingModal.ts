/**
 * WhoIsPlayingModal.ts
 * Screen shown after tapping "Play" on the Main Menu:
 * "Who is playing?" with "vs Computer" and "2 players" tactile cards.
 * Matches shunneklabs.app reference screen (ref1_t34s.png).
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { DESIGN_TOKENS } from '../config/designTokens';
import { soundManager } from '../audio/SoundAndHaptics';
import EventEmitter from 'eventemitter3';

export class WhoIsPlayingModal extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;

  private backdrop: Graphics;
  private contentContainer: Container;
  private backBtn: Container;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.container = new Container();
    this.container.visible = false;

    // Soft dimming backdrop so the wooden desk is still subtly visible
    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.backdrop.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(this.backdrop);

    this.contentContainer = new Container();
    this.contentContainer.eventMode = 'static';
    this.contentContainer.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(this.contentContainer);

    this.backBtn = this.createBackButton();
    this.contentContainer.addChild(this.backBtn);

    this.layout();
  }

  public show(): void {
    this.container.visible = true;
    this.layout();
  }

  public hide(): void {
    this.container.visible = false;
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.backdrop.clear()
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: DESIGN_TOKENS.colors.deepNavy, alpha: DESIGN_TOKENS.opacity.modalScrim });

    for (const c of this.contentContainer.removeChildren()) c.destroy({ children: true });

    const isCompact = screenHeight < 720;

    // ── 1. Top Bar: Back Button & Header ─────────────────────────────
    const topBarY = Math.max(20, isCompact ? 22 : Math.round(screenHeight * 0.05));
    const backBtn = this.createBackButton();
    backBtn.x = 24;
    backBtn.y = topBarY;
    this.contentContainer.addChild(backBtn);

    const titleStyle = new TextStyle({
      fontFamily: DESIGN_TOKENS.typography.fontHeading,
      fontSize: isCompact ? 24 : 26,
      fill: DESIGN_TOKENS.colors.creamSurface,
      stroke: { color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thick },
      fontWeight: 'bold',
    });
    const headerTitle = new Text({ text: 'Who is playing?', style: titleStyle });
    headerTitle.anchor.set(0, 0.5);
    headerTitle.x = 84;
    headerTitle.y = topBarY + 22;
    this.contentContainer.addChild(headerTitle);

    // ── 2. Mode Cards Container ──────────────────────────────────────
    const cardWidth = Math.min(screenWidth - 40, 380);
    const cardHeight = isCompact ? 132 : 150;
    const cardGap = isCompact ? 16 : 24;

    const cardsContainer = new Container();
    cardsContainer.x = screenWidth / 2;
    cardsContainer.y = Math.max(isCompact ? 90 : 130, Math.round(screenHeight * (isCompact ? 0.17 : 0.21)));
    this.contentContainer.addChild(cardsContainer);

    // Card 1: vs Computer
    const vsAiCard = this.createModeCard({
      w: cardWidth,
      h: cardHeight,
      avatarBg: COLORS.skyBlue,
      avatarIcon: '🤖',
      title: 'vs Computer',
      subtitle: 'You against the desk champion.',
      isCompact,
      onClick: () => {
        soundManager.play('ui_click');
        this.emit('select_mode', 'VS_AI');
      }
    });
    vsAiCard.y = 0;
    cardsContainer.addChild(vsAiCard);

    // Card 2: 2 players
    const twoPlayerCard = this.createModeCard({
      w: cardWidth,
      h: cardHeight,
      avatarBg: COLORS.mintGreen,
      avatarIcon: '👥',
      title: '2 players',
      subtitle: 'One device. Take turns to flick.',
      isCompact,
      onClick: () => {
        soundManager.play('ui_click');
        this.emit('select_mode', 'TWO_PLAYER');
      }
    });
    twoPlayerCard.y = cardHeight + cardGap;
    cardsContainer.addChild(twoPlayerCard);

    // ── 3. Footer: Online Coming Soon ────────────────────────────────
    const footerStyle = new TextStyle({
      fontFamily: DESIGN_TOKENS.typography.fontBody,
      fontSize: isCompact ? 12.5 : 14,
      fill: DESIGN_TOKENS.colors.secondaryText,
      fontWeight: 'bold',
    });
    const footerText = new Text({ text: '🌐 Online · Coming soon 🔒', style: footerStyle });
    footerText.anchor.set(0.5, 0.5);
    footerText.x = screenWidth / 2;
    footerText.y = Math.min(screenHeight - 24, cardsContainer.y + (cardHeight * 2) + cardGap + (isCompact ? 30 : 45));
    this.contentContainer.addChild(footerText);
  }

  private createBackButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const w = 46;
    const h = 46;
    const r = DESIGN_TOKENS.radii.sm;

    // 3D Shadow
    const shadow = new Graphics()
      .roundRect(0, DESIGN_TOKENS.shadows.buttonOffset, w, h, r)
      .fill({ color: DESIGN_TOKENS.colors.navyOutline });
    btn.addChild(shadow);

    // Surface
    const body = new Graphics()
      .roundRect(0, 0, w, h, r)
      .fill({ color: DESIGN_TOKENS.colors.creamSurface })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });
    btn.addChild(body);

    // Yellow Left Arrow
    const arrow = new Text({
      text: '⇦',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: 26,
        fill: DESIGN_TOKENS.colors.premiumGold,
        stroke: { color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thin },
        fontWeight: 'bold',
      })
    });
    arrow.anchor.set(0.5, 0.5);
    arrow.x = w / 2;
    arrow.y = h / 2 - 1;
    btn.addChild(arrow);

    btn.on('pointerdown', () => {
      body.y = 2;
      arrow.y = h / 2 + 1;
    });
    btn.on('pointerup', () => {
      body.y = 0;
      arrow.y = h / 2 - 1;
      soundManager.play('ui_click');
      this.emit('back');
    });
    btn.on('pointerupoutside', () => {
      body.y = 0;
      arrow.y = h / 2 - 1;
    });

    return btn;
  }

  private createModeCard(opts: {
    w: number;
    h: number;
    avatarBg: number;
    avatarIcon: string;
    title: string;
    subtitle: string;
    isCompact?: boolean;
    onClick: () => void;
  }): Container {
    const card = new Container();
    card.eventMode = 'static';
    card.cursor = 'pointer';

    const r = DESIGN_TOKENS.radii.lg;
    const isCompact = opts.isCompact ?? false;

    // 3D Solid Bottom Shadow
    const shadow = new Graphics()
      .roundRect(-opts.w / 2, DESIGN_TOKENS.shadows.cardOffset, opts.w, opts.h, r)
      .fill({ color: DESIGN_TOKENS.colors.navyOutline });
    card.addChild(shadow);

    // Card Surface
    const surface = new Graphics()
      .roundRect(-opts.w / 2, 0, opts.w, opts.h, r)
      .fill({ color: DESIGN_TOKENS.colors.creamSurface })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thick });
    card.addChild(surface);

    // Avatar Box (Rounded Square with dark border)
    const avatarBoxSize = isCompact ? 54 : 64;
    const avatarBoxY = isCompact ? 10 : 14;
    const avatarBox = new Graphics()
      .roundRect(-avatarBoxSize / 2, avatarBoxY, avatarBoxSize, avatarBoxSize, DESIGN_TOKENS.radii.md)
      .fill({ color: opts.avatarBg })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });
    surface.addChild(avatarBox);

    const avatarText = new Text({
      text: opts.avatarIcon,
      style: new TextStyle({
        fontSize: isCompact ? 28 : 32,
        align: 'center',
      })
    });
    avatarText.anchor.set(0.5, 0.5);
    avatarText.x = 0;
    avatarText.y = avatarBoxY + avatarBoxSize / 2;
    surface.addChild(avatarText);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: DESIGN_TOKENS.typography.fontHeading,
      fontSize: isCompact ? 20 : 23,
      fill: DESIGN_TOKENS.colors.navyOutline,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    });
    const title = new Text({ text: opts.title, style: titleStyle });
    title.anchor.set(0.5, 0);
    title.x = 0;
    title.y = avatarBoxY + avatarBoxSize + (isCompact ? 6 : 8);
    surface.addChild(title);

    // Subtitle
    const subStyle = new TextStyle({
      fontFamily: DESIGN_TOKENS.typography.fontBody,
      fontSize: isCompact ? 12 : 13,
      fill: DESIGN_TOKENS.colors.secondaryText,
      fontWeight: 'bold',
    });
    const sub = new Text({ text: opts.subtitle, style: subStyle });
    sub.anchor.set(0.5, 0);
    sub.x = 0;
    sub.y = title.y + (isCompact ? 24 : 28);
    surface.addChild(sub);

    // Tactile Press Physics
    card.on('pointerdown', () => {
      surface.y = 3.5;
    });
    card.on('pointerup', () => {
      surface.y = 0;
      opts.onClick();
    });
    card.on('pointerupoutside', () => {
      surface.y = 0;
    });

    return card;
  }

  public destroy(): void {
    this.removeAllListeners();
    this.container.destroy({ children: true });
  }
}
