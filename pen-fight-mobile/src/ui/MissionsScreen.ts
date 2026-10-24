/**
 * src/ui/MissionsScreen.ts
 * Daily Missions + account level + the free daily PEN refill.
 * Every claim goes through the economy engine, which refuses a second claim
 * for the same mission on the same local day.
 *
 * Events: 'back', 'toast' (message, kind).
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import EventEmitter from 'eventemitter3';
import { DESIGN_TOKENS } from '../config/designTokens';
import { ECONOMY_CONFIG } from '../config/economyConfig';
import { formatPen } from '../economy/EconomyEngine';
import { getEconomy } from '../economy/EconomyStorage';
import { GameButton } from './components/GameButton';
import { ScreenScaffold } from './components/ScreenScaffold';
import { drawPenNib } from './components/PenChip';
import type { ToastKind } from './components/ToastNotification';

export class MissionsScreen extends EventEmitter {
  public container: Container;
  private scaffold: ScreenScaffold;
  private w: number;
  private h: number;
  private unsub: (() => void) | null = null;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.w = screenWidth;
    this.h = screenHeight;
    this.scaffold = new ScreenScaffold({ title: 'Daily Missions', onBack: () => this.emit('back') });
    this.container = this.scaffold.container;
    this.layout(screenWidth, screenHeight);
  }

  public get isOpen(): boolean {
    return this.scaffold.visible;
  }

  public show(): void {
    this.scaffold.show();
    this.unsub?.();
    // Re-render after the current touch event finishes (never destroy a
    // button from inside its own click handler).
    this.unsub = getEconomy().subscribe(() => {
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

  private toast(message: string, kind: ToastKind): void {
    this.emit('toast', message, kind);
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

    // ── Account level ───────────────────────────────────────────────
    const acct = eco.getAccountProgress();
    const accH = 76;
    const acc = new Container();
    acc.x = x0;
    acc.y = y;
    acc.addChild(
      new Graphics()
        .roundRect(0, 3, contentW, accH, DESIGN_TOKENS.radii.md).fill({ color: DESIGN_TOKENS.colors.navyShadow })
        .roundRect(0, 0, contentW, accH, DESIGN_TOKENS.radii.md)
        .fill({ color: DESIGN_TOKENS.colors.deepNavy })
        .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular }),
    );
    const lv = new Text({
      text: `Level ${acct.level}`,
      style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.headline.family, fontSize: 20, fill: DESIGN_TOKENS.semantic.pen, fontWeight: 'bold' }),
    });
    lv.x = S.s16;
    lv.y = S.s8;
    acc.addChild(lv);
    const xpLabel = new Text({
      text: acct.maxed ? 'Max level' : `${formatPen(acct.xpIntoLevel)} / ${formatPen(acct.xpForNext)} XP`,
      style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.bodySmall.family, fontSize: 12, fill: DESIGN_TOKENS.colors.textOnDark, fontWeight: '800' }),
    });
    xpLabel.anchor.set(1, 0);
    xpLabel.x = contentW - S.s16;
    xpLabel.y = S.s12;
    acc.addChild(xpLabel);
    this.drawBar(acc, S.s16, 38, contentW - 2 * S.s16, 12, acct.ratio, DESIGN_TOKENS.colors.victoryGreen, true);
    if (!acct.maxed) {
      const nr = new Text({
        text: `Next level reward: +${formatPen(acct.nextRewardPen)} PEN`,
        style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.bodySmall.family, fontSize: 11.5, fill: 0xC8D3E0, fontWeight: '700' }),
      });
      nr.x = S.s16;
      nr.y = 54;
      acc.addChild(nr);
    }
    body.addChild(acc);
    y += accH + S.s16;

    // ── Missions ───────────────────────────────────────────────────
    const missions = eco.getMissions();
    const refillShown = eco.getBalance() < ECONOMY_CONFIG.allowance.belowBalance;
    const footerH = 22;
    const refillH = refillShown ? 70 : 0;
    const availForRows = sc.contentBottom - y - footerH - (refillShown ? refillH + S.s12 : 0);
    const gap = S.s8;
    const rowH = Math.max(56, Math.min(68, Math.floor((availForRows - (missions.length - 1) * gap) / missions.length)));

    missions.forEach((m) => {
      const row = new Container();
      row.x = x0;
      row.y = y;
      row.addChild(
        new Graphics()
          .roundRect(0, 3, contentW, rowH, DESIGN_TOKENS.radii.md).fill({ color: DESIGN_TOKENS.colors.navyShadow })
          .roundRect(0, 0, contentW, rowH, DESIGN_TOKENS.radii.md)
          .fill({ color: m.claimed ? DESIGN_TOKENS.colors.creamMuted : DESIGN_TOKENS.colors.creamSurface })
          .stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.regular }),
      );

      const btnW = 92;
      const textW = contentW - btnW - 3 * S.s12;
      const title = new Text({
        text: m.title,
        style: new TextStyle({
          fontFamily: DESIGN_TOKENS.type.title.family,
          fontSize: 14,
          fill: DESIGN_TOKENS.colors.textPrimary,
          fontWeight: 'bold',
          wordWrap: true,
          wordWrapWidth: textW,
        }),
      });
      title.x = S.s12;
      title.y = S.s8;
      row.addChild(title);

      this.drawBar(row, S.s12, rowH - 24, textW - 54, 10, m.target > 0 ? m.progress / m.target : 0, DESIGN_TOKENS.colors.premiumGold, false);
      const cnt = new Text({
        text: `${m.progress}/${m.target}`,
        style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.label.family, fontSize: 11.5, fill: DESIGN_TOKENS.colors.textSecondary, fontWeight: '800' }),
      });
      cnt.anchor.set(0, 0.5);
      cnt.x = S.s12 + textW - 48;
      cnt.y = rowH - 19;
      row.addChild(cnt);

      // Right side: reward + state
      const rx = contentW - S.s12 - btnW / 2;
      const nib = new Graphics();
      drawPenNib(nib, 8);
      nib.x = rx - 22;
      nib.y = 18;
      row.addChild(nib);
      const rw = new Text({
        text: `+${formatPen(m.rewardPen)}`,
        style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.currency.family, fontSize: 14, fill: DESIGN_TOKENS.colors.textPrimary, fontWeight: 'bold' }),
      });
      rw.anchor.set(0, 0.5);
      rw.x = rx - 10;
      rw.y = 18;
      row.addChild(rw);

      if (m.claimed) {
        const done = new Text({
          text: '✓ Claimed',
          style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.label.family, fontSize: 13, fill: DESIGN_TOKENS.semantic.success, fontWeight: '900' }),
        });
        done.anchor.set(0.5, 0.5);
        done.x = rx;
        done.y = rowH - 22;
        row.addChild(done);
      } else {
        const claim = new GameButton({
          width: btnW,
          height: 36,
          label: m.claimable ? 'Claim' : 'In progress',
          fontSize: m.claimable ? 15 : 11.5,
          bgColor: DESIGN_TOKENS.colors.premiumGold,
          disabled: !m.claimable,
          onClick: () => {
            const r = getEconomy().claimMission(m.id);
            if (r.ok) this.toast(`+${formatPen(r.rewardPen)} PEN claimed`, 'success');
            else this.toast(r.message, 'error');
          },
        });
        claim.x = rx;
        claim.y = rowH - 46;
        if (!m.claimable) claim.setDisabled(true);
        row.addChild(claim);
      }
      body.addChild(row);
      y += rowH + gap;
    });

    // ── Free daily refill (never a dead end at 0 PEN) ──────────────────────
    if (refillShown) {
      const canClaim = eco.canClaimAllowance();
      const box = new Container();
      box.x = x0;
      box.y = y + S.s4;
      box.addChild(
        new Graphics()
          .roundRect(0, 3, contentW, refillH, DESIGN_TOKENS.radii.md).fill({ color: DESIGN_TOKENS.colors.navyShadow })
          .roundRect(0, 0, contentW, refillH, DESIGN_TOKENS.radii.md)
          .fill({ color: DESIGN_TOKENS.colors.creamSurface })
          .stroke({ color: canClaim ? DESIGN_TOKENS.colors.premiumGold : DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thick }),
      );
      const t = new Text({
        text: canClaim ? 'Free daily PEN refill' : 'Refill used today',
        style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.title.family, fontSize: 15, fill: DESIGN_TOKENS.colors.textPrimary, fontWeight: 'bold' }),
      });
      t.x = S.s12;
      t.y = S.s8;
      box.addChild(t);
      const st = new Text({
        text: canClaim
          ? `Tops you up to ${formatPen(ECONOMY_CONFIG.allowance.topUpTo)} PEN. Once a day.`
          : 'Comes back tomorrow. Practice and missions still work.',
        style: new TextStyle({
          fontFamily: DESIGN_TOKENS.type.bodySmall.family,
          fontSize: 11.5,
          fill: DESIGN_TOKENS.colors.textSecondary,
          fontWeight: '700',
          wordWrap: true,
          wordWrapWidth: contentW - 120,
        }),
      });
      st.x = S.s12;
      st.y = 30;
      box.addChild(st);
      const rb = new GameButton({
        width: 92,
        height: DESIGN_TOKENS.touch.min,
        label: 'Claim',
        fontSize: 15,
        bgColor: DESIGN_TOKENS.colors.premiumGold,
        disabled: !canClaim,
        onClick: () => {
          const r = getEconomy().claimAllowance();
          if (r.ok) this.toast(`+${formatPen(r.amount)} PEN refill claimed`, 'success');
          else this.toast(r.message, 'error');
        },
      });
      rb.x = contentW - S.s12 - 46;
      rb.y = (refillH - DESIGN_TOKENS.touch.min) / 2 - 2;
      if (!canClaim) rb.setDisabled(true);
      box.addChild(rb);
      body.addChild(box);
      y += refillH + S.s12;
    }

    const foot = new Text({
      text: `Missions reset daily at midnight (${ECONOMY_CONFIG.timezone}).`,
      style: new TextStyle({ fontFamily: DESIGN_TOKENS.type.bodySmall.family, fontSize: 11, fill: DESIGN_TOKENS.colors.textOnDark, fontWeight: '700' }),
    });
    foot.anchor.set(0.5, 0);
    foot.x = this.w / 2;
    foot.y = Math.min(y, sc.contentBottom - 14);
    body.addChild(foot);

    sc.refreshChip();
  }

  private drawBar(parent: Container, x: number, y: number, w: number, h: number, ratio: number, fill: number, onDark: boolean): void {
    const r = h / 2;
    const g = new Graphics().roundRect(x, y, w, h, r).fill({ color: onDark ? 0x0F1B30 : DESIGN_TOKENS.colors.creamMuted });
    const fw = Math.max(0, Math.min(1, ratio)) * w;
    if (fw > 0) g.roundRect(x, y, Math.max(h, fw), h, r).fill({ color: fill });
    g.roundRect(x, y, w, h, r).stroke({ color: DESIGN_TOKENS.colors.navyOutline, width: DESIGN_TOKENS.borders.thin });
    parent.addChild(g);
  }

  public destroy(): void {
    this.unsub?.();
    this.removeAllListeners();
    this.container.destroy({ children: true });
  }
}
