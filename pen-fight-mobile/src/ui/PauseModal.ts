/**
 * PauseModal.ts
 * 100% Authentic Pause Screen matching https://shunneklabs.app/games/pen-fight/ (sheet_611_02.jpg).
 * Header: [||] Paused ("Same pens · your turn can wait")
 * Summary: "Match X · You 0 · Computer 0 · First to 3" / "Win streaks · You 0 · Computer 0"
 * Buttons: Resume (mint), Restart match (dashed), Change pens, Full screen, Settings, How to play, Main menu
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { soundManager } from '../audio/SoundAndHaptics';
import EventEmitter from 'eventemitter3';

export interface PauseModalData {
  matchNum: number;
  scores: [number, number];
  winsNeeded: number;
  mode: 'VS_AI' | 'TWO_PLAYER';
  p1Streak: number;
  p2Streak: number;
}

export class PauseModal extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;
  private backdrop: Graphics;
  private cardContainer: Container;
  private cardSurface: Graphics;
  private content: Container;
  private data: PauseModalData | null = null;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.container = new Container();
    this.container.visible = false;

    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.container.addChild(this.backdrop);

    this.cardContainer = new Container();
    this.container.addChild(this.cardContainer);

    this.cardSurface = new Graphics();
    this.cardContainer.addChild(this.cardSurface);

    this.content = new Container();
    this.cardContainer.addChild(this.content);

    this.layout();
  }

  public show(data: PauseModalData): void {
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
    this.content.removeChildren();

    const w = Math.min(this.screenWidth - 28, 380);
    const h = Math.min(this.screenHeight - 28, 590);
    const r = 22;

    this.cardSurface.clear();
    this.cardSurface
      .roundRect(-w / 2, -h / 2 + 6, w, h, r)
      .fill({ color: COLORS.navyShadow })
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3.2 });

    const topY = -h / 2 + 20;

    // Green [||] Badge
    const badgeS = 38;
    const badge = new Graphics()
      .roundRect(-w / 2 + 20, topY, badgeS, badgeS, 11)
      .fill({ color: 0xCDEAC0 })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });
    const barW = 3.5;
    const barH = 13;
    badge
      .roundRect(-w / 2 + 20 + badgeS / 2 - barW - 2, topY + (badgeS - barH) / 2, barW, barH, 1.5)
      .fill({ color: COLORS.textDark })
      .roundRect(-w / 2 + 20 + badgeS / 2 + 2, topY + (badgeS - barH) / 2, barW, barH, 1.5)
      .fill({ color: COLORS.textDark });
    this.content.addChild(badge);

    const title = new Text({
      text: 'Paused',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 21,
        fill: COLORS.textDark,
        fontWeight: 'bold'
      })
    });
    title.x = -w / 2 + 68;
    title.y = topY - 1;
    this.content.addChild(title);

    const sub = new Text({
      text: 'Same pens · your turn can wait',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 12,
        fill: COLORS.textMuted,
        fontWeight: '700'
      })
    });
    sub.x = -w / 2 + 68;
    sub.y = topY + 23;
    this.content.addChild(sub);

    const isAi = this.data.mode === 'VS_AI';
    const p1Lbl = isAi ? 'You' : 'Player 1';
    const p2Lbl = isAi ? 'Computer' : 'Player 2';

    const matchSummary = new Text({
      text: `Match ${this.data.matchNum} · ${p1Lbl} ${this.data.scores[0]} · ${p2Lbl} ${this.data.scores[1]} · First to ${this.data.winsNeeded}`,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 11.5,
        fill: COLORS.textDark,
        fontWeight: '800'
      })
    });
    matchSummary.anchor.set(0.5, 0);
    matchSummary.x = 0;
    matchSummary.y = topY + 52;
    this.content.addChild(matchSummary);

    const streakSummary = new Text({
      text: `Win streaks · ${p1Lbl} ${this.data.p1Streak} · ${p2Lbl} ${this.data.p2Streak}`,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 11.5,
        fill: COLORS.textMuted,
        fontWeight: '700'
      })
    });
    streakSummary.anchor.set(0.5, 0);
    streakSummary.x = 0;
    streakSummary.y = topY + 69;
    this.content.addChild(streakSummary);

    const btnW = w - 40;
    const btnH = 44;
    let curY = topY + 96;

    const actions: { icon: string; label: string; bg: number; event: string }[] = [
      { icon: '▷', label: 'Resume', bg: 0xCDEAC0, event: 'resume' },
      { icon: '↻', label: 'Restart match', bg: 0xF5EFE2, event: 'restart' },
      { icon: '✎', label: 'Change pens', bg: COLORS.cardCream, event: 'change_pens' },
      { icon: '⛶', label: 'Full screen', bg: COLORS.cardCream, event: 'fullscreen' },
      { icon: '⚙', label: 'Settings', bg: COLORS.cardCream, event: 'settings' },
      { icon: '?', label: 'How to play', bg: COLORS.cardCream, event: 'help' },
      { icon: '🏠', label: 'Main menu', bg: COLORS.cardCream, event: 'main_menu' },
    ];

    actions.forEach((act) => {
      const btn = this.createRowButton(btnW, btnH, act.icon, act.label, act.bg, () => {
        soundManager.play('ui_click');
        this.emit(act.event);
      });
      btn.x = 0;
      btn.y = curY;
      this.content.addChild(btn);
      curY += btnH + 9;
    });

    const footer = new Text({
      text: 'Leaving asks you to confirm',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 11,
        fill: COLORS.textMuted,
        fontWeight: '700'
      })
    });
    footer.anchor.set(0.5, 0);
    footer.x = 0;
    footer.y = curY + 2;
    this.content.addChild(footer);
  }

  private createRowButton(
    w: number,
    h: number,
    icon: string,
    label: string,
    bgColor: number,
    onClick: () => void
  ): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const r = 13;
    const shadow = new Graphics()
      .roundRect(-w / 2, 3, w, h, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-w / 2, 0, w, h, r)
      .fill({ color: bgColor })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });
    btn.addChild(surface);

    const ic = new Text({
      text: icon,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 15,
        fill: COLORS.textDark,
        fontWeight: 'bold'
      })
    });
    ic.anchor.set(0.5, 0.5);
    ic.x = -w / 2 + 24;
    ic.y = h / 2;
    surface.addChild(ic);

    const lbl = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 15,
        fill: COLORS.textDark,
        fontWeight: 'bold'
      })
    });
    lbl.anchor.set(0, 0.5);
    lbl.x = -w / 2 + 46;
    lbl.y = h / 2;
    surface.addChild(lbl);

    btn.on('pointerdown', () => { surface.y = 2; });
    btn.on('pointerup', () => {
      surface.y = 0;
      onClick();
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });

    return btn;
  }
}
