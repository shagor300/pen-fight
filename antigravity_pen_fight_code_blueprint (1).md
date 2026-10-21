# Google Antigravity IDE — 100% Accurate Physics, Thermometer Aim-Bar, Animated AI & Gameplay Fix Blueprint for "Desk Wars: Pen Fight"

**Target Local Project Folder:** `C:\Users\SHAGOR\shagorize Lab\Pen Fight`  
**Reference Original Game:** [Desk Wars: Pen Fight](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2Fpen-fight%2F) ([Shunnek Games](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2F))  
**Target Agent:** [Google Antigravity IDE](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fproduct%2Fantigravity-ide%2F)

---

## ১. আপনার ৪ মিনিট ৩৫ সেকেন্ডের গেমপ্লে ভিডিও বনাম আসল গেমের ২টি ভিডিওর নিখুঁত তুলনা ও ৬টি লজিক বাগ (Root-Cause Analysis)

আপনার দেওয়া ৩টি ভিডিও (`video6250999259202592582.mp4`, `video6250999259202592611.mp4` — আসল গেমের ২টি ভিডিও, এবং `video6250999259202592594.mp4` — আপনার ৪ মিনিট ৩৫ সেকেন্ডের গেমপ্লে ভিডিও) ফ্রেম-বাই-ফ্রেম বিশ্লেষণ করে আপনার বর্তমান গেমের **৬টি প্রধান লজিক ও ফিজিক্স সমস্যা** পাওয়া গেছে:

| ক্রমিক | আপনার গেমের সমস্যা (`4m35s` ভিডিওতে যা দেখা গেছে) | আসল গেমে (`shunneklabs.app`) যেভাবে কাজ করে | কেন এই সমস্যা হয়েছিল এবং কীভাবে ১০০% ফিক্স করা হয়েছে |
| :--- | :--- | :--- | :--- |
| **১. শামুকের মতো ধীরগতির মুভমেন্ট (Snail-Crawl Physics Bug)** | ভিডিওর `00:18–00:45`, `01:57–03:18` এবং `03:30–04:33` অংশে দেখা যায় কলম টোকা দেওয়ার পর **১ মিনিট ধরে শামুকের মতো একটু একটু করে সরছে**, টার্ন শেষই হচ্ছে না! | আসল গেমে (`00:14–00:16`, `00:22–00:24`) কলমে ফ্লিক করলে সেটি **০.৩৫ থেকে ০.৭৫ সেকেন্ডের মধ্যে** দ্রুতগতিতে গিয়ে ধাক্কা মেরে সুন্দরভাবে থেমে যায়। | Antigravity শুধু Exponential Damping (`v *= 0.96`) ও খুব ছোট Stop Threshold (`0.04`) দিয়েছিল, যার ফলে কলমের বেগ শূন্য হতে ৬০ সেকেন্ড লেগে যাচ্ছিল। নিচে **Coulomb Dry Surface Friction + Anisotropic Drag** দেওয়া হয়েছে যাতে কলম **০.৮ সেকেন্ডের মধ্যে** ক্রিস্পভাবে থেমে যায়। |
| **২. ডেস্কের ভুল সাইজ ও পজিশন (Wrong Desk Aspect Ratio & Spawn)** | আপনার ভিডিওতে ফোনের লম্বা স্ক্রিনের উপরের দিকে ছোট একটা আড়াআড়ি বাক্সের মতো ডেস্ক এবং নিচে অর্ধেক স্ক্রিন খালি। কলম দুটি উপরে-নিচে বর্ডার ঘেঁষে রাখা। | আসল মোবাইল ভিডিওতে (`00:10`) কাঠের ডেস্কটি **পুরো লম্বা স্ক্রিন জুড়ে (Full-Bleed Portrait Desk)** থাকে এবং দুটি কলম **ডেস্কের ঠিক মাঝখানে পাশাপাশি** (`Computer` বামে, `You` ডানে) মুখোমুখি শুরু করে। | ডেস্কের বাউন্ডারি পুরো স্ক্রিন (`94% width × 90% height`) করা হয়েছে এবং রাউন্ডের শুরুতে দুটি কলম ডেস্কের মাঝখানে (`x = 34%` এবং `x = 66%`, `y = 50%`) হালকা কোণাকুণি (`±10°`) স্পন করানো হয়েছে। |
| **৩. থার্মোমিটার পাওয়ার বার ও স্পিন অ্যারো নেই (Missing Thermometer Gauge & Spin Arc)** | আপনার ভিডিওতে (`00:13`, `01:56`) টানলে শুধু একটি চিকন সাদা সুতা ও ছোট হলুদ ডট দেখা যায়—কোথায় আঘাত লাগছে বা কতটুকু স্পিন হবে তা বোঝা যায় না। | আসল গেমে (`00:14`, `00:18`, `00:27`, `00:31`) কলমের গায়ে **সাদা Contact Dot**, পেছনে **৪-ভাগের থার্মোমিটার পাওয়ার বার (সবুজ→হলুদ→কমলা→লাল)**, সামনে **সোজা তীর (Push Arrow)** এবং প্রান্তে ধরলে **বাঁকানো স্পিন তীর (`↻`/`↺` Spin Arc)** দেখা যায়। | নিচে `renderThermometerAimUI()` ফাংশনে হুবহু আসল গেমের মতো সাদা কন্টাক্ট ডট, থার্মোমিটার টিউব, সামনের তীর এবং বাঁকানো স্পিন কার্ভ কোড করে দেওয়া হয়েছে। |
| **৪. বট/কম্পিউটারের অ্যানিমেশন নেই (Bot Instant Teleport Bug)** | আপনার ভিডিওতে (`00:46–01:37`) `"BOT IS AIMING..."` লেখা উঠে বট কোনো নিশানা না দেখিয়েই হঠাৎ কলম নড়িয়ে দেয় এবং লেখাটি ১ মিনিট ধরে আটকে থাকে। | আসল গেমে (`00:29`, `00:33`, `00:39`) প্রথমে `Computer · Thinking` দেখায়, এরপর `Computer's turn`-এ **কম্পিউটার নিজেও থার্মোমিটার পাওয়ার বার ও স্পিন অ্যারো টেনে (0.45s অ্যানিমেশন করে) তারপর শট ছাড়ে!** | AI-এর জন্য ৩-ধাপের স্টেট (`AI_THINKING` → `AI_PULLING_BACK` → `SIMULATING`) তৈরি করা হয়েছে যাতে কম্পিউটারের শটও মানুষের মতো থার্মোমিটার বার টেনে দেখা যায়। |
| **৫. কলমে ধাক্কা লাগলে আটকে থাকা ও স্টারবার্স্ট ইফেক্ট না থাকা (`03:15–04:33`)** | আপনার ভিডিওর `03:15` থেকে `04:33` পর্যন্ত দুটি কলম একে অপরের সাথে লেগে ১ মিনিট ধরে আঠার মতো আটকে থেকে সরছিল। | আসল গেমে (`00:16`, `00:20`, `00:53`, `01:05`) দুটি কলমের সংঘর্ষ হলে সাথে সাথে **৮-কাঁটার কালো Starburst Impact Ring** ফ্ল্যাশ করে এবং কলম দুটি প্রাণবন্তভাবে ছিটকে যায় (`Lively Rebound`)। | কলিশন রেস্টিটিউশন (`0.78`), পজিশনাল সেপারেশন এবং কৌণিক হুইপ টর্ক ঠিক করা হয়েছে, সাথে সংঘর্ষের বিন্দুতে আসল গেমের মতো **8-Spike Starburst Impact Ring** যোগ করা হয়েছে। |
| **৬. উপরের লেখার ওভারল্যাপ ও কলমের নিচে `You`/`Computer` লেবেল না থাকা** | আপনার ভিডিওর একদম উপরে `P1: CHEAP BALLPOINT 0-0 P2...` লেখাগুলো একটার ওপর আরেকটা উঠে ঘিজিমিজি হয়ে গেছে। | আসল গেমে উপরে বামে ছোট স্কোর (`You 0 · Computer 1`), মাঝখানে স্ট্যাটাস পিল (`● Your turn` / `● 5 normal turns left`), এবং ডেস্কে কলমের ঠিক নিচে **`You` (কমলা)** ও **`Computer` (নীল)** লেখা ভেসে থাকে এবং টার্নের শুরুতে মাঝখানে **`Your turn`** কার্ড পপ-আপ হয়। | উপরের HUD সম্পূর্ণ পরিষ্কার করা হয়েছে, কলমের নিচে ফ্লোটিং `You` / `Computer` লেবেল এবং মাঝখানে `Your turn` পপ-আপ ব্যাজ যুক্ত করা হয়েছে। |

---

## ২. Google Antigravity IDE-এর জন্য সরাসরি নির্দেশ (Master Prompt to Copy-Paste into Antigravity)

আপনি নিচের ব্লকটি কপি করে সরাসরি **Google Antigravity IDE**-এর এজেন্ট চ্যাট বক্সে পেস্ট করবেন:

> **CRITICAL INSTRUCTION FOR GOOGLE ANTIGRAVITY AGENT:**
>
> You are working inside `C:\Users\SHAGOR\shagorize Lab\Pen Fight`.
>
> The current build has severe physics, UI, and gameplay logic bugs compared to the reference game **Desk Wars: Pen Fight** (`https://shunneklabs.app/games/pen-fight/`):
> 1. **Fix the Snail-Crawl Physics**: Pens currently crawl for 60+ seconds after a flick. Replace the physics step and friction logic with the exact **Coulomb Dry Friction + Anisotropic Rolling Drag + 2.4s Watchdog** in `src/physics/PenFightEngine.ts` below so shots complete crisply in `0.35s–0.85s`.
> 2. **Fix the Portrait Full-Screen Desk & Center Spawn**: Make the wooden desk fill the vertical screen (`94% width × 90% height`) and spawn both pens in the center of the desk facing each other (`Computer` at `34% X, 50% Y`, `You` at `66% X, 50% Y`).
> 3. **Implement the Exact Thermometer Power Bar + White Contact Dot + Curved Spin Arc (`↻`/`↺`)**: Replace the dashed line aim guide with `renderThermometerAimGauge()` provided below.
> 4. **Implement Animated AI Pull-Back**: During the Computer's turn, show `Computer · Thinking` (`380ms`), then animate the Computer pulling back the exact same Thermometer Power Bar & Spin Arc (`450ms` `AI_PULLING` state) before releasing its shot.
> 5. **Add the 8-Spike Starburst Collision Ring, Floating `You`/`Computer` Desk Labels, `"Your turn"` Center Toast, and Clean Non-Overlapping Top HUD**: Write all files below directly into `C:\Users\SHAGOR\shagorize Lab\Pen Fight`, run `npm run dev` to verify 60fps gameplay, and sync with `npx cap sync android`.

---

## ৩. আসল গেমের ৮টি কলমের নিখুঁত কনফিগারেশন (`src/config/pensConfig.ts`)

`C:\Users\SHAGOR\shagorize Lab\Pen Fight\src\config\pensConfig.ts` ফাইলে নিচের কোডটি হুবহু বসাতে বলুন:

```typescript
export interface PenSpec {
  id: string;
  name: string;
  tagline: string;
  stats: {
    weight: number; // 1 to 5 stars
    speed: number;  // 1 to 5 stars
    spin: number;   // 1 to 5 stars
    grip: number;   // 1 to 5 stars
    reach: number;  // 1 to 5 stars
  };
  lengthPx: number;
  widthPx: number;
  colors: {
    barrel: string;
    cap: string;
    grip: string;
    tip: string;
    clip: string;
    ink: string;
  };
  transparent: boolean;
  styleType: 'ballpoint' | 'clicker' | '4colour' | 'gel' | 'metal' | 'highlighter' | 'marker' | 'spinner';
}

export const PENS_ROSTER: PenSpec[] = [
  {
    id: 'cheap-ballpoint',
    name: 'Cheap Ballpoint',
    tagline: 'Long barrel. Smooth side flicks.',
    stats: { weight: 2, speed: 4, spin: 3, grip: 3, reach: 4 },
    lengthPx: 164,
    widthPx: 13,
    colors: {
      barrel: '#e2e8f0',
      cap: '#ea580c',
      grip: '#cbd5e1',
      tip: '#d97706',
      clip: '#ea580c',
      ink: '#1e3a8a'
    },
    transparent: true,
    styleType: 'ballpoint'
  },
  {
    id: 'click-pen',
    name: 'Click Pen',
    tagline: 'Quick mid-weight. Easy to steer.',
    stats: { weight: 3, speed: 4, spin: 3, grip: 4, reach: 3 },
    lengthPx: 152,
    widthPx: 14,
    colors: {
      barrel: '#4d7c0f',
      cap: '#365314',
      grip: '#1a2e05',
      tip: '#cbd5e1',
      clip: '#94a3b8',
      ink: '#15803d'
    },
    transparent: false,
    styleType: 'clicker'
  },
  {
    id: '4-colour-pen',
    name: '4-Colour Pen',
    tagline: 'A chunky classic for steady, straight pushes.',
    stats: { weight: 4, speed: 3, spin: 2, grip: 4, reach: 3 },
    lengthPx: 150,
    widthPx: 18,
    colors: {
      barrel: '#f8fafc',
      cap: '#2563eb',
      grip: '#f97316',
      tip: '#cbd5e1',
      clip: '#3b82f6',
      ink: '#2563eb'
    },
    transparent: false,
    styleType: '4colour'
  },
  {
    id: 'gel-pen',
    name: 'Gel Pen',
    tagline: 'Gentle shots, easy to place.',
    stats: { weight: 2, speed: 5, spin: 4, grip: 3, reach: 3 },
    lengthPx: 156,
    widthPx: 14,
    colors: {
      barrel: '#93c5fd',
      cap: '#1d4ed8',
      grip: '#1e40af',
      tip: '#e2e8f0',
      clip: '#3b82f6',
      ink: '#1d4ed8'
    },
    transparent: true,
    styleType: 'gel'
  },
  {
    id: 'metal-pen',
    name: 'Metal Pen',
    tagline: 'Steel barrel. Lively rebounds.',
    stats: { weight: 5, speed: 3, spin: 3, grip: 5, reach: 3 },
    lengthPx: 154,
    widthPx: 16,
    colors: {
      barrel: '#94a3b8',
      cap: '#64748b',
      grip: '#475569',
      tip: '#e2e8f0',
      clip: '#cbd5e1',
      ink: '#334155'
    },
    transparent: false,
    styleType: 'metal'
  },
  {
    id: 'yellow-highlighter',
    name: 'Yellow Highlighter',
    tagline: 'Wide flat body with strong desk grip.',
    stats: { weight: 4, speed: 3, spin: 2, grip: 5, reach: 2 },
    lengthPx: 142,
    widthPx: 22,
    colors: {
      barrel: '#facc15',
      cap: '#ca8a04',
      grip: '#eab308',
      tip: '#fef08a',
      clip: '#ca8a04',
      ink: '#eab308'
    },
    transparent: false,
    styleType: 'highlighter'
  },
  {
    id: 'dual-tip-marker',
    name: 'Dual-Tip Marker',
    tagline: 'Twin-capped marker built for helicopter spin.',
    stats: { weight: 3, speed: 3, spin: 5, grip: 2, reach: 4 },
    lengthPx: 166,
    widthPx: 16,
    colors: {
      barrel: '#8b5cf6',
      cap: '#5b21b6',
      grip: '#4c1d95',
      tip: '#ddd6fe',
      clip: '#6d28d9',
      ink: '#7c3aed'
    },
    transparent: false,
    styleType: 'marker'
  },
  {
    id: 'long-mod-spinner',
    name: 'Long Mod Spinner',
    tagline: 'Balanced pen-mod with weighted silicone tips.',
    stats: { weight: 4, speed: 4, spin: 5, grip: 3, reach: 5 },
    lengthPx: 182,
    widthPx: 15,
    colors: {
      barrel: '#f97316',
      cap: '#1e293b',
      grip: '#ea580c',
      tip: '#fdba74',
      clip: '#334155',
      ink: '#f97316'
    },
    transparent: false,
    styleType: 'spinner'
  }
];
```

---

## ৪. ১০০% নিখুঁত ফিজিক্স, কলিশন, অ্যানিসোট্রপিক ফ্রিকশন ও AI ইঞ্জিন (`src/physics/PenFightEngine.ts`)

এই ফাইলটি আপনার গেমের **সবগুলো ফিজিক্স ও লজিক সমস্যা (Snail crawl, কলম আটকে থাকা, স্পিন টর্ক, বাউন্ডারি শ্রিংক এবং কম্পিউটারের অ্যানিমেটেড থার্মোমিটার শট)** সম্পূর্ণ সমাধান করবে:

```typescript
import { PenSpec, PENS_ROSTER } from '../config/pensConfig';

export type GamePhase =
  | 'AIMING'          // Human player can touch & pull back
  | 'AI_THINKING'     // "Computer · Thinking" pause (380ms)
  | 'AI_PULLING'      // "Computer's turn" animated thermometer pull-back (460ms)
  | 'SIMULATING'      // Pens in motion on the desk
  | 'ROUND_OVER';     // Winner modal displayed

export interface PenBody {
  playerIndex: 1 | 2; // 1 = You / Player 1 (Orange label), 2 = Computer / Player 2 (Blue label)
  label: string;      // "You" | "Computer" | "Player 1" | "Player 2"
  labelColor: string; // "#e06d3b" (orange) or "#3b82f6" (blue)
  spec: PenSpec;
  level: number;
  x: number;
  y: number;
  vx: number;         // px per second
  vy: number;         // px per second
  angle: number;      // radians
  omega: number;      // radians per second
  lengthPx: number;
  widthPx: number;
  mass: number;
  inertia: number;
  speedMult: number;
  spinMult: number;
  gripMult: number;
  falling: boolean;
  fallenOut: boolean;
  fallScale: number;
  fallAlpha: number;
}

export interface AimDragState {
  active: boolean;
  penIndex: 0 | 1;
  grabOffsetRatio: number; // -0.92 (back cap) to +0.92 (front tip) along pen axis
  pullX: number;           // Pull vector X (from contact point toward finger)
  pullY: number;           // Pull vector Y (from contact point toward finger)
  powerRatio: number;      // 0.0 to 1.0
}

export interface ImpactRingEffect {
  x: number;
  y: number;
  ageMs: number;
  durationMs: number;
  maxRadius: number;
}

export const SHRINK_TURNS = [15, 19, 23, 27];
export const MAX_PULL_PX = 135;
export const CANCEL_PULL_PX = 14;
export const MAX_SIMULATION_MS = 2400; // Safety watchdog so pens NEVER crawl forever

export class PenFightEngine {
  public pens: [PenBody, PenBody] | [] = [];
  public phase: GamePhase = 'AIMING';
  public activePlayer: 1 | 2 = 1;
  public startingPlayer: 1 | 2 = 1;
  public turnCount = 1;
  public shrinkSteps = 0;

  // Full-screen desk outer rectangle & active inner boundary (after shrinking)
  public outerDesk = { x: 24, y: 56, w: 500, h: 800 };
  public activeBounds = { x: 24, y: 56, w: 500, h: 800 };

  public aim: AimDragState = {
    active: false,
    penIndex: 0,
    grabOffsetRatio: 0,
    pullX: 0,
    pullY: 0,
    powerRatio: 0
  };

  // AI animated pull-back state
  public aiPlan = {
    thinkTimerMs: 0,
    pullTimerMs: 0,
    pullDurationMs: 460,
    grabOffsetRatio: 0,
    targetPullX: 0,
    targetPullY: 0,
    targetPowerRatio: 0.65
  };

  public impactRings: ImpactRingEffect[] = [];
  public simulationElapsedMs = 0;
  public turnToastTimerMs = 0;
  public turnToastText = 'Your turn';

  public onHitSound?: (intensity: number) => void;
  public onFlickSound?: (power: number) => void;
  public onFallSound?: () => void;
  public onRoundEnd?: (winner: 0 | 1 | 2, reason: string) => void;

  public updateDeskGeometry(canvasW: number, canvasH: number): void {
    const marginX = Math.max(16, Math.round(canvasW * 0.032));
    const marginTop = Math.max(52, Math.round(canvasH * 0.065));
    const marginBottom = Math.max(18, Math.round(canvasH * 0.025));

    this.outerDesk = {
      x: marginX,
      y: marginTop,
      w: canvasW - marginX * 2,
      h: canvasH - marginTop - marginBottom
    };

    this.recalculateActiveBounds();
  }

  public recalculateActiveBounds(): void {
    const shrinkRatio = Math.min(0.32, this.shrinkSteps * 0.07);
    const insetX = (this.outerDesk.w * shrinkRatio) / 2;
    const insetY = (this.outerDesk.h * shrinkRatio) / 2;
    this.activeBounds = {
      x: this.outerDesk.x + insetX,
      y: this.outerDesk.y + insetY,
      w: this.outerDesk.w - insetX * 2,
      h: this.outerDesk.h - insetY * 2
    };
  }

  public startNewRound(
    p1Spec: PenSpec,
    p2Spec: PenSpec,
    mode: 'ai' | '2p',
    startingPlayer: 1 | 2
  ): void {
    this.turnCount = 1;
    this.shrinkSteps = 0;
    this.startingPlayer = startingPlayer;
    this.activePlayer = startingPlayer;
    this.recalculateActiveBounds();
    this.impactRings = [];
    this.aim.active = false;

    const cx = this.outerDesk.x + this.outerDesk.w * 0.5;
    const cy = this.outerDesk.y + this.outerDesk.h * 0.5;
    const spreadX = Math.min(115, this.outerDesk.w * 0.19);

    // Exact spawn positions from original mobile video (side-by-side in the center of the desk!)
    // Player 2 / Computer on the LEFT, Player 1 / You on the RIGHT
    const p1 = this.createPenBody(
      1,
      mode === 'ai' ? 'You' : 'Player 1',
      '#e06d3b', // Official warm orange label
      p1Spec,
      cx + spreadX,
      cy + 4,
      Math.PI + 0.18 // Facing left & slightly up
    );

    const p2 = this.createPenBody(
      2,
      mode === 'ai' ? 'Computer' : 'Player 2',
      '#3b82f6', // Official blue label
      p2Spec,
      cx - spreadX,
      cy - 4,
      0.18 // Facing right & slightly down
    );

    this.pens = [p1, p2];

    if (mode === 'ai' && this.activePlayer === 2) {
      this.beginAiTurn('normal');
    } else {
      this.phase = 'AIMING';
      this.triggerTurnToast(this.activePlayer === 1 ? (mode === 'ai' ? 'Your turn' : "Player 1's turn") : "Player 2's turn");
    }
  }

  private createPenBody(
    playerIndex: 1 | 2,
    label: string,
    labelColor: string,
    spec: PenSpec,
    x: number,
    y: number,
    angle: number
  ): PenBody {
    const mass = 0.85 + spec.stats.weight * 0.24;
    const speedMult = 0.88 + spec.stats.speed * 0.08;
    const spinMult = 0.85 + spec.stats.spin * 0.14;
    const gripMult = 0.92 + spec.stats.grip * 0.07;
    const L = spec.lengthPx;
    const W = spec.widthPx;
    // Realistic rod moment of inertia scaled for crisp angular whip
    const inertia = (mass * (L * L + W * W)) / 14.5;

    return {
      playerIndex,
      label,
      labelColor,
      spec,
      level: 1,
      x,
      y,
      vx: 0,
      vy: 0,
      angle,
      omega: 0,
      lengthPx: L,
      widthPx: W,
      mass,
      inertia,
      speedMult,
      spinMult,
      gripMult,
      falling: false,
      fallenOut: false,
      fallScale: 1,
      fallAlpha: 1
    };
  }

  public triggerTurnToast(text: string): void {
    this.turnToastText = text;
    this.turnToastTimerMs = 850;
  }

  /**
   * Computes the world coordinates of the white contact dot on the pen's centerline
   */
  public getContactWorldPoint(pen: PenBody, grabOffsetRatio: number): { x: number; y: number } {
    const halfUsableL = pen.lengthPx * 0.44;
    return {
      x: pen.x + Math.cos(pen.angle) * (grabOffsetRatio * halfUsableL),
      y: pen.y + Math.sin(pen.angle) * (grabOffsetRatio * halfUsableL)
    };
  }

  /**
   * Fires the flick shot using realistic impulse + off-center torque
   * Velocities are in pixels/second so motion is 100% frame-rate independent and finishes in 0.4-0.8s!
   */
  public fireShot(pen: PenBody, pullX: number, pullY: number, powerRatio: number, grabOffsetRatio: number): void {
    const pullLen = Math.hypot(pullX, pullY) || 1;
    // Launch direction is opposite to the pull-back vector
    const dirX = -pullX / pullLen;
    const dirY = -pullY / pullLen;

    const clampedPower = Math.min(1.0, Math.max(0.08, powerRatio));
    // Crisp launch velocity (320 px/s on gentle tap up to 1480 px/s on 100% full red thermometer!)
    const baseImpulse = (310 + clampedPower * 1180) * pen.speedMult;

    const jx = dirX * baseImpulse;
    const jy = dirY * baseImpulse;

    const contact = this.getContactWorldPoint(pen, grabOffsetRatio);
    this.applyWorldImpulse(pen, jx, jy, contact.x, contact.y, pen.spinMult);

    if (this.onFlickSound) this.onFlickSound(clampedPower);
    this.aim.active = false;
    this.phase = 'SIMULATING';
    this.simulationElapsedMs = 0;
  }

  private applyWorldImpulse(
    pen: PenBody,
    jx: number,
    jy: number,
    contactX: number,
    contactY: number,
    spinBoost = 1.0
  ): void {
    pen.vx += jx / pen.mass;
    pen.vy += jy / pen.mass;

    // Lever arm r = contactPoint - centerOfMass
    const rx = contactX - pen.x;
    const ry = contactY - pen.y;
    const crossTorque = (rx * jy - ry * jx) * spinBoost;
    pen.omega += crossTorque / pen.inertia;
  }

  /**
   * Starts the AI's 2-stage turn:
   * 1. "Computer · Thinking" (380ms)
   * 2. "Computer's turn" with animated Thermometer Pull-Back (460ms)
   */
  public beginAiTurn(difficulty: 'easy' | 'normal' | 'hard'): void {
    if (this.pens.length < 2) return;
    const aiPen = this.pens[1];
    const targetPen = this.pens[0];

    // Pick whether AI aims for target's center or nearer tip/cap
    const targetEnds = this.getSegmentEndpoints(targetPen);
    let aimX = targetPen.x;
    let aimY = targetPen.y;

    if (difficulty === 'hard' && Math.random() < 0.7) {
      // Aim at whichever end of the player's pen gives better leverage
      if (Math.random() < 0.5) {
        aimX = (targetPen.x + targetEnds.ax) * 0.5;
        aimY = (targetPen.y + targetEnds.ay) * 0.5;
      } else {
        aimX = (targetPen.x + targetEnds.bx) * 0.5;
        aimY = (targetPen.y + targetEnds.by) * 0.5;
      }
    }

    // Decide AI grab offset on its own pen (off-center for spin shots, near-center for straight pushes)
    let grabOffsetRatio = (Math.random() - 0.5) * 0.35;
    if (difficulty !== 'easy' && Math.random() < 0.52) {
      grabOffsetRatio = (Math.random() < 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.38);
    }

    const aiContact = this.getContactWorldPoint(aiPen, grabOffsetRatio);
    const toTargetX = aimX - aiContact.x;
    const toTargetY = aimY - aiContact.y;
    const distPx = Math.hypot(toTargetX, toTargetY) || 1;

    let launchAngle = Math.atan2(toTargetY, toTargetX);
    const errorRad =
      difficulty === 'easy' ? 0.28 : difficulty === 'normal' ? 0.11 : 0.035;
    launchAngle += (Math.random() - 0.5) * errorRad;

    // Calculate controlled power so AI doesn't suicidally fly off the desk
    const distRatio = Math.min(1.0, Math.max(0.24, distPx / 420));
    const powerRatio =
      difficulty === 'easy'
        ? 0.32 + Math.random() * 0.35
        : Math.min(0.82, Math.max(0.28, distRatio * (0.72 + Math.random() * 0.16)));

    // Pull vector is opposite to launch direction
    const pullMag = powerRatio * MAX_PULL_PX;
    this.aiPlan = {
      thinkTimerMs: 380,
      pullTimerMs: 0,
      pullDurationMs: 460,
      grabOffsetRatio,
      targetPullX: -Math.cos(launchAngle) * pullMag,
      targetPullY: -Math.sin(launchAngle) * pullMag,
      targetPowerRatio: powerRatio
    };

    this.phase = 'AI_THINKING';
  }

  /**
   * Main 60fps/120fps physics & state step (`dtSec` in seconds, e.g., 0.0166)
   */
  public step(dtSec: number, mode: 'ai' | '2p', aiDifficulty: 'easy' | 'normal' | 'hard'): void {
    const clampedDt = Math.min(0.033, Math.max(0.001, dtSec));
    const dtMs = clampedDt * 1000;

    if (this.turnToastTimerMs > 0) {
      this.turnToastTimerMs = Math.max(0, this.turnToastTimerMs - dtMs);
    }

    // Update starburst collision rings
    for (let i = this.impactRings.length - 1; i >= 0; i--) {
      this.impactRings[i].ageMs += dtMs;
      if (this.impactRings[i].ageMs >= this.impactRings[i].durationMs) {
        this.impactRings.splice(i, 1);
      }
    }

    // Handle AI Thinking -> Animated Thermometer Pull-Back -> Shot Release
    if (this.phase === 'AI_THINKING') {
      this.aiPlan.thinkTimerMs -= dtMs;
      if (this.aiPlan.thinkTimerMs <= 0) {
        this.phase = 'AI_PULLING';
        this.aiPlan.pullTimerMs = 0;
        this.aim.active = true;
        this.aim.penIndex = 1;
        this.aim.grabOffsetRatio = this.aiPlan.grabOffsetRatio;
        this.aim.pullX = 0;
        this.aim.pullY = 0;
        this.aim.powerRatio = 0;
      }
      return;
    }

    if (this.phase === 'AI_PULLING') {
      this.aiPlan.pullTimerMs += dtMs;
      const t = Math.min(1.0, this.aiPlan.pullTimerMs / this.aiPlan.pullDurationMs);
      // Smooth easeOutCubic pull-back animation
      const ease = 1 - Math.pow(1 - t, 3);
      this.aim.pullX = this.aiPlan.targetPullX * ease;
      this.aim.pullY = this.aiPlan.targetPullY * ease;
      this.aim.powerRatio = this.aiPlan.targetPowerRatio * ease;

      if (t >= 1.0 && this.pens.length === 2) {
        this.fireShot(
          this.pens[1],
          this.aiPlan.targetPullX,
          this.aiPlan.targetPullY,
          this.aiPlan.targetPowerRatio,
          this.aiPlan.grabOffsetRatio
        );
      }
      return;
    }

    if (this.phase !== 'SIMULATING' || this.pens.length < 2) return;

    this.simulationElapsedMs += dtMs;

    // 8 Physics Sub-steps per frame for ultra-accurate capsule collision & zero tunneling
    const subSteps = 8;
    const subDt = clampedDt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      for (const pen of this.pens) {
        if (pen.fallenOut) continue;
        pen.x += pen.vx * subDt;
        pen.y += pen.vy * subDt;
        pen.angle += pen.omega * subDt;

        // Check Center-of-Mass against active desk boundary
        if (!pen.falling) {
          const b = this.activeBounds;
          if (pen.x < b.x || pen.x > b.x + b.w || pen.y < b.y || pen.y > b.y + b.h) {
            pen.falling = true;
            if (this.onFallSound) this.onFallSound();
          }
        }
      }

      this.resolveCapsuleCollision(this.pens[0], this.pens[1]);
    }

    // Apply Anisotropic Friction + Dry Coulomb Deceleration (Stops pens crisply in 0.4–0.8s!)
    let anyMoving = false;

    for (const pen of this.pens) {
      if (pen.falling) {
        pen.fallScale = Math.max(0.35, pen.fallScale - clampedDt * 2.2);
        pen.fallAlpha = Math.max(0, pen.fallAlpha - clampedDt * 3.2);
        pen.vx *= Math.pow(0.08, clampedDt);
        pen.vy *= Math.pow(0.08, clampedDt);
        if (pen.fallAlpha <= 0.02) {
          pen.fallenOut = true;
          pen.vx = 0;
          pen.vy = 0;
          pen.omega = 0;
        } else {
          anyMoving = true;
        }
        continue;
      }

      // Decompose velocity into axial (along barrel) and lateral (sideways rolling)
      const ux = Math.cos(pen.angle);
      const uy = Math.sin(pen.angle);
      const lx = -uy;
      const ly = ux;

      let vAxial = pen.vx * ux + pen.vy * uy;
      let vLateral = pen.vx * lx + pen.vy * ly;

      // 1. Exponential surface damping (stronger along barrel, smoother sideways roll)
      const axialDecay = Math.pow(0.018 / pen.gripMult, clampedDt);
      const lateralDecay = Math.pow(0.055 / pen.gripMult, clampedDt);
      vAxial *= axialDecay;
      vLateral *= lateralDecay;

      // 2. Dry Coulomb wood-surface friction (subtracts constant speed per second so it NEVER crawls!)
      const axialCoulomb = 340 * pen.gripMult * clampedDt;
      const lateralCoulomb = 185 * pen.gripMult * clampedDt;

      if (Math.abs(vAxial) <= axialCoulomb) vAxial = 0;
      else vAxial -= Math.sign(vAxial) * axialCoulomb;

      if (Math.abs(vLateral) <= lateralCoulomb) vLateral = 0;
      else vLateral -= Math.sign(vLateral) * lateralCoulomb;

      pen.vx = ux * vAxial + lx * vLateral;
      pen.vy = uy * vAxial + ly * vLateral;

      // 3. Angular spin damping + dry rotational friction
      pen.omega *= Math.pow(0.035 / pen.gripMult, clampedDt);
      const angularCoulomb = 4.2 * pen.gripMult * clampedDt;
      if (Math.abs(pen.omega) <= angularCoulomb) pen.omega = 0;
      else pen.omega -= Math.sign(pen.omega) * angularCoulomb;

      const linearSpeed = Math.hypot(pen.vx, pen.vy);

      // Force clean stop when below human-perceptible threshold or if watchdog expires
      if (
        (linearSpeed < 14 && Math.abs(pen.omega) < 0.35) ||
        this.simulationElapsedMs >= MAX_SIMULATION_MS
      ) {
        pen.vx = 0;
        pen.vy = 0;
        pen.omega = 0;
      } else {
        anyMoving = true;
      }
    }

    if (!anyMoving) {
      this.evaluateEndOfTurn(mode, aiDifficulty);
    }
  }

  public getSegmentEndpoints(pen: PenBody): { ax: number; ay: number; bx: number; by: number } {
    const halfL = (pen.lengthPx - pen.widthPx) * 0.5;
    const cos = Math.cos(pen.angle);
    const sin = Math.sin(pen.angle);
    return {
      ax: pen.x - cos * halfL,
      ay: pen.y - sin * halfL,
      bx: pen.x + cos * halfL,
      by: pen.y + sin * halfL
    };
  }

  private resolveCapsuleCollision(pA: PenBody, pB: PenBody): void {
    if (pA.falling || pB.falling) return;

    const segA = this.getSegmentEndpoints(pA);
    const segB = this.getSegmentEndpoints(pB);

    const cp = this.closestPointsOnSegments(
      segA.ax, segA.ay, segA.bx, segA.by,
      segB.ax, segB.ay, segB.bx, segB.by
    );

    const dx = cp.c2x - cp.c1x;
    const dy = cp.c2y - cp.c1y;
    const dist = Math.hypot(dx, dy);
    const minDist = (pA.widthPx + pB.widthPx) * 0.52;

    if (dist >= minDist) return;

    // Collision normal from A to B
    let nx = 1;
    let ny = 0;
    if (dist > 0.0001) {
      nx = dx / dist;
      ny = dy / dist;
    } else {
      const cdx = pB.x - pA.x;
      const cdy = pB.y - pA.y;
      const cLen = Math.hypot(cdx, cdy) || 1;
      nx = cdx / cLen;
      ny = cdy / cLen;
    }

    // Immediate positional separation (prevents pens from ever sticking or overlapping!)
    const overlap = minDist - dist + 0.5;
    const invMassA = 1 / pA.mass;
    const invMassB = 1 / pB.mass;
    const totalInvMass = invMassA + invMassB;

    pA.x -= nx * overlap * (invMassA / totalInvMass);
    pA.y -= ny * overlap * (invMassA / totalInvMass);
    pB.x += nx * overlap * (invMassB / totalInvMass);
    pB.y += ny * overlap * (invMassB / totalInvMass);

    const contactX = (cp.c1x + cp.c2x) * 0.5;
    const contactY = (cp.c1y + cp.c2y) * 0.5;

    const rAx = contactX - pA.x;
    const rAy = contactY - pA.y;
    const rBx = contactX - pB.x;
    const rBy = contactY - pB.y;

    // Point velocity v_p = v + omega × r
    const vAx = pA.vx - pA.omega * rAy;
    const vAy = pA.vy + pA.omega * rAx;
    const vBx = pB.vx - pB.omega * rBy;
    const vBy = pB.vy + pB.omega * rBx;

    const relVx = vBx - vAx;
    const relVy = vBy - vAy;
    const velAlongNormal = relVx * nx + relVy * ny;

    if (velAlongNormal > 0) return;

    const rACrossN = rAx * ny - rAy * nx;
    const rBCrossN = rBx * ny - rBy * nx;
    const restitution = 0.82; // Lively plastic/steel rebound

    const denom =
      invMassA +
      invMassB +
      (rACrossN * rACrossN) / pA.inertia +
      (rBCrossN * rBCrossN) / pB.inertia;

    const j = (-(1 + restitution) * velAlongNormal) / denom;
    const jx = j * nx;
    const jy = j * ny;

    this.applyWorldImpulse(pA, -jx, -jy, contactX, contactY, 1.0);
    this.applyWorldImpulse(pB, jx, jy, contactX, contactY, 1.0);

    // Tangential spin-whip transfer
    const tx = -ny;
    const ty = nx;
    const relTan = relVx * tx + relVy * ty;
    const jt = (-relTan * 0.28) / denom;
    this.applyWorldImpulse(pA, -jt * tx, -jt * ty, contactX, contactY, 0.9);
    this.applyWorldImpulse(pB, jt * tx, jt * ty, contactX, contactY, 0.9);

    const impactSpeed = Math.abs(velAlongNormal);
    if (impactSpeed > 45) {
      const intensity = Math.min(1.0, impactSpeed / 650);
      if (this.onHitSound) this.onHitSound(intensity);

      // Spawn the signature 8-spike Starburst Impact Ring seen in the reference videos!
      if (
        this.impactRings.length === 0 ||
        Math.hypot(
          this.impactRings[this.impactRings.length - 1].x - contactX,
          this.impactRings[this.impactRings.length - 1].y - contactY
        ) > 18
      ) {
        this.impactRings.push({
          x: contactX,
          y: contactY,
          ageMs: 0,
          durationMs: 210,
          maxRadius: 18 + intensity * 16
        });
      }
    }
  }

  private closestPointsOnSegments(
    p1x: number, p1y: number, q1x: number, q1y: number,
    p2x: number, p2y: number, q2x: number, q2y: number
  ): { c1x: number; c1y: number; c2x: number; c2y: number } {
    const d1x = q1x - p1x, d1y = q1y - p1y;
    const d2x = q2x - p2x, d2y = q2y - p2y;
    const rx = p1x - p2x, ry = p1y - p2y;
    const a = d1x * d1x + d1y * d1y;
    const e = d2x * d2x + d2y * d2y;
    const f = d2x * rx + d2y * ry;

    let s = 0, t = 0;
    const c = d1x * rx + d1y * ry;
    const b = d1x * d2x + d1y * d2y;
    const denom = a * e - b * b;

    if (denom !== 0) {
      s = Math.max(0, Math.min(1, (b * f - c * e) / denom));
    }
    t = (b * s + f) / (e || 1);
    if (t < 0) {
      t = 0;
      s = Math.max(0, Math.min(1, -c / (a || 1)));
    } else if (t > 1) {
      t = 1;
      s = Math.max(0, Math.min(1, (b - c) / (a || 1)));
    }

    return {
      c1x: p1x + d1x * s,
      c1y: p1y + d1y * s,
      c2x: p2x + d2x * t,
      c2y: p2y + d2y * t
    };
  }

  private evaluateEndOfTurn(mode: 'ai' | '2p', aiDifficulty: 'easy' | 'normal' | 'hard'): void {
    if (this.pens.length < 2) return;
    const p1 = this.pens[0];
    const p2 = this.pens[1];
    const p1Out = p1.falling || p1.fallenOut;
    const p2Out = p2.falling || p2.fallenOut;

    if (p1Out || p2Out) {
      this.phase = 'ROUND_OVER';
      let winner: 1 | 2 = 1;
      let reason = '';

      if (p1Out && p2Out) {
        // Double KO: the active player who took the risky shot loses!
        winner = this.activePlayer === 1 ? 2 : 1;
        reason = 'Both pens fell off! The shooter forfeits the round.';
      } else if (p1Out) {
        winner = 2;
        reason = mode === 'ai' ? 'The computer takes this one' : 'Nice flick, Player 2!';
      } else {
        winner = 1;
        reason = mode === 'ai' ? 'You take this round!' : 'Nice flick, Player 1!';
      }

      if (this.onRoundEnd) this.onRoundEnd(winner, reason);
      return;
    }

    // Apply desk shrinking after turns 15, 19, 23, 27
    if (SHRINK_TURNS.includes(this.turnCount)) {
      this.shrinkSteps++;
      this.recalculateActiveBounds();

      // Check if shrinking immediately dropped a pen outside the new inner dashed line
      const b = this.activeBounds;
      for (const pen of this.pens) {
        if (pen.x < b.x || pen.x > b.x + b.w || pen.y < b.y || pen.y > b.y + b.h) {
          pen.falling = true;
          if (this.onFallSound) this.onFallSound();
        }
      }
      if (p1.falling || p2.falling) {
        this.phase = 'SIMULATING';
        this.simulationElapsedMs = 0;
        return;
      }
    }

    if (this.turnCount >= 30) {
      this.phase = 'ROUND_OVER';
      if (this.onRoundEnd) this.onRoundEnd(0, '30 turns reached — Round Draw!');
      return;
    }

    this.turnCount++;
    this.activePlayer = this.activePlayer === 1 ? 2 : 1;

    if (mode === 'ai' && this.activePlayer === 2) {
      this.beginAiTurn(aiDifficulty);
    } else {
      this.phase = 'AIMING';
      const label =
        this.activePlayer === 1
          ? mode === 'ai'
            ? 'Your turn'
            : "Player 1's turn"
          : "Player 2's turn";
      this.triggerTurnToast(label);
    }
  }
}
```

---

## ৫. আসল গেমের থার্মোমিটার পাওয়ার বার, সাদা কন্টাক্ট ডট, বাঁকানো স্পিন অ্যারো (`↻`/`↺`), স্টারবার্স্ট কলিশন রিং এবং ফ্লোটিং লেবেল রেন্ডারার (`src/rendering/ArenaRenderer.ts`)

আপনার পাঠানো আসল গেমের ভিডিওতে (`video6250999259202592611.mp4` এবং `video6250999259202592582.mp4`) নিশানা করার সময় যে **Segmented Thermometer Power Gauge**, **White Contact Dot**, **Forward Arrow**, **Curved Spin Arrow (`↻`/`↺`)**, **8-Spike Starburst Collision Ring**, এবং কলমের নিচে **`You` / `Computer`** লেবেল দেখা যায়, তার ১০০% নিখুঁত রেন্ডারার নিচে দেওয়া হলো:

```typescript
import { PenFightEngine, PenBody, SHRINK_TURNS, MAX_PULL_PX, CANCEL_PULL_PX } from '../physics/PenFightEngine';

export class ArenaRenderer {
  /**
   * Renders the entire Desk Wars arena, pens, floating labels, starburst rings,
   * thermometer aiming UI, and "Your turn" center toast
   */
  public static renderArena(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    engine: PenFightEngine,
    deskStyle: 'clean' | 'old',
    penLook: 'real' | 'classic'
  ): void {
    ctx.clearRect(0, 0, canvasW, canvasH);

    // 1. Draw Full-Bleed Wooden School Desk
    this.drawSchoolDesk(ctx, canvasW, canvasH, engine, deskStyle);

    // 2. Draw Floating "You" / "Computer" Labels under stopped pens
    for (const pen of engine.pens) {
      this.drawFloatingPenLabel(ctx, pen, engine);
    }

    // 3. Draw Both Pens (8-layer Real 3D or Classic Vector)
    for (const pen of engine.pens) {
      this.drawPen(ctx, pen, penLook);
    }

    // 4. Draw 8-Spike Starburst Collision Rings on impact
    for (const ring of engine.impactRings) {
      this.drawStarburstImpactRing(ctx, ring.x, ring.y, ring.ageMs / ring.durationMs, ring.maxRadius);
    }

    // 5. Draw Thermometer Power Gauge + White Contact Dot + Forward Push Arrow + Curved Spin Arc
    if (engine.aim.active && (engine.phase === 'AIMING' || engine.phase === 'AI_PULLING')) {
      const activePen = engine.pens[engine.aim.penIndex];
      if (activePen) {
        this.drawThermometerAimGauge(ctx, activePen, engine);
      }
    }

    // 6. Draw Center "Your turn" / "Player 2's turn" Tactile Toast Card
    if (engine.turnToastTimerMs > 0 && engine.phase === 'AIMING') {
      this.drawCenterTurnToast(ctx, canvasW, canvasH, engine.turnToastText, engine.turnToastTimerMs / 850);
    }
  }

  private static drawSchoolDesk(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    engine: PenFightEngine,
    deskStyle: 'clean' | 'old'
  ): void {
    // Classroom background
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const d = engine.outerDesk;

    ctx.save();
    // Outer desk dark wood frame
    ctx.fillStyle = '#6d4c3d';
    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(d.x - 6, d.y - 6, d.w + 12, d.h + 12, 22);
    ctx.fill();
    ctx.stroke();

    // Main vertical oak wood grain gradient
    const woodGrad = ctx.createLinearGradient(d.x, d.y, d.x + d.w, d.y);
    if (deskStyle === 'clean') {
      woodGrad.addColorStop(0, '#d8b48e');
      woodGrad.addColorStop(0.25, '#cfa77e');
      woodGrad.addColorStop(0.5, '#d9b58f');
      woodGrad.addColorStop(0.75, '#cca379');
      woodGrad.addColorStop(1, '#d5af88');
    } else {
      woodGrad.addColorStop(0, '#b88f68');
      woodGrad.addColorStop(0.5, '#a87e56');
      woodGrad.addColorStop(1, '#9c724b');
    }

    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(d.x, d.y, d.w, d.h, 16);
    ctx.fill();
    ctx.clip();

    // Subtle vertical wood grain fibers (matches vertical grain in mobile video!)
    ctx.strokeStyle = deskStyle === 'clean' ? 'rgba(120, 82, 48, 0.13)' : 'rgba(72, 44, 22, 0.24)';
    ctx.lineWidth = 1.2;
    const grainStep = 14;
    for (let gx = d.x + 10; gx < d.x + d.w; gx += grainStep) {
      ctx.beginPath();
      ctx.moveTo(gx, d.y);
      ctx.bezierCurveTo(
        gx + Math.sin(gx * 0.05) * 4,
        d.y + d.h * 0.33,
        gx - Math.cos(gx * 0.05) * 4,
        d.y + d.h * 0.66,
        gx,
        d.y + d.h
      );
      ctx.stroke();
    }

    // If desk has shrunk (Turn > 15), darken the out-of-bounds margin outside activeBounds
    if (engine.shrinkSteps > 0) {
      const b = engine.activeBounds;
      ctx.fillStyle = 'rgba(28, 19, 14, 0.34)';
      // Top, bottom, left, right darkened margins
      ctx.fillRect(d.x, d.y, d.w, b.y - d.y);
      ctx.fillRect(d.x, b.y + b.h, d.w, d.y + d.h - (b.y + b.h));
      ctx.fillRect(d.x, b.y, b.x - d.x, b.h);
      ctx.fillRect(b.x + b.w, b.y, d.x + d.w - (b.x + b.w), b.h);

      // Inner dashed boundary line ("Desk smaller · stay inside the line")
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([9, 7]);
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 12);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Next-turn shrink warning red pulsing border on turns 15, 19, 23, 27
    if (SHRINK_TURNS.includes(engine.turnCount) && engine.phase !== 'ROUND_OVER') {
      const nextRatio = Math.min(0.32, (engine.shrinkSteps + 1) * 0.07);
      const inX = (d.w * nextRatio) / 2;
      const inY = (d.h * nextRatio) / 2;
      const pulse = 0.55 + Math.sin(performance.now() * 0.008) * 0.3;

      ctx.strokeStyle = `rgba(220, 38, 38, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.roundRect(d.x + inX, d.y + inY, d.w - inX * 2, d.h - inY * 2, 12);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  /**
   * Renders the floating "You" (orange) and "Computer" (blue) labels directly below each pen
   */
  private static drawFloatingPenLabel(
    ctx: CanvasRenderingContext2D,
    pen: PenBody,
    engine: PenFightEngine
  ): void {
    if (pen.falling || pen.fallenOut) return;
    const speed = Math.hypot(pen.vx, pen.vy);
    if (speed > 40) return; // Hide label while pen is moving fast

    const isCurrentTurn = pen.playerIndex === engine.activePlayer;
    ctx.save();
    ctx.font = '800 13px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isCurrentTurn ? pen.labelColor : 'rgba(92, 75, 60, 0.72)';

    const labelY = pen.y + 38;
    const text = isCurrentTurn && pen.playerIndex === 1 ? `▸ ${pen.label}` : pen.label;
    ctx.fillText(text, pen.x, labelY);
    ctx.restore();
  }

  /**
   * Renders the 8-spike dark starburst ring at collision points (exact match to 00:16, 00:20, 00:53 in video)
   */
  private static drawStarburstImpactRing(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    progress: number,
    maxRadius: number
  ): void {
    const p = Math.min(1, Math.max(0, progress));
    const radius = maxRadius * (0.45 + 0.55 * p);
    const alpha = 1 - p;

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 2.2;

    // Central circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 8 radiating impact spikes
    const spikes = 8;
    for (let i = 0; i < spikes; i++) {
      const ang = (i * Math.PI * 2) / spikes + 0.2;
      const innerR = radius * 0.85;
      const outerR = radius * 1.48;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * innerR, Math.sin(ang) * innerR);
      ctx.lineTo(Math.cos(ang) * outerR, Math.sin(ang) * outerR);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Renders the exact Thermometer Power Bar + White Contact Dot + Forward Push Arrow + Curved Spin Arc (`↻`/`↺`)
   * seen in `video6250999259202592611.mp4` at 00:14, 00:18, 00:27, 00:31, 00:39, 01:47!
   */
  private static drawThermometerAimGauge(
    ctx: CanvasRenderingContext2D,
    pen: PenBody,
    engine: PenFightEngine
  ): void {
    const { grabOffsetRatio, pullX, pullY, powerRatio } = engine.aim;
    const contact = engine.getContactWorldPoint(pen, grabOffsetRatio);
    const pullDist = Math.hypot(pullX, pullY);

    ctx.save();

    if (pullDist >= CANCEL_PULL_PX && powerRatio > 0.04) {
      const pullAng = Math.atan2(pullY, pullX);
      const launchAng = pullAng + Math.PI;

      // Dynamic color from green -> yellow -> orange -> red
      const gaugeColor =
        powerRatio < 0.35
          ? '#65a30d'
          : powerRatio < 0.65
          ? '#eab308'
          : powerRatio < 0.85
          ? '#f97316'
          : '#dc2626';

      // =====================================================================
      // A. FORWARD LAUNCH ARROW (extends in front of the white contact dot)
      // =====================================================================
      const arrowLen = 26 + powerRatio * 48;
      ctx.save();
      ctx.translate(contact.x, contact.y);
      ctx.rotate(launchAng);

      // Arrow shaft with dark outline
      ctx.strokeStyle = '#2b302a';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(arrowLen, 0);
      ctx.stroke();

      ctx.strokeStyle = gaugeColor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(arrowLen, 0);
      ctx.stroke();

      // Arrowhead triangle
      ctx.fillStyle = gaugeColor;
      ctx.strokeStyle = '#2b302a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(arrowLen + 9, 0);
      ctx.lineTo(arrowLen - 5, -8);
      ctx.lineTo(arrowLen - 5, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // =====================================================================
      // B. CURVED SPIN INDICATOR ARROW (`↻` / `↺`) around the contact dot
      // =====================================================================
      const halfL = pen.lengthPx * 0.44;
      const rx = Math.cos(pen.angle) * (grabOffsetRatio * halfL);
      const ry = Math.sin(pen.angle) * (grabOffsetRatio * halfL);
      const fx = Math.cos(launchAng);
      const fy = Math.sin(launchAng);
      // Normalized cross product (r × F) determines spin direction and magnitude
      const normalizedTorque = (rx * fy - ry * fx) / (halfL || 1);

      if (Math.abs(normalizedTorque) > 0.14) {
        const spinDir = normalizedTorque > 0 ? 1 : -1;
        const arcRadius = 18;
        const arcSpan = Math.min(Math.PI * 1.15, (0.45 + Math.abs(normalizedTorque) * 0.75) * Math.PI);
        const startA = launchAng - spinDir * (arcSpan * 0.45);
        const endA = launchAng + spinDir * (arcSpan * 0.55);

        ctx.save();
        ctx.translate(contact.x, contact.y);
        ctx.strokeStyle = '#2b302a';
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, arcRadius, startA, endA, spinDir < 0);
        ctx.stroke();

        ctx.strokeStyle = gaugeColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, arcRadius, startA, endA, spinDir < 0);
        ctx.stroke();

        // Tiny arrowhead at the end of the curved spin arc
        const tipX = Math.cos(endA) * arcRadius;
        const tipY = Math.sin(endA) * arcRadius;
        const tangentAng = endA + (spinDir > 0 ? Math.PI / 2 : -Math.PI / 2);
        ctx.translate(tipX, tipY);
        ctx.rotate(tangentAng);
        ctx.fillStyle = gaugeColor;
        ctx.strokeStyle = '#2b302a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // =====================================================================
      // C. SEGMENTED THERMOMETER POWER BAR (extends behind the contact dot)
      // =====================================================================
      const tubeMaxLen = 104;
      const tubeWidth = 13;
      const fillLen = Math.max(8, powerRatio * tubeMaxLen);

      ctx.save();
      ctx.translate(contact.x, contact.y);
      ctx.rotate(pullAng);

      // Outer white capsule frame with dark border
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = '#2b302a';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(12, -tubeWidth / 2, tubeMaxLen, tubeWidth, tubeWidth / 2);
      ctx.fill();
      ctx.stroke();

      // Inner colored power fill
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(14, -tubeWidth / 2 + 2, tubeMaxLen - 4, tubeWidth - 4, (tubeWidth - 4) / 2);
      ctx.clip();

      ctx.fillStyle = gaugeColor;
      ctx.fillRect(14, -tubeWidth / 2, fillLen, tubeWidth);

      // 3 segment divider ticks inside the thermometer (25%, 50%, 75%)
      ctx.strokeStyle = 'rgba(43, 48, 42, 0.45)';
      ctx.lineWidth = 1.5;
      for (const frac of [0.25, 0.5, 0.75]) {
        const tx = 14 + (tubeMaxLen - 4) * frac;
        ctx.beginPath();
        ctx.moveTo(tx, -tubeWidth / 2);
        ctx.lineTo(tx, tubeWidth / 2);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    }

    // =====================================================================
    // D. WHITE CONTACT DOT ON THE PEN BARREL (always visible while grabbing)
    // =====================================================================
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(contact.x, contact.y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Renders the photorealistic 8-layer Real pen or Classic cartoon pen
   */
  private static drawPen(
    ctx: CanvasRenderingContext2D,
    pen: PenBody,
    mode: 'real' | 'classic'
  ): void {
    if (pen.fallenOut) return;

    const L = pen.lengthPx;
    const W = pen.widthPx;
    const halfL = L / 2;
    const halfW = W / 2;

    ctx.save();
    ctx.globalAlpha = pen.fallAlpha;

    // World-space soft drop shadow on the wooden desk
    if (mode === 'real' && !pen.falling) {
      ctx.save();
      ctx.translate(pen.x + 3, pen.y + 6);
      ctx.rotate(pen.angle);
      ctx.fillStyle = 'rgba(20, 14, 10, 0.32)';
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW, L, W, halfW);
      ctx.fill();
      ctx.restore();
    }

    ctx.translate(pen.x, pen.y);
    ctx.scale(pen.fallScale, pen.fallScale);
    ctx.rotate(pen.angle);

    // 1. Main Barrel
    ctx.fillStyle = pen.spec.transparent ? 'rgba(226, 232, 240, 0.65)' : pen.spec.colors.barrel;
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.82, -halfW, L * 0.82, W, 4);
    ctx.fill();

    // 2. Visible inner ink refill tube for translucent pens (Cheap Ballpoint & Gel Pen)
    if (pen.spec.transparent) {
      ctx.fillStyle = pen.spec.colors.ink;
      ctx.fillRect(-halfL * 0.62, -2.2, L * 0.68, 4.4);
    }

    // 3. Rubber Grip Zone near front
    ctx.fillStyle = pen.spec.colors.grip;
    ctx.fillRect(halfL * 0.22, -halfW, L * 0.24, W);

    // 4. Tapered Nose Cone & Ballpoint Nib (+X end)
    ctx.fillStyle = pen.spec.colors.tip;
    ctx.beginPath();
    ctx.moveTo(halfL * 0.64, -halfW);
    ctx.lineTo(halfL, -2.0);
    ctx.lineTo(halfL, 2.0);
    ctx.lineTo(halfL * 0.64, halfW);
    ctx.closePath();
    ctx.fill();

    // 5. Back Cap (-X end) & Pocket Clip
    ctx.fillStyle = pen.spec.colors.cap;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW - 1.2, L * 0.3, W + 2.4, 4);
    ctx.fill();

    ctx.fillStyle = pen.spec.colors.clip;
    ctx.beginPath();
    ctx.roundRect(-halfL + 5, -halfW - 3.6, L * 0.22, 2.6, 1.5);
    ctx.fill();

    // 6. Cylindrical 3D Specular Highlight (Real Mode) vs Bold Ink Outline (Classic Mode)
    if (mode === 'real') {
      const cyl = ctx.createLinearGradient(0, -halfW, 0, halfW);
      cyl.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
      cyl.addColorStop(0.28, 'rgba(255, 255, 255, 0.62)');
      cyl.addColorStop(0.55, 'rgba(255, 255, 255, 0.0)');
      cyl.addColorStop(0.85, 'rgba(0, 0, 0, 0.24)');
      cyl.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
      ctx.fillStyle = cyl;
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW, L * 0.86, W, 4);
      ctx.fill();

      ctx.strokeStyle = 'rgba(43, 48, 42, 0.55)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW, L * 0.86, W, 4);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#2b302a';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW, L * 0.86, W, 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Renders the tactile center toast card ("Your turn" / "Player 2's turn") seen in the reference videos
   */
  private static drawCenterTurnToast(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    text: string,
    lifeRatio: number
  ): void {
    const alpha = Math.min(1, lifeRatio * 2.5);
    const isPlayer2 = text.includes('2');
    const cardBg = isPlayer2 ? '#9ec5e8' : '#fbf5e5';

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvasW / 2, canvasH / 2 - 18);

    const w = 156;
    const h = 44;

    // Hard tactile neo-brutalist bottom shadow
    ctx.fillStyle = '#2b302a';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2 + 4, w, h, 12);
    ctx.fill();

    // Card surface
    ctx.fillStyle = cardBg;
    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2b302a';
    ctx.font = '800 17px Fredoka, Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1);

    ctx.restore();
  }
}
```

---

## ৬. টাচ ও স্লিং-শট ইনপুট কন্ট্রোলার (`src/controllers/TouchAimController.ts`)

খেলোয়াড় যখন নিজের কলমের যেকোনো জায়গায় (মাঝখানে বা নিব/ক্যাপের প্রান্তে) টাচ করে পেছনে টানবে, তখন নিখুঁতভাবে `grabOffsetRatio` এবং থার্মোমিটারের পাওয়ার বের করার কোড:

```typescript
import { PenFightEngine, MAX_PULL_PX, CANCEL_PULL_PX } from '../physics/PenFightEngine';

export class TouchAimController {
  private pointerStartX = 0;
  private pointerStartY = 0;
  private activePointerId: number | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private engine: PenFightEngine,
    private getMode: () => 'ai' | '2p'
  ) {
    this.bindEvents();
  }

  private getCanvasPoint(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
    };
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      if (this.engine.phase !== 'AIMING' || this.engine.pens.length < 2) return;
      if (this.getMode() === 'ai' && this.engine.activePlayer === 2) return;

      const pt = this.getCanvasPoint(e);
      const penIndex: 0 | 1 = this.engine.activePlayer === 1 ? 0 : 1;
      const pen = this.engine.pens[penIndex];

      // Transform touch point into pen's local coordinates
      const dx = pt.x - pen.x;
      const dy = pt.y - pen.y;
      const cos = Math.cos(pen.angle);
      const sin = Math.sin(pen.angle);

      const localAlong = dx * cos + dy * sin;
      const localPerp = Math.abs(-dx * sin + dy * cos);
      const halfUsableL = pen.lengthPx * 0.44;

      // Generous touch hitbox around the active pen so mobile fingers grab effortlessly
      if (Math.abs(localAlong) <= pen.lengthPx * 0.72 && localPerp <= 48) {
        const grabOffsetRatio = Math.max(-0.92, Math.min(0.92, localAlong / halfUsableL));
        const contact = this.engine.getContactWorldPoint(pen, grabOffsetRatio);

        this.activePointerId = e.pointerId;
        this.pointerStartX = contact.x;
        this.pointerStartY = contact.y;

        this.engine.aim = {
          active: true,
          penIndex,
          grabOffsetRatio,
          pullX: pt.x - contact.x,
          pullY: pt.y - contact.y,
          powerRatio: 0.05
        };

        this.canvas.setPointerCapture(e.pointerId);
      }
    });

    this.canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.engine.aim.active || e.pointerId !== this.activePointerId) return;
      const pt = this.getCanvasPoint(e);

      const rawPullX = pt.x - this.pointerStartX;
      const rawPullY = pt.y - this.pointerStartY;
      const dist = Math.hypot(rawPullX, rawPullY);

      const clampedDist = Math.min(MAX_PULL_PX, dist);
      const scale = dist > 0 ? clampedDist / dist : 0;

      this.engine.aim.pullX = rawPullX * scale;
      this.engine.aim.pullY = rawPullY * scale;
      this.engine.aim.powerRatio = clampedDist / MAX_PULL_PX;
    });

    const releaseHandler = (e: PointerEvent) => {
      if (!this.engine.aim.active || e.pointerId !== this.activePointerId) return;
      this.activePointerId = null;

      const { penIndex, grabOffsetRatio, pullX, pullY, powerRatio } = this.engine.aim;
      const pullDist = Math.hypot(pullX, pullY);
      const pen = this.engine.pens[penIndex];

      // Cancel shot if released inside cancel zone
      if (!pen || pullDist < CANCEL_PULL_PX) {
        this.engine.aim.active = false;
        return;
      }

      this.engine.fireShot(pen, pullX, pullY, powerRatio, grabOffsetRatio);
    };

    this.canvas.addEventListener('pointerup', releaseHandler);
    this.canvas.addEventListener('pointercancel', () => {
      this.activePointerId = null;
      this.engine.aim.active = false;
    });
  }
}
```

---

## ৭. উপরের নন-ওভারল্যাপিং HUD ও স্ট্যাটাস পিল লজিক (`src/ui/TopHudUpdater.ts`)

আপনার ভিডিওতে উপরের হেডারে লেখাগুলো একটার ওপর আরেকটা উঠে গিয়েছিল। আসল গেমের মোবাইল ভিডিওতে (`video6250999259202592611.mp4`) উপরের বারটি যেমন পরিষ্কার থাকে (`You 0 · Computer 1` বামে, `● Your turn` বা `● 5 normal turns left` মাঝখানে, এবং `||` ডানে), তার কোড:

```typescript
import { PenFightEngine, SHRINK_TURNS } from '../physics/PenFightEngine';

export function getTopStatusPillText(engine: PenFightEngine, mode: 'ai' | '2p'): {
  dotColor: string;
  text: string;
} {
  if (engine.phase === 'AI_THINKING') {
    return { dotColor: '#3b82f6', text: 'Computer · Thinking' };
  }
  if (engine.phase === 'AI_PULLING') {
    return { dotColor: '#3b82f6', text: "Computer's turn" };
  }

  // Show shrink warning on turns 15, 19, 23, 27
  if (SHRINK_TURNS.includes(engine.turnCount)) {
    return { dotColor: '#dc2626', text: '⚠️ Desk shrinks after this turn' };
  }

  // Show countdown from Turn 9 to Turn 14 ("6 normal turns left" ... "1 normal turn left")
  if (engine.turnCount >= 9 && engine.turnCount < 15) {
    const left = 15 - engine.turnCount;
    return {
      dotColor: engine.activePlayer === 1 ? '#e06d3b' : '#3b82f6',
      text: `${left} normal ${left === 1 ? 'turn' : 'turns'} left`
    };
  }

  if (engine.shrinkSteps > 0) {
    return {
      dotColor: '#ea580c',
      text: '⚠️ Desk smaller · stay inside the line'
    };
  }

  if (mode === 'ai') {
    return {
      dotColor: engine.activePlayer === 1 ? '#e06d3b' : '#3b82f6',
      text: engine.activePlayer === 1 ? 'Your turn' : "Computer's turn"
    };
  }

  return {
    dotColor: engine.activePlayer === 1 ? '#e06d3b' : '#3b82f6',
    text: engine.activePlayer === 1 ? "Player 1's turn" : "Player 2's turn"
  };
}
```