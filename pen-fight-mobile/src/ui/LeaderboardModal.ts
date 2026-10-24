/**
 * src/ui/LeaderboardModal.ts
 * Honest LOCAL leaderboard: your own records and recent results on this
 * device. There is no online player data in this build, so none is shown.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import EventEmitter from 'eventemitter3';
import { DESIGN_TOKENS } from '../config/designTokens';
import { ECONOMY_CONFIG } from '../config/economyConfig';
import { PENS_ROSTER } from '../config/pensConfig';
import { formatPen, type MatchRecord } from '../economy/EconomyEngine';
import { getEconomy } from '../economy/EconomyStorage';
import { ScreenScaffold } from './components/ScreenScaffold';

const TIER_ICON: Record<string, string> = { practice: '🎯', bronze: '🥉', silver: '🥈', gold: '🥇' };

export class LeaderboardModal extends EventEmitter {
  public container: Container;
  private scaffold: ScreenScaffold;
  private w: number;
  private h: number;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.w = screenWidth;
    this.h = screenHeight;
    this.scaffold = new ScreenScaffold({ title: 'Leaderboard', onBack: () => this.hide() });
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
    const eco = getEconomy();
    const S = DESIGN_TOKENS.space;
    const sc = this.scaffold;
    const body = sc.body;
    body.removeChildren().forEach((c) => c.destroy({ children: true }));

    const contentW = Math.min(this.w - 2 * sc.inset, 420);
    const x0 = (this.w - contentW) / 2;
    let y = sc.contentTop;
    const st = eco.getStats();
    const acct = eco.getAccountProgress();

    // Scope label: say plainly what this is
    const scope = new Text({
      text: 'THIS DEVICE ONLY · NO ONLINE PLAYERS',
      style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.label.family, fontSize: 11, fill: DESIGN_TOKENS.colors.textOnDark, fontWeight: '800', letterSpacing: 1 }),
    });
    scope.anchor.set(0.5, 0);
    scope.x = this.w / 2;
    scope.y = y - S.s8;
    body.addChild(scope);
    y += S.s12;

    // Your record
    const recH = 84;
    body.addChild(
      new Graphics()
        .roundRect(x0, y + 3, contentW, recH, DESIGN_TOKENS.radii.md).fill({ color: DESIGN_TOKENS.colors.navyShadow })
        .roundRect(x0, y, contentW, recH, DESIGN_TOKENS.radii.md)
        .fill({ color: DESIGN_TOKENS.colors.deepNavy })
        .stroke({ color: DESIGN_TOKENS.semantic.pen, width: DESIGN_TOKENS.borders.thick }),
    );
    const decided = st.wins + st.losses;
    const cells: [string, string][] = [
      ['Level', `${acct.level}`],
      ['Wins', formatPen(st.wins)],
      ['Win rate', decided > 0 ? `${Math.round((st.wins / decided) * 100)}%` : '–'],
      ['Best streak', `${st.bestStreak}`],
    ];
    const cw = contentW / cells.length;
    cells.forEach(([label, value], i) => {
      const cx = x0 + cw * i + cw / 2;
      const v = new Text({ text: value, style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.headline.family, fontSize: 22, fill: DESIGN_TOKENS.semantic.pen, fontWeight: 'bold' }) });
      v.anchor.set(0.5, 0);
      v.x = cx;
      v.y = y + 16;
      const l = new Text({ text: label, style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.bodySmall.family, fontSize: 11, fill: DESIGN_TOKENS.colors.textOnDark, fontWeight: '800' }) });
      l.anchor.set(0.5, 0);
      l.x = cx;
      l.y = y + 50;
      body.addChild(v, l);
    });
    y += recH + S.s16;

    // Recent matches
    const head = new Text({
      text: 'RECENT MATCHES',
      style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.label.family, fontSize: 11, fill: DESIGN_TOKENS.colors.textOnDark, fontWeight: '800', letterSpacing: 1.2 }),
    });
    head.x = x0;
    head.y = y;
    body.addChild(head);
    y += S.s16 + S.s4;

    const recent = eco.getRecentMatches(12);
    if (recent.length === 0) {
      this.renderEmpty(body, x0, y, contentW);
      return;
    }
    const rowH = 52;
    const gap = S.s8;
    const maxRows = Math.max(1, Math.floor((sc.contentBottom - y + gap) / (rowH + gap)));
    recent.slice(0, maxRows).forEach((m) => {
      this.renderRow(body, m, x0, y, contentW, rowH);
      y += rowH + gap;
    });
  }

  private renderRow(body: Container, m: MatchRecord, x: number, y: number, w: number, h: number): void {
    const S = DESIGN_TOKENS.space;
    const outcome = m.outcome === 'win' ? 'W' : m.outcome === 'draw' ? 'D' : 'L';
    const color = m.outcome === 'win' ? DESIGN_TOKENS.semantic.success : m.outcome === 'draw' ? DESIGN_TOKENS.colors.textSecondary : DESIGN_TOKENS.semantic.danger;
    body.addChild(
      new Graphics()
        .roundRect(x, y + 3, w, h, DESIGN_TOKENS.radii.md).fill({ color: DESIGN_TOKENS.colors.navyShadow })
        .roundRect(x, y, w, h, DESIGN_TOKENS.radii.md)
        .fill({ color: DESIGN_TOKENS.colors.creamSurface })
        .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular }),
    );
    const badge = new Graphics().circle(x + S.s12 + 14, y + h / 2, 14).fill({ color });
    body.addChild(badge);
    const bt = new Text({ text: outcome, style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.title.family, fontSize: 15, fill: 0xFFFFFF, fontWeight: 'bold' }) });
    bt.anchor.set(0.5, 0.5);
    bt.x = x + S.s12 + 14;
    bt.y = y + h / 2;
    body.addChild(bt);

    const pen = PENS_ROSTER.find((p) => p.id === m.penId);
    const who = m.mode === 'VS_AI' ? `vs Computer · ${m.difficulty}` : 'Local duel';
    const t1 = new Text({ text: `${TIER_ICON[m.tier] ?? ''} ${pen ? pen.name : 'Pen'}`, style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.title.family, fontSize: 14, fill: DESIGN_TOKENS.colors.textPrimary, fontWeight: 'bold' }) });
    t1.x = x + S.s12 + 36;
    t1.y = y + 8;
    const t2 = new Text({ text: m.forfeited ? `${who} · forfeited` : who, style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.bodySmall.family, fontSize: 11.5, fill: DESIGN_TOKENS.colors.textSecondary, fontWeight: '700' }) });
    t2.x = x + S.s12 + 36;
    t2.y = y + 28;
    body.addChild(t1, t2);

    if (m.entryFee > 0 || m.bonusPen > 0) {
      const net = m.netPen + m.bonusPen;
      const nt = new Text({
        text: `${net > 0 ? '+' : net < 0 ? '−' : ''}${formatPen(Math.abs(net))} PEN`,
        style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.currency.family, fontSize: 14, fill: net >= 0 ? DESIGN_TOKENS.semantic.success : DESIGN_TOKENS.semantic.danger, fontWeight: 'bold' }),
      });
      nt.anchor.set(1, 0.5);
      nt.x = x + w - S.s12;
      nt.y = y + h / 2;
      body.addChild(nt);
    }
  }

  private renderEmpty(body: Container, x: number, y: number, w: number): void {
    const h = 150;
    body.addChild(
      new Graphics()
        .roundRect(x, y + 3, w, h, DESIGN_TOKENS.radii.lg).fill({ color: DESIGN_TOKENS.colors.navyShadow })
        .roundRect(x, y, w, h, DESIGN_TOKENS.radii.lg)
        .fill({ color: DESIGN_TOKENS.colors.creamSurface })
        .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular }),
    );
    const icon = new Text({ text: '🏆', style: new TextStyle({ fontSize: 34 }) });
    icon.anchor.set(0.5, 0);
    icon.x = x + w / 2;
    icon.y = y + 16;
    const t = new Text({ text: 'No matches yet', style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.headline.family, fontSize: 18, fill: DESIGN_TOKENS.colors.textPrimary, fontWeight: 'bold' }) });
    t.anchor.set(0.5, 0);
    t.x = x + w / 2;
    t.y = y + 66;
    const s = new Text({
      text: `Finish a match and it shows up here. Daily PEN resets follow ${ECONOMY_CONFIG.timezone} time.`,
      style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.bodySmall.family, fontSize: 12, fill: DESIGN_TOKENS.colors.textSecondary, fontWeight: '700', align: 'center', wordWrap: true, wordWrapWidth: w - 40 }),
    });
    s.anchor.set(0.5, 0);
    s.x = x + w / 2;
    s.y = y + 96;
    body.addChild(icon, t, s);
  }

  public destroy(): void {
    this.removeAllListeners();
    this.container.destroy({ children: true });
  }
}
