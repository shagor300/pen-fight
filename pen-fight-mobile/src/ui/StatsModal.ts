/**
 * src/ui/StatsModal.ts
 * Statistics screen: real recorded data only (no placeholders, no "world"
 * numbers). Overview tab = matches, wins, win rate, PEN earned/spent, favorite
 * pen. Pen Mastery tab = level and XP per pen.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import EventEmitter from 'eventemitter3';
import { DESIGN_TOKENS } from '../config/designTokens';
import { PENS_ROSTER } from '../config/pensConfig';
import { formatPen } from '../economy/EconomyEngine';
import { getEconomy } from '../economy/EconomyStorage';
import type { ProgressionManager } from '../core/ProgressionManager';
import { SegmentedControl } from './components/SegmentedControl';
import { ScreenScaffold } from './components/ScreenScaffold';

type Tab = 'overview' | 'mastery';

export class StatsModal extends EventEmitter {
  public container: Container;
  private scaffold: ScreenScaffold;
  private progression: ProgressionManager;
  private tab: Tab = 'overview';
  private w: number;
  private h: number;

  constructor(screenWidth: number, screenHeight: number, progression: ProgressionManager) {
    super();
    this.w = screenWidth;
    this.h = screenHeight;
    this.progression = progression;
    this.scaffold = new ScreenScaffold({ title: 'Statistics', onBack: () => this.hide() });
    this.container = this.scaffold.container;
    this.layout(screenWidth, screenHeight);
  }

  public show(): void {
    this.scaffold.show();
    this.render();
  }

  public hide(): void {
    this.scaffold.hide();
  }

  public layout(screenWidth: number, screenHeight: number): void {
    this.w = screenWidth;
    this.h = screenHeight;
    this.scaffold.layout(screenWidth, screenHeight);
    if (this.scaffold.visible) this.render();
  }

  private render(): void {
    const S = DESIGN_TOKENS.space;
    const sc = this.scaffold;
    const body = sc.body;
    body.removeChildren().forEach((c) => c.destroy({ children: true }));

    const contentW = Math.min(this.w - 2 * sc.inset, 420);
    const x0 = (this.w - contentW) / 2;
    let y = sc.contentTop;

    const seg = new SegmentedControl({
      width: contentW,
      height: DESIGN_TOKENS.touch.min - 4,
      items: [
        { id: 'overview', label: 'Overview' },
        { id: 'mastery', label: 'Pen Mastery' },
      ],
      initialSelectedId: this.tab,
      onChange: (id) => {
        this.tab = id as Tab;
        setTimeout(() => {
          if (this.scaffold.visible) this.render();
        }, 0);
      },
    });
    seg.x = this.w / 2;
    seg.y = y + (DESIGN_TOKENS.touch.min - 4) / 2;
    body.addChild(seg);
    y += DESIGN_TOKENS.touch.min + S.s8;

    if (this.tab === 'overview') this.renderOverview(body, x0, y, contentW);
    else this.renderMastery(body, x0, y, contentW);
  }

  private card(parent: Container, x: number, y: number, w: number, h: number, fill = DESIGN_TOKENS.colors.creamSurface): void {
    parent.addChild(
      new Graphics()
        .roundRect(x, y + 3, w, h, DESIGN_TOKENS.radii.md).fill({ color: DESIGN_TOKENS.colors.navyShadow })
        .roundRect(x, y, w, h, DESIGN_TOKENS.radii.md)
        .fill({ color: fill })
        .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular }),
    );
  }

  private txt(parent: Container, text: string, x: number, y: number, size: number, fill: number, family: string, anchorX = 0, weight: 'bold' | '700' | '800' = 'bold'): Text {
    const t = new Text({ text, style: new TextStyle({ fontFamily: family, fontSize: size, fill, fontWeight: weight }) });
    t.anchor.set(anchorX, 0);
    t.x = x;
    t.y = y;
    parent.addChild(t);
    return t;
  }

  private renderOverview(body: Container, x0: number, y0: number, contentW: number): void {
    const eco = getEconomy();
    const st = eco.getStats();
    const S = DESIGN_TOKENS.space;
    const heading = DESIGN_TOKENS.type.headline.family;
    const bodyFont = DESIGN_TOKENS.type.bodySmall.family;
    let y = y0;

    const decided = st.wins + st.losses;
    const winRate = decided > 0 ? Math.round((st.wins / decided) * 100) : 0;
    const kpis: { label: string; value: string }[] = [
      { label: 'Matches', value: formatPen(st.matches) },
      { label: 'Wins', value: formatPen(st.wins) },
      { label: 'Losses', value: formatPen(st.losses) },
      { label: 'Win rate', value: decided > 0 ? `${winRate}%` : '–' },
      { label: 'PEN earned', value: formatPen(st.penEarned) },
      { label: 'PEN spent', value: formatPen(st.penSpent) },
    ];
    const gap = S.s8;
    const kw = (contentW - 2 * gap) / 3;
    const kh = 62;
    kpis.forEach((k, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const kx = x0 + col * (kw + gap);
      const ky = y + row * (kh + gap);
      this.card(body, kx, ky, kw, kh);
      this.txt(body, k.value, kx + kw / 2, ky + 10, 19, DESIGN_TOKENS.colors.textPrimary, heading, 0.5);
      this.txt(body, k.label, kx + kw / 2, ky + 38, 11, DESIGN_TOKENS.colors.textSecondary, bodyFont, 0.5, '800');
    });
    y += 2 * (kh + gap) + S.s4;

    // Win / loss split
    const barCardH = 74;
    this.card(body, x0, y, contentW, barCardH);
    this.txt(body, 'WIN / LOSS', x0 + S.s12, y + S.s8, 10.5, DESIGN_TOKENS.colors.textSecondary, bodyFont, 0, '800');
    if (decided === 0) {
      this.txt(body, 'No matches yet. Play a VS Computer match to start your record.', x0 + S.s12, y + 32, 12, DESIGN_TOKENS.colors.textSecondary, bodyFont, 0, '700');
    } else {
      const bw = contentW - 2 * S.s12;
      const bar = new Graphics().roundRect(x0 + S.s12, y + 28, bw, 16, 8).fill({ color: 0xF2B8B5 });
      if (st.wins > 0) bar.roundRect(x0 + S.s12, y + 28, Math.max(16, (st.wins / decided) * bw), 16, 8).fill({ color: 0x8FD9A8 });
      bar.roundRect(x0 + S.s12, y + 28, bw, 16, 8).stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thin });
      body.addChild(bar);
      this.txt(body, `Won ${winRate}% (${st.wins})  ·  Lost ${100 - winRate}% (${st.losses})`, x0 + S.s12, y + 50, 12, DESIGN_TOKENS.colors.textPrimary, bodyFont, 0, '800');
    }
    y += barCardH + S.s12;

    // Favorite pen + streak
    const favId = eco.getFavoritePenId();
    const fav = PENS_ROSTER.find((p) => p.id === favId);
    const rowH = 54;
    this.card(body, x0, y, contentW, rowH);
    this.txt(body, 'Favorite pen', x0 + S.s12, y + 8, 11, DESIGN_TOKENS.colors.textSecondary, bodyFont, 0, '800');
    this.txt(body, fav ? fav.name : 'None yet', x0 + S.s12, y + 26, 16, DESIGN_TOKENS.colors.textPrimary, heading);
    this.txt(body, `Best streak ${st.bestStreak} 🔥`, x0 + contentW - S.s12, y + 19, 14, DESIGN_TOKENS.colors.textPrimary, heading, 1);
  }

  private renderMastery(body: Container, x0: number, y0: number, contentW: number): void {
    const S = DESIGN_TOKENS.space;
    const gap = S.s8;
    const cols = 2;
    const cw = (contentW - gap) / cols;
    const avail = this.scaffold.contentBottom - y0;
    const rows = Math.ceil(PENS_ROSTER.length / cols);
    const ch = Math.max(56, Math.min(84, Math.floor((avail - (rows - 1) * gap - 24) / rows)));

    PENS_ROSTER.forEach((pen, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = x0 + col * (cw + gap);
      const y = y0 + row * (ch + gap);
      const prog = this.progression.getProgress(pen.id);
      const next = this.progression.getXPForNextLevel(pen.id);
      this.card(body, x, y, cw, ch);

      // Colour swatch from the pen's own palette
      const sw = new Graphics()
        .roundRect(x + S.s8, y + S.s8, 8, ch - 2 * S.s8, 4)
        .fill({ color: parseInt(pen.colors.primary.replace('#', ''), 16) || DESIGN_TOKENS.colors.premiumGold });
      body.addChild(sw);

      this.txt(body, pen.name, x + 24, y + 8, 12.5, DESIGN_TOKENS.colors.textPrimary, DESIGN_TOKENS.type.title.family);
      this.txt(body, prog.level >= 5 ? 'Lv.5 MAX' : `Lv.${prog.level}`, x + 24, y + 26, 12, prog.level >= 5 ? DESIGN_TOKENS.semantic.success : DESIGN_TOKENS.colors.textSecondary, DESIGN_TOKENS.type.label.family, 0, '800');

      const bx = x + 24;
      const bw = cw - 24 - S.s8;
      const by = y + ch - 20;
      const bar = new Graphics().roundRect(bx, by, bw, 10, 5).fill({ color: DESIGN_TOKENS.colors.creamMuted });
      const fw = Math.max(0, Math.min(1, next.ratio)) * bw;
      if (fw > 0) bar.roundRect(bx, by, Math.max(10, fw), 10, 5).fill({ color: DESIGN_TOKENS.colors.premiumGold });
      bar.roundRect(bx, by, bw, 10, 5).stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thin });
      body.addChild(bar);
    });

    const note = this.txt(body, 'Mastery XP is earned per pen from finished matches.', this.w / 2, y0 + rows * (ch + gap) + 2, 11, DESIGN_TOKENS.colors.textOnDark, DESIGN_TOKENS.type.bodySmall.family, 0.5, '700');
    note.alpha = 0.9;
  }

  public destroy(): void {
    this.removeAllListeners();
    this.container.destroy({ children: true });
  }
}
