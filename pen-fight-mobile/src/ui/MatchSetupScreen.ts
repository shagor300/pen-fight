/**
 * src/ui/MatchSetupScreen.ts
 * Full-screen "Choose Match" step for VS Computer: Practice / Bronze / Silver /
 * Gold. Shows the exact fee, balance after the fee, payout and what a loss or
 * draw means BEFORE anything is charged. Nothing is deducted by opening or
 * browsing this screen; the fee is taken only when Start is tapped.
 *
 * Events: 'back', 'confirm' (tier), 'open_missions'.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import EventEmitter from 'eventemitter3';
import { DESIGN_TOKENS } from '../config/designTokens';
import { ECONOMY_CONFIG, type AIDifficultyId, type MatchTierId } from '../config/economyConfig';
import { formatPen, type GameModeId } from '../economy/EconomyEngine';
import { getEconomy } from '../economy/EconomyStorage';
import { soundManager } from '../audio/SoundAndHaptics';
import { GameButton } from './components/GameButton';
import { ScreenScaffold } from './components/ScreenScaffold';
import { drawPenNib } from './components/PenChip';

export interface MatchSetupContext {
  mode: GameModeId;
  difficulty: AIDifficultyId;
  /** Endless series cannot be played for PEN. */
  endless: boolean;
  preselect?: MatchTierId;
}

const TIER_ORDER: MatchTierId[] = ['practice', 'bronze', 'silver', 'gold'];
const TIER_ICON: Record<MatchTierId, string> = { practice: '🎯', bronze: '🥉', silver: '🥈', gold: '🥇' };
const TIER_COLOR: Record<MatchTierId, number> = {
  practice: 0x9CA9B8,
  bronze: 0xC8793B,
  silver: 0xBBC4CE,
  gold: 0xFFC94A,
};

export class MatchSetupScreen extends EventEmitter {
  public container: Container;
  private scaffold: ScreenScaffold;
  private ctx: MatchSetupContext = { mode: 'VS_AI', difficulty: 'normal', endless: false };
  private selected: MatchTierId = 'practice';
  private w: number;
  private h: number;
  private unsub: (() => void) | null = null;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.w = screenWidth;
    this.h = screenHeight;
    this.scaffold = new ScreenScaffold({
      title: 'Choose Match',
      onBack: () => this.emit('back'),
      onChipTap: () => this.emit('open_missions'),
    });
    this.container = this.scaffold.container;
    this.layout(screenWidth, screenHeight);
  }

  public get isOpen(): boolean {
    return this.scaffold.visible;
  }

  public show(ctx: MatchSetupContext): void {
    this.ctx = ctx;
    const eco = getEconomy();
    // Default to the highest tier the player can afford, never above Silver.
    let pick: MatchTierId = ctx.preselect ?? 'practice';
    if (pick !== 'practice' && (ctx.endless || !eco.previewEntry(pick, ctx.mode, ctx.difficulty).affordable)) {
      pick = 'practice';
    }
    this.selected = pick;
    this.scaffold.show();
    this.unsub?.();
    // Re-render after the current touch event finishes (never destroy a
    // button from inside its own click handler).
    this.unsub = eco.subscribe(() => {
      setTimeout(() => {
        if (this.scaffold.visible) this.render();
      }, 0);
    });
    this.render();
  }

  public hide(): void {
    this.scaffold.hide();
    this.unsub?.();
    this.unsub = null;
  }

  public layout(screenWidth: number, screenHeight: number): void {
    this.w = screenWidth;
    this.h = screenHeight;
    this.scaffold.layout(screenWidth, screenHeight);
    if (this.scaffold.visible) this.render();
  }

  // ─── Rendering ───────────────────────────────────────────────────────

  private render(): void {
    const eco = getEconomy();
    const S = DESIGN_TOKENS.space;
    const sc = this.scaffold;
    const body = sc.body;
    body.removeChildren().forEach((c) => c.destroy({ children: true }));

    const contentW = Math.min(this.w - 2 * sc.inset, 420);
    const x0 = (this.w - contentW) / 2;
    let y = sc.contentTop;

    // Caption: which match this is
    const modeLabel = this.ctx.mode === 'VS_AI' ? `VS Computer · ${cap(this.ctx.difficulty)}` : 'Local Duel';
    const caption = new Text({
      text: modeLabel,
      style: new TextStyle({
        fontFamily: DESIGN_TOKENS.type.label.family,
        fontSize: 12,
        fill: DESIGN_TOKENS.colors.textOnDark,
        fontWeight: '800',
        letterSpacing: 1,
      }),
    });
    caption.anchor.set(0.5, 0);
    caption.x = this.w / 2;
    caption.y = y - S.s8;
    body.addChild(caption);
    y += S.s16;

    // Reserve space for info panel + action area
    const selPreview = eco.previewEntry(this.selected, this.ctx.mode, this.ctx.difficulty);
    const paid = this.selected !== 'practice';
    const infoRows = paid ? 5 : 2;
    const rowH = 18;
    const infoH = infoRows * rowH + S.s16 + S.s4;
    const btnH = 52;
    const helpH = !selPreview.affordable ? 44 : 0;
    const reserved = infoH + S.s12 + helpH + btnH + S.s12;
    const avail = sc.contentBottom - y - reserved;
    const gap = S.s8;
    const cardH = Math.max(50, Math.min(78, Math.floor((avail - 3 * gap) / 4)));

    // Tier cards
    TIER_ORDER.forEach((tier) => {
      const card = this.buildTierCard(tier, contentW, cardH);
      card.x = x0;
      card.y = y;
      body.addChild(card);
      y += cardH + gap;
    });
    y += S.s4;

    // Info panel
    const info = new Container();
    info.x = x0;
    info.y = y;
    const bg = new Graphics()
      .roundRect(0, 3, contentW, infoH, DESIGN_TOKENS.radii.md).fill({ color: DESIGN_TOKENS.colors.navyShadow })
      .roundRect(0, 0, contentW, infoH, DESIGN_TOKENS.radii.md)
      .fill({ color: DESIGN_TOKENS.colors.creamSurface })
      .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });
    info.addChild(bg);

    const rows: { l: string; v: string; color?: number }[] = [];
    if (!paid) {
      rows.push({ l: 'PEN at stake', v: 'None' });
      rows.push({ l: 'Rewards', v: 'Reduced XP, daily cap' });
    } else {
      rows.push({ l: 'Entry fee', v: `−${formatPen(selPreview.entryFee)} PEN`, color: DESIGN_TOKENS.semantic.danger });
      rows.push({ l: 'Balance after entry', v: `${formatPen(selPreview.balanceAfterEntry < 0 ? 0 : selPreview.balanceAfterEntry)} PEN` });
      rows.push({
        l: 'If you win',
        v: selPreview.dailyProfitCapReached
          ? `${formatPen(selPreview.winPayout)} PEN (daily cap)`
          : `${formatPen(selPreview.winPayout)} PEN (+${formatPen(selPreview.winProfit)})`,
        color: DESIGN_TOKENS.semantic.success,
      });
      rows.push({ l: 'If it is a draw', v: 'Entry refunded' });
      rows.push({ l: 'If you lose', v: 'Entry fee is lost', color: DESIGN_TOKENS.semantic.danger });
    }
    rows.forEach((r, i) => {
      const ry = S.s8 + i * rowH;
      const l = new Text({
        text: r.l,
        style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.bodySmall.family, fontSize: 12, fill: DESIGN_TOKENS.colors.textSecondary, fontWeight: '700' }),
      });
      l.x = S.s12;
      l.y = ry;
      const v = new Text({
        text: r.v,
        style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.bodySmall.family, fontSize: 12.5, fill: r.color ?? DESIGN_TOKENS.colors.textPrimary, fontWeight: '800' }),
      });
      v.anchor.set(1, 0);
      v.x = contentW - S.s12;
      v.y = ry;
      info.addChild(l, v);
    });
    body.addChild(info);
    y += infoH + S.s12;

    // Not enough PEN: say why and how to get more (never a dead end)
    if (!selPreview.affordable) {
      const short = selPreview.entryFee - selPreview.balance;
      const msg = new Text({
        text: `You need ${formatPen(short)} more PEN. Practice is always free, and Daily Missions give PEN.`,
        style: new TextStyle({
          fontFamily: DESIGN_TOKENS.type.bodySmall.family,
          fontSize: 12,
          fill: DESIGN_TOKENS.colors.textOnDark,
          fontWeight: '800',
          align: 'center',
          wordWrap: true,
          wordWrapWidth: contentW - S.s8,
        }),
      });
      msg.anchor.set(0.5, 0);
      msg.x = this.w / 2;
      msg.y = y;
      body.addChild(msg);
      y += helpH;
    }

    // Primary action, anchored to the bottom safe area
    const btnY = Math.min(y, sc.contentBottom - btnH);
    const eligible = selPreview.affordable && !(this.ctx.endless && paid);
    const label = !paid
      ? 'Start Practice'
      : !selPreview.affordable
        ? 'Not enough PEN'
        : `Pay ${formatPen(selPreview.entryFee)} PEN & Start`;
    const startBtn = new GameButton({
      width: contentW,
      height: btnH,
      label,
      fontSize: 19,
      bgColor: DESIGN_TOKENS.colors.premiumGold,
      disabled: !eligible,
      onClick: () => {
        if (!eligible) return;
        this.emit('confirm', this.selected);
      },
    });
    startBtn.x = this.w / 2;
    startBtn.y = btnY;
    if (!eligible) startBtn.setDisabled(true);
    body.addChild(startBtn);

    sc.refreshChip();
  }

  private buildTierCard(tier: MatchTierId, w: number, h: number): Container {
    const eco = getEconomy();
    const cfg = ECONOMY_CONFIG.tiers[tier];
    const S = DESIGN_TOKENS.space;
    const preview = eco.previewEntry(tier, this.ctx.mode, this.ctx.difficulty);
    const paid = tier !== 'practice';
    const blockedByEndless = paid && this.ctx.endless;
    const selected = this.selected === tier;
    const dim = blockedByEndless || (paid && !preview.affordable);

    const card = new Container();
    card.eventMode = blockedByEndless ? 'none' : 'static';
    card.cursor = 'pointer';
    card.alpha = dim ? 0.6 : 1;

    const g = new Graphics()
      .roundRect(0, 3, w, h, DESIGN_TOKENS.radii.md).fill({ color: DESIGN_TOKENS.colors.navyShadow })
      .roundRect(0, 0, w, h, DESIGN_TOKENS.radii.md)
      .fill({ color: selected ? DESIGN_TOKENS.colors.creamSurface : DESIGN_TOKENS.colors.creamSecondary })
      .stroke({
        color: selected ? DESIGN_TOKENS.colors.premiumGold : DESIGN_TOKENS.colors.navyOutline,
        width: selected ? DESIGN_TOKENS.borders.chunky : DESIGN_TOKENS.borders.regular,
      });
    card.addChild(g);
    if (selected) {
      // Dark outline outside the gold so the selected state is not colour-only
      card.addChild(
        new Graphics().roundRect(-1, -1, w + 2, h + 2, DESIGN_TOKENS.radii.md + 1).stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: 1.5 }),
      );
    }

    const r = Math.min(22, h * 0.34);
    const badge = new Graphics()
      .circle(0, 0, r).fill({ color: TIER_COLOR[tier] })
      .circle(0, 0, r).stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular });
    badge.x = S.s12 + r;
    badge.y = h / 2;
    card.addChild(badge);
    const ic = new Text({ text: TIER_ICON[tier], style: new TextStyle({ fontSize: Math.round(r * 1.05) }) });
    ic.anchor.set(0.5, 0.5);
    ic.x = badge.x;
    ic.y = badge.y;
    card.addChild(ic);

    const tx = badge.x + r + S.s12;
    const title = new Text({
      text: cfg.label,
      style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.title.family, fontSize: 17, fill: DESIGN_TOKENS.colors.textPrimary, fontWeight: 'bold' }),
    });
    title.x = tx;
    title.y = h / 2 - 20;
    card.addChild(title);

    let sub: string;
    if (blockedByEndless) sub = 'Needs a 3 or 5 win series';
    else if (!paid) sub = 'Free · learn the desk';
    else if (!preview.affordable) sub = `Need ${formatPen(preview.entryFee - preview.balance)} more`;
    else sub = `Win pays ${formatPen(preview.winPayout)} PEN`;
    const subT = new Text({
      text: sub,
      style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.bodySmall.family, fontSize: 12, fill: DESIGN_TOKENS.colors.textSecondary, fontWeight: '700' }),
    });
    subT.x = tx;
    subT.y = h / 2 + 2;
    card.addChild(subT);

    // Fee, right aligned
    if (!paid) {
      const pw = 54;
      const ph = 26;
      const pill = new Graphics()
        .roundRect(w - S.s12 - pw, h / 2 - ph / 2, pw, ph, ph / 2)
        .fill({ color: DESIGN_TOKENS.semantic.success })
        .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thin });
      card.addChild(pill);
      const ft = new Text({
        text: 'FREE',
        style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.label.family, fontSize: 12, fill: 0xFFFFFF, fontWeight: '900', letterSpacing: 0.8 }),
      });
      ft.anchor.set(0.5, 0.5);
      ft.x = w - S.s12 - pw / 2;
      ft.y = h / 2;
      card.addChild(ft);
    } else {
      const fee = new Text({
        text: formatPen(cfg.entryFee),
        style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.currency.family, fontSize: 17, fill: DESIGN_TOKENS.colors.textPrimary, fontWeight: 'bold' }),
      });
      fee.anchor.set(1, 0.5);
      fee.x = w - S.s12;
      fee.y = h / 2;
      card.addChild(fee);
      const nib = new Graphics();
      drawPenNib(nib, 10);
      nib.x = w - S.s12 - fee.width - 8 - 10;
      nib.y = h / 2;
      card.addChild(nib);
    }

    card.on('pointerup', () => {
      soundManager.play('ui_click');
      this.selected = tier;
      // Rebuild after this event finishes so we never destroy the card mid-dispatch.
      setTimeout(() => {
        if (this.scaffold.visible) this.render();
      }, 0);
    });
    return card;
  }

  public destroy(): void {
    this.unsub?.();
    this.removeAllListeners();
    this.container.destroy({ children: true });
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
