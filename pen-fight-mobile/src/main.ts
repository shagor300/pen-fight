/**
 * main.ts
 * Application entry point — initializes PixiJS and bootstraps the game.
 */
import './style.css';
import { Application } from 'pixi.js';
import { GameManager } from './core/GameManager';
import { themeManager } from './ui/ThemeManager';
import { soundSystem } from './audio/penFightProSoundEngine';
import { initEconomy } from './economy/EconomyStorage';

async function boot(): Promise<void> {
  // Unlock Web Audio API on first user interaction
  window.addEventListener('pointerdown', () => {
    soundSystem.init();
  }, { once: true });

  // Load visual theme preferences (light/dark, desk, pen look)
  await themeManager.loadPreferences();

  const app = new Application();

  await app.init({
    backgroundAlpha: 0,         // transparent so 2D Arena Canvas is visible underneath
    resizeTo: window,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    preference: 'webgl',
  });

  const canvas = app.canvas as HTMLCanvasElement;
  document.getElementById('app')!.appendChild(canvas);

  // Ensure canvas fills viewport and sits on top with transparency
  canvas.id = 'pixi-canvas';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.zIndex = '10';
  canvas.style.touchAction = 'none'; // prevent browser gestures

  // Fonts are bundled (@fontsource, imported in style.css), so no network is
  // needed. Wait briefly so the first Pixi text render uses the right face.
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('700 20px Fredoka'),
        document.fonts.load('600 14px Fredoka'),
        document.fonts.load('700 14px Nunito'),
        document.fonts.load('800 14px Nunito'),
      ]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    // Fall back to system fonts rather than blocking startup
  }

  // Load the PEN wallet (newest of localStorage / Preferences) before any UI
  await initEconomy();

  const gameManager = new GameManager(app);

  // Present the Main Menu (VS Computer / 2 Players / Garage / Settings)
  gameManager.showMainMenu();
}

boot().catch(console.error);
