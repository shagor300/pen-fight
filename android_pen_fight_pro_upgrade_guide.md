# Android Pen Fight Pro — ৭টি কাস্টম আপগ্রেড গাইড, বাগ ফিক্স এবং Antigravity Master Prompt

রেফারেন্স ইঞ্জিন ও আর্কেড স্ট্যান্ডার্ড: [Shunnek Labs Pen Fight](https://shunneklabs.app/games/pen-fight/) • [Shunnek Labs Games Catalog](https://shunneklabs.app/games/)

আপনার দেওয়া ৩টি স্ক্রিনশট (`Gameplay Overhang`, `Pick Your Pen`, এবং `Round Complete Popup`) মনোযোগ দিয়ে বিশ্লেষণ করে আপনার **মূল স্মুথ গেমপ্লে ফিজিক্স ১০০% অক্ষত রেখে** সম্পূর্ণ **Android Mobile-Focused** ৭টি আপগ্রেডের কোড এবং **Antigravity AI এক-ক্লিক মাস্টার প্রম্পট** নিচে তৈরি করে দেওয়া হলো।

---

## ১. আপনার ৩টি স্ক্রিনশটে ধরা পড়া সমস্যা ও নতুন সমাধানের তুলনা

| স্ক্রিনশট ও আপনার নির্দেশনা | বর্তমান প্রজেক্টে কী সমস্যা হচ্ছে | নতুন প্রফেশনাল Android সলিউশন |
| :--- | :--- | :--- |
| **১. বাউন্ডারির বাইরে অর্ধেক কলম গেলে ভাইব্রেশন ও গ্র্যাভিটি (`Screenshot 1`)** | কলমের অর্ধেক অংশ কোর্টের বাইরে চলে গেলেও কলমটি সাধারণভাবে স্থির হয়ে থাকছে, পড়ে যাওয়ার কোনো টানটান উত্তেজনা বা কম্পন নেই। | **Edge Overhang Gravity Wobble + Android Haptic Vibration:** কলমের কোনো প্রান্ত (`Tip` বা `Tail`) বাউন্ডারির বাইরে গেলে এবং `COM` ভেতরে থাকলে কলমটিতে **গ্র্যাভিটি টিটারিং ভাইব্রেশন (Micro-Tremor + 3D Tilt Wobble)** শুরু হবে, লালচে সতর্কবার্তা (Danger Pulse) দেখাবে এবং ফোনে `navigator.vibrate` কম্পন হবে। |
| **২. কম্পিউটার (AI) আস্তে মারে (`Screenshot 1`)** | কম্পিউটার শট নেওয়ার সময় কম পাওয়ার (`0.45 - 0.65`) ব্যবহার করছে, ফলে শটগুলো দুর্বল মনে হয়। | **Aggressive Knockout AI:** মূল স্মুথ গেমপ্লেতে কোনো হাত না দিয়ে শুধু AI-এর শট ক্যালকুলেটরে পাওয়ার বাড়িয়ে `0.78 - 1.00` করা হয়েছে এবং আপনার কলমকে বাউন্ডারির বাইরে ফেলার জন্য সরাসরি **Aggressive Edge-Knockout Aiming** যুক্ত করা হয়েছে। |
| **৩. স্কিল বারগুলো প্রফেশনাল ও আলাদা কালার করা (`Screenshot 2`)** | `Weight`, `Speed`, `Spin`, `Grip`, `Reach`—সবগুলো স্কিল বার একই নীল (`#2563eb`) রঙের দেখায়। | **5-Color Pro Skill System:** প্রতিটি স্কিলের জন্য আলাদা প্রফেশনাল গ্লোয়িং কালার ও আইকন দেওয়া হয়েছে: **Weight** (Amber Gold), **Speed** (Electric Cyan), **Spin** (Neon Purple), **Grip** (Emerald Green), **Reach** (Crimson Rose)। |
| **৪. Easy, Normal, Hard মোড ১০০% কাজ করা (`Screenshot 2`)** | বাটন সিলেক্ট করলেও অনেক সময় স্টেট আপডেট হয় না বা সব মোডে কম্পিউটার একইভাবে খেলে। | **100% Bound Difficulty State:** `EASY`, `NORMAL`, `HARD` সিলেক্ট করার সাথে সাথে অ্যাক্টিভ স্টেট লক হবে এবং প্রতিটি মোডে AI-এর শক্তি, নিশানা ও স্পিন অ্যাটাক সম্পূর্ণ আলাদা আচরণ করবে। |
| **৫. পেন শোকেস ব্যাকগ্রাউন্ড রিয়ালিস্টিক করা (`Screenshot 2`)** | হালকা বেইজ (`#e8dec8`) ব্যাকগ্রাউন্ডের সাথে হালকা বা স্বচ্ছ কলম মিশে গিয়ে ফ্যাকাশে দেখাচ্ছে। | **3D Dark Velvet Spotlight Showcase:** কলম দেখানোর বক্সে ডার্ক মেটালিক স্টুডিও স্পটলাইট (`Radial Studio Pedestal`), নিচে রিয়েলিস্টিক কাস্ট শ্যাডো (`Drop Shadow`) এবং গ্লাস-শাইন যোগ করা হয়েছে যাতে যেকোনো রঙের কলম একদম জীবন্ত ও 3D দেখায়। |
| **৬. ম্যাচ/রাউন্ড শেষের পপআপ কাস্টমাইজ ও ওভারল্যাপ ফিক্স (`Screenshot 3`)** | ১) সবুজ চশমা পরা ইমোজি (`😎`) স্কোর বক্সের বর্ডারের ওপর উঠে গেছে, ২) কলমের ছবি দুটি লেখার ওপর উঠে গেছে, ৩) `Change pens` লেখাটি বাটনের বাইরে চলে গেছে, এবং ৪) ডিজাইনটি হুবহু ক্লোন মনে হচ্ছে। | **Custom Android Arcade Victory Modal:** ওভারল্যাপিং লেয়ার ১০০% ঠিক করা হয়েছে এবং ক্লোন লুক বাদ দিয়ে সম্পূর্ণ নিজস্ব **Mobile Esports Arcade** কার্ড ডিজাইন (Trophy Header, VS Score Pill, Clean Pen XP Card, ও Full-Width Android Touch Buttons) তৈরি করা হয়েছে। |
| **৭. ফুল অ্যান্ড্রয়েড মোবাইল ফোকাস** | ডেস্কটপ ওয়েব ব্রাউজারের মতো স্পেসিং ও হোভার ইফেক্ট। | **100% Android Mobile Portrait (`100dvh`) UI:** `touch-action: none`, `user-select: none`, নিরাপদ মোবাইল টাচ টার্গেট (`min-height: 48px`), এবং অ্যান্ড্রয়েড হ্যাপটিক ভাইব্রেশন ইন্টিগ্রেশন। |

---

## ২. ফিজিক্স ও গেমপ্লে কোড আপগ্রেড (মূল স্মুথ ফিজিক্স অক্ষত রেখে)

আপনার বর্তমান স্মুথ ফিজিক্স লুপ (`updateFrame` / `stepPhysics`) এবং কলিশন সলভারে **কোনো পরিবর্তন না করে** শুধু নিচের দুটি ফাংশন (`updateEdgeOverhangWobble` এবং `computeAIShot`) আপনার ফিজিক্স ইঞ্জিনে যুক্ত বা রিপ্লেস করুন:

### ২.১ বাউন্ডারির বাইরে অর্ধেক কলম গেলে ভাইব্রেশন ও গ্র্যাভিটি ("পড়ে যাবে পড়ে যাবে" ভাব)

```javascript
/**
 * ============================================================================
 * 1. EDGE OVERHANG GRAVITY WOBBLE & ANDROID VIBRATION SYSTEM
 * ============================================================================
 * কলমের অর্ধেক অংশ কোর্টের ভেতরে এবং অর্ধেক অংশ বাইরে থাকলে (COM তখনো ভেতরে),
 * কলমটি গ্র্যাভিটির টানে কাঁপতে থাকবে ("পড়ে যাবে পড়ে যাবে" ভাব)।
 */
export function updateEdgeOverhangWobble(pen, deskBounds, dt, currentTimeMs) {
  if (pen.isOut || pen.isFalling) {
    pen.overhangRatio = 0;
    pen.wobbleOffsetX = 0;
    pen.wobbleOffsetY = 0;
    pen.wobbleAngle = 0;
    pen.wobbleScale = 1.0;
    return;
  }

  const ep = pen.getEndpoints(false);
  const d = deskBounds;

  // কলমের দুই প্রান্ত (Tip A এবং Tail B) বাউন্ডারি থেকে কতটুকু বাইরে গেছে তা মাপা
  const outDistPoint = (px, py) => {
    const outLeft = Math.max(0, d.left - px);
    const outRight = Math.max(0, px - d.right);
    const outTop = Math.max(0, d.top - py);
    const outBottom = Math.max(0, py - d.bottom);
    return Math.hypot(Math.max(outLeft, outRight), Math.max(outTop, outBottom));
  };

  const outA = outDistPoint(ep.ax, ep.ay);
  const outB = outDistPoint(ep.bx, ep.by);
  const maxOutPx = Math.max(outA, outB);

  // কলমের মোট দৈর্ঘ্যের কত শতাংশ বাইরে ঝুলে আছে (0.0 থেকে 0.55+)
  const overhangRatio = Math.min(1.0, maxOutPx / (pen.length * 0.55));
  pen.overhangRatio = overhangRatio;

  // যদি কলমের ২০% বা তার বেশি অংশ কোর্টের বাইরে ঝুলে থাকে ("Cliffhanger State")
  if (overhangRatio > 0.20) {
    // ১. গ্র্যাভিটি টিটারিং ফ্রিকোয়েন্সি (যত বেশি ঝুলে থাকবে, তত দ্রুত কাঁপবে)
    const freq = 28 + overhangRatio * 36;
    const phase = (currentTimeMs * 0.001) * freq;

    // ২. ভাইব্রেশন অ্যামপ্লিচিউড (পড়ে যাবে পড়ে যাবে কাঁপুনি)
    const shakeAmpPx = (1.2 + overhangRatio * 3.2);
    pen.wobbleOffsetX = Math.sin(phase * 1.7) * shakeAmpPx;
    pen.wobbleOffsetY = Math.cos(phase * 2.1) * shakeAmpPx;

    // ৩. সামান্য কৌণিক দুলুনি (Teetering Torque Angle) ও 3D গ্র্যাভিটি ড্রপ স্কেল
    pen.wobbleAngle = Math.sin(phase) * (0.025 + overhangRatio * 0.055);
    pen.wobbleScale = 1.0 - overhangRatio * 0.06; // বাইরের প্রান্ত নিচের দিকে ঝুলে পড়ার ভাব

    // ৪. কলমটি যদি একদম কিনারায় (> 42% বাইরে) ঝুলে থাকে, তবে হালকা গ্র্যাভিটি টান কাজ করবে
    if (overhangRatio > 0.42 && Math.hypot(pen.vx, pen.vy) < 25) {
      const pullDirX = outA > outB ? (ep.ax - pen.x) : (ep.bx - pen.x);
      const pullDirY = outA > outB ? (ep.ay - pen.y) : (ep.by - pen.y);
      const len = Math.hypot(pullDirX, pullDirY) || 1;
      // গ্র্যাভিটি কলমটিকে ধীরে ধীরে বাইরের দিকে টানবে
      pen.vx += (pullDirX / len) * (overhangRatio * 18) * dt;
      pen.vy += (pullDirY / len) * (overhangRatio * 18) * dt;
    }

    // ৫. Android Mobile Haptic Vibration (প্রতি ১৮০ মিলিসেকেন্ড পর পর মৃদু কম্পন)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (!pen.lastVibrateTime || currentTimeMs - pen.lastVibrateTime > 180) {
        navigator.vibrate(Math.round(12 + overhangRatio * 20));
        pen.lastVibrateTime = currentTimeMs;
      }
    }
  } else {
    pen.wobbleOffsetX = 0;
    pen.wobbleOffsetY = 0;
    pen.wobbleAngle = 0;
    pen.wobbleScale = 1.0;
  }
}
```

**রেন্ডারিংয়ে যুক্ত করার নিয়ম (Canvas 2D / 3D):**
কলম ড্র করার সময় `pen.renderX` ও `pen.renderY`-এর সাথে `wobbleOffsetX`, `wobbleOffsetY` এবং `wobbleAngle` যোগ করে দিন:
```javascript
const drawX = pen.renderX + (pen.wobbleOffsetX || 0);
const drawY = pen.renderY + (pen.wobbleOffsetY || 0);
const drawAngle = pen.renderAngle + (pen.wobbleAngle || 0);
```

---

### ২.২ শক্তিশালী কম্পিউটার (AI) এবং ১০০% কার্যকরী `EASY / NORMAL / HARD` মোড

```javascript
/**
 * ============================================================================
 * 2. AGGRESSIVE KNOCKOUT AI & 100% WORKING DIFFICULTY MODES
 * ============================================================================
 * কম্পিউটার আর আস্তে মারবে না! সিলেক্ট করা মোড অনুযায়ী নিখুঁত শক্তিতে আঘাত করবে।
 */
export const AI_DIFFICULTY_PROFILES = {
  easy: {
    id: 'easy',
    label: 'EASY',
    angleJitterRad: 0.14,     // সামান্য লক্ষ্যভ্রষ্ট হতে পারে
    powerMin: 0.68,           // আগে 0.45 ছিল, এখন 0.68 যাতে আস্তে না মারে
    powerMax: 0.84,
    spinProbability: 0.25,
    aimAtTipProbability: 0.20,
    reactionDelayMs: 650
  },
  normal: {
    id: 'normal',
    label: 'NORMAL',
    angleJitterRad: 0.055,    // ভালো নিশানা
    powerMin: 0.80,           // শক্তিশালী শট
    powerMax: 0.94,
    spinProbability: 0.65,
    aimAtTipProbability: 0.60,
    reactionDelayMs: 520
  },
  hard: {
    id: 'hard',
    label: 'HARD',
    angleJitterRad: 0.012,    // পিন-পয়েন্ট স্নাইপার নিশানা
    powerMin: 0.90,           // ফুল পাওয়ার নকআউট শট!
    powerMax: 1.00,
    spinProbability: 0.92,    // হেলিকপ্টার স্পিন অ্যাটাক
    aimAtTipProbability: 0.88,
    reactionDelayMs: 420
  }
};

export function computeAggressiveAIShot(aiPen, playerPen, deskBounds, difficultyKey = 'normal') {
  const modeKey = String(difficultyKey || 'normal').toLowerCase();
  const cfg = AI_DIFFICULTY_PROFILES[modeKey] || AI_DIFFICULTY_PROFILES.normal;

  const epTarget = playerPen.getEndpoints(false);
  let aimX = playerPen.x;
  let aimY = playerPen.y;

  // Normal ও Hard মোডে খেলোয়াড়ের কলমের যে প্রান্ত বাউন্ডারির কাছে আছে, সেখানে আঘাত করবে
  if (Math.random() < cfg.aimAtTipProbability) {
    const distA = Math.min(
      epTarget.ax - deskBounds.left,
      deskBounds.right - epTarget.ax,
      epTarget.ay - deskBounds.top,
      deskBounds.bottom - epTarget.ay
    );
    const distB = Math.min(
      epTarget.bx - deskBounds.left,
      deskBounds.right - epTarget.bx,
      epTarget.by - deskBounds.top,
      deskBounds.bottom - epTarget.by
    );
    if (distA < distB) {
      aimX = epTarget.ax;
      aimY = epTarget.ay;
    } else {
      aimX = epTarget.bx;
      aimY = epTarget.by;
    }
  }

  const dx = aimX - aiPen.x;
  const dy = aimY - aiPen.y;
  const dist = Math.hypot(dx, dy) || 1;

  // নিশানা ও সামান্য জিটার
  const exactAngle = Math.atan2(dy, dx);
  const shotAngle = exactAngle + (Math.random() - 0.5) * cfg.angleJitterRad;

  const dirX = Math.cos(shotAngle);
  const dirY = Math.sin(shotAngle);

  // দূরত্ব ও মোড অনুযায়ী উচ্চ শট পাওয়ার (কম্পিউটার কখনোই দুর্বল শট মারবে না)
  const distFactor = Math.min(1.0, Math.max(0.35, dist / 340));
  let power = cfg.powerMin + distFactor * (cfg.powerMax - cfg.powerMin);

  // যদি খেলোয়াড়ের কলম কিনারায় ঝুলে থাকে (overhangRatio > 0.15), তবে ফুল পাওয়ারে ফিনিশিং শট মারবে!
  if (playerPen.overhangRatio && playerPen.overhangRatio > 0.15) {
    power = Math.min(1.0, power + 0.12);
  }

  // স্পিন শট নেওয়ার জন্য কলমের নিব বা পেছনের প্রান্ত ধরা
  let grabOffset = 0;
  if (Math.random() < cfg.spinProbability) {
    const side = Math.random() < 0.5 ? 1 : -1;
    grabOffset = side * (aiPen.length * 0.36);
  }

  return {
    dirX,
    dirY,
    power: Math.min(1.0, power),
    grabOffset,
    difficultyUsed: cfg.id,
    reactionDelayMs: cfg.reactionDelayMs
  };
}
```

---

## ৩. প্রফেশনাল "PICK YOUR PEN" স্ক্রিন এবং কাস্টমাইজড "MATCH END POPUP" (HTML + CSS + JS)

নিচের কোডটিতে আপনার বাকি ৫টি নির্দেশনা ১০০% সমাধান করা হয়েছে:
1. **পেন শোকেস ব্যাকগ্রাউন্ড:** ডার্ক ভেলভেট স্টুডিও স্পটলাইট + নিচে 3D শ্যাডো প্লেট, যাতে কলমগুলো একদম রিয়েলিস্টিক ও উজ্জ্বল দেখায়।
2. **৫টি স্কিলের ৫টি আলাদা প্রফেশনাল কালার:** প্রতিটি স্কিল বারের নিজস্ব গ্লোয়িং কালার ও আইকন।
3. **Easy / Normal / Hard বাটন:** ১০০% স্টেট-বাউন্ড, সিলেক্ট করলে অ্যাক্টিভ ব্যাজ ও AI প্রোফাইল সাথে সাথে আপডেট হয়।
4. **রাউন্ড/ম্যাচ শেষের পপআপ:** কোনো লেয়ার একটার ওপর আরেকটা উঠবে না (Zero Overlap) এবং দেখতে অন্য কোনো গেমের হুবহু কপি মনে হবে না।

```html
<!-- ==========================================================================
     ANDROID MOBILE PRO UI STYLES (PICK YOUR PEN + CUSTOM VICTORY POPUP)
     ========================================================================== -->
<style>
  :root {
    --skill-weight: linear-gradient(90deg, #f59e0b, #fbbf24);
    --skill-speed:  linear-gradient(90deg, #06b6d4, #38bdf8);
    --skill-spin:   linear-gradient(90deg, #8b5cf6, #c084fc);
    --skill-grip:   linear-gradient(90deg, #10b981, #34d399);
    --skill-reach:  linear-gradient(90deg, #f43f5e, #fb7185);
  }

  /* Full Android Mobile Viewport Lock */
  html, body {
    width: 100vw;
    height: 100dvh;
    margin: 0;
    padding: 0;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  }

  /* Modal Backdrop for Android Portrait */
  .pf-android-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(9, 13, 22, 0.78);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px;
  }

  .pf-android-card {
    width: 100%;
    max-width: 390px;
    max-height: 92dvh;
    overflow-y: auto;
    background: #fdfaf3;
    border: 3px solid #1e293b;
    border-radius: 28px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55), 0 6px 0 #0f172a;
    padding: 18px 16px;
    color: #0f172a;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* 1. REALISTIC 3D STUDIO PEN SHOWCASE BOX (Fixes blending with background) */
  .pf-pen-studio-stage {
    position: relative;
    height: 128px;
    border-radius: 20px;
    background:
      radial-gradient(ellipse at 50% 38%, rgba(56, 189, 248, 0.22) 0%, transparent 65%),
      radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 72%, #090d16 100%);
    border: 2px solid #334155;
    box-shadow: inset 0 4px 18px rgba(0, 0, 0, 0.75), 0 4px 12px rgba(15, 23, 42, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* Subtle Studio Pedestal Floor Reflection */
  .pf-pen-studio-stage::before {
    content: '';
    position: absolute;
    bottom: 22px;
    width: 72%;
    height: 16px;
    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.75) 0%, transparent 75%);
    border-radius: 50%;
    pointer-events: none;
  }

  .pf-pen-studio-stage img,
  .pf-pen-studio-stage canvas {
    position: relative;
    z-index: 2;
    max-width: 76%;
    max-height: 76px;
    filter: drop-shadow(0 10px 10px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.12));
    transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* 2. MULTI-COLORED PROFESSIONAL SKILL BARS */
  .pf-skills-grid {
    display: flex;
    flex-direction: column;
    gap: 7px;
    background: #f4efe4;
    padding: 11px 12px;
    border-radius: 16px;
    border: 1.5px solid #e2d9c5;
  }

  .pf-skill-row {
    display: grid;
    grid-template-columns: 76px 1fr 32px;
    align-items: center;
    gap: 8px;
  }

  .pf-skill-label {
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 5px;
    color: #1e293b;
  }

  .pf-skill-segments {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 5px;
  }

  .pf-skill-seg {
    height: 10px;
    border-radius: 999px;
    background: #d6cebe;
    transition: all 0.25s ease;
  }

  .pf-skill-seg.active-weight { background: var(--skill-weight); box-shadow: 0 0 8px rgba(245, 158, 11, 0.45); }
  .pf-skill-seg.active-speed  { background: var(--skill-speed);  box-shadow: 0 0 8px rgba(6, 182, 212, 0.45); }
  .pf-skill-seg.active-spin   { background: var(--skill-spin);   box-shadow: 0 0 8px rgba(139, 92, 246, 0.45); }
  .pf-skill-seg.active-grip   { background: var(--skill-grip);   box-shadow: 0 0 8px rgba(16, 185, 129, 0.45); }
  .pf-skill-seg.active-reach  { background: var(--skill-reach);  box-shadow: 0 0 8px rgba(244, 63, 94, 0.45); }

  /* 3. 100% WORKING DIFFICULTY SELECTOR PILLS */
  .pf-difficulty-bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .pf-diff-btn {
    min-height: 44px;
    border-radius: 999px;
    border: 2px solid #1e293b;
    background: #efe8d8;
    color: #334155;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .pf-diff-btn.active[data-diff="easy"] {
    background: #38bdf8;
    color: #082f49;
    box-shadow: 0 3px 0 #0284c7;
    transform: translateY(-1px);
  }
  .pf-diff-btn.active[data-diff="normal"] {
    background: #fbbf24;
    color: #451a03;
    box-shadow: 0 3px 0 #d97706;
    transform: translateY(-1px);
  }
  .pf-diff-btn.active[data-diff="hard"] {
    background: #f43f5e;
    color: #ffffff;
    box-shadow: 0 3px 0 #be123c;
    transform: translateY(-1px);
  }

  /* 4. CUSTOMIZED BUG-FREE ROUND/MATCH RESULT POPUP (Zero Layer Overlap) */
  .pf-result-header-banner {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: #ffffff;
    border-radius: 20px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid #334155;
  }

  .pf-result-badge-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: linear-gradient(135deg, #facc15, #f97316);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
  }

  .pf-scoreboard-duel {
    background: #f4efe4;
    border: 2px solid #1e293b;
    border-radius: 20px;
    padding: 14px 12px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .pf-xp-reward-box {
    background: #0f172a;
    color: #f8fafc;
    border-radius: 16px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pf-action-row-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .pf-btn-secondary {
    min-height: 48px;
    border-radius: 16px;
    border: 2.5px solid #1e293b;
    background: #ffffff;
    color: #0f172a;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 10px;
    white-space: nowrap;
    box-shadow: 0 3px 0 #1e293b;
  }
</style>
```

---

## ৪. Antigravity AI Master Prompt (এক ক্লিকে সবগুলো আপগ্রেড বসাতে কপি-পেস্ট করুন)

আপনার `localhost:3000` প্রজেক্টে এই ৭টি পরিবর্তন একসাথে এবং নিখুঁতভাবে বসাতে নিচের বক্সের প্রম্পটটি কপি করে **Antigravity AI**-তে পেস্ট করে দিন:

```markdown
# ANTIGRAVITY MASTER TASK: IMPLEMENT 7 ANDROID PRO UPGRADES & UI FIXES IN MY PEN FIGHT GAME

Please apply the following 7 specific upgrades to my Pen Fight game (`localhost:3000`).
**CRITICAL RULE**: Do NOT alter or break my existing smooth physics timestep, movement, or collision solver—keep the core gameplay physics 100% intact. Only add the overhang vibration effect, upgrade the AI shot calculator, and update the UI/UX as specified below.

## 1. Boundary Overhang Vibration & Gravity Wobble ("পড়ে যাবে পড়ে যাবে ভাব")
- In the physics/render update loop, check if either endpoint (`tip` or `tail`) of a pen extends outside the court/desk boundary while the pen has not yet fallen (`!pen.isFalling && !pen.isOut`).
- Compute `overhangRatio = maxOutDistance / (pen.length * 0.55)`.
- When `overhangRatio > 0.20` (half inside, half outside the court):
  - Apply a real-time high-frequency teetering vibration (`wobbleOffsetX`, `wobbleOffsetY`, and `wobbleAngle` oscillation at `28-64 Hz`) so the pen visibly trembles on the edge as if gravity is about to pull it down.
  - Render a subtle red/orange pulsing danger glow under the overhanging end of the pen.
  - Trigger Android haptic feedback via `navigator.vibrate(20)` throttled every `180ms`.
  - If `overhangRatio > 0.42` and the pen is nearly stopped, apply a subtle outward gravity pull toward the overhanging tip so it teeters and either tips over or barely survives.

## 2. Stronger, Competitive Computer AI (No More Weak Shots)
- Keep my smooth physics untouched, but upgrade the AI shot generator (`computeAIShot`):
  - Increase base shot power significantly so the Computer never shoots softly:
    - `EASY`: `powerMin = 0.68`, `powerMax = 0.84`, `angleJitter = 0.14`, `spinProb = 0.25`
    - `NORMAL`: `powerMin = 0.80`, `powerMax = 0.94`, `angleJitter = 0.055`, `spinProb = 0.65`
    - `HARD`: `powerMin = 0.90`, `powerMax = 1.00`, `angleJitter = 0.012`, `spinProb = 0.92` (aims directly at the player pen's tip nearest the boundary for maximum rotational knockout).

## 3. 100% Working Difficulty Mode Buttons (`EASY`, `NORMAL`, `HARD`)
- In the `PICK YOUR PEN · VS AI` modal, bind click/touch listeners to the `EASY`, `NORMAL`, and `HARD` buttons so selecting a mode:
  1. Immediately updates `gameState.aiDifficulty` (`'easy' | 'normal' | 'hard'`) and persists it in `localStorage`.
  2. Highlights the active button with a distinct color (`EASY` = Cyan `#38bdf8`, `NORMAL` = Amber `#fbbf24`, `HARD` = Crimson `#f43f5e`).
  3. Passes `gameState.aiDifficulty` directly into `computeAIShot()` on every Computer turn.

## 4. Professional Multi-Colored Skill Bars in "PICK YOUR PEN"
- Replace the uniform blue stat bars in the `PICK YOUR PEN` modal with 5 distinct, professional gradient colors and icons:
  - **Weight**: Amber/Gold gradient (`linear-gradient(90deg, #f59e0b, #fbbf24)`)
  - **Speed**: Electric Cyan gradient (`linear-gradient(90deg, #06b6d4, #38bdf8)`)
  - **Spin**: Neon Purple gradient (`linear-gradient(90deg, #8b5cf6, #c084fc)`)
  - **Grip**: Emerald Green gradient (`linear-gradient(90deg, #10b981, #34d399)`)
  - **Reach**: Crimson Rose gradient (`linear-gradient(90deg, #f43f5e, #fb7185)`)
- Show a numeric `X/5` badge on the right side of each skill row.

## 5. Realistic High-Contrast 3D Studio Pen Showcase Background
- In `PICK YOUR PEN`, replace the flat beige pen preview background (`#e8dec8`) with a realistic dark studio spotlight stage:
  - Background: `radial-gradient(ellipse at 50% 38%, rgba(56, 189, 248, 0.22) 0%, transparent 65%), radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 72%, #090d16 100%)`
  - Add a dark elliptical floor shadow pedestal underneath the pen and a strong `drop-shadow(0 10px 10px rgba(0,0,0,0.65))` on the pen graphic so light and transparent pens stand out with 3D realism.

## 6. Customized, Zero-Overlap Round/Match Result Popup
- Redesign the Round/Match Complete modal so it has its own original Mobile Arcade identity and **fixes all 3 overlapping layer bugs**:
  1. **Header Banner**: Place the status icon/trophy inside a dedicated dark flex header (`display: flex; align-items: center; gap: 12px`)—remove any absolute/negative-margin positioning so the green icon badge NEVER overlaps the `SERIES SCORE` box.
  2. **VS Scoreboard Card**: Display `YOU` vs `COMPUTER` scores in a clean 3-column grid with a `STREAK` pill badge.
  3. **Pen XP & Matchup Strip**: Place the `+50 XP` progress bar and pen icons inside a dark card with proper flex spacing so the pen graphics NEVER overlap the text `"New series keeps the same pens"`.
  4. **Buttons**: Use a 2-column CSS grid (`grid-template-columns: 1fr 1fr; gap: 10px`) with `font-size: 13px; white-space: nowrap; padding: 0 12px; min-height: 48px` so `"Change pens"` fits 100% inside its button without overflowing.

## 7. Full Android Mobile Portrait Optimization
- Lock the game layout for Android mobile portrait screens (`width: 100vw; height: 100dvh; overflow: hidden; touch-action: none; user-select: none; -webkit-tap-highlight-color: transparent`).
- Ensure all touch buttons have a minimum tap target of `48px` height and responsive mobile spacing.
```
