/**
 * WhoIsPlayingModal.ts
 * Screen shown after tapping "Play" on the Main Menu:
 * "Who is playing?" with "vs Computer" and "2 players" tactile cards.
 * Matches shunneklabs.app reference screen (ref1_t34s.png).
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
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
    this.container.addChild(this.backdrop);

    this.contentContainer = new Container();
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
      .fill({ color: 0x121820, alpha: 0.55 });

    this.contentContainer.removeChildren();

    // ── 1. Top Bar: Back Button & Header ─────────────────────────────
    const topBarY = Math.max(30, screenHeight * 0.05);
    const backBtn = this.createBackButton();
    backBtn.x = 24;
    backBtn.y = topBarY;
    this.contentContainer.addChild(backBtn);

    const titleStyle = new TextStyle({
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: 26,
      fill: COLORS.cardCream,
      stroke: { color: COLORS.navyBorder, width: 4 },
      fontWeight: 'bold',
    });
    const headerTitle = new Text({ text: 'Who is playing?', style: titleStyle });
    headerTitle.anchor.set(0, 0.5);
    headerTitle.x = 84;
    headerTitle.y = topBarY + 22;
    this.contentContainer.addChild(headerTitle);

    // ── 2. Mode Cards Container ──────────────────────────────────────
    const cardsContainer = new Container();
    cardsContainer.x = screenWidth / 2;
    cardsContainer.y = Math.max(140, screenHeight * 0.22);
    this.contentContainer.addChild(cardsContainer);

    const cardWidth = Math.min(screenWidth - 44, 380);
    const cardHeight = 150;

    // Card 1: vs Computer
    const vsAiCard = this.createModeCard({
      w: cardWidth,
      h: cardHeight,
      avatarBg: COLORS.skyBlue,
      avatarIcon: '🤖',
      title: 'vs Computer',
      subtitle: 'You against the desk champion.',
      onClick: () => {
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
      onClick: () => {
        this.emit('select_mode', 'TWO_PLAYER');
      }
    });
    twoPlayerCard.y = cardHeight + 24;
    cardsContainer.addChild(twoPlayerCard);

    // ── 3. Footer: Online Coming Soon ────────────────────────────────
    const footerStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 14,
      fill: 0xD6CDBA,
      fontWeight: 'bold',
    });
    const footerText = new Text({ text: '🌐 Online · Coming soon 🔒', style: footerStyle });
    footerText.anchor.set(0.5, 0.5);
    footerText.x = screenWidth / 2;
    footerText.y = Math.min(screenHeight - 36, cardsContainer.y + (cardHeight * 2) + 70);
    this.contentContainer.addChild(footerText);
  }

  private createBackButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const w = 48;
    const h = 48;
    const r = 14;

    // 3D Shadow
    const shadow = new Graphics()
      .roundRect(0, 4, w, h, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    // Surface
    const body = new Graphics()
      .roundRect(0, 0, w, h, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3 });
    btn.addChild(body);

    // Yellow Left Arrow
    const arrow = new Text({
      text: '⇦',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 26,
        fill: COLORS.butterYellow,
        stroke: { color: COLORS.navyBorder, width: 3 },
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
    onClick: () => void;
  }): Container {
    const card = new Container();
    card.eventMode = 'static';
    card.cursor = 'pointer';

    const r = 22;

    // 3D Solid Bottom Shadow (0px 6px 0px)
    const shadow = new Graphics()
      .roundRect(-opts.w / 2, 6, opts.w, opts.h, r)
      .fill({ color: COLORS.navyShadow });
    card.addChild(shadow);

    // Card Surface
    const surface = new Graphics()
      .roundRect(-opts.w / 2, 0, opts.w, opts.h, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3.5 });
    card.addChild(surface);

    // Avatar Box (Rounded Square with dark border)
    const avatarBoxSize = 64;
    const avatarBox = new Graphics()
      .roundRect(-avatarBoxSize / 2, 14, avatarBoxSize, avatarBoxSize, 18)
      .fill({ color: opts.avatarBg })
      .stroke({ color: COLORS.navyBorder, width: 3 });
    surface.addChild(avatarBox);

    const avatarText = new Text({
      text: opts.avatarIcon,
      style: new TextStyle({
        fontSize: 32,
        align: 'center',
      })
    });
    avatarText.anchor.set(0.5, 0.5);
    avatarText.x = 0;
    avatarText.y = 14 + avatarBoxSize / 2;
    surface.addChild(avatarText);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: 23,
      fill: COLORS.textDark,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    });
    const title = new Text({ text: opts.title, style: titleStyle });
    title.anchor.set(0.5, 0);
    title.x = 0;
    title.y = 86;
    surface.addChild(title);

    // Subtitle
    const subStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 13,
      fill: COLORS.textMuted,
      fontWeight: 'bold',
    });
    const sub = new Text({ text: opts.subtitle, style: subStyle });
    sub.anchor.set(0.5, 0);
    sub.x = 0;
    sub.y = 116;
    surface.addChild(sub);

    // Tactile Press Physics
    card.on('pointerdown', () => {
      surface.y = 4;
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
}
