/**
 * HUD.ts
 * Skeuomorphic In-Game Top Header matching shunneklabs.app reference (ref_gameplay_t15s.png).
 * Floating cream scoreboard pill with colored circular score badges, square cream pause button,
 * and floating status pill ("○ Your turn" / "○ Computer's turn").
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, MAX_TURNS_PER_ROUND } from '../config/gameConstants';
import { getTopStatusPillText } from './TopHudUpdater';
import EventEmitter from 'eventemitter3';

export class HUD extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;

  // Score Pill Components (Top Left)
  private scorePillContainer: Container;
  private scorePillBg: Graphics;
  private scoreContent: Container;

  // Action Buttons (Top Right)
  private pauseButton: Container;
  private soundButton: Container;
  private soundMuted = false;

  // Status Pill (Center Below Top Bar)
  private statusPillContainer: Container;
  private statusPillBg: Graphics;
  private statusPillText: Text;

  // Bottom Turn Counter
  private turnCounterText: Text;

  // Inactivity Countdown Timer
  private timerContainer: Container;
  private timerBar: Graphics;
  private timerText: Text;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.container = new Container();

    // ── 1. Top-Left Scoreboard Pill ──────────────────────────────────
    this.scorePillContainer = new Container();
    this.scorePillBg = new Graphics();
    this.scoreContent = new Container();
    this.scorePillContainer.addChild(this.scorePillBg);
    this.scorePillContainer.addChild(this.scoreContent);
    this.container.addChild(this.scorePillContainer);

    // ── 2. Top-Right Pause Button ────────────────────────────────────
    this.pauseButton = this.createPauseButton();
    this.container.addChild(this.pauseButton);

    this.soundButton = this.createSoundButton();
    this.container.addChild(this.soundButton);

    // ── 3. Center Status Pill ────────────────────────────────────────
    this.statusPillContainer = new Container();
    this.statusPillBg = new Graphics();
    this.statusPillContainer.addChild(this.statusPillBg);

    const statusStyle = new TextStyle({
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: 13,
      fill: COLORS.textDark,
      fontWeight: 'bold',
    });
    this.statusPillText = new Text({ text: '○ Your turn', style: statusStyle });
    this.statusPillText.anchor.set(0.5, 0.5);
    this.statusPillContainer.addChild(this.statusPillText);
    this.container.addChild(this.statusPillContainer);

    // ── 4. Bottom Turn Counter ───────────────────────────────────────
    const counterStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 12,
      fill: COLORS.textMuted,
      fontWeight: 'bold',
    });
    this.turnCounterText = new Text({ text: 'Turn 1 / 30', style: counterStyle });
    this.turnCounterText.anchor.set(0.5, 1);
    this.container.addChild(this.turnCounterText);

    // ── 5. Inactivity Countdown Timer ────────────────────────────────
    this.timerContainer = new Container();
    this.timerContainer.visible = false;
    this.container.addChild(this.timerContainer);

    this.timerBar = new Graphics();
    this.timerContainer.addChild(this.timerBar);

    const timerStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 13,
      fill: COLORS.danger,
      fontWeight: 'bold',
    });
    this.timerText = new Text({ text: '20s', style: timerStyle });
    this.timerText.anchor.set(0.5, 0.5);
    this.timerContainer.addChild(this.timerText);

    this.layout();
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    const topY = Math.max(16, screenHeight * 0.025);

    // Score pill positioned on top left
    this.scorePillContainer.x = 20;
    this.scorePillContainer.y = topY;

    // Pause button on top right
    this.pauseButton.x = screenWidth - 20;
    this.pauseButton.y = topY;

    this.soundButton.x = screenWidth - 72;
    this.soundButton.y = topY;

    // Status pill centered below top bar
    this.statusPillContainer.x = screenWidth / 2;
    this.statusPillContainer.y = topY + 44;

    // Bottom counter
    this.turnCounterText.x = screenWidth / 2;
    this.turnCounterText.y = screenHeight - 12;

    // Timer
    this.timerContainer.x = screenWidth / 2;
    this.timerContainer.y = topY + 82;
  }

  private createPauseButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const s = 40;
    const r = 12;

    const shadow = new Graphics()
      .roundRect(-s, 3, s, s, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-s, 0, s, s, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.5 });
    btn.addChild(surface);

    // Double Pause Bars ⏸
    const barW = 4;
    const barH = 14;
    const barR = 2;
    const iconG = new Graphics()
      .roundRect(-s / 2 - barW - 2, (s - barH) / 2, barW, barH, barR)
      .fill({ color: COLORS.textDark })
      .roundRect(-s / 2 + 2, (s - barH) / 2, barW, barH, barR)
      .fill({ color: COLORS.textDark });
    surface.addChild(iconG);

    btn.on('pointerdown', () => { surface.y = 2; });
    btn.on('pointerup', () => {
      surface.y = 0;
      this.emit('pause_click');
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });

    return btn;
  }

  private createSoundButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const s = 40;
    const r = 12;

    const shadow = new Graphics()
      .roundRect(-s, 3, s, s, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-s, 0, s, s, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.5 });
    btn.addChild(surface);

    const icon = new Text({
      text: '🔊',
      style: new TextStyle({ fontSize: 18 })
    });
    icon.anchor.set(0.5, 0.5);
    icon.x = -s / 2;
    icon.y = s / 2;
    surface.addChild(icon);

    btn.on('pointerdown', () => { surface.y = 2; });
    btn.on('pointerup', () => {
      surface.y = 0;
      this.soundMuted = !this.soundMuted;
      icon.text = this.soundMuted ? '🔇' : '🔊';
      this.emit('sound_toggle', !this.soundMuted);
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });

    return btn;
  }

  /**
   * Update HUD from simulation engine and current scores.
   * Renders the authentic top-left pill:
   * "You [0 (peach)] · Computer [0 (blue)]"
   */
  public updateFromEngine(
    engine: import('../physics/PenFightEngine').PenFightEngine,
    mode: 'ai' | '2p',
    scores: [number, number]
  ): void {
    const isAI = mode === 'ai';
    const p1Name = 'You';
    const p2Name = isAI ? 'Computer' : 'Player 2';

    // 1. Rebuild Score Pill Content
    this.scoreContent.removeChildren();

    const pillH = 38;
    const r = 9999;

    let curX = 14;

    // "You" text
    const p1Txt = new Text({
      text: p1Name,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 13,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    p1Txt.anchor.set(0, 0.5);
    p1Txt.x = curX;
    p1Txt.y = pillH / 2;
    this.scoreContent.addChild(p1Txt);
    curX += p1Txt.width + 8;

    // P1 Score Circle Badge (Peach)
    const badgeR = 11;
    const p1Badge = new Graphics()
      .circle(curX + badgeR, pillH / 2, badgeR)
      .fill({ color: COLORS.peachOrange })
      .stroke({ color: COLORS.navyBorder, width: 1.5 });
    this.scoreContent.addChild(p1Badge);

    const p1Score = new Text({
      text: `${scores[0]}`,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 12,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    p1Score.anchor.set(0.5, 0.5);
    p1Score.x = curX + badgeR;
    p1Score.y = pillH / 2;
    this.scoreContent.addChild(p1Score);
    curX += badgeR * 2 + 10;

    // Middle Dot ·
    const dotTxt = new Text({
      text: '·',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 18,
        fill: COLORS.textMuted,
        fontWeight: 'bold',
      })
    });
    dotTxt.anchor.set(0, 0.5);
    dotTxt.x = curX;
    dotTxt.y = pillH / 2 - 1;
    this.scoreContent.addChild(dotTxt);
    curX += dotTxt.width + 10;

    // "Computer" text
    const p2Txt = new Text({
      text: p2Name,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 13,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    p2Txt.anchor.set(0, 0.5);
    p2Txt.x = curX;
    p2Txt.y = pillH / 2;
    this.scoreContent.addChild(p2Txt);
    curX += p2Txt.width + 8;

    // P2 Score Circle Badge (Sky Blue)
    const p2Badge = new Graphics()
      .circle(curX + badgeR, pillH / 2, badgeR)
      .fill({ color: COLORS.skyBlue })
      .stroke({ color: COLORS.navyBorder, width: 1.5 });
    this.scoreContent.addChild(p2Badge);

    const p2Score = new Text({
      text: `${scores[1]}`,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 12,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    p2Score.anchor.set(0.5, 0.5);
    p2Score.x = curX + badgeR;
    p2Score.y = pillH / 2;
    this.scoreContent.addChild(p2Score);
    curX += badgeR * 2 + 14;

    const totalPillW = curX;

    // Render Pill Background & Shadow
    this.scorePillBg.clear();
    this.scorePillBg
      .roundRect(0, 3, totalPillW, pillH, r)
      .fill({ color: COLORS.navyShadow });
    this.scorePillBg
      .roundRect(0, 0, totalPillW, pillH, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.5 });

    // 2. Update Status Pill
    const pillInfo = getTopStatusPillText(engine, mode);
    this.statusPillText.text = pillInfo.text;

    let parsedColor: number = COLORS.textDark;
    if (pillInfo.dotColor.startsWith('#')) {
      parsedColor = parseInt(pillInfo.dotColor.replace('#', '0x'), 16);
    }

    const textW = this.statusPillText.width;
    const statW = Math.max(140, textW + 54);
    const statH = 34;

    this.statusPillBg.clear();
    // 3D Shadow
    this.statusPillBg
      .roundRect(-statW / 2, 3, statW, statH, 9999)
      .fill({ color: COLORS.navyShadow });
    // Surface
    this.statusPillBg
      .roundRect(-statW / 2, 0, statW, statH, 9999)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });

    // Status Ring Indicator (matches ring in ref_gameplay_t15s.png)
    const ringX = -statW / 2 + 20;
    const ringY = statH / 2;
    this.statusPillBg
      .circle(ringX, ringY, 7)
      .stroke({ color: COLORS.navyBorder, width: 2.5 })
      .circle(ringX, ringY, 3.5)
      .fill({ color: parsedColor });

    this.statusPillText.x = 10;
    this.statusPillText.y = statH / 2;
    (this.statusPillText.style as TextStyle).fill = COLORS.textDark;
    (this.statusPillText.style as TextStyle).fontSize = 13;

    this.setTurnCount(engine.turnCount, 30);
  }

  public setTurnCount(currentTurn: number, maxTurns = MAX_TURNS_PER_ROUND): void {
    this.turnCounterText.text = `Turn ${currentTurn} / ${maxTurns}`;
  }

  public showWarning(show: boolean): void {
    // Handled in status pill
  }

  public updateCountdown(remainingSec: number, ratio: number): void {
    if (remainingSec <= 0) {
      this.timerContainer.visible = false;
      return;
    }
    this.timerContainer.visible = true;

    const barW = 180;
    const barH = 8;
    this.timerBar.clear()
      .roundRect(-barW / 2, -barH / 2, barW, barH, 4)
      .fill({ color: 0xD1D5DB });

    const fillColor = ratio > 0.4 ? COLORS.butterYellow : COLORS.danger;
    this.timerBar
      .roundRect(-barW / 2, -barH / 2, barW * Math.max(0, ratio), barH, 4)
      .fill({ color: fillColor })
      .stroke({ color: COLORS.navyBorder, width: 1.5 });

    this.timerText.x = barW / 2 + 18;
    this.timerText.y = 0;
    this.timerText.text = `${Math.ceil(remainingSec)}s`;
  }

  public hideCountdown(): void {
    this.timerContainer.visible = false;
  }
}
