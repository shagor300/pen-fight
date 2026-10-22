/**
 * MatchResultModal.ts
 * Skeuomorphic Match End Modal matching the reference video (end_t91.0s.png).
 * Displays Series Complete, winner avatar box, series score inset card,
 * win streaks, XP gain, and 3 chunky buttons: [🔄 Rematch], [✎ Change pens], [☰ Menu].
 */
import { Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { PenSpec } from '../config/pensConfig';
import { renderPenToCanvas } from '../rendering/RealPenRenderer';
import EventEmitter from 'eventemitter3';

export interface MatchResultData {
  winner: 1 | 2; // 1 = You / Player 1, 2 = Computer / Player 2
  scores: [number, number];
  winsNeeded: number;
  mode: 'VS_AI' | 'TWO_PLAYER';
  p1Pen: PenSpec;
  p2Pen: PenSpec;
  streak: number;
  xpEarned: number;
  isSeriesComplete?: boolean;
}

export class MatchResultModal extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;

  private backdrop: Graphics;
  private cardContainer: Container;
  private cardSurface: Graphics;
  private cardContent: Container;

  // Cache for mini pen preview canvases
  private p1Canvas: HTMLCanvasElement;
  private p2Canvas: HTMLCanvasElement;
  private p1Sprite: Sprite;
  private p2Sprite: Sprite;

  private data: MatchResultData | null = null;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.container = new Container();
    this.container.visible = false;

    // Translucent dark scrim over the desk
    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.container.addChild(this.backdrop);

    this.cardContainer = new Container();
    this.container.addChild(this.cardContainer);

    this.cardSurface = new Graphics();
    this.cardContainer.addChild(this.cardSurface);

    this.cardContent = new Container();
    this.cardContainer.addChild(this.cardContent);

    // Mini pen canvases
    this.p1Canvas = document.createElement('canvas');
    this.p1Canvas.width = 160;
    this.p1Canvas.height = 40;
    this.p1Sprite = Sprite.from(this.p1Canvas);
    this.p1Sprite.anchor.set(0.5, 0.5);

    this.p2Canvas = document.createElement('canvas');
    this.p2Canvas.width = 160;
    this.p2Canvas.height = 40;
    this.p2Sprite = Sprite.from(this.p2Canvas);
    this.p2Sprite.anchor.set(0.5, 0.5);

    this.layout();
  }

  public show(data: MatchResultData): void {
    this.data = data;
    this.container.visible = true;
    this.layout();
    this.renderModal();
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

    if (this.container.visible && this.data) {
      this.renderModal();
    }
  }

  private renderModal(): void {
    if (!this.data) return;

    this.cardContent.removeChildren();

    const w = Math.min(this.screenWidth - 32, 380);
    const h = 530;
    const r = 24;

    // ── 1. Main Card Surface with 3D Shadow ──────────────────────────
    this.cardSurface.clear();
    // 3D Shadow
    this.cardSurface
      .roundRect(-w / 2, -h / 2 + 7, w, h, r)
      .fill({ color: COLORS.navyShadow });
    // Surface
    this.cardSurface
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3.5 });

    const p1Won = this.data.winner === 1;
    const isAi = this.data.mode === 'VS_AI';

    // ── 2. Dark Header Banner (Zero Overlap — icon inside banner) ────
    const topY = -h / 2 + 20;
    const bannerW = w - 32;
    const bannerH = 82;

    const headerBanner = new Graphics()
      .roundRect(-bannerW / 2, topY, bannerW, bannerH, 20)
      .fill({ color: 0x1E293B })
      .stroke({ color: 0x334155, width: 2 });
    this.cardContent.addChild(headerBanner);

    // Trophy/Avatar badge inside banner (left side)
    const badgeSize = 52;
    const badgeX = -bannerW / 2 + 14 + badgeSize / 2;
    const badgeY = topY + bannerH / 2;

    const badgeBg = new Graphics()
      .roundRect(-badgeSize / 2, -badgeSize / 2, badgeSize, badgeSize, 16)
      .fill({ color: p1Won ? 0xFACC15 : 0x38BDF8 });
    badgeBg.x = badgeX;
    badgeBg.y = badgeY;
    this.cardContent.addChild(badgeBg);

    const avIcon = new Text({
      text: p1Won ? '🏆' : '🤖',
      style: new TextStyle({ fontSize: 28 })
    });
    avIcon.anchor.set(0.5, 0.5);
    avIcon.x = badgeX;
    avIcon.y = badgeY;
    this.cardContent.addChild(avIcon);

    // Header text (right of badge)
    const headerTextX = badgeX + badgeSize / 2 + 12;
    const isComplete = this.data.isSeriesComplete !== false;
    const seriesSubtitle = new Text({
      text: isComplete
        ? `SERIES COMPLETE · FIRST TO ${this.data.winsNeeded}`
        : `ROUND ${this.data.scores[0] + this.data.scores[1]} · FIRST TO ${this.data.winsNeeded}`,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10,
        fill: 0x94A3B8,
        fontWeight: '800',
        letterSpacing: 1,
      })
    });
    seriesSubtitle.x = headerTextX;
    seriesSubtitle.y = topY + 14;
    this.cardContent.addChild(seriesSubtitle);

    const winnerTitle = isComplete
      ? (p1Won
        ? (isAi ? 'You win the series!' : 'Player 1 wins!')
        : (isAi ? 'Computer wins series' : 'Player 2 wins!'))
      : (p1Won
        ? (isAi ? 'You won this round!' : 'Player 1 won!')
        : (isAi ? 'Computer won round' : 'Player 2 won!'));

    const titleText = new Text({
      text: winnerTitle,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 18,
        fill: 0xF8FAFC,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: bannerW - badgeSize - 52,
      })
    });
    titleText.x = headerTextX;
    titleText.y = topY + 32;
    this.cardContent.addChild(titleText);

    // ── 3. Inset "SERIES SCORE" Card ─────────────────────────────────
    const scoreBoxY = topY + bannerH + 14;
    const scoreBoxW = w - 44;
    const scoreBoxH = 96;

    const scoreBox = new Graphics()
      .roundRect(-scoreBoxW / 2, scoreBoxY, scoreBoxW, scoreBoxH, 16)
      .fill({ color: 0xF7EFE0 })
      .stroke({ color: COLORS.navyBorder, width: 2.5 });
    this.cardContent.addChild(scoreBox);

    const scoreTitle = new Text({
      text: 'SERIES SCORE',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10,
        fill: 0x8C7B65,
        fontWeight: '800',
        letterSpacing: 1.5,
      })
    });
    scoreTitle.anchor.set(0.5, 0);
    scoreTitle.x = 0;
    scoreTitle.y = scoreBoxY + 10;
    this.cardContent.addChild(scoreTitle);

    // Score numbers and labels
    const scoreRow = new Container();
    scoreRow.y = scoreBoxY + 52;

    const p1Label = new Text({
      text: '• You',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 15,
        fill: COLORS.peachOrange,
        fontWeight: 'bold',
      })
    });
    p1Label.anchor.set(1, 0.5);
    p1Label.x = -68;
    scoreRow.addChild(p1Label);

    const p1Score = new Text({
      text: `${this.data.scores[0]}`,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 34,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    p1Score.anchor.set(0.5, 0.5);
    p1Score.x = -36;
    scoreRow.addChild(p1Score);

    const dash = new Text({
      text: '–',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 26,
        fill: COLORS.textMuted,
        fontWeight: 'bold',
      })
    });
    dash.anchor.set(0.5, 0.5);
    dash.x = 0;
    scoreRow.addChild(dash);

    const p2Score = new Text({
      text: `${this.data.scores[1]}`,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 34,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    p2Score.anchor.set(0.5, 0.5);
    p2Score.x = 36;
    scoreRow.addChild(p2Score);

    const p2Label = new Text({
      text: isAi ? '• Computer' : '• Player 2',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 15,
        fill: COLORS.skyBlue,
        fontWeight: 'bold',
      })
    });
    p2Label.anchor.set(0, 0.5);
    p2Label.x = 68;
    scoreRow.addChild(p2Label);

    this.cardContent.addChild(scoreRow);

    // ── 4. Win Streaks & XP (Dark Card — No Pen Overlap) ─────────────
    const statsY = scoreBoxY + scoreBoxH + 12;
    const xpCardW = w - 44;
    const xpCardH = 68;

    const xpCardBg = new Graphics()
      .roundRect(-xpCardW / 2, statsY, xpCardW, xpCardH, 16)
      .fill({ color: 0x0F172A });
    this.cardContent.addChild(xpCardBg);

    const streakText = new Text({
      text: `🔥 Win streaks · You ${p1Won ? this.data.streak : 0} · Computer ${!p1Won ? this.data.streak : 0}`,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 11,
        fill: 0x94A3B8,
        fontWeight: '700',
      })
    });
    streakText.anchor.set(0.5, 0);
    streakText.x = 0;
    streakText.y = statsY + 10;
    this.cardContent.addChild(streakText);

    const xpText = new Text({
      text: `${this.data.p1Pen.name}: +${this.data.xpEarned} XP`,
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 14,
        fill: 0x34D399,
        fontWeight: 'bold',
      })
    });
    xpText.anchor.set(0.5, 0);
    xpText.x = 0;
    xpText.y = statsY + 28;
    this.cardContent.addChild(xpText);

    const keepText = new Text({
      text: 'New series keeps the same pens',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10,
        fill: 0x64748B,
        fontWeight: '700',
      })
    });
    keepText.anchor.set(0.5, 0);
    keepText.x = 0;
    keepText.y = statsY + 48;
    this.cardContent.addChild(keepText);

    // ── 5. Action Buttons ────────────────────────────────────────────
    const btnW = w - 44;
    const btnH = 56;
    const buttonsY = statsY + xpCardH + 14;

    // Button 1: Next Round or Play Again (Rematch)
    const primaryLabel = isComplete ? 'Play again' : 'Next round';
    const primaryIcon = isComplete ? '🔄' : '▷';
    const primaryEvent = isComplete ? 'rematch' : 'next_round';

    const mainActionBtn = this.createButton({
      w: btnW,
      h: btnH,
      color: COLORS.butterYellow,
      icon: primaryIcon,
      label: primaryLabel,
      primary: true,
      onClick: () => {
        this.hide();
        this.emit(primaryEvent);
      }
    });
    mainActionBtn.x = 0;
    mainActionBtn.y = buttonsY;
    this.cardContent.addChild(mainActionBtn);

    // Bottom Row: [✎ Change pens] & [☰ Menu]
    const smallBtnW = (btnW - 12) / 2;
    const smallBtnH = 48;
    const smallBtnY = buttonsY + btnH + 12;

    const changePensBtn = this.createButton({
      w: smallBtnW,
      h: smallBtnH,
      color: COLORS.cardCream,
      icon: '✎',
      label: 'Change',
      primary: false,
      onClick: () => {
        this.hide();
        this.emit('change_pens');
      }
    });
    changePensBtn.x = -btnW / 2 + smallBtnW / 2;
    changePensBtn.y = smallBtnY;
    this.cardContent.addChild(changePensBtn);

    const menuBtn = this.createButton({
      w: smallBtnW,
      h: smallBtnH,
      color: COLORS.cardCream,
      icon: '☰',
      label: 'Menu',
      primary: false,
      onClick: () => {
        this.hide();
        this.emit('menu');
      }
    });
    menuBtn.x = btnW / 2 - smallBtnW / 2;
    menuBtn.y = smallBtnY;
    this.cardContent.addChild(menuBtn);
  }

  private createButton(opts: {
    w: number;
    h: number;
    color: number;
    icon: string;
    label: string;
    primary: boolean;
    onClick: () => void;
  }): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const r = 16;
    const shadow = new Graphics()
      .roundRect(-opts.w / 2, 4, opts.w, opts.h, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-opts.w / 2, 0, opts.w, opts.h, r)
      .fill({ color: opts.color })
      .stroke({ color: COLORS.navyBorder, width: opts.primary ? 2.8 : 2.2 });
    btn.addChild(surface);

    const row = new Container();
    const icon = new Text({
      text: opts.icon,
      style: new TextStyle({ fontSize: opts.primary ? 20 : 16 })
    });
    icon.anchor.set(1, 0.5);
    icon.x = -6;
    icon.y = opts.h / 2;
    row.addChild(icon);

    const label = new Text({
      text: opts.label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: opts.primary ? 20 : 15,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    label.anchor.set(0, 0.5);
    label.x = 2;
    label.y = opts.h / 2;
    row.addChild(label);

    surface.addChild(row);

    btn.on('pointerdown', () => { surface.y = 3; });
    btn.on('pointerup', () => {
      surface.y = 0;
      opts.onClick();
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });

    return btn;
  }
}
