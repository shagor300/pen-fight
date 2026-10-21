/**
 * HUD.ts
 * 100% Authentic In-Game Top Header matching https://shunneklabs.app/games/pen-fight/.
 * Top-Left: Score Pill ("You [0] · Computer [0]" or "Player 1 [0] · Player 2 [0]")
 * Top-Center: Status Pill ("○ Your turn" / "○ 6 normal turns left" / "⚠️ Desk shrinks after this turn")
 * Top-Right: Single Square Cream Pause Button ("||")
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { getTopStatusPillText } from './TopHudUpdater';
import EventEmitter from 'eventemitter3';

export class HUD extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;

  private scorePillContainer: Container;
  private scorePillBg: Graphics;
  private scoreContent: Container;

  private pauseButton: Container;

  private statusPillContainer: Container;
  private statusPillBg: Graphics;
  private statusPillText: Text;

  private timerContainer: Container;
  private timerBar: Graphics;
  private timerText: Text;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.container = new Container();

    // 1. Top-Left Scoreboard Pill
    this.scorePillContainer = new Container();
    this.scorePillBg = new Graphics();
    this.scoreContent = new Container();
    this.scorePillContainer.addChild(this.scorePillBg);
    this.scorePillContainer.addChild(this.scoreContent);
    this.container.addChild(this.scorePillContainer);

    // 2. Top-Right Single Square Cream Pause Button (||)
    this.pauseButton = this.createPauseButton();
    this.container.addChild(this.pauseButton);

    // 3. Top-Center Status Pill
    this.statusPillContainer = new Container();
    this.statusPillBg = new Graphics();
    this.statusPillContainer.addChild(this.statusPillBg);

    const statusStyle = new TextStyle({
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: 13,
      fill: COLORS.textDark,
      fontWeight: 'bold',
    });
    this.statusPillText = new Text({ text: 'Your turn', style: statusStyle });
    this.statusPillText.anchor.set(0.5, 0.5);
    this.statusPillContainer.addChild(this.statusPillText);
    this.container.addChild(this.statusPillContainer);

    // 4. Inactivity Countdown Timer (appears after 10s wait)
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

    const topY = Math.max(12, screenHeight * 0.018);

    this.scorePillContainer.x = 18;
    this.scorePillContainer.y = topY;

    this.pauseButton.x = screenWidth - 18;
    this.pauseButton.y = topY;

    this.statusPillContainer.x = screenWidth / 2;
    this.statusPillContainer.y = topY + 46;

    this.timerContainer.x = screenWidth / 2;
    this.timerContainer.y = topY + 84;
  }

  private createPauseButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const s = 38;
    const r = 11;

    const shadow = new Graphics()
      .roundRect(-s, 3, s, s, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-s, 0, s, s, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.4 });
    btn.addChild(surface);

    const barW = 3.8;
    const barH = 13;
    const barR = 1.8;
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

  public updateFromEngine(
    engine: import('../physics/PenFightEngine').PenFightEngine,
    mode: 'ai' | '2p',
    scores: [number, number]
  ): void {
    const isAI = mode === 'ai';
    const p1Name = isAI ? 'You' : 'Player 1';
    const p2Name = isAI ? 'Computer' : 'Player 2';

    this.scoreContent.removeChildren();

    const pillH = 34;
    const r = 9999;
    let curX = 12;

    const p1Txt = new Text({
      text: p1Name,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 12.5,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    p1Txt.anchor.set(0, 0.5);
    p1Txt.x = curX;
    p1Txt.y = pillH / 2;
    this.scoreContent.addChild(p1Txt);
    curX += p1Txt.width + 6;

    const badgeR = 10;
    const p1Badge = new Graphics()
      .circle(curX + badgeR, pillH / 2, badgeR)
      .fill({ color: COLORS.peachOrange })
      .stroke({ color: COLORS.navyBorder, width: 1.5 });
    this.scoreContent.addChild(p1Badge);

    const p1Score = new Text({
      text: `${scores[0]}`,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 11.5,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    p1Score.anchor.set(0.5, 0.5);
    p1Score.x = curX + badgeR;
    p1Score.y = pillH / 2;
    this.scoreContent.addChild(p1Score);
    curX += badgeR * 2 + 8;

    const dotTxt = new Text({
      text: '·',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 16,
        fill: COLORS.textMuted,
        fontWeight: 'bold',
      })
    });
    dotTxt.anchor.set(0, 0.5);
    dotTxt.x = curX;
    dotTxt.y = pillH / 2 - 1;
    this.scoreContent.addChild(dotTxt);
    curX += dotTxt.width + 8;

    const p2Txt = new Text({
      text: p2Name,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 12.5,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    p2Txt.anchor.set(0, 0.5);
    p2Txt.x = curX;
    p2Txt.y = pillH / 2;
    this.scoreContent.addChild(p2Txt);
    curX += p2Txt.width + 6;

    const p2Badge = new Graphics()
      .circle(curX + badgeR, pillH / 2, badgeR)
      .fill({ color: COLORS.skyBlue })
      .stroke({ color: COLORS.navyBorder, width: 1.5 });
    this.scoreContent.addChild(p2Badge);

    const p2Score = new Text({
      text: `${scores[1]}`,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 11.5,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    p2Score.anchor.set(0.5, 0.5);
    p2Score.x = curX + badgeR;
    p2Score.y = pillH / 2;
    this.scoreContent.addChild(p2Score);
    curX += badgeR * 2 + 12;

    const totalPillW = curX;

    this.scorePillBg.clear();
    this.scorePillBg
      .roundRect(0, 3, totalPillW, pillH, r)
      .fill({ color: COLORS.navyShadow });
    this.scorePillBg
      .roundRect(0, 0, totalPillW, pillH, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });

    const pillInfo = getTopStatusPillText(engine, mode);
    this.statusPillText.text = pillInfo.text;

    let parsedColor: number = COLORS.textDark;
    if (pillInfo.dotColor.startsWith('#')) {
      parsedColor = parseInt(pillInfo.dotColor.replace('#', '0x'), 16);
    }

    const textW = this.statusPillText.width;
    const statW = Math.max(138, textW + 52);
    const statH = 34;

    this.statusPillBg.clear();
    this.statusPillBg
      .roundRect(-statW / 2, 3, statW, statH, 9999)
      .fill({ color: COLORS.navyShadow });
    this.statusPillBg
      .roundRect(-statW / 2, 0, statW, statH, 9999)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });

    const ringX = -statW / 2 + 20;
    const ringY = statH / 2;
    this.statusPillBg
      .circle(ringX, ringY, 6.5)
      .stroke({ color: COLORS.navyBorder, width: 2.2 })
      .circle(ringX, ringY, 3.2)
      .fill({ color: parsedColor });

    this.statusPillText.x = 10;
    this.statusPillText.y = statH / 2;
  }

  public showWarning(_show: boolean): void {}

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
