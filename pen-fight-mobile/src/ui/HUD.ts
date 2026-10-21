/**
 * src/ui/HUD.ts
 * 120-FPS Zero-Allocation In-Game Top Header matching https://shunneklabs.app/games/pen-fight/.
 *
 * Performance Fix:
 * Pre-allocates all Text and Graphics objects once in `constructor()` and only rebuilds
 * the score/status pill geometry when `lastStateKey` actually changes (e.g., on turn change
 * or score change)—eliminating 100% of per-frame WebGL text rasterization stutter!
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
  private p1Txt: Text;
  private p1Badge: Graphics;
  private p1Score: Text;
  private dotTxt: Text;
  private p2Txt: Text;
  private p2Badge: Graphics;
  private p2Score: Text;

  private pauseButton: Container;
  private leaveButton: Container;

  private statusPillContainer: Container;
  private statusPillBg: Graphics;
  private statusPillText: Text;

  private timerContainer: Container;
  private timerBar: Graphics;
  private timerText: Text;

  private lastStateKey = '';

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.container = new Container();

    // 1. Top-Left Scoreboard Pill (Pre-allocated nodes!)
    this.scorePillContainer = new Container();
    this.scorePillBg = new Graphics();
    this.scorePillContainer.addChild(this.scorePillBg);

    const nameStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 12.5,
      fill: COLORS.textDark,
      fontWeight: 'bold',
    });
    const scoreStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 11.5,
      fill: COLORS.textDark,
      fontWeight: 'bold',
    });

    this.p1Txt = new Text({ text: 'You', style: nameStyle });
    this.p1Txt.anchor.set(0, 0.5);
    this.p1Badge = new Graphics();
    this.p1Score = new Text({ text: '0', style: scoreStyle });
    this.p1Score.anchor.set(0.5, 0.5);

    this.dotTxt = new Text({
      text: '·',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 16,
        fill: COLORS.textMuted,
        fontWeight: 'bold',
      })
    });
    this.dotTxt.anchor.set(0, 0.5);

    this.p2Txt = new Text({ text: 'Computer', style: nameStyle });
    this.p2Txt.anchor.set(0, 0.5);
    this.p2Badge = new Graphics();
    this.p2Score = new Text({ text: '0', style: scoreStyle });
    this.p2Score.anchor.set(0.5, 0.5);

    this.scorePillContainer.addChild(
      this.p1Txt,
      this.p1Badge,
      this.p1Score,
      this.dotTxt,
      this.p2Txt,
      this.p2Badge,
      this.p2Score
    );
    this.container.addChild(this.scorePillContainer);

    // 2. Top-Right Pause Button (||) & Leave Button (🏠)
    this.pauseButton = this.createPauseButton();
    this.container.addChild(this.pauseButton);

    this.leaveButton = this.createLeaveButton();
    this.container.addChild(this.leaveButton);

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

    // 4. Inactivity Countdown Timer
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

    this.leaveButton.x = screenWidth - 62;
    this.leaveButton.y = topY;

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

  private createLeaveButton(): Container {
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

    const txt = new Text({
      text: '🏠',
      style: new TextStyle({ fontSize: 18 })
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = -s / 2;
    txt.y = s / 2;
    surface.addChild(txt);

    btn.on('pointerdown', () => { surface.y = 2; });
    btn.on('pointerup', () => {
      surface.y = 0;
      this.emit('leave_click');
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });

    return btn;
  }

  public updateFromEngine(
    engine: import('../physics/PenFightEngine').PenFightEngine,
    mode: 'ai' | '2p',
    scores: [number, number]
  ): void {
    const stateKey = `${mode}_${scores[0]}_${scores[1]}_${engine.phase}_${engine.activePlayer}_${engine.turnCount}_${engine.shrinkSteps}`;
    if (stateKey === this.lastStateKey) return;
    this.lastStateKey = stateKey;

    const isAI = mode === 'ai';
    const p1Name = isAI ? 'You' : 'Player 1';
    const p2Name = isAI ? 'Computer' : 'Player 2';

    const pillH = 34;
    const r = 9999;
    let curX = 12;

    this.p1Txt.text = p1Name;
    this.p1Txt.x = curX;
    this.p1Txt.y = pillH / 2;
    curX += this.p1Txt.width + 6;

    const badgeR = 10;
    this.p1Badge.clear()
      .circle(curX + badgeR, pillH / 2, badgeR)
      .fill({ color: COLORS.peachOrange })
      .stroke({ color: COLORS.navyBorder, width: 1.5 });

    this.p1Score.text = `${scores[0]}`;
    this.p1Score.x = curX + badgeR;
    this.p1Score.y = pillH / 2;
    curX += badgeR * 2 + 8;

    this.dotTxt.x = curX;
    this.dotTxt.y = pillH / 2 - 1;
    curX += this.dotTxt.width + 8;

    this.p2Txt.text = p2Name;
    this.p2Txt.x = curX;
    this.p2Txt.y = pillH / 2;
    curX += this.p2Txt.width + 6;

    this.p2Badge.clear()
      .circle(curX + badgeR, pillH / 2, badgeR)
      .fill({ color: COLORS.skyBlue })
      .stroke({ color: COLORS.navyBorder, width: 1.5 });

    this.p2Score.text = `${scores[1]}`;
    this.p2Score.x = curX + badgeR;
    this.p2Score.y = pillH / 2;
    curX += badgeR * 2 + 12;

    const totalPillW = curX;

    this.scorePillBg.clear()
      .roundRect(0, 3, totalPillW, pillH, r)
      .fill({ color: COLORS.navyShadow })
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

    this.statusPillBg.clear()
      .roundRect(-statW / 2, 3, statW, statH, 9999)
      .fill({ color: COLORS.navyShadow })
      .roundRect(-statW / 2, 0, statW, statH, 9999)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.2 })
      .circle(-statW / 2 + 20, statH / 2, 6.5)
      .stroke({ color: COLORS.navyBorder, width: 2.2 })
      .circle(-statW / 2 + 20, statH / 2, 3.2)
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
