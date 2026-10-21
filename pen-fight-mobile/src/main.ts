/**
 * main.ts
 * Application entry point — initializes PixiJS with Ultra-HD Retina Supersampling
 * (minimum 2x resolution even on standard displays) and bootstraps Desk Wars: Pen Fight.
 */
import './style.css';
import { Application, AbstractRenderer } from 'pixi.js';
import { GameManager } from './core/GameManager';
import { themeManager } from './ui/ThemeManager';

async function boot(): Promise<void> {
  await themeManager.loadPreferences();

  // Force at least 2x Retina supersampling so vector borders, pens, and text look razor-sharp
  const targetResolution = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
  AbstractRenderer.defaultOptions.resolution = targetResolution;

  const app = new Application();

  await app.init({
    backgroundAlpha: 0,
    resizeTo: window,
    antialias: true,
    autoDensity: true,
    roundPixels: false,
    resolution: targetResolution,
    preference: 'webgl',
  });

  const canvas = app.canvas as HTMLCanvasElement;
  document.getElementById('app')!.appendChild(canvas);

  canvas.id = 'pixi-canvas';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.zIndex = '10';
  canvas.style.touchAction = 'none';

  const fontLink = document.createElement('style');
  fontLink.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800&display=swap');
    body, html, #app {
      background-color: #f5edd6;
      margin: 0;
      padding: 0;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
  `;
  document.head.appendChild(fontLink);

  if (document.fonts && document.fonts.ready) {
    await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 400))]);
  } else {
    await new Promise(r => setTimeout(r, 300));
  }

  const gameManager = new GameManager(app);
  gameManager.showMainMenu();
}

boot().catch(console.error);
