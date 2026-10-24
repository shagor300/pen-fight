# PEN economy (Pen Fight Pro)

All numbers live in `src/config/economyConfig.ts` (versioned). Logic lives in
`src/economy/EconomyEngine.ts` (no UI/Capacitor imports, unit tested).
PEN is a virtual, local-only currency: no cash-out, no transfers, no real-money value.

## Match rules (VS Computer)

| Tier | Entry | Win payout, Normal AI | Draw | Loss |
|---|---|---|---|---|
| Practice | 0 | none (reduced XP, daily cap) | none | none |
| Bronze | 1,000 | 1,900 (+900) | fee refunded | fee lost |
| Silver | 2,000 | 3,800 (+1,800) | fee refunded | fee lost |
| Gold | 5,000 | 9,500 (+4,500) | fee refunded | fee lost |

Payout = fee x multiplier (payout includes the fee): Easy x1.2, Normal x1.9, Hard x2.3.
The computer does not put PEN into a pool. Net profit per local day from paid
matches is capped at 4,000 PEN (lost fees make room again); past the cap a win returns the fee only.
Local 2-player duels are free (no PEN). Paid tiers need a 3 or 5 win series (not Endless).
`pvpPoolWinnerShare` (90% of a two-player pool, 10% removed) is defined for a future online mode and unused today.

## Leaving a match
- Before the first shot: entry fee refunded.
- After the first shot: counts as a loss, fee kept (the pause/leave dialog says so first).
- App killed mid-match: before first shot refund; after first shot loss (`interruptedInProgressPolicy`).

## Earning
- Account XP: 50 per match + 50 for a win (x0.5 for Practice, Easy, local duels; those share a 400 XP/day cap).
- Pen mastery XP: win 100 / loss 30 / draw 30 (same low-stakes rules, 300 per pen per day).
- First daily win (VS Computer, not Practice+Easy): +200 PEN.
- Level-ups: +250 PEN (levels 2-5), +500 (6-15), +1,000 after, each paid once.
- Daily missions: 100 / 150 / 300 / 500 PEN, claim once per local day.
- Daily refill: if balance < 1,000, once a day tops up to 1,000. Practice is always free.
- Day boundary: Asia/Dhaka.

## Integrity
- Every credit/debit has a unique id (`fee:<match>`, `payout:<match>`, `levelup:<n>`, `firstwin:<date>`, `mission:<date>:<id>`, `allowance:<date>`); reapplying an id is a no-op.
- Mutations run on a cloned draft and are saved before they replace live state; a failed save changes nothing.
- A finalized match returns its stored result and never pays twice; result screens read that record.
- Pen mastery XP is queued and cleared before it is applied, so it is applied at most once.
- Saves go to localStorage and are mirrored to Capacitor Preferences; the higher `rev` wins at boot.

## Known limits
- Local-only: anyone who can edit device storage can edit the balance. Not cheat-proof.
- PEN has no spending sink yet except match entry (all pens cost 0). Skilled players will accumulate PEN until cosmetics/pen prices are added (`penPrices`, `purchasePen` already exist and are tested).
- Achievements and a pen shop UI are not built.

## Commands
- `npm run test:economy` unit tests (Node 22+, no install needed)
- `npm run sim:economy` 30-day balance simulation (win rates are assumptions)
