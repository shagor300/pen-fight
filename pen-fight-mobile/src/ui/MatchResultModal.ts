/**
 * MatchResultModal.ts
 * Skeuomorphic Match End Modal matching the reference video (end_t91.0s.png).
 * Displays Series Complete, winner avatar box, series score inset card,
 * win streaks, XP gain, and 3 chunky buttons: [🔄 Rematch], [✎ Change pens], [☰ Menu].
 */
import { Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { DESIGN_TOKENS } from '../config/designTokens';
import { PenSpec } from '../config/pensConfig';
import { renderPenToCanvas } from '../rendering/RealPenRenderer';
import { soundManager } from '../audio/SoundAndHaptics';
import { formatPen } from '../economy/EconomyEngine';
import EventEmitter from 'eventemitter3';

export interface MatchResultData {
  winner: 1 | 2; // 1 = You / Player 1, 2 = Computer / Player 2
  scores: [number, number];
  winsNeeded: number;
  mode: 'VS_AI' | 'TWO_PLAYER';
  p1Pen: PenSpec;
  p2Pen: PenSpec;
  streak: number;
  isSeriesComplete?: boolean;
  /** This round ended level (no point scored). */
  roundDraw?: boolean;
  /** PEN at stake for the series, shown on non-final rounds. */
  stakeFee?: number;
  /** Settled economy numbers, read from the finalized match record. */
  econ?: MatchResultEcon;
}

export interface MatchResultEcon {
  tierLabel: string;
  entryFee: number;
  payout: number;
  netPen: number;
  bonusPen: number;
  balanceAfter: number;
  accountXp: number;
  penXp: number;
  levelsGained: number[];
  forfeited: boolean;
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

    const isCompact = this.screenHeight < 720;
    const w = Math.min(this.screenWidth - 32, 380);
    const h = Math.min(this.screenHeight - 24, isCompact ? 490 : 530);
    const r = DESIGN_TOKENS.radii.lg;

    // ── 1. Main Card Surface with 3D Shadow ──────────────────────────
    this.cardSurface.clear();
    // 3D Shadow
    this.cardSurface
      .roundRect(-w / 2, -h / 2 + DESIGN_TOKENS.shadows.cardOffset, w, h, r)
      .fill({ color: DESIGN_TOKENS.colors.navyOutline });
    // Surface
    this.cardSurface
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill({ color: DESIGN_TOKENS.colors.creamSurface })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thick });

    const p1Won = this.data.winner === 1;
    const isAi = this.data.mode === 'VS_AI';

    // ── 2. Dark Header Banner (Zero Overlap — icon inside banner) ────
    const topY = -h / 2 + (isCompact ? 14 : 20);
    const bannerW = w - 32;
    const bannerH = isCompact ? 72 : 82;

    const headerBanner = new Graphics()
      .roundRect(-bannerW / 2, topY, bannerW, bannerH, DESIGN_TOKENS.radii.md)
      .fill({ color: DESIGN_TOKENS.colors.deepNavy })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: 2 });
    this.cardContent.addChild(headerBanner);

    // Trophy/Avatar badge inside banner (left side)
    const badgeSize = isCompact ? 46 : 52;
    const badgeX = -bannerW / 2 + 14 + badgeSize / 2;
    const badgeY = topY + bannerH / 2;

    const badgeBg = new Graphics()
      .roundRect(-badgeSize / 2, -badgeSize / 2, badgeSize, badgeSize, DESIGN_TOKENS.radii.sm)
      .fill({ color: p1Won ? DESIGN_TOKENS.colors.premiumGold : 0x38BDF8 });
    badgeBg.x = badgeX;
    badgeBg.y = badgeY;
    this.cardContent.addChild(badgeBg);

    const avIcon = new Text({
      text: p1Won ? '🏆' : '🤖',
      style: new TextStyle({ fontSize: isCompact ? 24 : 28 })
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
        fontFamily: DESIGN_TOKENS.typography.fontBody,
        fontSize: 10,
        fill: 0x94A3B8,
        fontWeight: '800',
        letterSpacing: 1,
      })
    });
    seriesSubtitle.x = headerTextX;
    seriesSubtitle.y = topY + (isCompact ? 10 : 14);
    this.cardContent.addChild(seriesSubtitle);

    const winnerTitle = this.data.roundDraw
      ? 'Round drawn'
      : isComplete
      ? (p1Won
        ? (isAi ? 'You win the series!' : 'Player 1 wins!')
        : (isAi ? 'Computer wins series' : 'Player 2 wins!'))
      : (p1Won
        ? (isAi ? 'You won this round!' : 'Player 1 won!')
        : (isAi ? 'Computer won round' : 'Player 2 won!'));

    const titleText = new Text({
      text: winnerTitle,
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: isCompact ? 16 : 18,
        fill: 0xF8FAFC,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: bannerW - badgeSize - 44,
      })
    });
    titleText.x = headerTextX;
    titleText.y = topY + (isCompact ? 28 : 32);
    this.cardContent.addChild(titleText);

    // ── 3. Inset "SERIES SCORE" Card ─────────────────────────────────
    const scoreBoxY = topY + bannerH + (isCompact ? 10 : 14);
    const scoreBoxW = w - 44;
    const scoreBoxH = isCompact ? 86 : 96;

    const scoreBox = new Graphics()
      .roundRect(-scoreBoxW / 2, scoreBoxY, scoreBoxW, scoreBoxH, DESIGN_TOKENS.radii.md)
      .fill({ color: DESIGN_TOKENS.colors.creamSecondary })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });
    this.cardContent.addChild(scoreBox);

    const scoreTitle = new Text({
      text: 'SERIES SCORE',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontBody,
        fontSize: 10,
        fill: DESIGN_TOKENS.colors.secondaryText,
        fontWeight: '800',
        letterSpacing: 1.5,
      })
    });
    scoreTitle.anchor.set(0.5, 0);
    scoreTitle.x = 0;
    scoreTitle.y = scoreBoxY + 8;
    this.cardContent.addChild(scoreTitle);

    // Score numbers and labels
    const scoreRow = new Container();
    scoreRow.y = scoreBoxY + (isCompact ? 46 : 52);

    const p1Label = new Text({
      text: '• You',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: 14,
        fill: DESIGN_TOKENS.colors.orangeAction,
        fontWeight: 'bold',
      })
    });
    p1Label.anchor.set(1, 0.5);
    p1Label.x = -68;
    scoreRow.addChild(p1Label);

    const p1Score = new Text({
      text: `${this.data.scores[0]}`,
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: isCompact ? 30 : 34,
        fill: DESIGN_TOKENS.colors.navyOutline,
        fontWeight: 'bold',
      })
    });
    p1Score.anchor.set(0.5, 0.5);
    p1Score.x = -36;
    scoreRow.addChild(p1Score);

    const dash = new Text({
      text: '–',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: 24,
        fill: DESIGN_TOKENS.colors.secondaryText,
        fontWeight: 'bold',
      })
    });
    dash.anchor.set(0.5, 0.5);
    dash.x = 0;
    scoreRow.addChild(dash);

    const p2Score = new Text({
      text: `${this.data.scores[1]}`,
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: isCompact ? 30 : 34,
        fill: DESIGN_TOKENS.colors.navyOutline,
        fontWeight: 'bold',
      })
    });
    p2Score.anchor.set(0.5, 0.5);
    p2Score.x = 36;
    scoreRow.addChild(p2Score);

    const p2Label = new Text({
      text: isAi ? '• Computer' : '• Player 2',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: 14,
        fill: 0x0EA5E9,
        fontWeight: 'bold',
      })
    });
    p2Label.anchor.set(0, 0.5);
    p2Label.x = 68;
    scoreRow.addChild(p2Label);

    this.cardContent.addChild(scoreRow);

    // ── 4. Rewards card (real, settled numbers) ──────────────────────
    const statsY = scoreBoxY + scoreBoxH + (isCompact ? 9 : 12);
    const xpCardW = w - 44;
    const econ = isComplete ? this.data.econ : undefined;
    const rowH = isCompact ? 16 : 17;
    const lines: { l: string; v: string; color?: number; bold?: boolean }[] = [];
    if (econ) {
      if (econ.entryFee > 0) {
        lines.push({ l: 'Entry fee', v: `−${formatPen(econ.entryFee)} PEN`, color: DESIGN_TOKENS.semantic.danger });
        lines.push({
          l: econ.payout > econ.entryFee ? 'Match payout' : econ.payout === econ.entryFee ? 'Refund' : 'Match payout',
          v: `+${formatPen(econ.payout)} PEN`,
          color: econ.payout > 0 ? DESIGN_TOKENS.semantic.success : 0x94A3B8,
        });
      } else {
        lines.push({ l: this.data.mode === 'VS_AI' ? 'Practice' : 'Local duel', v: 'No PEN at stake', color: 0x94A3B8 });
      }
      if (econ.bonusPen > 0) lines.push({ l: 'Bonuses', v: `+${formatPen(econ.bonusPen)} PEN`, color: DESIGN_TOKENS.semantic.pen });
      const net = econ.netPen + econ.bonusPen;
      if (econ.entryFee > 0 || econ.bonusPen > 0) {
        lines.push({
          l: 'Net PEN',
          v: `${net > 0 ? '+' : net < 0 ? '−' : ''}${formatPen(Math.abs(net))}`,
          color: net >= 0 ? DESIGN_TOKENS.semantic.success : DESIGN_TOKENS.semantic.danger,
          bold: true,
        });
      }
      lines.push({ l: 'Balance', v: `${formatPen(econ.balanceAfter)} PEN`, color: 0xF8FAFC, bold: true });
      lines.push({
        l: 'XP',
        v: econ.forfeited ? 'None (forfeit)' : `Account +${econ.accountXp} · Pen +${econ.penXp}`,
        color: DESIGN_TOKENS.semantic.success,
      });
      if (econ.levelsGained.length > 0) {
        lines.push({ l: 'Level up!', v: `Level ${econ.levelsGained[econ.levelsGained.length - 1]}`, color: DESIGN_TOKENS.semantic.pen, bold: true });
      }
    } else {
      const fee = this.data.stakeFee ?? 0;
      lines.push({ l: 'Series', v: `First to ${this.data.winsNeeded}` });
      lines.push({ l: 'At stake', v: fee > 0 ? `${formatPen(fee)} PEN` : 'No PEN (Practice)', color: fee > 0 ? DESIGN_TOKENS.semantic.pen : 0x94A3B8 });
      lines.push({ l: 'Win streak', v: `${this.data.streak}` });
    }
    const xpCardH = lines.length * rowH + (isCompact ? 14 : 18);

    const xpCardBg = new Graphics()
      .roundRect(-xpCardW / 2, statsY, xpCardW, xpCardH, DESIGN_TOKENS.radii.md)
      .fill({ color: DESIGN_TOKENS.colors.deepNavy });
    this.cardContent.addChild(xpCardBg);

    lines.forEach((ln, i) => {
      const ly = statsY + (isCompact ? 7 : 9) + i * rowH;
      const lt = new Text({
        text: ln.l,
        style: new TextStyle({ fontFamily: DESIGN_TOKENS.typography.fontBody, fontSize: isCompact ? 11 : 12, fill: 0x94A3B8, fontWeight: '700' }),
      });
      lt.x = -xpCardW / 2 + 14;
      lt.y = ly;
      const vt = new Text({
        text: ln.v,
        style: new TextStyle({
          fontFamily: ln.bold ? DESIGN_TOKENS.typography.fontHeading : DESIGN_TOKENS.typography.fontBody,
          fontSize: isCompact ? 11.5 : 12.5,
          fill: ln.color ?? 0xF8FAFC,
          fontWeight: ln.bold ? 'bold' : '800',
        }),
      });
      vt.anchor.set(1, 0);
      vt.x = xpCardW / 2 - 14;
      vt.y = ly;
      this.cardContent.addChild(lt, vt);
    });

    // ── 5. Action Buttons ────────────────────────────────────────────
    const btnW = w - 44;
    const btnH = isCompact ? 48 : 56;
    const buttonsY = statsY + xpCardH + (isCompact ? 10 : 14);

    // Button 1: Next Round or Play Again (Rematch)
    const rematchFee = this.data.econ?.entryFee ?? 0;
    const primaryLabel = isComplete
      ? (rematchFee > 0 ? `Rematch · ${formatPen(rematchFee)} PEN` : 'Play again')
      : 'Next round';
    const primaryIcon = isComplete ? '🔄' : '▷';
    const primaryEvent = isComplete ? 'rematch' : 'next_round';

    const mainActionBtn = this.createButton({
      w: btnW,
      h: btnH,
      color: DESIGN_TOKENS.colors.premiumGold,
      icon: primaryIcon,
      label: primaryLabel,
      primary: true,
      onClick: () => {
        soundManager.play('flick');
        this.hide();
        this.emit(primaryEvent);
      }
    });
    mainActionBtn.x = 0;
    mainActionBtn.y = buttonsY;
    this.cardContent.addChild(mainActionBtn);

    // Bottom Row: [✎ Change pens] & [☰ Menu]
    const smallBtnW = (btnW - 12) / 2;
    const smallBtnH = isCompact ? 42 : 48;
    const smallBtnY = buttonsY + btnH + (isCompact ? 8 : 12);

    const changePensBtn = this.createButton({
      w: smallBtnW,
      h: smallBtnH,
      color: DESIGN_TOKENS.colors.creamSurface,
      icon: '✎',
      label: 'Change',
      primary: false,
      onClick: () => {
        soundManager.play('ui_click');
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
      color: DESIGN_TOKENS.colors.creamSurface,
      icon: '☰',
      label: 'Menu',
      primary: false,
      onClick: () => {
        soundManager.play('ui_click');
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

    const r = DESIGN_TOKENS.radii.md;
    const shadow = new Graphics()
      .roundRect(-opts.w / 2, DESIGN_TOKENS.shadows.buttonOffset, opts.w, opts.h, r)
      .fill({ color: DESIGN_TOKENS.colors.navyOutline });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-opts.w / 2, 0, opts.w, opts.h, r)
      .fill({ color: opts.color })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: opts.primary ? DESIGN_TOKENS.borders.thick : DESIGN_TOKENS.borders.regular });
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
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: opts.primary ? 19 : 15,
        fill: DESIGN_TOKENS.colors.navyOutline,
        fontWeight: 'bold',
      })
    });
    label.anchor.set(0, 0.5);
    label.x = 2;
    label.y = opts.h / 2;
    row.addChild(label);

    surface.addChild(row);

    btn.on('pointerdown', () => { surface.y = 2.5; });
    btn.on('pointerup', () => {
      surface.y = 0;
      opts.onClick();
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });

    return btn;
  }

  public destroy(): void {
    this.removeAllListeners();
    this.container.destroy({ children: true });
  }
}
