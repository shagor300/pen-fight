/**
 * src/ui/StatsModal.ts
 * Professional Career Analytics & Global Community Charts Modal
 * matching https://shunneklabs.app/games/pen-fight/ ("Me" and "World" tabs).
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { DESIGN_TOKENS } from '../config/designTokens';
import { ProgressionManager } from '../core/ProgressionManager';
import { PENS_ROSTER } from '../config/pensConfig';
import { soundManager } from '../audio/SoundAndHaptics';
import EventEmitter from 'eventemitter3';

type StatsTab = 'me' | 'world';

export class StatsModal extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;
  private progression: ProgressionManager;
  private activeTab: StatsTab = 'me';

  private backdrop: Graphics;
  private cardContainer: Container;

  constructor(
    screenWidth: number,
    screenHeight: number,
    progression: ProgressionManager,
  ) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.progression = progression;

    this.container = new Container();
    this.container.visible = false;

    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.backdrop.on('pointerdown', () => this.hide());
    this.container.addChild(this.backdrop);

    this.cardContainer = new Container();
    this.cardContainer.eventMode = 'static';
    this.cardContainer.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(this.cardContainer);

    this.layout();
  }

  public show(): void {
    this.container.visible = true;
    this.renderStats();
  }

  public hide(): void {
    this.container.visible = false;
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.backdrop.clear()
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: 0x0F172A, alpha: 0.72 });

    this.cardContainer.x = screenWidth / 2;
    this.cardContainer.y = screenHeight / 2;

    if (this.container.visible) {
      this.renderStats();
    }
  }

  private renderStats(): void {
    this.cardContainer.removeChildren();

    const stats = this.progression.getStats();
    const cardW = Math.min(this.screenWidth - 24, 412);
    const cardH = Math.min(this.screenHeight - 28, 610);
    const r = 24;

    const shadow = new Graphics()
      .roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, r)
      .fill({ color: COLORS.navyShadow });
    this.cardContainer.addChild(shadow);

    const card = new Graphics()
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, r)
      .fill({ color: 0xF7F3E3 })
      .stroke({ color: 0x2B333E, width: 3.4 });
    this.cardContainer.addChild(card);

    card.roundRect(-22, -cardH / 2 + 9, 44, 4, 2).fill({ color: 0xC8BFA8 });

    const topY = -cardH / 2 + 22;
    const iconBadge = new Graphics()
      .roundRect(-cardW / 2 + 20, topY, 34, 34, 10)
      .fill({ color: 0x9EC5E8 })
      .stroke({ color: 0x2B333E, width: 2 });
    card.addChild(iconBadge);

    const chartIcon = new Text({ text: '📊', style: new TextStyle({ fontSize: 18 }) });
    chartIcon.anchor.set(0.5, 0.5);
    chartIcon.x = -cardW / 2 + 37;
    chartIcon.y = topY + 17;
    card.addChild(chartIcon);

    const title = new Text({
      text: 'Stats & Charts',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 22,
        fill: 0x2B333E,
        fontWeight: 'bold',
      })
    });
    title.x = -cardW / 2 + 64;
    title.y = topY + 3;
    card.addChild(title);

    // Close Button
    const closeBtn = new Container();
    closeBtn.x = cardW / 2 - 34;
    closeBtn.y = topY + 17;
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.addChild(
      new Graphics()
        .roundRect(-16, -16, 32, 32, 10)
        .fill({ color: 0xEAE2CF })
        .stroke({ color: 0x2B333E, width: 2 })
    );
    const closeTxt = new Text({
      text: '✕',
      style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 14, fill: 0x2B333E, fontWeight: 'bold' })
    });
    closeTxt.anchor.set(0.5, 0.5);
    closeBtn.addChild(closeTxt);
    closeBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      this.hide();
    });
    card.addChild(closeBtn);

    // 2 Tabs: "👤 Me (Career)" and "🌍 World Stats"
    const innerW = cardW - 40;
    const tabW = (innerW - 8) / 2;
    const tabsY = topY + 46;

    const tabs: { id: StatsTab; label: string }[] = [
      { id: 'me', label: '👤 Me (My Career)' },
      { id: 'world', label: '🌍 World Charts' },
    ];

    tabs.forEach((t, idx) => {
      const isSel = this.activeTab === t.id;
      const tBtn = new Container();
      tBtn.x = -innerW / 2 + idx * (tabW + 8);
      tBtn.y = tabsY;
      tBtn.eventMode = 'static';
      tBtn.cursor = 'pointer';
      tBtn.addChild(
        new Graphics()
          .roundRect(0, 0, tabW, 34, 10)
          .fill({ color: isSel ? COLORS.butterYellow : 0xEAE2CF })
          .stroke({ color: 0x2B333E, width: isSel ? 2.4 : 1.6 })
      );
      const lbl = new Text({
        text: t.label,
        style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 12.5, fill: 0x2B333E, fontWeight: 'bold' })
      });
      lbl.anchor.set(0.5, 0.5);
      lbl.x = tabW / 2;
      lbl.y = 17;
      tBtn.addChild(lbl);
      tBtn.on('pointerdown', (e) => {
        e.stopPropagation();
        soundManager.play('ui_click');
        this.activeTab = t.id;
        this.renderStats();
      });
      card.addChild(tBtn);
    });

    const contentY = tabsY + 46;

    if (this.activeTab === 'me') {
      // 4 KPI Cards
      const items = [
        { label: 'Played Matches', val: `${stats.matches}`, bg: 0xFFF8E1 },
        { label: 'Win Rate', val: `${stats.winRate}%`, bg: 0xE8F5E9 },
        { label: 'Total Wins', val: `${stats.wins}`, bg: 0xE3F2FD },
        { label: 'Best Streak', val: `${stats.bestStreak} 🔥`, bg: 0xFBE9E7 },
      ];

      const itemW = (innerW - 10) / 2;
      const itemH = 64;
      items.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = -innerW / 2 + col * (itemW + 10);
        const by = contentY + row * (itemH + 8);

        card.addChild(
          new Graphics()
            .roundRect(bx, by, itemW, itemH, 12)
            .fill({ color: item.bg })
            .stroke({ color: 0x2B333E, width: 2 })
        );

        const valText = new Text({
          text: item.val,
          style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 20, fill: 0x2B333E, fontWeight: 'bold' })
        });
        valText.anchor.set(0.5, 0);
        valText.x = bx + itemW / 2;
        valText.y = by + 8;
        card.addChild(valText);

        const lblText = new Text({
          text: item.label,
          style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 11, fill: 0x6E6658, fontWeight: '800' })
        });
        lblText.anchor.set(0.5, 0);
        lblText.x = bx + itemW / 2;
        lblText.y = by + 38;
        card.addChild(lblText);
      });

      // Win / Loss Split Horizontal Chart Bar
      const chartY = contentY + 150;
      const chartTitle = new Text({
        text: 'WIN / LOSS DISTRIBUTION CHART',
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 10.5, fill: 0x6E6658, fontWeight: '800', letterSpacing: 1.2 })
      });
      chartTitle.x = -innerW / 2;
      chartTitle.y = chartY;
      card.addChild(chartTitle);

      const barH = 22;
      const winW = Math.max(24, Math.round((stats.winRate / 100) * innerW));
      const barG = new Graphics()
        .roundRect(-innerW / 2, chartY + 18, innerW, barH, 8)
        .fill({ color: 0xFCA5A5 })
        .roundRect(-innerW / 2, chartY + 18, winW, barH, 8)
        .fill({ color: 0x86EFAC })
        .roundRect(-innerW / 2, chartY + 18, innerW, barH, 8)
        .stroke({ color: 0x2B333E, width: 2 });
      card.addChild(barG);

      const splitLbl = new Text({
        text: `Won ${stats.winRate}% (${stats.wins})  ·  Lost ${100 - stats.winRate}% (${stats.losses})`,
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 11, fill: 0x2B333E, fontWeight: '800' })
      });
      splitLbl.anchor.set(0.5, 0);
      splitLbl.y = chartY + 44;
      card.addChild(splitLbl);

      // Pen Mastery & XP Breakdown Chart (Top 4 Pens)
      const penChartY = chartY + 72;
      const penHdr = new Text({
        text: 'PEN MASTERY & XP PROGRESS',
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 10.5, fill: 0x6E6658, fontWeight: '800', letterSpacing: 1.2 })
      });
      penHdr.x = -innerW / 2;
      penHdr.y = penChartY;
      card.addChild(penHdr);

      PENS_ROSTER.slice(0, 4).forEach((pen, idx) => {
        const py = penChartY + 20 + idx * 42;
        const prog = this.progression.getProgress(pen.id);
        const nextInfo = this.progression.getXPForNextLevel(pen.id);

        card.addChild(
          new Graphics()
            .roundRect(-innerW / 2, py, innerW, 36, 10)
            .fill({ color: 0xEFE9D8 })
            .stroke({ color: 0x2B333E, width: 1.5 })
        );

        const pName = new Text({
          text: `${pen.name} (Lv${prog.level})`,
          style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 12.5, fill: 0x2B333E, fontWeight: 'bold' })
        });
        pName.x = -innerW / 2 + 12;
        pName.y = py + 9;
        card.addChild(pName);

        const pBarW = 130;
        const pBarX = innerW / 2 - pBarW - 12;
        const fillW = Math.max(10, Math.round(pBarW * Math.min(1, Math.max(0.12, nextInfo.ratio))));
        card.addChild(
          new Graphics()
            .roundRect(pBarX, py + 12, pBarW, 12, 6)
            .fill({ color: 0xD5CBB8 })
            .roundRect(pBarX, py + 12, fillW, 12, 6)
            .fill({ color: COLORS.butterYellow })
            .roundRect(pBarX, py + 12, pBarW, 12, 6)
            .stroke({ color: 0x2B333E, width: 1.4 })
        );
      });
    } else {
      // WORLD STATS TAB (Verified from https://shunneklabs.app/games/pen-fight/)
      const worldKpis = [
        { label: 'Players', val: '26.5k' },
        { label: 'Matches', val: '268k' },
        { label: 'Hours Played', val: '5,074h' },
      ];
      const kw = (innerW - 12) / 3;
      worldKpis.forEach((k, idx) => {
        const kx = -innerW / 2 + idx * (kw + 6);
        card.addChild(
          new Graphics()
            .roundRect(kx, contentY, kw, 62, 12)
            .fill({ color: 0xEFE9D8 })
            .stroke({ color: 0x2B333E, width: 2 })
        );
        const vTxt = new Text({
          text: k.val,
          style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 19, fill: 0x2B333E, fontWeight: 'bold' })
        });
        vTxt.anchor.set(0.5, 0);
        vTxt.x = kx + kw / 2;
        vTxt.y = contentY + 10;
        card.addChild(vTxt);

        const lTxt = new Text({
          text: k.label,
          style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 10.5, fill: 0x6E6658, fontWeight: '800' })
        });
        lTxt.anchor.set(0.5, 0);
        lTxt.x = kx + kw / 2;
        lTxt.y = contentY + 38;
        card.addChild(lTxt);
      });

      // Worldwide vs Computer Split
      const wwY = contentY + 80;
      const wwHdr = new Text({
        text: 'VS COMPUTER WORLDWIDE (PLAYERS 57% · AI 40% · DRAWS 3%)',
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 10, fill: 0x6E6658, fontWeight: '800', letterSpacing: 1 })
      });
      wwHdr.x = -innerW / 2;
      wwHdr.y = wwY;
      card.addChild(wwHdr);

      const pW = Math.round(innerW * 0.57);
      const cW = Math.round(innerW * 0.40);
      card.addChild(
        new Graphics()
          .roundRect(-innerW / 2, wwY + 18, innerW, 24, 8)
          .fill({ color: 0xCBD5E1 })
          .roundRect(-innerW / 2, wwY + 18, pW + cW, 24, 8)
          .fill({ color: 0x9EC5E8 })
          .roundRect(-innerW / 2, wwY + 18, pW, 24, 8)
          .fill({ color: 0x86EFAC })
          .roundRect(-innerW / 2, wwY + 18, innerW, 24, 8)
          .stroke({ color: 0x2B333E, width: 2 })
      );

      // By Difficulty Breakdown Bars (Easy 78% · Normal 61% · Hard 49%)
      const diffY = wwY + 62;
      const diffHdr = new Text({
        text: 'WIN RATE BY AI DIFFICULTY (WON · LOST · DRAWS)',
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 10, fill: 0x6E6658, fontWeight: '800', letterSpacing: 1 })
      });
      diffHdr.x = -innerW / 2;
      diffHdr.y = diffY;
      card.addChild(diffHdr);

      const levels = [
        { name: 'Easy AI', won: 78, lost: 19, draw: 3, col: 0x86EFAC },
        { name: 'Normal AI', won: 61, lost: 36, draw: 3, col: 0xFAD24B },
        { name: 'Hard AI', won: 49, lost: 48, draw: 3, col: 0xFDBA74 },
      ];

      levels.forEach((lv, idx) => {
        const ly = diffY + 22 + idx * 62;
        const lbl = new Text({
          text: `${lv.name}   —   ${lv.won}% Won  ·  ${lv.lost}% Lost  ·  ${lv.draw}% Draw`,
          style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 12.5, fill: 0x2B333E, fontWeight: 'bold' })
        });
        lbl.x = -innerW / 2;
        lbl.y = ly;
        card.addChild(lbl);

        const wPx = Math.round((lv.won / 100) * innerW);
        card.addChild(
          new Graphics()
            .roundRect(-innerW / 2, ly + 22, innerW, 18, 7)
            .fill({ color: 0xE2DAC9 })
            .roundRect(-innerW / 2, ly + 22, wPx, 18, 7)
            .fill({ color: lv.col })
            .roundRect(-innerW / 2, ly + 22, innerW, 18, 7)
            .stroke({ color: 0x2B333E, width: 1.8 })
        );
      });
    }
  }

  public destroy(): void {
    this.removeAllListeners();
    this.container.destroy({ children: true });
  }
}
