/**
 * main.ts
 * Application entry point — initializes PixiJS and bootstraps the game.
 */
import './style.css';
import { Application } from 'pixi.js';
import { GameManager } from './core/GameManager';
import { themeManager } from './ui/ThemeManager';
import { soundSystem } from './audio/penFightProSoundEngine';

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

  // Load fonts via CSS
  const fontLink = document.createElement('style');
  fontLink.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;700&family=Nunito:wght@400;700&display=swap');
  `;
  document.head.appendChild(fontLink);

  // Wait a moment for fonts to start loading
  await new Promise(r => setTimeout(r, 300));

  const gameManager = new GameManager(app);

  // Present the Main Menu (VS Computer / 2 Players / Garage / Settings)
  gameManager.showMainMenu();
}

boot().catch(console.error);
