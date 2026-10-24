/**
 * src/ui/PauseModal.ts
 * 100% Authentic Pause Screen matching https://shunneklabs.app/games/pen-fight/.
 * Includes `cardContainer.eventMode = 'static'` + `stopPropagation()` so tapping inside the Pause card never closes it accidentally.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { DESIGN_TOKENS } from '../config/designTokens';
import { soundManager } from '../audio/SoundAndHaptics';
import { themeManager, DESK_WOOD_THEMES } from './ThemeManager';
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
    this.backdrop.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(this.backdrop);

    this.cardContainer = new Container();
    this.cardContainer.eventMode = 'static';
    this.cardContainer.on('pointerdown', (e) => e.stopPropagation());
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
    for (const c of this.content.removeChildren()) c.destroy({ children: true });

    const isCompact = this.screenHeight < 720;
    const w = Math.min(this.screenWidth - 28, 380);
    const h = Math.min(this.screenHeight - 28, isCompact ? 530 : 590);
    const r = DESIGN_TOKENS.radii.lg;

    this.cardSurface.clear();
    this.cardSurface
      .roundRect(-w / 2, -h / 2 + DESIGN_TOKENS.shadows.cardOffset, w, h, r)
      .fill({ color: DESIGN_TOKENS.colors.navyOutline })
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill({ color: DESIGN_TOKENS.colors.creamSurface })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thick });

    const topY = -h / 2 + (isCompact ? 14 : 20);

    const badgeS = isCompact ? 32 : 38;
    const badge = new Graphics()
      .roundRect(-w / 2 + 20, topY, badgeS, badgeS, DESIGN_TOKENS.radii.sm)
      .fill({ color: 0xCDEAC0 })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thin });
    const barW = isCompact ? 3 : 3.5;
    const barH = isCompact ? 11 : 13;
    badge
      .roundRect(-w / 2 + 20 + badgeS / 2 - barW - 2, topY + (badgeS - barH) / 2, barW, barH, 1.5)
      .fill({ color: DESIGN_TOKENS.colors.navyOutline })
      .roundRect(-w / 2 + 20 + badgeS / 2 + 2, topY + (badgeS - barH) / 2, barW, barH, 1.5)
      .fill({ color: DESIGN_TOKENS.colors.navyOutline });
    this.content.addChild(badge);

    const title = new Text({
      text: 'Paused',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: isCompact ? 19 : 21,
        fill: DESIGN_TOKENS.colors.navyOutline,
        fontWeight: 'bold'
      })
    });
    title.x = -w / 2 + (isCompact ? 60 : 68);
    title.y = topY - 1;
    this.content.addChild(title);

    const sub = new Text({
      text: 'Same pens · your turn can wait',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontBody,
        fontSize: isCompact ? 11 : 12,
        fill: DESIGN_TOKENS.colors.secondaryText,
        fontWeight: '700'
      })
    });
    sub.x = -w / 2 + (isCompact ? 60 : 68);
    sub.y = topY + (isCompact ? 19 : 23);
    this.content.addChild(sub);

    const isAi = this.data.mode === 'VS_AI';
    const p1Lbl = isAi ? 'You' : 'Player 1';
    const p2Lbl = isAi ? 'Computer' : 'Player 2';

    const matchSummary = new Text({
      text: `Match ${this.data.matchNum} · ${p1Lbl} ${this.data.scores[0]} · ${p2Lbl} ${this.data.scores[1]} · First to ${this.data.winsNeeded}`,
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontBody,
        fontSize: isCompact ? 10.5 : 11.5,
        fill: DESIGN_TOKENS.colors.navyOutline,
        fontWeight: '800'
      })
    });
    matchSummary.anchor.set(0.5, 0);
    matchSummary.x = 0;
    matchSummary.y = topY + (isCompact ? 44 : 52);
    this.content.addChild(matchSummary);

    const streakSummary = new Text({
      text: `Win streaks · ${p1Lbl} ${this.data.p1Streak} · ${p2Lbl} ${this.data.p2Streak}`,
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontBody,
        fontSize: isCompact ? 10.5 : 11.5,
        fill: DESIGN_TOKENS.colors.secondaryText,
        fontWeight: '700'
      })
    });
    streakSummary.anchor.set(0.5, 0);
    streakSummary.x = 0;
    streakSummary.y = topY + (isCompact ? 59 : 69);
    this.content.addChild(streakSummary);

    const btnW = w - 40;
    const btnH = isCompact ? 37 : 44;
    const btnGap = isCompact ? 5 : 8;
    let curY = topY + (isCompact ? 80 : 96);

    const activeWood = DESK_WOOD_THEMES.find(t => t.id === themeManager.getNormalizedDeskTheme()) || DESK_WOOD_THEMES[0];

    const actions: { icon: string; label: string; bg: number; onClick: () => void }[] = [
      { icon: '▷', label: 'Resume', bg: 0xCDEAC0, onClick: () => this.emit('resume') },
      { icon: '↻', label: 'Restart match', bg: DESIGN_TOKENS.colors.creamSecondary, onClick: () => this.emit('restart') },
      { icon: '✎', label: 'Change pens', bg: DESIGN_TOKENS.colors.creamSurface, onClick: () => this.emit('change_pens') },
      {
        icon: activeWood.icon,
        label: `Desk Wood: ${activeWood.label}`,
        bg: DESIGN_TOKENS.colors.creamSurface,
        onClick: async () => {
          const curIdx = DESK_WOOD_THEMES.findIndex(t => t.id === activeWood.id);
          const nextTheme = DESK_WOOD_THEMES[(curIdx + 1) % DESK_WOOD_THEMES.length];
          await themeManager.setDeskTheme(nextTheme.id);
          setTimeout(() => this.renderModal(), 0);
        }
      },
      { icon: '⚙', label: 'Settings', bg: DESIGN_TOKENS.colors.creamSurface, onClick: () => this.emit('settings') },
      { icon: '?', label: 'How to play', bg: DESIGN_TOKENS.colors.creamSurface, onClick: () => this.emit('help') },
      { icon: '🏠', label: 'Main menu', bg: DESIGN_TOKENS.colors.creamSurface, onClick: () => this.emit('main_menu') },
    ];

    actions.forEach((act) => {
      const btn = this.createRowButton(btnW, btnH, act.icon, act.label, act.bg, () => {
        soundManager.play('ui_click');
        act.onClick();
      });
      btn.x = 0;
      btn.y = curY;
      this.content.addChild(btn);
      curY += btnH + btnGap;
    });

    const footer = new Text({
      text: 'Leaving asks you to confirm',
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontBody,
        fontSize: isCompact ? 10 : 11,
        fill: DESIGN_TOKENS.colors.secondaryText,
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

    const r = DESIGN_TOKENS.radii.sm;
    const shadow = new Graphics()
      .roundRect(-w / 2, DESIGN_TOKENS.shadows.buttonOffset, w, h, r)
      .fill({ color: DESIGN_TOKENS.colors.navyOutline });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-w / 2, 0, w, h, r)
      .fill({ color: bgColor })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thin });
    btn.addChild(surface);

    const ic = new Text({
      text: icon,
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: 15,
        fill: DESIGN_TOKENS.colors.navyOutline,
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
        fontFamily: DESIGN_TOKENS.typography.fontHeading,
        fontSize: 14,
        fill: DESIGN_TOKENS.colors.navyOutline,
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

  public destroy(): void {
    this.removeAllListeners();
    this.container.destroy({ children: true });
  }
}
