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
import { ProgressionManager, progressionManager as sharedProgression } from './ProgressionManager';
import { soundSystem, soundManager } from '../audio/penFightProSoundEngine';
import { themeManager } from '../ui/ThemeManager';
import { HUD } from '../ui/HUD';
import { MainMenu } from '../ui/MainMenu';
import { WhoIsPlayingModal } from '../ui/WhoIsPlayingModal';
import { PenSelectorModal } from '../ui/PenSelectorModal';
import { StatsModal } from '../ui/StatsModal';
import { LeaderboardModal } from '../ui/LeaderboardModal';
import { MatchSetupScreen } from '../ui/MatchSetupScreen';
import { MissionsScreen } from '../ui/MissionsScreen';
import { ConfirmModal } from '../ui/components/ConfirmModal';
import { ToastNotification, type ToastKind } from '../ui/components/ToastNotification';
import { PenChip } from '../ui/components/PenChip';
import { getEconomy } from '../economy/EconomyStorage';
import { formatPen, type MatchOutcome } from '../economy/EconomyEngine';
import { ECONOMY_CONFIG, type AIDifficultyId, type MatchTierId } from '../config/economyConfig';
import { HowToPlayModal } from '../ui/HowToPlayModal';
import { MatchResultModal, type MatchResultEcon, type MatchResultData } from '../ui/MatchResultModal';
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
  private matchSetup!: MatchSetupScreen;
  private missionsScreen!: MissionsScreen;
  private confirmModal!: ConfirmModal;
  private toast!: ToastNotification;

  // PEN economy / match lifecycle
  private currentMatchId: string | null = null;
  private lastTier: MatchTierId = 'practice';
  private matchMarkedStarted = false;
  private prePausePhase: GamePhase | null = null;
  private lastResultData: MatchResultData | null = null;
  private returnToPause = false;
  private unsettledOutcome: MatchOutcome | null = null;

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
    this.progressionManager = sharedProgression;

    this.touchController = new TouchAimController(
      this.canvasEl,
      this.engine,
      () => (this.state.mode === 'VS_AI' ? 'ai' : '2p'),
      () => this.canAim()
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
    this.mainMenu.on('open_missions', () => {
      this.missionsScreen.show();
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
      p2Index?: number;
      mode: GameMode;
      difficulty: AIDifficulty;
      look: 'real' | 'classic';
      mirror: boolean;
      equalLevels: boolean;
    }) => {
      this.selectedPenIndices[0] = opts.penIndex;
      this.selectedPenIndices[1] = opts.mirror
        ? opts.penIndex
        : (opts.p2Index ?? (opts.penIndex + 1) % PENS_ROSTER.length);
      this.state.mode = opts.mode;
      this.state.aiDifficulty = opts.difficulty;
      this.state.equalLevels = opts.equalLevels;
      this.state.mirrorMatch = opts.mirror;
      if (opts.look) {
        this.settingsModal.settings.penLook = opts.look;
        themeManager.setPenLook(opts.look);
      }
      this.penModal.hide();
      if (opts.mode === 'VS_AI') {
        // Nothing is charged here: the player picks a tier and confirms the fee.
        this.openMatchSetup();
      } else {
        // Local duels are free (no PEN stakes).
        this.beginMatch('practice');
      }
    });

    // ── Stats Modal ─────────────────────────────────────────────────
    this.statsModal = new StatsModal(app.screen.width, app.screen.height, this.progressionManager);
    this.modalLayer.addChild(this.statsModal.container);

    this.leaderboardModal = new LeaderboardModal(app.screen.width, app.screen.height);
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
    this.settingsModal.on('request_reset', () => this.requestResetProgress());
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
      this.matchResultModal.hide();
      this.rematch();
    });

    // Both ask first when the series is still open (leaving then forfeits).
    this.matchResultModal.on('change_pens', () => this.requestLeave('change_pens'));

    this.matchResultModal.on('menu', () => this.requestLeave('menu'));

    // ── Pause Modal & In-Game Controls ──────────────────────────────
    this.pauseModal = new PauseModal(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.pauseModal.container);

    this.hud.on('pause_click', () => this.pauseGame());

    this.hud.on('leave_click', () => this.requestLeave('menu'));

    this.pauseModal.on('resume', () => this.resumeGame());

    this.pauseModal.on('restart', () => this.requestLeave('restart'));

    this.pauseModal.on('change_pens', () => this.requestLeave('change_pens'));

    // Settings / Help opened from Pause: Pause comes back when they close.
    this.pauseModal.on('settings', () => {
      this.pauseModal.hide();
      this.returnToPause = true;
      this.settingsModal.show();
    });

    this.pauseModal.on('help', () => {
      this.pauseModal.hide();
      this.returnToPause = true;
      this.howToPlayModal.show();
    });

    this.pauseModal.on('main_menu', () => this.requestLeave('menu'));

    // ── Economy screens, dialog and toast (always on top) ─────────────────
    this.matchSetup = new MatchSetupScreen(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.matchSetup.container);
    this.matchSetup.on('back', () => {
      this.matchSetup.hide();
      this.penModal.show(this.selectedPenIndices[0], this.state.mode, this.state.aiDifficulty);
    });
    this.matchSetup.on('confirm', (tier: MatchTierId) => this.beginMatch(tier));
    this.matchSetup.on('open_missions', () => this.missionsScreen.show());

    this.missionsScreen = new MissionsScreen(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.missionsScreen.container);
    this.missionsScreen.on('back', () => {
      this.missionsScreen.hide();
      if (this.state.phase === 'MENU') this.mainMenu.updateStats();
    });
    this.missionsScreen.on('toast', (msg: string, kind: ToastKind) => this.showToast(msg, kind));

    this.confirmModal = new ConfirmModal(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.confirmModal.container);

    this.toast = new ToastNotification();
    this.modalLayer.addChild(this.toast);
    this.toast.layout(app.screen.width);

    // Settle anything a crash or OS kill left open, and finish pen XP once.
    this.startupRecovery();

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
    if (this.confirmModal.isOpen) {
      this.confirmModal.cancel();
      return;
    }
    if (this.missionsScreen.isOpen) {
      this.missionsScreen.hide();
      return;
    }
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
      // Between rounds the match is still open: leaving needs the same warning.
      if (getEconomy().getActiveMatch()) {
        this.requestLeave('menu');
      } else {
        this.matchResultModal.hide();
        this.showMainMenu();
      }
      return;
    }
    if (this.pauseModal.container.visible) {
      this.resumeGame();
      return;
    }
    if (this.matchSetup.isOpen) {
      this.matchSetup.hide();
      this.penModal.show(this.selectedPenIndices[0], this.state.mode, this.state.aiDifficulty);
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
      this.pauseGame();
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
      this.markMatchStarted(); // from the first shot on, leaving forfeits the entry fee
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
    // The series format is fixed for a live match; a new choice applies from the next match.
    if (!getEconomy().getActiveMatch()) {
      this.state.matchFormat = cfg.matchFormat;
      this.state.winsNeeded = cfg.matchFormat === 'first_to_5' ? 5 : 3;
    }
    // Wire physics mode into the engine
    if (cfg.physicsMode) {
      this.engine.setPhysicsMode(cfg.physicsMode);
    }
    // Invalidate cached desk texture so wood color changes instantly
    PenChip.reduceMotion = !!cfg.reduceMotion;
    ArenaRenderer.clearDeskCache();
    if (this.state.phase === 'MENU') {
      this.renderMenuBackground();
    }
  }

  public showMainMenu(): void {
    // Safety net: no path may leave a match open (and its fee in limbo).
    this.leaveMatch();
    this.state.phase = 'MENU';
    this.prePausePhase = null;
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
    this.matchSetup.hide();
    this.missionsScreen.hide();
    this.confirmModal.close();
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
    const penLook = (this.settingsModal.settings.penLook || themeManager.prefs.penLook) === 'classic' ? 'classic' : 'real';

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
    this.lastResultData = null;
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
    // Back from Settings / Help (however it was closed): show Pause again.
    if (
      this.returnToPause &&
      this.state.phase === 'PAUSED' &&
      !this.settingsModal.container.visible &&
      !this.howToPlayModal.container.visible
    ) {
      this.returnToPause = false;
      this.showPauseModal();
    }
    // Paused, or choosing pens/tier: the simulation must not advance underneath.
    if (this.state.phase === 'PAUSED' || this.state.phase === 'PEN_SELECT') return;

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
    const penLook = (this.settingsModal.settings.penLook || themeManager.prefs.penLook) === 'classic' ? 'classic' : 'real';
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
    } else if (winner === 2) {
      this.state.scores[1]++;
      const title = this.state.mode === 'VS_AI' ? 'COMPUTER WINS ROUND!' : 'PLAYER 2 WINS!';
      this.showRoundBanner(title, reason);
    } else {
      this.showRoundBanner('ROUND DRAW!', reason);
    }

    // PEN and XP are settled once, when the whole series ends (never per round).
    const matchEnded = this.checkMatchWin();
    let econ: MatchResultEcon | undefined;
    if (matchEnded) {
      econ = this.settleSeries();
    }
    soundSystem.stopAllTableSlides();

    const stakeFee = getEconomy().getActiveMatch()?.entryFee ?? 0;
    const streak = getEconomy().getStats().currentStreak;

    setTimeout(() => {
      // The player may have left during the banner (Home / Main Menu).
      if (this.state.phase !== 'ROUND_RESULT') return;
      this.bannerContainer.visible = false;
      const p1Spec = PENS_ROSTER[this.selectedPenIndices[0]];
      const p2Spec = PENS_ROSTER[this.selectedPenIndices[1]];
      soundSystem.playMatchEndPopup(winner === 1);
      this.lastResultData = {
        winner: winner === 1 ? 1 : 2,
        scores: this.state.scores,
        winsNeeded: this.state.winsNeeded,
        mode: this.state.mode,
        p1Pen: p1Spec,
        p2Pen: p2Spec,
        streak,
        isSeriesComplete: matchEnded,
        roundDraw: winner === 0,
        stakeFee,
        econ,
      };
      this.matchResultModal.show(this.lastResultData);
    }, 1500);
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
    this.matchSetup.layout(w, h);
    this.missionsScreen.layout(w, h);
    this.confirmModal.layout(w, h);
    this.toast.layout(w);

    this.bannerContainer.x = w / 2;
    this.bannerContainer.y = h / 2;

    if (this.state.phase === 'MENU') {
      this.renderMenuBackground();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PEN ECONOMY: match lifecycle
  // ═══════════════════════════════════════════════════════════════════════

  private showToast(message: string, kind: ToastKind = 'info', ms = 2600): void {
    this.toast.show(message, kind, ms);
  }

  private ecoDifficulty(): AIDifficultyId {
    const d = this.state.aiDifficulty;
    return d === 'master' ? 'hard' : d;
  }

  /** Touch aiming is only allowed while a match is live and nothing covers it. */
  private canAim(): boolean {
    if (this.confirmModal && this.confirmModal.isOpen) return false;
    return this.state.phase === 'PLAYER_TURN' || this.state.phase === 'SIMULATING';
  }

  private openMatchSetup(preselect?: MatchTierId): void {
    this.matchSetup.show({
      mode: this.state.mode,
      difficulty: this.ecoDifficulty(),
      endless: this.state.matchFormat === 'endless',
      preselect: preselect ?? this.lastTier,
    });
  }

  /** Charge the fee (if any) once, open the match record, then start playing. */
  private beginMatch(tier: MatchTierId): void {
    const eco = getEconomy();
    // A leftover open match would block a new one; settle it first.
    this.leaveMatch();
    // Pick up the format chosen in Settings (locked while a match is open).
    this.state.matchFormat = this.settingsModal.settings.matchFormat;
    this.state.winsNeeded = this.state.matchFormat === 'first_to_5' ? 5 : 3;

    const matchId = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const p1 = PENS_ROSTER[this.selectedPenIndices[0]];
    const p2 = PENS_ROSTER[this.selectedPenIndices[1]];
    const r = eco.startMatch({
      matchId,
      mode: this.state.mode,
      tier,
      difficulty: this.ecoDifficulty(),
      penId: p1.id,
      opponentPenId: this.state.mode === 'TWO_PLAYER' ? p2.id : null,
      endless: this.state.matchFormat === 'endless',
    });
    if (!r.ok) {
      this.showToast(r.message, 'error', 3200);
      return;
    }
    this.currentMatchId = matchId;
    this.lastTier = tier;
    this.matchMarkedStarted = false;
    this.matchSetup.hide();
    this.startGame(this.selectedPenIndices[0], this.selectedPenIndices[1]);
  }

  /** First shot fired: from now on leaving the match forfeits the entry fee. */
  private markMatchStarted(): void {
    if (this.matchMarkedStarted || !this.currentMatchId) return;
    // Only remember success, so a failed save is retried on the next shot.
    const r = getEconomy().markMatchStarted(this.currentMatchId);
    if (r.ok) this.matchMarkedStarted = true;
  }

  /** Series finished: settle PEN and XP exactly once and build the result data. */
  private settleSeries(): MatchResultEcon | undefined {
    const eco = getEconomy();
    const id = this.currentMatchId;
    if (!id) return undefined;
    const outcome: MatchOutcome = this.state.scores[0] > this.state.scores[1] ? 'win' : 'loss';
    const r = eco.finalizeMatch(id, outcome);
    if (!r.ok) {
      // Keep the outcome so Rematch / Leave can retry the save instead of forfeiting.
      this.unsettledOutcome = outcome;
      this.showToast(`Could not save the result: ${r.message}`, 'error', 4000);
      return undefined;
    }
    this.unsettledOutcome = null;
    this.currentMatchId = null;
    this.applyPendingPenXp();
    const m = r.match;
    if (m.levelsGained.length > 0 && r.fresh) {
      this.showToast(`Level up! You reached level ${m.levelsGained[m.levelsGained.length - 1]}`, 'success', 3200);
    }
    return {
      tierLabel: ECONOMY_CONFIG.tiers[m.tier].label,
      entryFee: m.entryFee,
      payout: m.payout,
      netPen: m.netPen,
      bonusPen: m.bonusPen,
      balanceAfter: m.balanceAfter ?? eco.getBalance(),
      accountXp: m.accountXp,
      penXp: m.penXp,
      levelsGained: m.levelsGained,
      forfeited: m.forfeited,
    };
  }

  /** Apply queued pen mastery XP. The queue is cleared first, so it can never double-apply. */
  private applyPendingPenXp(): void {
    for (const x of getEconomy().takePendingPenXp()) {
      this.progressionManager.addXP(x.penId, x.amount);
    }
  }

  /**
   * End the current match without a normal result: refund before the first
   * shot, forfeit after it. Endless Practice is simply scored where it stands.
   */
  private leaveMatch(): void {
    const eco = getEconomy();
    const m = eco.getActiveMatch();
    if (!m) {
      this.currentMatchId = null;
      return;
    }
    if (this.unsettledOutcome) {
      // A finished series whose save failed: retry it rather than forfeit.
      const retry = eco.finalizeMatch(m.matchId, this.unsettledOutcome);
      if (retry.ok) this.unsettledOutcome = null;
      else eco.abandonMatch(m.matchId);
    } else if (m.status === 'in_progress' && m.tier === 'practice' && m.endless) {
      const [a, b] = this.state.scores;
      eco.finalizeMatch(m.matchId, a > b ? 'win' : a < b ? 'loss' : 'draw');
    } else {
      eco.abandonMatch(m.matchId);
    }
    this.currentMatchId = null;
    this.applyPendingPenXp();
  }

  /** Ask before leaving a live match, saying exactly what it costs. */
  private requestLeave(next: 'menu' | 'restart' | 'change_pens'): void {
    const m = getEconomy().getActiveMatch();
    const proceed = (): void => {
      this.pauseModal.hide();
      this.matchResultModal.hide();
      this.prePausePhase = null;
      this.leaveMatch();
      if (next === 'menu') {
        this.showMainMenu();
      } else if (next === 'change_pens') {
        // Menu phase keeps Android Back and the simulation (stopped) consistent
        this.state.phase = 'MENU';
        this.hud.container.visible = false;
        this.penModal.show(this.selectedPenIndices[0], this.state.mode, this.state.aiDifficulty);
      } else {
        this.rematch();
      }
    };
    if (!m) {
      proceed();
      return;
    }

    let body: string;
    let danger = false;
    if (m.status === 'in_progress' && m.entryFee > 0) {
      body = `Leaving now counts as a loss and you lose your ${formatPen(m.entryFee)} PEN entry fee.`;
      danger = true;
    } else if (m.status === 'in_progress') {
      body = 'Leaving now ends this match without rewards.';
    } else if (m.entryFee > 0) {
      body = `No shot has been taken yet, so your ${formatPen(m.entryFee)} PEN entry fee will be refunded.`;
    } else {
      body = 'Leave this match?';
    }
    this.freeze();
    this.confirmModal.open({
      title: 'Leave match?',
      body,
      confirmLabel: 'Leave',
      cancelLabel: 'Stay',
      danger,
      onConfirm: proceed,
      onCancel: () => {
        // Stay. The result card hides itself when one of its buttons is tapped,
        // so bring it back; otherwise carry on playing unless the pause menu is up.
        if (this.state.phase === 'ROUND_RESULT' && !this.matchResultModal.container.visible && this.lastResultData) {
          this.matchResultModal.show(this.lastResultData);
        } else if (!this.pauseModal.container.visible && !this.matchResultModal.container.visible) {
          this.unfreeze();
        }
      },
    });
  }

  /** New match with the same pens. Paid tiers must be confirmed (and charged) again. */
  private rematch(): void {
    this.state.scores = [0, 0];
    this.state.roundFirstPlayer = 1;
    this.hud.container.visible = false;
    this.state.phase = 'MENU';
    if (this.state.mode === 'VS_AI' && this.lastTier !== 'practice') {
      this.openMatchSetup(this.lastTier);
    } else {
      this.beginMatch('practice');
    }
  }

  // ── Pause (the match really stops while paused) ───────────────────────

  private freeze(): void {
    if (this.state.phase === 'PLAYER_TURN' || this.state.phase === 'SIMULATING') {
      this.prePausePhase = this.state.phase;
      this.state.phase = 'PAUSED';
      this.engine.aim.active = false;
      soundSystem.stopAllTableSlides();
    }
  }

  private unfreeze(): void {
    if (this.state.phase === 'PAUSED') {
      this.state.phase = this.prePausePhase ?? 'PLAYER_TURN';
      this.prePausePhase = null;
    }
  }

  private pauseGame(): void {
    if (this.state.phase !== 'PLAYER_TURN' && this.state.phase !== 'SIMULATING') return;
    this.freeze();
    this.showPauseModal();
  }

  private showPauseModal(): void {
    this.pauseModal.show({
      matchNum: this.state.scores[0] + this.state.scores[1] + 1,
      scores: this.state.scores,
      winsNeeded: this.state.winsNeeded,
      mode: this.state.mode,
      p1Streak: getEconomy().getStats().currentStreak,
      p2Streak: 0,
    });
  }

  private resumeGame(): void {
    this.pauseModal.hide();
    this.unfreeze();
  }

  // ── Reset progress, startup recovery ──────────────────────────────

  private requestResetProgress(): void {
    this.confirmModal.open({
      title: 'Reset progress?',
      body: 'This clears your PEN balance, XP, levels, stats and pen mastery. This cannot be undone.',
      confirmLabel: 'Reset',
      cancelLabel: 'Cancel',
      danger: true,
      onConfirm: () => {
        this.leaveMatch();
        getEconomy().resetAll();
        this.progressionManager.reset();
        this.settingsModal.hide();
        this.showMainMenu();
        this.showToast('Progress reset. You start with a fresh PEN balance.', 'info', 3600);
      },
    });
  }

  private startupRecovery(): void {
    const eco = getEconomy();
    const note = eco.recoverInterrupted();
    this.applyPendingPenXp();
    if (eco.recoveredFromCorruption) {
      this.showToast('Saved data could not be read, so a new wallet was created.', 'error', 5000);
    } else if (note) {
      this.showToast(note, 'info', 4500);
    }
  }
}
