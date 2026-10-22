/**
 * GameManager.ts
 * Core game coordinator connecting PenFightEngine, ArenaRenderer, TouchAimController,
 * TopHudUpdater, ProgressionManager, and UI modals (MainMenu, PenSelectorModal, SettingsModal).
 */
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import EventEmitter from 'eventemitter3';
import { App } from '@capacitor/app';
import { PenFightEngine } from '../physics/PenFightEngine';
import { ArenaRenderer } from '../rendering/ArenaRenderer';
import { TouchAimController } from '../controllers/TouchAimController';
import { PENS_ROSTER, PenSpec } from '../config/pensConfig';
import { ProgressionManager } from './ProgressionManager';
import { soundSystem, soundManager } from '../audio/penFightProSoundEngine';
import { themeManager } from '../ui/ThemeManager';
import { HUD } from '../ui/HUD';
import { MainMenu } from '../ui/MainMenu';
import { WhoIsPlayingModal } from '../ui/WhoIsPlayingModal';
import { PenSelectorModal } from '../ui/PenSelectorModal';
import { StatsModal } from '../ui/StatsModal';
import { LeaderboardModal } from '../ui/LeaderboardModal';
import { HowToPlayModal } from '../ui/HowToPlayModal';
import { MatchResultModal } from '../ui/MatchResultModal';
import { PauseModal } from '../ui/PauseModal';
import { SettingsModal, GameSettings } from '../ui/SettingsModal';
import { COLORS, MatchFormat } from '../config/gameConstants';

export type GameMode = 'VS_AI' | 'TWO_PLAYER';
export type AIDifficulty = 'easy' | 'normal' | 'hard' | 'master';
export type GamePhase =
  | 'MENU'
  | 'PEN_SELECT'
  | 'SETTINGS'
  | 'PLAYER_TURN'
  | 'SIMULATING'
  | 'ROUND_RESULT'
  | 'MATCH_RESULT'
  | 'PAUSED';

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  currentPlayer: 0 | 1;
  turnNumber: number;
  scores: [number, number];
  roundFirstPlayer: 1 | 2;
  matchFormat: MatchFormat;
  winsNeeded: number;
  equalLevels: boolean;
  mirrorMatch: boolean;
}

export class GameManager extends EventEmitter {
  private app: Application;
  private canvasEl: HTMLCanvasElement; // Pixi overlay canvas

  // 2D Hardware-Accelerated Arena Canvas
  private arenaCanvas: HTMLCanvasElement;
  private arenaCtx: CanvasRenderingContext2D;

  // New Physics & Gameplay Engine
  public engine: PenFightEngine;
  private touchController: TouchAimController;
  private progressionManager: ProgressionManager;

  // Visual layers (Pixi overlays)
  private hudLayer: Container;
  private modalLayer: Container;

  // UI Components
  private hud: HUD;
  private mainMenu: MainMenu;
  private whoModal: WhoIsPlayingModal;
  private penModal: PenSelectorModal;
  private settingsModal: SettingsModal;
  private statsModal: StatsModal;
  private leaderboardModal: LeaderboardModal;
  private howToPlayModal: HowToPlayModal;
  private matchResultModal: MatchResultModal;
  private pauseModal: PauseModal;

  // Selected Pens
  private selectedPenIndices: [number, number] = [0, 1];

  // Game state
  public state: GameState;

  // Center banner for round results & match outcome
  private bannerContainer: Container;
  private bannerBg: Graphics;
  private bannerTitle: Text;
  private bannerSubtitle: Text;

  constructor(app: Application) {
    super();
    this.app = app;
    this.canvasEl = app.canvas as HTMLCanvasElement;

    // 1. Setup 2D Game Arena Canvas
    this.arenaCanvas = document.createElement('canvas');
    this.arenaCanvas.id = 'arena-canvas';
    this.arenaCanvas.style.position = 'absolute';
    this.arenaCanvas.style.top = '0';
    this.arenaCanvas.style.left = '0';
    this.arenaCanvas.style.width = '100%';
    this.arenaCanvas.style.height = '100%';
    this.arenaCanvas.style.zIndex = '1';
    this.arenaCanvas.style.touchAction = 'none';
    this.arenaCtx = this.arenaCanvas.getContext('2d', { alpha: false })!;

    this.canvasEl.style.position = 'absolute';
    this.canvasEl.style.top = '0';
    this.canvasEl.style.left = '0';
    this.canvasEl.style.width = '100%';
    this.canvasEl.style.height = '100%';
    this.canvasEl.style.zIndex = '10';
    this.canvasEl.style.touchAction = 'none';

    const appDiv = document.getElementById('app') || document.body;
    appDiv.insertBefore(this.arenaCanvas, this.canvasEl);

    // 2. Initialize Pure Simulation Engine & Touch Controller
    this.engine = new PenFightEngine();
    this.progressionManager = new ProgressionManager();

    this.touchController = new TouchAimController(
      this.canvasEl,
      this.engine,
      () => (this.state.mode === 'VS_AI' ? 'ai' : '2p')
    );

    // Hook audio events into the engine
    this.setupEngineAudio();

    // 3. Setup Pixi UI Layers (Transparent overlay on top of 2D arena)
    this.hudLayer = new Container();
    this.modalLayer = new Container();

    app.stage.addChild(this.hudLayer);
    app.stage.addChild(this.modalLayer);

    // Initial game state
    this.state = {
      phase: 'MENU',
      mode: 'VS_AI',
      aiDifficulty: 'normal',
      currentPlayer: 0,
      turnNumber: 1,
      scores: [0, 0],
      roundFirstPlayer: 1,
      matchFormat: 'first_to_3',
      winsNeeded: 3,
      equalLevels: true,
      mirrorMatch: false,
    };

    // ── HUD ─────────────────────────────────────────────────────────
    this.hud = new HUD(app.screen.width, app.screen.height);
    this.hudLayer.addChild(this.hud.container);

    this.hud.on('pause_click', () => this.togglePauseMenu());
    this.hud.on('sound_toggle', (enabled: boolean) => {
      soundManager.setEnabled(enabled);
    });

    // ── Center Banner Overlay ───────────────────────────────────────
    this.bannerContainer = new Container();
    this.bannerContainer.visible = false;
    this.hudLayer.addChild(this.bannerContainer);

    this.bannerBg = new Graphics();
    this.bannerContainer.addChild(this.bannerBg);

    const bannerTitleStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 32,
      fill: COLORS.white,
      stroke: { color: COLORS.textDark, width: 4 },
      align: 'center',
    });
    this.bannerTitle = new Text({ text: '', style: bannerTitleStyle });
    this.bannerTitle.anchor.set(0.5, 0.5);
    this.bannerContainer.addChild(this.bannerTitle);

    const bannerSubStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 15,
      fill: COLORS.cream,
      align: 'center',
    });
    this.bannerSubtitle = new Text({ text: '', style: bannerSubStyle });
    this.bannerSubtitle.anchor.set(0.5, 0.5);
    this.bannerContainer.addChild(this.bannerSubtitle);

    // ── Main Menu ───────────────────────────────────────────────────
    this.mainMenu = new MainMenu(app.screen.width, app.screen.height, this.progressionManager);
    this.modalLayer.addChild(this.mainMenu.container);

    this.mainMenu.on('play_click', () => {
      this.mainMenu.hide();
      this.whoModal.show();
    });
    this.mainMenu.on('open_stats', () => {
      this.statsModal.show();
    });
    this.mainMenu.on('open_leaderboard', () => {
      this.leaderboardModal.show();
    });
    this.mainMenu.on('open_settings', () => {
      this.settingsModal.show();
    });
    this.mainMenu.on('open_help', () => {
      this.howToPlayModal.show();
    });
    this.mainMenu.on('sound_toggle', (enabled: boolean) => {
      soundManager.setEnabled(enabled);
      this.settingsModal.settings.soundEnabled = enabled;
    });
    this.mainMenu.on('open_feedback', () => {
      window.open('https://github.com/shagor300/pen-fight/issues', '_blank');
    });

    // ── Who Is Playing Modal ────────────────────────────────────────
    this.whoModal = new WhoIsPlayingModal(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.whoModal.container);

    this.whoModal.on('back', () => {
      this.whoModal.hide();
      this.mainMenu.show();
    });
    this.whoModal.on('select_mode', (mode: GameMode) => {
      this.state.mode = mode;
      this.whoModal.hide();
      this.penModal.show(this.selectedPenIndices[0], mode, this.state.aiDifficulty);
    });

    // ── Pen Selector Modal ──────────────────────────────────────────
    this.penModal = new PenSelectorModal(app.screen.width, app.screen.height, this.progressionManager);
    this.modalLayer.addChild(this.penModal.container);

    this.penModal.on('back', () => {
      this.penModal.hide();
      this.whoModal.show();
    });
    this.penModal.on('start_fight', (opts: {
      penIndex: number;
      mode: GameMode;
      difficulty: AIDifficulty;
      look: 'real' | 'classic';
      mirror: boolean;
      equalLevels: boolean;
    }) => {
      this.selectedPenIndices[0] = opts.penIndex;
      this.selectedPenIndices[1] = opts.mirror ? opts.penIndex : (opts.penIndex + 1) % PENS_ROSTER.length;
      this.state.mode = opts.mode;
      this.state.aiDifficulty = opts.difficulty;
      this.state.equalLevels = opts.equalLevels;
      this.state.mirrorMatch = opts.mirror;
      if (opts.look) {
        this.settingsModal.settings.penLook = opts.look;
      }
      this.penModal.hide();
      this.startGame(this.selectedPenIndices[0], this.selectedPenIndices[1]);
    });

    // ── Stats Modal ─────────────────────────────────────────────────
    this.statsModal = new StatsModal(app.screen.width, app.screen.height, this.progressionManager);
    this.modalLayer.addChild(this.statsModal.container);

    this.leaderboardModal = new LeaderboardModal(app.screen.width, app.screen.height, this.progressionManager);
    this.modalLayer.addChild(this.leaderboardModal.container);

    // ── How To Play Modal ───────────────────────────────────────────
    this.howToPlayModal = new HowToPlayModal(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.howToPlayModal.container);

    // ── Settings Modal ──────────────────────────────────────────────
    this.settingsModal = new SettingsModal(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.settingsModal.container);

    this.settingsModal.on('settings_changed', (cfg: GameSettings) => {
      this.applySettings(cfg);
    });
    this.applySettings(this.settingsModal.settings);

    // ── Match Result Modal ──────────────────────────────────────────
    this.matchResultModal = new MatchResultModal(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.matchResultModal.container);

    this.matchResultModal.on('next_round', () => {
      this.matchResultModal.hide();
      this.state.roundFirstPlayer = this.state.roundFirstPlayer === 1 ? 2 : 1;
      this.startRound();
    });

    this.matchResultModal.on('rematch', () => {
      this.state.scores = [0, 0];
      this.state.roundFirstPlayer = 1;
      this.matchResultModal.hide();
      this.startRound();
    });

    this.matchResultModal.on('change_pens', () => {
      this.matchResultModal.hide();
      this.penModal.show(this.selectedPenIndices[0], this.state.mode, this.state.aiDifficulty);
    });

    this.matchResultModal.on('menu', () => {
      this.matchResultModal.hide();
      this.showMainMenu();
    });

    // ── Pause Modal & In-Game Controls ──────────────────────────────
    this.pauseModal = new PauseModal(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.pauseModal.container);

    this.hud.on('pause_click', () => {
      this.pauseModal.show({
        matchNum: this.state.scores[0] + this.state.scores[1] + 1,
        scores: this.state.scores,
        winsNeeded: this.state.winsNeeded,
        mode: this.state.mode,
        p1Streak: this.progressionManager.getStats().currentStreak,
        p2Streak: 0,
      });
    });

    this.hud.on('leave_click', () => {
      this.showMainMenu();
    });

    this.pauseModal.on('resume', () => {
      this.pauseModal.hide();
    });

    this.pauseModal.on('restart', () => {
      this.pauseModal.hide();
      this.state.scores = [0, 0];
      this.state.roundFirstPlayer = 1;
      this.startRound();
    });

    this.pauseModal.on('change_pens', () => {
      this.pauseModal.hide();
      this.penModal.show(this.selectedPenIndices[0], this.state.mode, this.state.aiDifficulty);
    });

    this.pauseModal.on('settings', () => {
      this.pauseModal.hide();
      this.settingsModal.show();
    });

    this.pauseModal.on('help', () => {
      this.pauseModal.hide();
      this.howToPlayModal.show();
    });

    this.pauseModal.on('main_menu', () => {
      this.pauseModal.hide();
      this.showMainMenu();
    });

    // Initial resize to set geometry & canvas pixel ratio
    this.onResize();

    // Listen to resize
    window.addEventListener('resize', () => this.onResize());

    // Android Hardware & Navigation Back Button Handler
    App.addListener('backButton', () => {
      this.handleHardwareBack();
    });

    // 60-120fps Main Game Loop
    app.ticker.add((ticker) => this.update(ticker.deltaMS / 1000));

    // Show Main Menu on start
    this.showMainMenu();
  }

  /**
   * Android Hardware / Navigation Back Button Handler:
   * - Closes any open modal/popup (Pick Pen, Settings, Stats, Pause) and returns to previous screen.
   * - Never abruptly exits the game while inside a match.
   * - Pauses the game if pressed during a match.
   * - Only exits when on the main menu.
   */
  private handleHardwareBack(): void {
    if (this.howToPlayModal.container.visible) {
      this.howToPlayModal.hide();
      return;
    }
    if (this.settingsModal.container.visible) {
      this.settingsModal.hide();
      return;
    }
    if (this.statsModal.container.visible) {
      this.statsModal.hide();
      return;
    }
    if (this.leaderboardModal.container.visible) {
      this.leaderboardModal.hide();
      return;
    }
    if (this.matchResultModal.container.visible) {
      this.matchResultModal.hide();
      this.showMainMenu();
      return;
    }
    if (this.pauseModal.container.visible) {
      this.pauseModal.hide();
      return;
    }
    if (this.penModal.container.visible) {
      this.penModal.hide();
      this.whoModal.show();
      return;
    }
    if (this.whoModal.container.visible) {
      this.whoModal.hide();
      this.mainMenu.show();
      return;
    }

    // Inside a match: pause, do not exit
    if (this.state.phase === 'PLAYER_TURN' || this.state.phase === 'SIMULATING') {
      this.togglePauseMenu();
      return;
    }

    // On Main Menu: exit app
    if (this.state.phase === 'MENU') {
      App.exitApp();
    }
  }

  private setupEngineAudio(): void {
    // 1. Exact Extracted Pen-on-Pen Collision
    this.engine.onCollision = (impactSpeed: number, isKnockout: boolean) => {
      soundSystem.playPenCollision(impactSpeed, isKnockout);
      soundSystem.haptic(isKnockout ? 'heavy' : impactSpeed > 280 ? 'medium' : 'light');
    };

    this.engine.onHitSound = (intensity: number) => {
      const impactSpeed = intensity * 440;
      soundSystem.playPenCollision(impactSpeed, intensity > 0.85);
      soundSystem.haptic(intensity > 0.6 ? 'heavy' : 'medium');
    };

    // 2. Flick Launch Whoosh
    this.engine.onFlickSound = (power: number) => {
      soundSystem.playFlickLaunch(power);
      soundSystem.haptic('light');
    };

    // 3. Falling Off Desk Edge
    this.engine.onFallSound = () => {
      soundSystem.playPenEdgeFall();
      soundSystem.haptic('heavy');
    };

    // 4. Turn Banner Switch ("YOUR TURN" / "COMPUTER'S TURN")
    this.engine.onTurnSwitch = () => {
      soundSystem.playTurnBanner();
    };

    // 5. Round End
    this.engine.onRoundEnd = (winner: 0 | 1 | 2, reason: string) => {
      this.handleEngineRoundEnd(winner, reason);
    };
  }

  private applySettings(cfg: GameSettings): void {
    this.state.matchFormat = cfg.matchFormat;
    this.state.winsNeeded = cfg.matchFormat === 'first_to_5' ? 5 : 3;
    // Wire physics mode into the engine
    if (cfg.physicsMode) {
      this.engine.setPhysicsMode(cfg.physicsMode);
    }
    // Invalidate cached desk texture so wood color changes instantly
    ArenaRenderer.clearDeskCache();
    if (this.state.phase === 'MENU') {
      this.renderMenuBackground();
    }
  }

  public showMainMenu(): void {
    this.state.phase = 'MENU';
    this.engine.aim.active = false;
    this.bannerContainer.visible = false;
    this.hud.container.visible = false;
    this.whoModal.hide();
    this.penModal.hide();
    this.statsModal.hide();
    this.leaderboardModal.hide();
    this.howToPlayModal.hide();
    this.settingsModal.hide();
    this.pauseModal.hide();
    this.matchResultModal.hide();
    this.mainMenu.show();

    // Render an idle desk background while in the menu
    this.renderMenuBackground();
  }

  private renderMenuBackground(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.arenaCtx.save();
    this.arenaCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const deskStyle = themeManager.getNormalizedDeskTheme();
    const penLook = (themeManager.prefs.penLook || this.settingsModal.settings.penLook) === 'classic' ? 'classic' : 'real';

    if (this.engine.pens.length < 2) {
      const p1 = PENS_ROSTER[this.selectedPenIndices[0]] || PENS_ROSTER[0];
      const p2 = PENS_ROSTER[this.selectedPenIndices[1]] || PENS_ROSTER[1];
      this.engine.startNewRound(p1, p2, 'ai', 1);
    }

    ArenaRenderer.renderArena(this.arenaCtx, w, h, this.engine, deskStyle, penLook);
    this.arenaCtx.restore();
  }

  /** Start a new match with the equipped pens */
  public startGame(pen1Index = 0, pen2Index = 0): void {
    this.selectedPenIndices = [pen1Index, pen2Index];
    this.state.scores = [0, 0];
    this.state.roundFirstPlayer = 1;
    this.mainMenu.hide();
    this.hud.container.visible = true;

    this.startRound();
  }

  /** Start a round within the current match */
  private startRound(): void {
    this.bannerContainer.visible = false;
    this.hud.showWarning(false);
    this.hud.hideCountdown();

    const p1Spec = PENS_ROSTER[this.selectedPenIndices[0]] || PENS_ROSTER[0];
    const p2Spec = PENS_ROSTER[this.selectedPenIndices[1]] || PENS_ROSTER[1];
    const mode = this.state.mode === 'VS_AI' ? 'ai' : '2p';

    const p1Level = this.progressionManager.getProgress(p1Spec.id).level;
    const p2Level = this.state.mirrorMatch && mode === 'ai'
      ? p1Level
      : this.progressionManager.getProgress(p2Spec.id).level;

    this.engine.startNewRound(
      p1Spec,
      p2Spec,
      mode,
      this.state.roundFirstPlayer,
      p1Level,
      p2Level,
      this.state.equalLevels
    );
    this.state.phase = 'PLAYER_TURN';

    this.hud.updateFromEngine(this.engine, mode, this.state.scores);
  }

  /** Per-frame game loop */
  private update(dt: number): void {
    if (this.state.phase === 'MENU') {
      this.mainMenu.update(dt);
      return;
    }
    if (this.state.phase === 'PAUSED') return;

    const mode = this.state.mode === 'VS_AI' ? 'ai' : '2p';
    const diff = this.state.aiDifficulty;

    // 1. Step the 60-120fps physics & AI engine
    this.engine.step(dt, mode, diff);

    // Continuous Velocity-Modulated Wooden Table Sliding Sound
    if (this.engine.phase === 'SIMULATING') {
      for (const pen of this.engine.pens) {
        const speed = Math.hypot(pen.vx, pen.vy);
        const isOnTable = !pen.falling && !pen.fallenOut;
        soundSystem.updatePenTableSlide(pen.playerIndex, speed, isOnTable, pen.omega);
      }
    } else {
      soundSystem.stopAllTableSlides();
    }

    // 2. Render Arena using ArenaRenderer onto 2D canvas
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.arenaCtx.save();
    this.arenaCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const deskStyle = themeManager.getNormalizedDeskTheme();
    const penLook = (themeManager.prefs.penLook || this.settingsModal.settings.penLook) === 'classic' ? 'classic' : 'real';
    const showAimGuide = this.settingsModal.settings.aimGuide;
    const reduceMotion = this.settingsModal.settings.reduceMotion;

    ArenaRenderer.renderArena(this.arenaCtx, w, h, this.engine, deskStyle, penLook, showAimGuide, reduceMotion);
    this.arenaCtx.restore();

    // 3. Update Top HUD using TopHudUpdater
    this.hud.updateFromEngine(this.engine, mode, this.state.scores);
  }

  /** Handle round end emitted by PenFightEngine */
  private handleEngineRoundEnd(winner: 0 | 1 | 2, reason: string): void {
    if (this.state.phase === 'ROUND_RESULT' || this.state.phase === 'MATCH_RESULT') return;
    this.state.phase = 'ROUND_RESULT';

    if (winner === 1) {
      this.state.scores[0]++;
      const title = this.state.mode === 'VS_AI' ? 'YOU WIN ROUND!' : 'PLAYER 1 WINS!';
      this.showRoundBanner(title, reason);
      this.awardXP(true);
    } else if (winner === 2) {
      this.state.scores[1]++;
      const title = this.state.mode === 'VS_AI' ? 'COMPUTER WINS ROUND!' : 'PLAYER 2 WINS!';
      this.showRoundBanner(title, reason);
      this.awardXP(false);
    } else {
      this.showRoundBanner('ROUND DRAW!', reason);
      this.awardXP(false);
    }

    const matchEnded = this.checkMatchWin();
    soundSystem.stopAllTableSlides();

    setTimeout(() => {
      this.bannerContainer.visible = false;
      const p1Spec = PENS_ROSTER[this.selectedPenIndices[0]];
      const p2Spec = PENS_ROSTER[this.selectedPenIndices[1]];
      soundSystem.playMatchEndPopup(winner === 1);
      this.matchResultModal.show({
        winner: winner === 1 ? 1 : 2,
        scores: this.state.scores,
        winsNeeded: this.state.winsNeeded,
        mode: this.state.mode,
        p1Pen: p1Spec,
        p2Pen: p2Spec,
        streak: this.progressionManager.getStats().currentStreak,
        xpEarned: winner === 1 ? 50 : 15,
        isSeriesComplete: matchEnded,
      });
    }, 1500);
  }

  private awardXP(p1Won: boolean): void {
    const p1Id = PENS_ROSTER[this.selectedPenIndices[0]].id;
    const p2Id = PENS_ROSTER[this.selectedPenIndices[1]].id;

    this.progressionManager.recordMatch(p1Id, p1Won);
    if (this.state.mode === 'TWO_PLAYER') {
      this.progressionManager.recordMatch(p2Id, !p1Won);
    }
  }

  private checkMatchWin(): boolean {
    if (this.state.matchFormat === 'endless') return false;
    return (
      this.state.scores[0] >= this.state.winsNeeded ||
      this.state.scores[1] >= this.state.winsNeeded
    );
  }

  private showMatchResult(): void {
    this.state.phase = 'MATCH_RESULT';
    const p1Won = this.state.scores[0] >= this.state.winsNeeded;
    const winnerName = p1Won
      ? 'PLAYER 1'
      : this.state.mode === 'VS_AI'
      ? 'COMPUTER'
      : 'PLAYER 2';

    this.showRoundBanner(
      `🏆 ${winnerName} WINS!`,
      `Final Score: ${this.state.scores[0]} – ${this.state.scores[1]}\nTap anywhere to return to Menu`,
    );

    const restartHandler = () => {
      this.canvasEl.removeEventListener('pointerdown', restartHandler);
      this.showMainMenu();
    };
    setTimeout(() => {
      this.canvasEl.addEventListener('pointerdown', restartHandler);
    }, 1200);
  }

  private showRoundBanner(title: string, sub: string): void {
    this.bannerTitle.text = title;
    this.bannerSubtitle.text = sub;

    const w = Math.min(this.app.screen.width - 40, 360);
    const h = 110;

    this.bannerBg.clear()
      .roundRect(-w / 2, -h / 2, w, h, 18)
      .fill({ color: 0x1A140E, alpha: 0.95 })
      .stroke({ color: COLORS.accent, width: 3 });

    this.bannerTitle.y = -16;
    this.bannerSubtitle.y = 20;

    this.bannerContainer.x = this.app.screen.width / 2;
    this.bannerContainer.y = this.app.screen.height / 2;
    this.bannerContainer.visible = true;
    soundSystem.playTurnBanner();
  }

  private togglePauseMenu(): void {
    if (this.state.phase === 'MENU') return;
    this.showMainMenu();
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    // Resize 2D Arena Canvas
    this.arenaCanvas.width = Math.round(w * dpr);
    this.arenaCanvas.height = Math.round(h * dpr);
    this.engine.updateDeskGeometry(w, h);

    // Layout Pixi UI layers
    this.hud.layout(w, h);
    this.mainMenu.layout(w, h);
    this.whoModal.layout(w, h);
    this.penModal.layout(w, h);
    this.settingsModal.layout(w, h);
    this.statsModal.layout(w, h);
    this.leaderboardModal.layout(w, h);
    this.howToPlayModal.layout(w, h);
    this.matchResultModal.layout(w, h);
    this.pauseModal.layout(w, h);

    this.bannerContainer.x = w / 2;
    this.bannerContainer.y = h / 2;

    if (this.state.phase === 'MENU') {
      this.renderMenuBackground();
    }
  }
}
