import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import EventEmitter from 'eventemitter3';
import { PenFightEngine } from '../physics/PenFightEngine';
import { ArenaRenderer } from '../rendering/ArenaRenderer';
import { TouchAimController } from '../controllers/TouchAimController';
import { PENS_ROSTER } from '../config/pensConfig';
import { ProgressionManager } from './ProgressionManager';
import { soundManager } from '../audio/SoundAndHaptics';
import { themeManager } from '../ui/ThemeManager';
import { HUD } from '../ui/HUD';
import { MainMenu } from '../ui/MainMenu';
import { WhoIsPlayingModal } from '../ui/WhoIsPlayingModal';
import { PenSelectorModal } from '../ui/PenSelectorModal';
import { StatsModal } from '../ui/StatsModal';
import { HowToPlayModal } from '../ui/HowToPlayModal';
import { MatchResultModal } from '../ui/MatchResultModal';
import { SettingsModal, GameSettings } from '../ui/SettingsModal';
import { COLORS, MatchFormat } from '../config/gameConstants';

export type GameMode = 'VS_AI' | 'TWO_PLAYER';
export type AIDifficulty = 'easy' | 'normal' | 'hard';
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
}

export class GameManager extends EventEmitter {
  private app: Application;
  private canvasEl: HTMLCanvasElement;

  private arenaCanvas: HTMLCanvasElement;
  private arenaCtx: CanvasRenderingContext2D;

  public engine: PenFightEngine;
  private touchController: TouchAimController;
  private progressionManager: ProgressionManager;

  private hudLayer: Container;
  private modalLayer: Container;

  private hud: HUD;
  private mainMenu: MainMenu;
  private whoModal: WhoIsPlayingModal;
  private penModal: PenSelectorModal;
  private settingsModal: SettingsModal;
  private statsModal: StatsModal;
  private howToPlayModal: HowToPlayModal;
  private matchResultModal: MatchResultModal;

  private selectedPenIndices: [number, number] = [0, 1];
  public state: GameState;

  private bannerContainer: Container;
  private bannerBg: Graphics;
  private bannerTitle: Text;
  private bannerSubtitle: Text;

  constructor(app: Application) {
    super();
    this.app = app;
    this.canvasEl = app.canvas as HTMLCanvasElement;

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

    this.engine = new PenFightEngine();
    this.progressionManager = new ProgressionManager();

    this.touchController = new TouchAimController(
      this.canvasEl,
      this.engine,
      () => (this.state.mode === 'VS_AI' ? 'ai' : '2p')
    );

    this.setupEngineAudio();

    this.hudLayer = new Container();
    this.modalLayer = new Container();

    app.stage.addChild(this.hudLayer);
    app.stage.addChild(this.modalLayer);

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
    };

    this.hud = new HUD(app.screen.width, app.screen.height);
    this.hudLayer.addChild(this.hud.container);

    this.hud.on('pause_click', () => {
      soundManager.play('ui_click');
      this.togglePauseMenu();
    });
    this.hud.on('sound_toggle', (enabled: boolean) => {
      soundManager.setEnabled(enabled);
      if (enabled) soundManager.play('ui_click');
    });

    this.bannerContainer = new Container();
    this.bannerContainer.visible = false;
    this.hudLayer.addChild(this.bannerContainer);

    this.bannerBg = new Graphics();
    this.bannerContainer.addChild(this.bannerBg);

    const bannerTitleStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 28,
      fill: COLORS.textDark,
      fontWeight: 'bold',
      align: 'center',
    });
    this.bannerTitle = new Text({ text: '', style: bannerTitleStyle });
    this.bannerTitle.anchor.set(0.5, 0.5);
    this.bannerContainer.addChild(this.bannerTitle);

    const bannerSubStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 14,
      fill: COLORS.textMuted,
      fontWeight: 'bold',
      align: 'center',
    });
    this.bannerSubtitle = new Text({ text: '', style: bannerSubStyle });
    this.bannerSubtitle.anchor.set(0.5, 0.5);
    this.bannerContainer.addChild(this.bannerSubtitle);

    this.mainMenu = new MainMenu(app.screen.width, app.screen.height, this.progressionManager);
    this.modalLayer.addChild(this.mainMenu.container);

    this.mainMenu.on('play_click', () => {
      soundManager.play('ui_click');
      this.mainMenu.hide();
      this.whoModal.show();
    });
    this.mainMenu.on('open_stats', () => {
      soundManager.play('ui_click');
      this.statsModal.show();
    });
    this.mainMenu.on('open_leaderboard', () => {
      soundManager.play('ui_click');
      this.statsModal.show();
    });
    this.mainMenu.on('open_settings', () => {
      soundManager.play('ui_click');
      this.settingsModal.show();
    });
    this.mainMenu.on('open_help', () => {
      soundManager.play('ui_click');
      this.howToPlayModal.show();
    });

    this.whoModal = new WhoIsPlayingModal(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.whoModal.container);

    this.whoModal.on('back', () => {
      soundManager.play('ui_click');
      this.whoModal.hide();
      this.mainMenu.show();
    });
    this.whoModal.on('select_mode', (mode: GameMode) => {
      soundManager.play('ui_click');
      this.state.mode = mode;
      this.whoModal.hide();
      this.penModal.show(this.selectedPenIndices[0], mode, this.state.aiDifficulty);
    });

    this.penModal = new PenSelectorModal(app.screen.width, app.screen.height, this.progressionManager);
    this.modalLayer.addChild(this.penModal.container);

    this.penModal.on('back', () => {
      this.penModal.hide();
      this.whoModal.show();
    });
    this.penModal.on('start_fight', (opts: {
      penIndex: number;
      p2PenIndex?: number;
      mode: GameMode;
      difficulty: AIDifficulty;
      look: 'real' | 'classic';
      mirror: boolean;
      equalLevels: boolean;
    }) => {
      this.selectedPenIndices[0] = opts.penIndex;
      if (opts.mirror) {
        this.selectedPenIndices[1] = opts.penIndex;
      } else if (opts.mode === 'TWO_PLAYER' && typeof opts.p2PenIndex === 'number') {
        this.selectedPenIndices[1] = opts.p2PenIndex;
      } else {
        let aiIdx = Math.floor(Math.random() * PENS_ROSTER.length);
        if (aiIdx === opts.penIndex) aiIdx = (opts.penIndex + 1) % PENS_ROSTER.length;
        this.selectedPenIndices[1] = aiIdx;
      }

      this.state.mode = opts.mode;
      this.state.aiDifficulty = opts.difficulty;
      this.state.equalLevels = opts.equalLevels;
      if (opts.look) {
        this.settingsModal.settings.penLook = opts.look;
      }
      this.penModal.hide();
      this.startGame(this.selectedPenIndices[0], this.selectedPenIndices[1]);
    });

    this.statsModal = new StatsModal(app.screen.width, app.screen.height, this.progressionManager);
    this.modalLayer.addChild(this.statsModal.container);

    this.howToPlayModal = new HowToPlayModal(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.howToPlayModal.container);

    this.settingsModal = new SettingsModal(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.settingsModal.container);

    this.settingsModal.on('settings_changed', (cfg: GameSettings) => {
      this.applySettings(cfg);
    });
    this.applySettings(this.settingsModal.settings);

    this.matchResultModal = new MatchResultModal(app.screen.width, app.screen.height);
    this.modalLayer.addChild(this.matchResultModal.container);

    this.matchResultModal.on('rematch', () => {
      this.state.scores = [0, 0];
      this.state.roundFirstPlayer = 1;
      this.matchResultModal.hide();
      this.hud.container.visible = true;
      this.startRound();
    });

    this.matchResultModal.on('change_pens', () => {
      this.matchResultModal.hide();
      this.hud.container.visible = false;
      this.penModal.show(this.selectedPenIndices[0], this.state.mode, this.state.aiDifficulty);
    });

    this.matchResultModal.on('menu', () => {
      this.matchResultModal.hide();
      this.showMainMenu();
    });

    this.onResize();
    window.addEventListener('resize', () => this.onResize());

    app.ticker.add((ticker) => this.update(ticker.deltaMS / 1000));

    this.showMainMenu();
  }

  private setupEngineAudio(): void {
    this.engine.onAimTick = (bucket: number) => {
      soundManager.play('aim_tick', 0.4 + bucket * 0.15);
      soundManager.haptic('light');
    };

    this.engine.onHitSound = (intensity: number) => {
      const sfx = intensity > 0.55 ? 'hit_heavy' : 'hit_light';
      soundManager.play(sfx, intensity);
      soundManager.haptic(intensity > 0.55 ? 'heavy' : 'medium');
    };

    this.engine.onFlickSound = (power: number) => {
      soundManager.play('flick', power);
      soundManager.play('slide', power);
      soundManager.haptic('light');
    };

    this.engine.onFallSound = () => {
      soundManager.play('fall');
      soundManager.haptic('heavy');
    };

    this.engine.onRoundEnd = (winner: 0 | 1 | 2, reason: string) => {
      this.handleEngineRoundEnd(winner, reason);
    };
  }

  private applySettings(cfg: GameSettings): void {
    this.state.matchFormat = cfg.matchFormat;
    this.state.winsNeeded = cfg.matchFormat === 'first_to_5' ? 5 : 3;
    this.state.equalLevels = cfg.equalLevels;
  }

  public showMainMenu(): void {
    this.state.phase = 'MENU';
    this.engine.aim.active = false;
    this.bannerContainer.visible = false;
    this.hud.container.visible = false;
    this.whoModal.hide();
    this.penModal.hide();
    this.statsModal.hide();
    this.howToPlayModal.hide();
    this.settingsModal.hide();
    this.matchResultModal.hide();
    this.mainMenu.show();

    this.renderMenuBackground();
  }

  private renderMenuBackground(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.arenaCtx.save();
    this.arenaCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const deskStyle = (themeManager.prefs.deskTheme === 'old-school' || this.settingsModal.settings.deskStyle === 'old_school') ? 'old' : 'clean';
    const penLook = (themeManager.prefs.penLook || this.settingsModal.settings.penLook) === 'classic' ? 'classic' : 'real';

    if (this.engine.pens.length < 2) {
      const p1 = PENS_ROSTER[this.selectedPenIndices[0]] || PENS_ROSTER[0];
      const p2 = PENS_ROSTER[this.selectedPenIndices[1]] || PENS_ROSTER[1];
      this.engine.startNewRound(p1, p2, 'ai', 1);
    }

    ArenaRenderer.renderArena(this.arenaCtx, w, h, this.engine, deskStyle, penLook);
    this.arenaCtx.restore();
  }

  public startGame(pen1Index = 0, pen2Index = 1): void {
    this.selectedPenIndices = [pen1Index, pen2Index];
    this.state.scores = [0, 0];
    this.state.roundFirstPlayer = 1;
    this.mainMenu.hide();
    this.hud.container.visible = true;

    this.startRound();
  }

  private startRound(): void {
    this.bannerContainer.visible = false;
    this.hud.showWarning(false);
    this.hud.hideCountdown();

    const p1Spec = PENS_ROSTER[this.selectedPenIndices[0]] || PENS_ROSTER[0];
    const p2Spec = PENS_ROSTER[this.selectedPenIndices[1]] || PENS_ROSTER[1];
    const mode = this.state.mode === 'VS_AI' ? 'ai' : '2p';

    const p1Lvl = this.progressionManager.getProgress(p1Spec.id).level;
    const p2Lvl = this.progressionManager.getProgress(p2Spec.id).level;

    this.engine.startNewRound(
      p1Spec,
      p2Spec,
      mode,
      this.state.roundFirstPlayer,
      p1Lvl,
      p2Lvl,
      this.state.equalLevels
    );
    this.state.phase = 'PLAYER_TURN';

    this.hud.updateFromEngine(this.engine, mode, this.state.scores);
  }

  private update(dt: number): void {
    if (this.state.phase === 'MENU' || this.state.phase === 'PAUSED') return;

    const mode = this.state.mode === 'VS_AI' ? 'ai' : '2p';
    const diff: 'easy' | 'normal' | 'hard' =
      this.state.aiDifficulty === 'hard' ? 'hard' : this.state.aiDifficulty === 'easy' ? 'easy' : 'normal';

    this.engine.step(dt, mode, diff);

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.arenaCtx.save();
    this.arenaCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const deskStyle = (themeManager.prefs.deskTheme === 'old-school' || this.settingsModal.settings.deskStyle === 'old_school') ? 'old' : 'clean';
    const penLook = (themeManager.prefs.penLook || this.settingsModal.settings.penLook) === 'classic' ? 'classic' : 'real';

    ArenaRenderer.renderArena(this.arenaCtx, w, h, this.engine, deskStyle, penLook);
    this.arenaCtx.restore();

    this.hud.updateFromEngine(this.engine, mode, this.state.scores);
    const cd = this.engine.getTurnCountdownStatus();
    if (cd) {
      this.hud.updateCountdown(cd.remainingSec, cd.ratio);
    } else {
      this.hud.hideCountdown();
    }
  }

  private handleEngineRoundEnd(winner: 0 | 1 | 2, reason: string): void {
    if (this.state.phase === 'ROUND_RESULT' || this.state.phase === 'MATCH_RESULT') return;
    this.state.phase = 'ROUND_RESULT';

    if (winner === 1) {
      this.state.scores[0]++;
      soundManager.play('round_win');
      const title = this.state.mode === 'VS_AI' ? 'You take this round!' : 'Player 1 takes this round!';
      this.showRoundBanner(title, `${reason}  ·  ${this.state.scores[0]} – ${this.state.scores[1]}`);
      this.awardXP(true);
    } else if (winner === 2) {
      this.state.scores[1]++;
      soundManager.play(this.state.mode === 'VS_AI' ? 'round_lose' : 'round_win');
      const title = this.state.mode === 'VS_AI' ? 'The computer takes this one' : 'Player 2 takes this round!';
      this.showRoundBanner(title, `${reason}  ·  ${this.state.scores[0]} – ${this.state.scores[1]}`);
      this.awardXP(false);
    } else {
      soundManager.play('round_lose');
      this.showRoundBanner('Round Draw!', reason);
      this.awardXP(false);
    }

    this.hud.updateFromEngine(this.engine, this.state.mode === 'VS_AI' ? 'ai' : '2p', this.state.scores);
    const matchEnded = this.checkMatchWin();

    setTimeout(() => {
      this.bannerContainer.visible = false;
      if (matchEnded) {
        this.showMatchResult();
      } else {
        this.state.roundFirstPlayer = this.state.roundFirstPlayer === 1 ? 2 : 1;
        this.startRound();
      }
    }, 1850);
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
    soundManager.play(p1Won ? 'match_victory' : 'round_lose');

    const p1Spec = PENS_ROSTER[this.selectedPenIndices[0]] || PENS_ROSTER[0];
    const p2Spec = PENS_ROSTER[this.selectedPenIndices[1]] || PENS_ROSTER[1];
    const stats = this.progressionManager.getStats();

    this.matchResultModal.show({
      winner: p1Won ? 1 : 2,
      scores: [this.state.scores[0], this.state.scores[1]],
      winsNeeded: this.state.winsNeeded,
      mode: this.state.mode,
      p1Pen: p1Spec,
      p2Pen: p2Spec,
      streak: Math.max(1, stats.currentStreak),
      xpEarned: p1Won ? 100 : 30
    });
  }

  private showRoundBanner(title: string, sub: string): void {
    this.bannerTitle.text = title;
    this.bannerSubtitle.text = sub;

    const w = Math.min(this.app.screen.width - 36, 360);
    const h = 98;

    this.bannerBg.clear()
      .roundRect(-w / 2, -h / 2 + 5, w, h, 20)
      .fill({ color: COLORS.navyShadow })
      .roundRect(-w / 2, -h / 2, w, h, 20)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3.2 });

    this.bannerTitle.y = -14;
    this.bannerSubtitle.y = 18;

    this.bannerContainer.x = this.app.screen.width / 2;
    this.bannerContainer.y = this.app.screen.height / 2;
    this.bannerContainer.visible = true;
  }

  private togglePauseMenu(): void {
    if (this.state.phase === 'MENU') return;
    this.showMainMenu();
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    this.arenaCanvas.width = Math.round(w * dpr);
    this.arenaCanvas.height = Math.round(h * dpr);
    this.engine.updateDeskGeometry(w, h);

    this.hud.layout(w, h);
    this.mainMenu.layout(w, h);
    this.whoModal.layout(w, h);
    this.penModal.layout(w, h);
    this.settingsModal.layout(w, h);
    this.statsModal.layout(w, h);
    this.howToPlayModal.layout(w, h);
    this.matchResultModal.layout(w, h);

    this.bannerContainer.x = w / 2;
    this.bannerContainer.y = h / 2;

    if (this.state.phase === 'MENU') {
      this.renderMenuBackground();
    }
  }
}
