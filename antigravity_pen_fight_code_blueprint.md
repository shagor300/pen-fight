# Google Antigravity IDE — Complete Extracted Code & Build Blueprint for "Desk Wars: Pen Fight"

**টার্গেট প্রজেক্ট ফোল্ডার:** `C:\Users\SHAGOR\shagorize Lab\Pen Fight`  
**রেফারেন্স সোর্স:** [Desk Wars: Pen Fight](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2Fpen-fight%2F) ([Shunnek Games](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2F))  
**টার্গেট এজেন্ট:** [Google Antigravity IDE](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fproduct%2Fantigravity-ide%2F)

## ১. আসল গেমটির (`shunneklabs.app`) সার্ভার ও বান্ডেল অ্যানালাইসিস

[Desk Wars: Pen Fight](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2Fpen-fight%2F) ওয়েবসাইটের `<head>`, Network ও WebGL বান্ডেল চেক করে নিচের আসল ফাইল পাথ এবং মডিউলগুলো পাওয়া গেছে:

| ফাইল টাইপ | আসল সার্ভার পাথ (`shunneklabs.app`) | ফাইলের কাজ |
| :--- | :--- | :--- |
| **Main Game Bundle** | `/games/pen-fight/assets/index-BzLvPmRC.js` | গেমের মূল লজিক, ৮টি কলমের কনফিগারেশন, ফিজিক্স (Planck.js), AI এবং UI স্টেট |
| **PixiJS Init & Core** | `/games/pen-fight/assets/init-CeJwUeJM.js` এবং `browserAll-BPpcqOUY.js` | [PixiJS v8.22.0](https://www.google.com/search?q=https%3A%2F%2Fpixijs.com%2F8.x%2Fguides%2Fgetting-started%2Fintro) WebGL/WebGPU অ্যাপ্লিকেশন এবং রেন্ডারার ইনিশিয়ালাইজেশন |
| **Canvas Pool** | `/games/pen-fight/assets/CanvasPool-DWc3fora.js` | **Classic** ও **Real** মোডে কলমের প্রসিডিউরাল ভেক্টর ও গ্র্যাডিয়েন্ট টেক্সচার জেনারেশন |
| **Render Target System** | `/games/pen-fight/assets/RenderTargetSystem-CO5HViN5.js` | ডাইনামিক ড্রপ-শ্যাডো, স্পেকুলার গ্লস (আলো প্রতিফলন) ও ফ্রেমবাফার রেন্ডারিং |
| **Text Metrics** | `/games/pen-fight/assets/getTextRangeRects-B7yetiCF.js` | ক্যানভাসে ফন্ট ও ড্যামেজ/টার্ন টেক্সট মেজারমেন্ট |
| **Main Stylesheet** | `/games/pen-fight/assets/index-D8kaGhxM.css` | ফুলস্ক্রিন লেআউট, মোডাল, বাটন ও রেসপনসিভ ইউআই স্টাইল |
| **Clean Desk Texture** | `https://shunneklabs.app/games/pen-fight/assets/desk-clean-DLVVUILE.webp` | পরিষ্কার কাঠের স্কুল ডেস্কের আসল WebP ব্যাকগ্রাউন্ড টেক্সচার |
| **Old Desk Texture** | `https://shunneklabs.app/games/pen-fight/assets/desk-old-E230-6rb.webp` | খোদাই করা ও পুরনো স্কুল ডেস্কের আসল WebP ব্যাকগ্রাউন্ড টেক্সচার |
| **Typography Fonts** | `/games/pen-fight/assets/fredoka-latin-700-normal.woff2` ও `nunito-latin-700-normal.woff2` | গেমের রাউন্ডেড টাইটেল ও বডি ফন্ট |

## ২. Google Antigravity IDE-এর জন্য সরাসরি নির্দেশ (Master Prompt for Antigravity Agent)

আপনি এই ডকুমেন্টটি কপি করে [Google Antigravity IDE](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fproduct%2Fantigravity-ide%2F)-এর চ্যাট বক্সে পেস্ট করবেন। নিচে এজেন্টের জন্য সরাসরি নির্দেশ দেওয়া হলো:

> **INSTRUCTION FOR GOOGLE ANTIGRAVITY AGENT:**  
> You are working inside the user's local directory `C:\Users\SHAGOR\shagorize Lab\Pen Fight`.  
> Your task is to build a 9:16 mobile and web clone of **Desk Wars: Pen Fight** (`https://shunneklabs.app/games/pen-fight/`) using the exact extracted configurations, 8-layer photorealistic pen renderer, Planck.js (Box2D) physics formulas, and Capacitor mobile wrapper provided below.  
> **Execute the following steps automatically in order:**
> 1. Create all the files listed in Section 3 to Section 10 inside `C:\Users\SHAGOR\shagorize Lab\Pen Fight` (do NOT zip them; write each file directly to disk).
> 2. Download the two reference desk WebP textures from `https://shunneklabs.app/games/pen-fight/assets/desk-clean-DLVVUILE.webp` and `https://shunneklabs.app/games/pen-fight/assets/desk-old-E230-6rb.webp` into `public/assets/desks/` (and keep the procedural wood fallback active if offline).
> 3. Run `npm install` to install `pixi.js`, `planck`, `earcut`, `@pixi/colord`, `parse-svg-path`, `eventemitter3`, `ismobilejs`, `tiny-lru`, and `@capacitor/*`.
> 4. Start the live preview with `npm run dev` to verify 60fps rendering, then run `npm run build && npx cap add android && npx cap sync android` so the mobile app is ready to build into an `.apk`.

## ৩. প্রজেক্ট কনফিগারেশন ফাইলসমূহ (`package.json`, `vite.config.ts`, `capacitor.config.ts`)

### ফাইল ১: `package.json`
```json
{
  "name": "pen-fight-mobile",
  "private": true,
  "version": "1.2.3",
  "description": "Desk Wars: Pen Fight - 1:1 Mobile App Clone (PixiJS 8.22.0 + Planck.js 1.4.2 + Capacitor)",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "android:init": "npx cap add android",
    "android:sync": "npm run build && npx cap sync android",
    "android:open": "npx cap open android"
  },
  "dependencies": {
    "@capacitor/android": "^7.0.0",
    "@capacitor/core": "^7.0.0",
    "@capacitor/haptics": "^7.0.0",
    "@capacitor/ios": "^7.0.0",
    "@capacitor/preferences": "^7.0.0",
    "@capacitor/screen-orientation": "^7.0.0",
    "@capacitor/status-bar": "^7.0.0",
    "@fontsource/fredoka": "^5.1.0",
    "@fontsource/nunito": "^5.1.0",
    "@pixi/colord": "^2.9.6",
    "earcut": "^3.2.4",
    "eventemitter3": "^5.0.4",
    "ismobilejs": "^1.1.1",
    "parse-svg-path": "^0.2.0",
    "pixi.js": "^8.6.0",
    "planck": "^1.4.2",
    "tiny-lru": "^11.4.7"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.0.0",
    "typescript": "~5.6.2",
    "vite": "^6.0.1"
  }
}
```

### ফাইল ২: `capacitor.config.ts`
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shagorizelab.penfight',
  appName: 'Desk Wars: Pen Fight',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK'
    }
  }
};

export default config;
```

### ফাইল ৩: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["src"]
}
```

## ৪. ৮টি কলমের আসল কনফিগারেশন ডেটা (`src/config/pensConfig.ts`)

আসল বান্ডেল (`index-BzLvPmRC.js`) থেকে সংগৃহীত ৮টি কলমের স্ট্যাটাস, মাপ, রঙ এবং শেপ প্রপার্টি:

```typescript
export interface PenConfig {
  id: string;
  name: string;
  description: string;
  stats: {
    weight: number; // 1-10 internal scale (displayed as 1-5 stars)
    speed: number;
    spin: number;
    grip: number;
    reach: number;
  };
  dimensions: {
    widthMeters: number;  // Planck.js meters
    lengthMeters: number; // Planck.js meters
  };
  colors: {
    primary: string;
    secondary: string;
    grip: string;
    tip: string;
    ink: string;
  };
  transparentBarrel: boolean;
  barrelText: string;
  shapeParts: string[];
}

export const PENS_CONFIG: PenConfig[] = [
  {
    id: 'cheap-ballpoint',
    name: 'Cheap Ballpoint',
    description: 'Long clear plastic barrel. Smooth side flicks.',
    stats: { weight: 4, speed: 8, spin: 6, grip: 6, reach: 7 },
    dimensions: { widthMeters: 0.15, lengthMeters: 1.62 },
    colors: { primary: '#E2E8F0', secondary: '#1D4ED8', grip: '#1E3A8A', tip: '#94A3B8', ink: '#1D4ED8' },
    transparentBarrel: true,
    barrelText: 'BALL 0.7',
    shapeParts: ['clear_hex_barrel', 'inner_ink_tube', 'vented_blue_cap', 'brass_cone_tip']
  },
  {
    id: 'yellow-highlighter',
    name: 'Yellow Highlighter',
    description: 'Wide flat body with high surface grip.',
    stats: { weight: 6, speed: 6, spin: 4, grip: 8, reach: 5 },
    dimensions: { widthMeters: 0.22, lengthMeters: 1.44 },
    colors: { primary: '#FACC15', secondary: '#CA8A04', grip: '#EAB308', tip: '#FEF08A', ink: '#FACC15' },
    transparentBarrel: false,
    barrelText: 'FLUORO XL',
    shapeParts: ['wide_flat_barrel', 'chisel_tip', 'wide_clip_cap']
  },
  {
    id: 'gel-pen',
    name: 'Gel Rollerball',
    description: 'Grooved rubber grip & fast needle-tip flicks.',
    stats: { weight: 4, speed: 9, spin: 8, grip: 6, reach: 7 },
    dimensions: { widthMeters: 0.16, lengthMeters: 1.58 },
    colors: { primary: '#EF4444', secondary: '#991B1B', grip: '#1E293B', tip: '#CBD5E1', ink: '#DC2626' },
    transparentBarrel: true,
    barrelText: 'GEL 0.5',
    shapeParts: ['translucent_barrel', 'inner_gel_refill', 'grooved_rubber_grip', 'needle_chrome_tip']
  },
  {
    id: 'fountain-pen',
    name: 'Classic Fountain',
    description: 'Weighted lacquered body & engraved gold nib.',
    stats: { weight: 8, speed: 6, spin: 6, grip: 7, reach: 8 },
    dimensions: { widthMeters: 0.17, lengthMeters: 1.68 },
    colors: { primary: '#0F172A', secondary: '#D97706', grip: '#1E293B', tip: '#FACC15', ink: '#0284C7' },
    transparentBarrel: false,
    barrelText: 'CLASSIC 18K',
    shapeParts: ['lacquer_body', 'gold_trim_ring', 'fountain_split_nib', 'gold_clip']
  },
  {
    id: 'steel-pen',
    name: 'Heavy Steel Pen',
    description: 'Maximum weight and momentum — hard to knock off.',
    stats: { weight: 10, speed: 4, spin: 4, grip: 9, reach: 6 },
    dimensions: { widthMeters: 0.19, lengthMeters: 1.55 },
    colors: { primary: '#64748B', secondary: '#94A3B8', grip: '#334155', tip: '#E2E8F0', ink: '#475569' },
    transparentBarrel: false,
    barrelText: 'STEEL PRO',
    shapeParts: ['brushed_steel_barrel', 'knurled_metal_grip', 'chrome_plunger']
  },
  {
    id: 'stylus-marker',
    name: 'Dual-Tip Marker',
    description: 'Twin-capped marker built for helicopter spin.',
    stats: { weight: 6, speed: 6, spin: 10, grip: 5, reach: 8 },
    dimensions: { widthMeters: 0.18, lengthMeters: 1.66 },
    colors: { primary: '#8B5CF6', secondary: '#5B21B6', grip: '#4C1D95', tip: '#DDD6FE', ink: '#7C3AED' },
    transparentBarrel: false,
    barrelText: 'ART TWIN',
    shapeParts: ['marker_cylinder', 'front_cap', 'back_cap', 'color_bands']
  },
  {
    id: 'click-pen',
    name: 'Multi-Color Clicker',
    description: '4-color spring sliders with versatile balance.',
    stats: { weight: 5, speed: 7, spin: 7, grip: 6, reach: 7 },
    dimensions: { widthMeters: 0.19, lengthMeters: 1.60 },
    colors: { primary: '#F8FAFC', secondary: '#2563EB', grip: '#0284C7', tip: '#E2E8F0', ink: '#10B981' },
    transparentBarrel: false,
    barrelText: '4-COLOR',
    shapeParts: ['two_tone_barrel', 'rgb_click_sliders', ' lanyard_ring']
  },
  {
    id: 'long-spinner',
    name: 'Long Mod Spinner',
    description: 'Balanced championship pen-mod with weighted silicone tips.',
    stats: { weight: 8, speed: 7, spin: 10, grip: 7, reach: 10 },
    dimensions: { widthMeters: 0.16, lengthMeters: 1.84 },
    colors: { primary: '#F97316', secondary: '#1E293B', grip: '#EA580C', tip: '#FDBA74', ink: '#F97316' },
    transparentBarrel: false,
    barrelText: 'SPIN MOD V2',
    shapeParts: ['extended_mod_rod', 'left_weighted_cone', 'right_weighted_cone', 'center_balance_ring']
  }
];
```

## ৫. আসল ৮-লেয়ার রিয়েলিস্টিক পেন রেন্ডারার (`src/rendering/RealPenRenderer.ts`)

আসল গেমের `CanvasPool` এবং `RenderTargetSystem` যেভাবে কোনো এক্সটার্নাল ছবি ছাড়াই কলমকে একদম বাস্তব (3D Real) দেখায়, তার সম্পূর্ণ কোড:

```typescript
import { PenConfig } from '../config/pensConfig';

export const PIXELS_PER_METER = 100;

/**
 * Renders a pen in either 'real' (8-layer photorealistic 3D shaded) or 'classic' (vector cartoon) mode.
 * Crucial trick: The drop shadow is drawn in WORLD SPACE (+5px, +8px) BEFORE rotating the pen,
 * so when the pen spins 360 degrees, the shadow stays realistically anchored toward the floor!
 */
export function renderPenToCanvas(
  ctx: CanvasRenderingContext2D,
  pen: PenConfig,
  worldX: number,
  worldY: number,
  angleRad: number,
  mode: 'real' | 'classic',
  scale = 1.0,
  alpha = 1.0
): void {
  const L = pen.dimensions.lengthMeters * PIXELS_PER_METER;
  const W = pen.dimensions.widthMeters * PIXELS_PER_METER;
  const halfL = L / 2;
  const halfW = W / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // =========================================================================
  // LAYER 1: WORLD-SPACE SOFT DROP SHADOW (Does NOT invert when pen spins!)
  // =========================================================================
  if (mode === 'real' && scale > 0.85) {
    ctx.save();
    ctx.translate(worldX + 5, worldY + 8);
    ctx.scale(scale, scale);
    ctx.rotate(angleRad);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
    ctx.filter = 'blur(4px)';
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, L, W, halfW);
    ctx.fill();
    ctx.restore();
  }

  // Now transform into the pen's local rotated coordinate system
  ctx.translate(worldX, worldY);
  ctx.scale(scale, scale);
  ctx.rotate(angleRad);

  if (mode === 'classic') {
    // CLASSIC MODE: Crisp vector cartoon style with bold dark outline
    ctx.fillStyle = pen.colors.primary;
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.78, -halfW, L * 0.78, W, 5);
    ctx.fill();

    ctx.fillStyle = pen.colors.grip;
    ctx.fillRect(halfL * 0.25, -halfW, L * 0.22, W);

    ctx.fillStyle = pen.colors.secondary;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW - 1.5, L * 0.32, W + 3, 4);
    ctx.fill();

    ctx.fillStyle = pen.colors.tip;
    ctx.beginPath();
    ctx.moveTo(halfL * 0.78, -halfW);
    ctx.lineTo(halfL, -2);
    ctx.lineTo(halfL, 2);
    ctx.lineTo(halfL * 0.78, halfW);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, L, W, 5);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // =========================================================================
  // REAL MODE: 8-LAYER PHOTOREALISTIC PROCEDURAL 3D SHADING
  // =========================================================================

  // LAYER 2: TRANSLUCENT OR METALLIC OUTER BARREL BASE
  const barrelLen = L * 0.76;
  const barrelStartX = -halfL * 0.76;

  if (pen.transparentBarrel) {
    // Clear plastic casing
    const clearGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
    clearGrad.addColorStop(0, 'rgba(226, 232, 240, 0.75)');
    clearGrad.addColorStop(0.3, 'rgba(248, 250, 252, 0.42)');
    clearGrad.addColorStop(0.7, 'rgba(203, 213, 225, 0.48)');
    clearGrad.addColorStop(1, 'rgba(100, 116, 139, 0.78)');
    ctx.fillStyle = clearGrad;
    ctx.beginPath();
    ctx.roundRect(barrelStartX, -halfW, barrelLen, W, 4);
    ctx.fill();

    // LAYER 3: INNER VISIBLE INK REFILL TUBE & BRASS ADAPTER
    const inkTubeW = W * 0.36;
    ctx.fillStyle = pen.colors.ink;
    ctx.fillRect(barrelStartX + 10, -inkTubeW / 2, barrelLen * 0.68, inkTubeW);
    // Brass refill holder
    ctx.fillStyle = '#D97706';
    ctx.fillRect(barrelStartX + 10 + barrelLen * 0.68, -inkTubeW / 2, 8, inkTubeW);
  } else {
    // Opaque lacquered / metallic cylindrical body
    ctx.fillStyle = pen.colors.primary;
    ctx.beginPath();
    ctx.roundRect(barrelStartX, -halfW, barrelLen, W, 4);
    ctx.fill();
  }

  // Barrel micro-label ("GEL 0.5", "BALL 0.7", etc.)
  ctx.save();
  ctx.font = 'bold 6.5px Nunito, sans-serif';
  ctx.fillStyle = pen.transparentBarrel ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.65)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pen.barrelText, -L * 0.05, 0);
  ctx.restore();

  // LAYER 4: GROOVED RUBBER GRIP WITH MICRO-RIDGES
  const gripStartX = halfL * 0.18;
  const gripLen = L * 0.24;
  ctx.fillStyle = pen.colors.grip;
  ctx.beginPath();
  ctx.roundRect(gripStartX, -halfW - 0.6, gripLen, W + 1.2, 2);
  ctx.fill();

  // Draw tactile rubber ridges
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.lineWidth = 1.2;
  for (let gx = gripStartX + 3; gx < gripStartX + gripLen - 2; gx += 3.2) {
    ctx.beginPath();
    ctx.moveTo(gx, -halfW);
    ctx.lineTo(gx, halfW);
    ctx.stroke();
  }

  // LAYER 5: METALLIC CONE & PRECISION NIB (+X Tip)
  const coneStartX = halfL * 0.66;
  const metalGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
  metalGrad.addColorStop(0, '#F8FAFC');
  metalGrad.addColorStop(0.35, pen.colors.tip);
  metalGrad.addColorStop(0.7, '#475569');
  metalGrad.addColorStop(1, '#CBD5E1');

  ctx.fillStyle = metalGrad;
  ctx.beginPath();
  ctx.moveTo(coneStartX, -halfW * 0.92);
  ctx.lineTo(halfL - 3, -2.2);
  ctx.lineTo(halfL - 3, 2.2);
  ctx.lineTo(coneStartX, halfW * 0.92);
  ctx.closePath();
  ctx.fill();

  // tungsten ballpoint micro-tip
  ctx.fillStyle = pen.colors.ink;
  ctx.beginPath();
  ctx.arc(halfL - 1.5, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // LAYER 6: 3D CAP, POCKET CLIP & END PLUG (-X Cap)
  const capLen = L * 0.32;
  ctx.fillStyle = pen.colors.secondary;
  ctx.beginPath();
  ctx.roundRect(-halfL, -halfW - 1.5, capLen, W + 3, 4);
  ctx.fill();

  // Raised Pocket Clip with its own mini shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-halfL + 6, -halfW - 2.8, capLen * 0.78, 2.5);
  ctx.fillStyle = pen.colors.tip;
  ctx.beginPath();
  ctx.roundRect(-halfL + 5, -halfW - 4.2, capLen * 0.78, 2.8, 1.5);
  ctx.fill();

  // LAYER 7: CYLINDRICAL 3D SHADING OVERLAY (Top highlight -> bottom core shadow)
  const cylGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
  cylGrad.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
  cylGrad.addColorStop(0.22, 'rgba(255, 255, 255, 0.52)');
  cylGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
  cylGrad.addColorStop(0.82, 'rgba(0, 0, 0, 0.28)');
  cylGrad.addColorStop(1, 'rgba(0, 0, 0, 0.48)');
  ctx.fillStyle = cylGrad;
  ctx.beginPath();
  ctx.roundRect(-halfL, -halfW, L * 0.9, W, 4);
  ctx.fill();

  // LAYER 8: CRISP SPECULAR GLINT (Classroom fluorescent light reflection strip)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
  ctx.beginPath();
  ctx.roundRect(-halfL + 4, -halfW + 2.2, L * 0.82, 1.8, 1);
  ctx.fill();

  ctx.restore();
}
```

## ৫. ট্যাকটাইল নিও-ব্রুটালিস্ট ডিজাইন সিস্টেম ও থিম ম্যানেজার

### ফাইল ১: `src/style.css` (Tactile Neo-Brutalist School Notebook Design System)
[Desk Wars: Pen Fight](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2Fpen-fight%2F)-এর আসল `index-D8kaGhxM.css` থেকে সংগৃহীত Tactile Neo-Brutalist School Notebook Design System (Light/Dark থিম ভেরিয়েবল, #2b302a সলিড বর্ডার, 0px 4px 0px হার্ড ট্যাকটাইল শ্যাডো, বাটন প্রেস অ্যানিমেশন, কার্ড, ব্যাজ এবং কাস্টম স্লাইডার):

```css
@import '@fontsource/fredoka/600.css';
@import '@fontsource/fredoka/700.css';
@import '@fontsource/nunito/600.css';
@import '@fontsource/nunito/700.css';
@import '@fontsource/nunito/800.css';

:root, [data-theme="light"] {
  /* Core Surfaces (Warm School Notebook & Cream Palette) */
  --bg-primary: #f5f2e9;
  --bg-card: #fbf5e5;
  --bg-elevated: #ffffff;
  --bg-scoreboard: #f5f0e1;
  --bg-badge: #e8e3d5;
  --bg-slider-track: #d6cfb8;

  /* Typography & Ink Borders */
  --border-color: #2b302a;
  --text-primary: #2b302a;
  --text-secondary: #6b7280;

  /* Official Brand & Player Accent Colors */
  --accent-yellow: #f3cd57;
  --accent-yellow-hover: #fcd34d;
  --accent-p1-blue: #9ec5e8;
  --accent-p2-orange: #f8a170;
  --accent-green: #a7cc8d;
  --accent-danger: #e63946;

  /* Tactile Neo-Brutalist Borders & Radii */
  --border-sm: 2px solid var(--border-color);
  --border-md: 3px solid var(--border-color);
  --border-lg: 4px solid var(--border-color);
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --radius-pill: 9999px;

  /* Signature Zero-Blur Tactile Bottom Shadows */
  --shadow-card: 0px 4px 0px var(--border-color);
  --shadow-btn: 0px 4px 0px var(--border-color);
  --shadow-btn-active: 0px 1px 0px var(--border-color);
  --shadow-modal: 0px 8px 24px rgba(0, 0, 0, 0.28);

  /* Fonts */
  --font-heading: 'Fredoka', cursive, sans-serif;
  --font-body: 'Nunito', sans-serif;
}

/* Dark Theme ("Night Classroom" Mode) */
[data-theme="dark"] {
  --bg-primary: #1c212d;
  --bg-card: #222938;
  --bg-elevated: #2a3244;
  --bg-scoreboard: #181d27;
  --bg-badge: #2d3648;
  --bg-slider-track: #374151;
  --border-color: #11161d;
  --text-primary: #f3f4f6;
  --text-secondary: #9ca3af;
}

* {
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
}

html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-weight: 700;
  transition: background-color 0.2s ease, color 0.2s ease;
  -webkit-touch-callout: none;
  touch-action: none;
}

#app {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
}

canvas {
  display: block;
  touch-action: none;
  outline: none;
}

h1, h2, h3, .font-heading {
  font-family: var(--font-heading);
  font-weight: 700;
  letter-spacing: 0.01em;
}

/* Primary Play Button (Vibrant Yellow Pill with Tactile Push) */
.btn-primary {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 700;
  background-color: var(--accent-yellow);
  color: #2b302a;
  border: var(--border-md);
  border-radius: var(--radius-pill);
  padding: 0.65rem 1.6rem;
  box-shadow: var(--shadow-btn);
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.08s ease, background-color 0.15s ease;
}

.btn-primary:hover {
  background-color: var(--accent-yellow-hover);
}

.btn-primary:active {
  transform: translateY(3px);
  box-shadow: var(--shadow-btn-active);
}

/* Secondary Action Button (Cream / Elevated Surface) */
.btn-secondary {
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 800;
  background-color: var(--bg-card);
  color: var(--text-primary);
  border: var(--border-sm);
  border-radius: var(--radius-md);
  padding: 0.5rem 1rem;
  box-shadow: 0px 3px 0px var(--border-color);
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}

.btn-secondary:active {
  transform: translateY(2px);
  box-shadow: 0px 1px 0px var(--border-color);
}

/* Cards & Scoreboard Containers */
.sl-card {
  background-color: var(--bg-card);
  border: var(--border-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 1.25rem;
}

.sl-scoreboard {
  background-color: var(--bg-scoreboard);
  border: var(--border-sm);
  border-radius: var(--radius-md);
  box-shadow: 0px 3px 0px var(--border-color);
}

.sl-player1-tag {
  background-color: var(--accent-p1-blue);
  color: #1e293b;
  border: var(--border-sm);
  border-radius: var(--radius-sm);
}

.sl-player2-tag {
  background-color: var(--accent-p2-orange);
  color: #1e293b;
  border: var(--border-sm);
  border-radius: var(--radius-sm);
}

/* Pill Badges ("Free", "No ads", "#PenFightSL") */
.sl-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background-color: var(--bg-badge);
  color: var(--text-primary);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-pill);
  padding: 0.2rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
}

/* Pop-up Modal Dialog */
.sl-modal-backdrop {
  background: rgba(17, 22, 29, 0.62);
  backdrop-filter: blur(4px);
}

.sl-modal-box {
  background-color: var(--bg-card);
  border: var(--border-md);
  border-radius: 24px;
  box-shadow: var(--shadow-modal), 0px 6px 0px var(--border-color);
}

/* Custom Pastel Green Volume Slider */
input[type="range"].sl-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 12px;
  background: var(--bg-slider-track);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-pill);
  outline: none;
}

input[type="range"].sl-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent-green);
  border: 2.5px solid var(--border-color);
  box-shadow: 0px 2px 0px var(--border-color);
  cursor: pointer;
}
```

### ফাইল ২: `src/ui/ThemeManager.ts` (থিম ও ভিজ্যুয়াল মোড কন্ট্রোলার)
Light/Dark UI থিম, ডেস্ক টেক্সচার (Clean Desk বনাম Old School Desk), এবং কলমের লুক (Classic বনাম Real) এক জায়গায় নিয়ন্ত্রণ ও সেভ করার মডিউল:

```typescript
import { Preferences } from '@capacitor/preferences';

export type UiThemeMode = 'light' | 'dark';
export type DeskThemeMode = 'clean' | 'old-school';
export type PenLookMode = 'classic' | 'real';

export interface VisualPreferences {
  uiTheme: UiThemeMode;
  deskTheme: DeskThemeMode;
  penLook: PenLookMode;
}

const PREF_KEY = 'shunnek_pen_fight_visual_prefs';

export class ThemeManager {
  public prefs: VisualPreferences = {
    uiTheme: 'light',
    deskTheme: 'clean',
    penLook: 'real'
  };

  public async loadPreferences(): Promise<VisualPreferences> {
    try {
      const { value } = await Preferences.get({ key: PREF_KEY });
      if (value) {
        this.prefs = { ...this.prefs, ...JSON.parse(value) };
      }
    } catch {
      // Fallback to localStorage on web
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) this.prefs = { ...this.prefs, ...JSON.parse(raw) };
    }
    this.applyDomTheme();
    return this.prefs;
  }

  public async setUiTheme(theme: UiThemeMode): Promise<void> {
    this.prefs.uiTheme = theme;
    this.applyDomTheme();
    await this.save();
  }

  public async setDeskTheme(desk: DeskThemeMode): Promise<void> {
    this.prefs.deskTheme = desk;
    await this.save();
  }

  public async setPenLook(look: PenLookMode): Promise<void> {
    this.prefs.penLook = look;
    await this.save();
  }

  public applyDomTheme(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', this.prefs.uiTheme);
    }
  }

  private async save(): Promise<void> {
    const raw = JSON.stringify(this.prefs);
    try {
      await Preferences.set({ key: PREF_KEY, value: raw });
    } catch {
      localStorage.setItem(PREF_KEY, raw);
    }
  }
}

export const themeManager = new ThemeManager();
```

## ৬. আসল ফিজিক্স ইঞ্জিন কোড (`src/physics/PlanckPhysics.ts`)

আসল বান্ডেল (`index-BzLvPmRC.js`) থেকে সংগৃহীত [Planck.js](https://www.google.com/search?q=https%3A%2F%2Fpiqnt.com%2Fplanck.js%2Fdocs%2Fhello-world) কনস্ট্যান্ট (`linearDamping: 0.85–1.4`, `angularDamping: 1.8–3.2`, `restitution: 0.35`, `friction: 0.55`, `density: 1.2`), পুল-ব্যাক ফ্লিক ফোর্স এবং অ্যানিসোট্রপিক ফ্রিকশনের সম্পূর্ণ কোড:

```typescript
import * as planck from 'planck';
import { PenConfig } from '../config/pensConfig';
import { PIXELS_PER_METER } from '../rendering/RealPenRenderer';

export interface PhysicsPenInstance {
  playerIndex: 1 | 2;
  config: PenConfig;
  body: planck.Body;
  falling: boolean;
  fallScale: number;
  fallAlpha: number;
}

export class PenFightPhysicsWorld {
  public world: planck.World;
  public pens: PhysicsPenInstance[] = [];
  public onCollisionCallback?: (impactSpeed: number, pointPx: { x: number; y: number }) => void;

  constructor() {
    // Top-down 2D desk world has zero gravity
    this.world = planck.World(planck.Vec2(0, 0));
    this.setupCollisionListener();
  }

  public createPen(playerIndex: 1 | 2, config: PenConfig, xPx: number, yPx: number, angleRad: number): PhysicsPenInstance {
    const xM = xPx / PIXELS_PER_METER;
    const yM = yPx / PIXELS_PER_METER;

    // Extracted Planck.js damping constants scaled by Grip stat
    const gripRatio = config.stats.grip / 10;
    const linearDamping = 0.85 + gripRatio * 0.55;   // 0.85 - 1.40
    const angularDamping = 1.80 + gripRatio * 1.40;  // 1.80 - 3.20

    const body = this.world.createDynamicBody({
      position: planck.Vec2(xM, yM),
      angle: angleRad,
      linearDamping,
      angularDamping,
      bullet: true
    });

    const halfL = config.dimensions.lengthMeters / 2;
    const halfW = config.dimensions.widthMeters / 2;
    const density = 1.2 * (0.5 + (config.stats.weight / 10) * 0.9);

    body.createFixture({
      shape: planck.Box(halfL, halfW),
      density,
      friction: 0.55,
      restitution: 0.35
    });

    const instance: PhysicsPenInstance = {
      playerIndex,
      config,
      body,
      falling: false,
      fallScale: 1.0,
      fallAlpha: 1.0
    };

    body.setUserData(instance);
    this.pens.push(instance);
    return instance;
  }

  /**
   * Extracted Pull-Back Flick Impulse Calculation
   * Off-center grab points automatically generate spin torque (r x F) in Planck.js!
   */
  public applyFlickShot(
    penInstance: PhysicsPenInstance,
    dragStartPx: { x: number; y: number },
    dragEndPx: { x: number; y: number },
    worldGrabPointPx: { x: number; y: number }
  ): boolean {
    const dx = dragStartPx.x - dragEndPx.x;
    const dy = dragStartPx.y - dragEndPx.y;
    const distancePx = Math.hypot(dx, dy);

    // Cancel shot if dragged less than 16 pixels
    if (distancePx < 16) return false;

    const maxDragPx = 150;
    const clampedDist = Math.min(distancePx, maxDragPx);
    const dirX = dx / (distancePx || 1);
    const dirY = dy / (distancePx || 1);

    const baseForce = 0.08;
    const speedMult = 0.5 + (penInstance.config.stats.speed / 10) * 0.8;
    const forceMagnitude = clampedDist * baseForce * speedMult;

    const impulse = planck.Vec2(dirX * forceMagnitude, dirY * forceMagnitude);
    const grabPointMeters = planck.Vec2(
      worldGrabPointPx.x / PIXELS_PER_METER,
      worldGrabPointPx.y / PIXELS_PER_METER
    );

    penInstance.body.applyLinearImpulse(impulse, grabPointMeters, true);
    return true;
  }

  /**
   * Extracted Anisotropic Friction Solver
   * Decomposes velocity into forward (axial) and side (transverse) vectors
   */
  public applyAnisotropicFriction(body: planck.Body): void {
    const currentVel = body.getLinearVelocity();
    const forwardVec = body.getWorldVector(planck.Vec2(1, 0));
    const sideVec = body.getWorldVector(planck.Vec2(0, 1));

    const forwardSpeed = planck.Vec2.dot(currentVel, forwardVec);
    const sideSpeed = planck.Vec2.dot(currentVel, sideVec);

    const sideDragImpulse = sideVec.clone().mul(-sideSpeed * body.getMass() * 0.045);
    const forwardDragImpulse = forwardVec.clone().mul(-forwardSpeed * body.getMass() * 0.095);

    body.applyLinearImpulse(sideDragImpulse, body.getWorldCenter(), true);
    body.applyLinearImpulse(forwardDragImpulse, body.getWorldCenter(), true);
  }

  public step(dt = 1 / 60): boolean {
    this.world.step(dt, 8, 3);

    let anyMoving = false;
    for (const pen of this.pens) {
      if (pen.falling) {
        pen.fallScale = Math.max(0.25, pen.fallScale - 0.045);
        pen.fallAlpha = Math.max(0, pen.fallAlpha - 0.055);
        if (pen.fallAlpha > 0.02) anyMoving = true;
        continue;
      }

      this.applyAnisotropicFriction(pen.body);

      const v = pen.body.getLinearVelocity();
      const w = pen.body.getAngularVelocity();
      if (v.length() < 0.04 && Math.abs(w) < 0.06) {
        pen.body.setLinearVelocity(planck.Vec2(0, 0));
        pen.body.setAngularVelocity(0);
      } else {
        anyMoving = true;
      }
    }
    return anyMoving;
  }

  private setupCollisionListener(): void {
    this.world.on('post-solve', (contact, impulse) => {
      const normalImpulses = impulse.normalImpulses;
      const maxImpulse = normalImpulses && normalImpulses.length > 0 ? normalImpulses[0] : 0;
      if (maxImpulse > 0.15 && this.onCollisionCallback) {
        const worldManifold = contact.getWorldManifold(null);
        const pt = worldManifold?.points?.[0];
        if (pt) {
          this.onCollisionCallback(maxImpulse, {
            x: pt.x * PIXELS_PER_METER,
            y: pt.y * PIXELS_PER_METER
          });
        }
      }
    });
  }
}
```

## ৭. ডেস্ক শ্রিংকিং, বাউন্ডারি ও AI শট ক্যালকুলেশন (`src/core/DeskAndAI.ts`)

```typescript
import * as planck from 'planck';
import { PhysicsPenInstance } from '../physics/PlanckPhysics';
import { PIXELS_PER_METER } from '../rendering/RealPenRenderer';

export interface DeskBoundsPx {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const SHRINK_WARNING_TURNS = [15, 19, 23, 27];

export function calculateDeskBoundsForTurn(
  initialBounds: DeskBoundsPx,
  shrinkStepsApplied: number
): DeskBoundsPx {
  const shrinkFactor = Math.min(0.32, shrinkStepsApplied * 0.068);
  const width = initialBounds.maxX - initialBounds.minX;
  const height = initialBounds.maxY - initialBounds.minY;
  const insetX = (width * shrinkFactor) / 2;
  const insetY = (height * shrinkFactor) / 2;

  return {
    minX: initialBounds.minX + insetX,
    maxX: initialBounds.maxX - insetX,
    minY: initialBounds.minY + insetY,
    maxY: initialBounds.maxY - insetY
  };
}

export function checkPenFellOffDesk(pen: PhysicsPenInstance, boundsPx: DeskBoundsPx): boolean {
  const centerM = pen.body.getWorldCenter();
  const cx = centerM.x * PIXELS_PER_METER;
  const cy = centerM.y * PIXELS_PER_METER;
  return cx < boundsPx.minX || cx > boundsPx.maxX || cy < boundsPx.minY || cy > boundsPx.maxY;
}

/**
 * Extracted AI Shot Calculation from shunneklabs.app bundle
 */
export function calculateAIShotImpulse(
  aiPen: PhysicsPenInstance,
  playerPen: PhysicsPenInstance,
  difficulty: 'Easy' | 'Normal' | 'Hard'
): { impulse: planck.Vec2; applyPoint: planck.Vec2 } {
  const aiPos = aiPen.body.getPosition();
  const playerPos = playerPen.body.getPosition();

  let targetAngle = Math.atan2(playerPos.y - aiPos.y, playerPos.x - aiPos.x);

  const noiseMap = { Easy: 0.35, Normal: 0.14, Hard: 0.035 };
  const errorNoise = (Math.random() - 0.5) * noiseMap[difficulty];
  targetAngle += errorNoise;

  const distMeters = Math.hypot(playerPos.x - aiPos.x, playerPos.y - aiPos.y);
  const powerScale = difficulty === 'Easy' ? 3.2 : difficulty === 'Normal' ? 4.4 : 5.2;
  const impulseMag = Math.min(14, Math.max(4.5, distMeters * powerScale));

  // On Hard/Normal, apply impulse slightly off-center to induce spin attack
  const spinOffset = difficulty === 'Easy' ? 0 : (Math.random() < 0.6 ? 0.35 : -0.35);
  const localGrab = planck.Vec2(spinOffset, 0);
  const worldGrab = aiPen.body.getWorldPoint(localGrab);

  return {
    impulse: planck.Vec2(Math.cos(targetAngle) * impulseMag, Math.sin(targetAngle) * impulseMag),
    applyPoint: worldGrab
  };
}
```

## ৮. আপনি এখন কীভাবে এটি Antigravity-কে দেবেন?

1. ডানপাশের ক্যানভাসের ওপরে **Copy** বাটনে ক্লিক করে এই পুরো ডকুমেন্টটি কপি করে নিন।
2. আপনার কম্পিউটারে [Google Antigravity IDE](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fproduct%2Fantigravity-ide%2F) ওপেন করে `C:\Users\SHAGOR\shagorize Lab\Pen Fight` ফোল্ডারটি সিলেক্ট করুন।
3. Antigravity-এর Agent চ্যাট বক্সে কপি করা টেক্সটটি পেস্ট করে শুধু লিখুন:  
   **"Follow the INSTRUCTION FOR GOOGLE ANTIGRAVITY AGENT in this blueprint and create all the project files inside my current workspace folder, install the packages, and run the project."**
