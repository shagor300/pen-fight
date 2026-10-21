/**
 * HUD.ts
 * In-game Heads Up Display: Scoreboard, turn indicator, countdown bar,
 * desk shrink alert, and top action buttons.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, COUNTDOWN_SECONDS, MAX_TURNS_PER_ROUND } from '../config/gameConstants';
import { getTopStatusPillText } from './TopHudUpdater';
import EventEmitter from 'eventemitter3';

export class HUD extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;

  // Header Elements
  private topCard: Graphics;
  private scoreText: Text;
  private p1Label: Text;
  private p2Label: Text;
  private turnPill: Graphics;
  private turnText: Text;
  private turnCounterText: Text;

  // Inactivity Timer
  private timerContainer: Container;
  private timerBar: Graphics;
  private timerText: Text;

  // Warning Banner
  private warningBanner: Container;
  private warningText: Text;

  // Action Buttons
  private pauseButton: Container;
  private soundButton: Container;
  private soundMuted = false;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.container = new Container();

    // ── Top Score Card ──────────────────────────────────────────────
    this.topCard = new Graphics();
    this.container.addChild(this.topCard);

    const labelStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 14,
      fill: COLORS.cream,
      letterSpacing: 1,
    });

    this.p1Label = new Text({ text: 'P1: PLAYER', style: labelStyle });
    this.p1Label.anchor.set(0, 0.5);
    this.container.addChild(this.p1Label);

    this.p2Label = new Text({ text: 'P2: BOT (NORMAL)', style: labelStyle });
    this.p2Label.anchor.set(1, 0.5);
    this.container.addChild(this.p2Label);

    const scoreStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 30,
      fill: COLORS.white,
      stroke: { color: COLORS.textDark, width: 4 },
      letterSpacing: 2,
    });
    this.scoreText = new Text({ text: '0 – 0', style: scoreStyle });
    this.scoreText.anchor.set(0.5, 0.5);
    this.container.addChild(this.scoreText);

    // ── Turn Pill Indicator ─────────────────────────────────────────
    this.turnPill = new Graphics();
    this.container.addChild(this.turnPill);

    const turnStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 13,
      fontWeight: 'bold',
      fill: COLORS.white,
    });
    this.turnText = new Text({ text: "PLAYER 1'S TURN", style: turnStyle });
    this.turnText.anchor.set(0.5, 0.5);
    this.container.addChild(this.turnText);

    // ── Turn Counter (bottom center) ────────────────────────────────
    const counterStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 13,
      fill: COLORS.cream,
      stroke: { color: COLORS.textDark, width: 2 },
    });
    this.turnCounterText = new Text({ text: `Turn 1 / ${MAX_TURNS_PER_ROUND}`, style: counterStyle });
    this.turnCounterText.anchor.set(0.5, 1);
    this.container.addChild(this.turnCounterText);

    // ── Inactivity Countdown Timer ──────────────────────────────────
    this.timerContainer = new Container();
    this.timerContainer.visible = false;
    this.container.addChild(this.timerContainer);

    this.timerBar = new Graphics();
    this.timerContainer.addChild(this.timerBar);

    const timerStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 14,
      fill: COLORS.danger,
    });
    this.timerText = new Text({ text: '20s', style: timerStyle });
    this.timerText.anchor.set(0.5, 0.5);
    this.timerContainer.addChild(this.timerText);

    // ── Desk Shrink Warning Banner ──────────────────────────────────
    this.warningBanner = new Container();
    this.warningBanner.visible = false;
    this.container.addChild(this.warningBanner);

    const bannerBg = new Graphics()
      .roundRect(-160, -16, 320, 32, 8)
      .fill({ color: COLORS.danger, alpha: 0.9 })
      .stroke({ color: COLORS.white, width: 1.5 });
    this.warningBanner.addChild(bannerBg);

    const warningStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 13,
      fill: COLORS.white,
      fontWeight: 'bold',
    });
    this.warningText = new Text({ text: '⚠️ DESK SHRINKS NEXT TURN!', style: warningStyle });
    this.warningText.anchor.set(0.5, 0.5);
    this.warningBanner.addChild(this.warningText);

    // ── Action Buttons ──────────────────────────────────────────────
    this.pauseButton = this.createIconButton('⏸', 14, () => this.emit('pause_click'));
    this.container.addChild(this.pauseButton);

    this.soundButton = this.createIconButton('🔊', 14, () => {
      this.soundMuted = !this.soundMuted;
      this.updateSoundButton();
      this.emit('sound_toggle', !this.soundMuted);
    });
    this.container.addChild(this.soundButton);

    this.layout();
  }

  private createIconButton(symbol: string, size: number, onClick: () => void): Container {
    const btn = new Container();
    const bg = new Graphics()
      .circle(0, 0, 18)
      .fill({ color: 0x1A1A1A, alpha: 0.6 })
      .stroke({ color: COLORS.cream, width: 1, alpha: 0.4 });
    btn.addChild(bg);

    const txt = new Text({
      text: symbol,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: size,
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

  private updateSoundButton(): void {
    const txt = this.soundButton.children[1] as Text;
    if (txt) {
      txt.text = this.soundMuted ? '🔇' : '🔊';
    }
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    const cardWidth = Math.min(screenWidth - 30, 480);
    const cardHeight = 52;
    const cardX = (screenWidth - cardWidth) / 2;
    const cardY = 10;

    // Background card
    this.topCard.clear()
      .roundRect(cardX, cardY, cardWidth, cardHeight, 14)
      .fill({ color: 0x221811, alpha: 0.85 })
      .stroke({ color: COLORS.woodMid, width: 1.5, alpha: 0.6 });

    // Labels & Score
    this.p1Label.x = cardX + 20;
    this.p1Label.y = cardY + cardHeight / 2;

    this.p2Label.x = cardX + cardWidth - 20;
    this.p2Label.y = cardY + cardHeight / 2;

    this.scoreText.x = screenWidth / 2;
    this.scoreText.y = cardY + cardHeight / 2;

    // Turn pill
    this.turnPill.x = screenWidth / 2;
    this.turnPill.y = cardY + cardHeight + 16;
    this.turnText.x = this.turnPill.x;
    this.turnText.y = this.turnPill.y;

    // Action buttons
    this.pauseButton.x = 28;
    this.pauseButton.y = cardY + cardHeight / 2;

    this.soundButton.x = screenWidth - 28;
    this.soundButton.y = cardY + cardHeight / 2;

    // Bottom counter
    this.turnCounterText.x = screenWidth / 2;
    this.turnCounterText.y = screenHeight - 10;

    // Warning banner
    this.warningBanner.x = screenWidth / 2;
    this.warningBanner.y = cardY + cardHeight + 52;

    // Inactivity timer
    this.timerContainer.x = screenWidth / 2;
    this.timerContainer.y = cardY + cardHeight + 40;
  }

  /** Update scoreboard and active player */
  public updateScore(
    scores: [number, number],
    currentPlayer: 0 | 1,
    p1Name: string,
    p2Name: string,
    isAI: boolean,
  ): void {
    this.scoreText.text = `${scores[0]} – ${scores[1]}`;
    this.p1Label.text = `P1: ${p1Name.toUpperCase()}`;
    this.p2Label.text = isAI ? `BOT: ${p2Name.toUpperCase()}` : `P2: ${p2Name.toUpperCase()}`;

    const activeColor = currentPlayer === 0 ? COLORS.accent : 0x3A86FF;
    const activeText = currentPlayer === 0
      ? `▶ ${p1Name.toUpperCase()}'S TURN`
      : isAI
      ? `⏳ BOT IS AIMING...`
      : `▶ ${p2Name.toUpperCase()}'S TURN`;

    this.turnText.text = activeText;

    const pillW = Math.max(160, this.turnText.width + 28);
    this.turnPill.clear()
      .roundRect(-pillW / 2, -12, pillW, 24, 12)
      .fill({ color: activeColor, alpha: 0.9 })
      .stroke({ color: COLORS.white, width: 1, alpha: 0.5 });
  }

  /**
   * Updates HUD using TopHudUpdater from blueprint:
   * Left: "You 0 · Computer 1"
   * Center Pill: "● Your turn" / "● Computer · Thinking" / "● 5 normal turns left"
   */
  public updateFromEngine(engine: import('../physics/PenFightEngine').PenFightEngine, mode: 'ai' | '2p', scores: [number, number]): void {
    const isAI = mode === 'ai';
    const leftText = isAI ? `You ${scores[0]} · Computer ${scores[1]}` : `P1 ${scores[0]} · P2 ${scores[1]}`;
    this.p1Label.text = leftText;
    this.p2Label.text = ''; // Clear to prevent any overlap!
    this.scoreText.text = ''; // Clear center text so only the clean pill is visible

    const pillInfo = getTopStatusPillText(engine, mode);
    this.turnText.text = `● ${pillInfo.text}`;

    let parsedColor = 0xF3CD57;
    if (pillInfo.dotColor.startsWith('#')) {
      parsedColor = parseInt(pillInfo.dotColor.replace('#', '0x'), 16);
    }

    const pillW = Math.max(170, this.turnText.width + 26);
    this.turnPill.clear()
      .roundRect(-pillW / 2, -13, pillW, 26, 13)
      .fill({ color: 0x221811, alpha: 0.92 })
      .stroke({ color: parsedColor, width: 2 });

    (this.turnText.style as TextStyle).fill = parsedColor;
    this.setTurnCount(engine.turnCount, 30);
  }

  public setTurnCount(currentTurn: number, maxTurns = MAX_TURNS_PER_ROUND): void {
    this.turnCounterText.text = `Turn ${currentTurn} / ${maxTurns}`;
  }

  public showWarning(show: boolean): void {
    this.warningBanner.visible = show;
  }

  public updateCountdown(remainingSec: number, ratio: number): void {
    if (remainingSec <= 0) {
      this.timerContainer.visible = false;
      return;
    }
    this.timerContainer.visible = true;

    const barW = 200;
    const barH = 6;
    this.timerBar.clear()
      .roundRect(-barW / 2, -barH / 2, barW, barH, 3)
      .fill({ color: 0x333333, alpha: 0.5 });

    const fillColor = ratio > 0.4 ? COLORS.accent : COLORS.danger;
    this.timerBar
      .roundRect(-barW / 2, -barH / 2, barW * Math.max(0, ratio), barH, 3)
      .fill({ color: fillColor });

    this.timerText.x = barW / 2 + 18;
    this.timerText.y = 0;
    this.timerText.text = `${Math.ceil(remainingSec)}s`;
  }

  public hideCountdown(): void {
    this.timerContainer.visible = false;
  }
}
