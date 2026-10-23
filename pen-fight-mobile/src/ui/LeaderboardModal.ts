/**
 * src/ui/LeaderboardModal.ts
 * Dedicated Multi-Tab Leaderboard & Match History Modal matching https://shunneklabs.app/games/pen-fight/.
 * Tabs:
 * 1. "🏆 Players" (with "This week" & "All time" filters, Rank #1-#8, Country flags, Levels, Wins, and Player's Live Row)
 * 2. "vs Computer" (Recent AI Series Match History & Win/Loss Log)
 * 3. "2 players" (Local Pass-and-Play Match History)
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { DESIGN_TOKENS } from '../config/designTokens';
import { ProgressionManager } from '../core/ProgressionManager';
import { soundManager } from '../audio/SoundAndHaptics';
import EventEmitter from 'eventemitter3';

type LeaderboardTab = 'players' | 'vs_computer' | 'two_players';
type TimeFilter = 'week' | 'all';

const GLOBAL_LEADERBOARD_WEEK = [
  { rank: 1, flag: '🇧🇩', name: 'Shagor_Pro', lv: 15, wins: 142, pen: 'Metal Pen' },
  { rank: 2, flag: '🇩🇪', name: 'Lukas_DeskKing', lv: 14, wins: 128, pen: 'Fountain Pen' },
  { rank: 3, flag: '🇺🇸', name: 'FlickMaster99', lv: 13, wins: 114, pen: 'Cheap Ballpoint' },
  { rank: 4, flag: '🇧🇩', name: 'ChattogramAce', lv: 12, wins: 98, pen: 'Click Pen' },
  { rank: 5, flag: '🇮🇳', name: 'Aarav_Spin', lv: 11, wins: 89, pen: 'Gel Pen' },
  { rank: 6, flag: '🇬🇧', name: 'PenSniperUK', lv: 10, wins: 76, pen: '4-Colour Pen' },
  { rank: 7, flag: '🇧🇷', name: 'Rafa_Turbo', lv: 9, wins: 64, pen: 'Marker' },
];

const GLOBAL_LEADERBOARD_ALL = [
  { rank: 1, flag: '🇩🇪', name: 'Lukas_DeskKing', lv: 24, wins: 842, pen: 'Fountain Pen' },
  { rank: 2, flag: '🇧🇩', name: 'Shagor_Pro', lv: 22, wins: 790, pen: 'Metal Pen' },
  { rank: 3, flag: '🇺🇸', name: 'FlickMaster99', lv: 21, wins: 715, pen: 'Cheap Ballpoint' },
  { rank: 4, flag: '🇯🇵', name: 'Kenji_ModSpin', lv: 19, wins: 640, pen: 'Click Pen' },
  { rank: 5, flag: '🇧🇩', name: 'DhakaLegend', lv: 18, wins: 588, pen: 'Highlighter' },
  { rank: 6, flag: '🇮🇳', name: 'Aarav_Spin', lv: 17, wins: 512, pen: 'Gel Pen' },
  { rank: 7, flag: '🇬🇧', name: 'PenSniperUK', lv: 16, wins: 465, pen: '4-Colour Pen' },
];

export class LeaderboardModal extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;
  private progression: ProgressionManager;

  private activeTab: LeaderboardTab = 'players';
  private timeFilter: TimeFilter = 'week';

  private backdrop: Graphics;
  private cardContainer: Container;

  constructor(
    screenWidth: number,
    screenHeight: number,
    progression: ProgressionManager
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
      .fill({ color: 0x0F172A, alpha: 0.72 });

    this.cardContainer.x = screenWidth / 2;
    this.cardContainer.y = screenHeight / 2;

    if (this.container.visible) {
      this.renderModal();
    }
  }

  private renderModal(): void {
    this.cardContainer.removeChildren();

    const w = Math.min(this.screenWidth - 24, 412);
    const h = Math.min(this.screenHeight - 28, 610);
    const r = 24;

    const shadow = new Graphics()
      .roundRect(-w / 2, -h / 2 + 6, w, h, r)
      .fill({ color: COLORS.navyShadow });
    this.cardContainer.addChild(shadow);

    const card = new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill({ color: 0xF7F3E3 })
      .stroke({ color: 0x2B333E, width: 3.4 });
    this.cardContainer.addChild(card);

    // Top Drag Handle
    card.roundRect(-22, -h / 2 + 9, 44, 4, 2).fill({ color: 0xC8BFA8 });

    // Header
    const topY = -h / 2 + 22;
    const trophyBadge = new Graphics()
      .roundRect(-w / 2 + 20, topY, 34, 34, 10)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: 0x2B333E, width: 2 });
    card.addChild(trophyBadge);

    const trophyIcon = new Text({ text: '🏆', style: new TextStyle({ fontSize: 18 }) });
    trophyIcon.anchor.set(0.5, 0.5);
    trophyIcon.x = -w / 2 + 37;
    trophyIcon.y = topY + 17;
    card.addChild(trophyIcon);

    const title = new Text({
      text: 'Leaderboard',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 22,
        fill: 0x2B333E,
        fontWeight: 'bold'
      })
    });
    title.x = -w / 2 + 64;
    title.y = topY + 3;
    card.addChild(title);

    // Close Button
    const closeBtn = new Container();
    closeBtn.x = w / 2 - 34;
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

    // 3 Top Tabs: "vs Computer", "2 players", "🏆 Players"
    const tabsY = topY + 46;
    const innerW = w - 40;
    const tabW = (innerW - 12) / 3;
    const tabs: { id: LeaderboardTab; label: string }[] = [
      { id: 'players', label: '🏆 Players' },
      { id: 'vs_computer', label: 'vs Computer' },
      { id: 'two_players', label: '2 players' },
    ];

    tabs.forEach((t, idx) => {
      const isSel = this.activeTab === t.id;
      const tx = -innerW / 2 + idx * (tabW + 6);
      const tBtn = new Container();
      tBtn.x = tx;
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
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 12,
          fill: 0x2B333E,
          fontWeight: 'bold'
        })
      });
      lbl.anchor.set(0.5, 0.5);
      lbl.x = tabW / 2;
      lbl.y = 17;
      tBtn.addChild(lbl);

      tBtn.on('pointerdown', (e) => {
        e.stopPropagation();
        soundManager.play('ui_click');
        this.activeTab = t.id;
        this.renderModal();
      });
      card.addChild(tBtn);
    });

    const contentY = tabsY + 46;

    if (this.activeTab === 'players') {
      // Time Filter Row ("This week" / "All time")
      const filterW = 105;
      const filters: { id: TimeFilter; label: string }[] = [
        { id: 'week', label: 'This week' },
        { id: 'all', label: 'All time' },
      ];
      filters.forEach((f, idx) => {
        const isSel = this.timeFilter === f.id;
        const fBtn = new Container();
        fBtn.x = -innerW / 2 + idx * (filterW + 8);
        fBtn.y = contentY;
        fBtn.eventMode = 'static';
        fBtn.cursor = 'pointer';
        fBtn.addChild(
          new Graphics()
            .roundRect(0, 0, filterW, 26, 8)
            .fill({ color: isSel ? 0x9EC5E8 : 0xEAE2CF })
            .stroke({ color: 0x2B333E, width: isSel ? 2 : 1.4 })
        );
        const fTxt = new Text({
          text: f.label,
          style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 11, fill: 0x2B333E, fontWeight: '800' })
        });
        fTxt.anchor.set(0.5, 0.5);
        fTxt.x = filterW / 2;
        fTxt.y = 13;
        fBtn.addChild(fTxt);
        fBtn.on('pointerdown', (e) => {
          e.stopPropagation();
          soundManager.play('ui_click');
          this.timeFilter = f.id;
          this.renderModal();
        });
        card.addChild(fBtn);
      });

      // Column Headers
      const colHeaderY = contentY + 34;
      const hdrLeft = new Text({
        text: 'RANK · PLAYER',
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 10, fill: 0x6E6658, fontWeight: '800', letterSpacing: 1.1 })
      });
      hdrLeft.x = -innerW / 2 + 8;
      hdrLeft.y = colHeaderY;
      card.addChild(hdrLeft);

      const hdrRight = new Text({
        text: 'LV · WINS',
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 10, fill: 0x6E6658, fontWeight: '800', letterSpacing: 1.1 })
      });
      hdrRight.anchor.set(1, 0);
      hdrRight.x = innerW / 2 - 8;
      hdrRight.y = colHeaderY;
      card.addChild(hdrRight);

      const rows = this.timeFilter === 'week' ? GLOBAL_LEADERBOARD_WEEK : GLOBAL_LEADERBOARD_ALL;
      let rowY = colHeaderY + 18;
      const rowH = 44;

      rows.forEach((r) => {
        const rowG = new Graphics()
          .roundRect(-innerW / 2, rowY, innerW, rowH, 12)
          .fill({ color: r.rank <= 3 ? 0xFFF9E6 : 0xEFE9D8 })
          .stroke({ color: 0x2B333E, width: r.rank === 1 ? 2.2 : 1.5 });
        card.addChild(rowG);

        const rankMedal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`;
        const rkTxt = new Text({
          text: rankMedal,
          style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 14, fill: 0x2B333E, fontWeight: 'bold' })
        });
        rkTxt.anchor.set(0.5, 0.5);
        rkTxt.x = -innerW / 2 + 24;
        rkTxt.y = rowY + rowH / 2;
        card.addChild(rkTxt);

        const nameTxt = new Text({
          text: `${r.flag}  ${r.name}`,
          style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 13.5, fill: 0x2B333E, fontWeight: 'bold' })
        });
        nameTxt.x = -innerW / 2 + 48;
        nameTxt.y = rowY + 7;
        card.addChild(nameTxt);

        const subPen = new Text({
          text: `Fav: ${r.pen}`,
          style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 10, fill: 0x6E6658, fontWeight: '700' })
        });
        subPen.x = -innerW / 2 + 48;
        subPen.y = rowY + 25;
        card.addChild(subPen);

        // Level Pill
        const lvPill = new Graphics()
          .roundRect(innerW / 2 - 92, rowY + 11, 38, 22, 7)
          .fill({ color: COLORS.butterYellow })
          .stroke({ color: 0x2B333E, width: 1.5 });
        card.addChild(lvPill);
        const lvTxt = new Text({
          text: `Lv${r.lv}`,
          style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 11, fill: 0x2B333E, fontWeight: 'bold' })
        });
        lvTxt.anchor.set(0.5, 0.5);
        lvTxt.x = innerW / 2 - 73;
        lvTxt.y = rowY + 22;
        card.addChild(lvTxt);

        const winTxt = new Text({
          text: `${r.wins}`,
          style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 15, fill: 0x15803D, fontWeight: 'bold' })
        });
        winTxt.anchor.set(1, 0.5);
        winTxt.x = innerW / 2 - 12;
        winTxt.y = rowY + rowH / 2;
        card.addChild(winTxt);

        rowY += rowH + 6;
      });

      // Player's Own Live Standing Footer Bar
      const myStats = this.progression.getStats();
      const myFooter = new Graphics()
        .roundRect(-innerW / 2, h / 2 - 58, innerW, 42, 12)
        .fill({ color: 0xDCECD0 })
        .stroke({ color: 0x2B333E, width: 2.2 });
      card.addChild(myFooter);

      const myText = new Text({
        text: `🇧🇩 You (Local Device)  ·  ${myStats.wins} Wins (${myStats.winRate}% Win Rate)`,
        style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 12.5, fill: 0x2B333E, fontWeight: 'bold' })
      });
      myText.anchor.set(0.5, 0.5);
      myText.x = 0;
      myText.y = h / 2 - 37;
      card.addChild(myText);
    } else {
      // "vs Computer" or "2 players" Match History View
      const myStats = this.progression.getStats();
      const summaryBox = new Graphics()
        .roundRect(-innerW / 2, contentY, innerW, 110, 16)
        .fill({ color: 0xEFE9D8 })
        .stroke({ color: 0x2B333E, width: 2 });
      card.addChild(summaryBox);

      const modeTitle = new Text({
        text: this.activeTab === 'vs_computer' ? '🤖 vs Computer Series Record' : '👥 2-Player Local Pass & Play',
        style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 16, fill: 0x2B333E, fontWeight: 'bold' })
      });
      modeTitle.anchor.set(0.5, 0);
      modeTitle.y = contentY + 14;
      card.addChild(modeTitle);

      const statLine = new Text({
        text: `Matches: ${myStats.matches}   ·   Wins: ${myStats.wins}   ·   Best Streak: ${myStats.bestStreak} 🔥`,
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 13, fill: 0x2B333E, fontWeight: '800' })
      });
      statLine.anchor.set(0.5, 0);
      statLine.y = contentY + 46;
      card.addChild(statLine);

      const subNote = new Text({
        text: 'Your finished series and pen XP milestones are saved on this device.',
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 11, fill: 0x6E6658, fontWeight: '700' })
      });
      subNote.anchor.set(0.5, 0);
      subNote.y = contentY + 76;
      card.addChild(subNote);
    }
  }

  public destroy(): void {
    this.removeAllListeners();
    this.container.destroy({ children: true });
  }
}
