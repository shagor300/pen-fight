/**
 * src/physics/PenFightEngine.ts
 * Shunnek Labs v1.5.4 Butter-Smooth Physics Engine — Complete Implementation.
 *
 * 7 Core Features (matching https://shunneklabs.app/games/pen-fight/):
 * 1. Fixed 120Hz Timestep Accumulator + 8x Sub-stepping = 960Hz collision precision
 * 2. Render State Interpolation for jitter-free visuals at any refresh rate
 * 3. Classic vs Real Physics Mode toggle
 * 4. Center-of-Mass (COM) offset per pen (cap shifts COM toward front)
 * 5. Overhang tipping animation with gravity-driven 3D fall
 * 6. Anisotropic friction with exp(-μ·k·dt) decay + smooth Coulomb stiction
 * 7. Stat-to-physics derivation aligned with Shunnek's 5-bar formula
 */
import { PenSpec } from '../config/pensConfig';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════
export type GamePhase =
  | 'AIMING'
  | 'AI_THINKING'
  | 'AI_PULLING'
  | 'SIMULATING'
  | 'ROUND_OVER';

export type PhysicsMode = 'classic' | 'real';

export interface PhysicsModeConfig {
  id: PhysicsMode;
  name: string;
  restitutionMultiplier: number;
  spinBoost: number;
  comOffsetScale: number;
  edgeAssistMarginPx: number;
  edgeAssistBrake: number;
  stictionSpeedThreshold: number;
}

export const PHYSICS_MODES: Record<PhysicsMode, PhysicsModeConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    restitutionMultiplier: 1.08,
    spinBoost: 1.28,
    comOffsetScale: 0.5,
    edgeAssistMarginPx: 38,
    edgeAssistBrake: 1.22,
    stictionSpeedThreshold: 18.0,
  },
  real: {
    id: 'real',
    name: 'Real',
    restitutionMultiplier: 0.94,
    spinBoost: 1.0,
    comOffsetScale: 1.0,
    edgeAssistMarginPx: 0,
    edgeAssistBrake: 1.0,
    stictionSpeedThreshold: 11.0,
  },
};

export interface PenBody {
  playerIndex: 1 | 2;
  label: string;
  labelColor: string;
  spec: PenSpec;
  level: number;

  // Current physics state
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  omega: number;

  // Previous state (for render interpolation)
  prevX: number;
  prevY: number;
  prevAngle: number;

  // Interpolated render state (what ArenaRenderer should use)
  renderX: number;
  renderY: number;
  renderAngle: number;

  // Pen physical properties (derived from stats)
  lengthPx: number;
  widthPx: number;
  mass: number;
  invMass: number;
  inertia: number;
  invInertia: number;
  friction: number;         // Surface friction coefficient (from Grip stat)
  restitution: number;      // Bounce coefficient
  maxFlickSpeed: number;    // Maximum launch speed (from Speed stat)
  comOffset: number;        // Center-of-mass offset along local X axis (px)

  // Per-stat multipliers (kept for passive skill bonuses)
  speedMult: number;
  spinMult: number;
  gripMult: number;

  // Falling / Tipping state (3D fall off desk edge)
  falling: boolean;
  fallenOut: boolean;
  zHeight: number;          // Height above desk (0 = on desk, negative = below)
  vz: number;               // Vertical velocity (for gravity)
  tiltAngle: number;        // 3D tilt as pen tips off edge
  fallEdgeNormalX: number;  // Direction pen is falling off
  fallEdgeNormalY: number;
  fallScale: number;        // Legacy compat for renderers using scale
  fallAlpha: number;        // Legacy compat for renderers using alpha
}

export interface AimDragState {
  active: boolean;
  penIndex: 0 | 1;
  grabOffsetRatio: number;
  pullX: number;
  pullY: number;
  powerRatio: number;
  lastTickBucket?: number;
}

export interface ImpactRingEffect {
  x: number;
  y: number;
  ageMs: number;
  durationMs: number;
  maxRadius: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
export const SHRINK_TURNS = [15, 19, 23, 27];
export const MAX_PULL_PX = 195;
export const CANCEL_PULL_PX = 14;
export const MAX_SIMULATION_MS = 2800;
export const INACTIVITY_START_SEC = 10;
export const COUNTDOWN_DURATION_SEC = 20;

// Fixed timestep configuration
const FIXED_DT = 1 / 120;    // 120Hz physics tick rate
const SUB_STEPS = 8;          // 8 sub-steps per tick = 960Hz collision precision
const MAX_ACCUMULATOR = 0.05; // Clamp to prevent spiral of death

// ═══════════════════════════════════════════════════════════════════════════
// PEN FIGHT ENGINE
// ═══════════════════════════════════════════════════════════════════════════
export class PenFightEngine {
  public pens: [PenBody, PenBody] | [] = [];
  public phase: GamePhase = 'AIMING';
  public activePlayer: 1 | 2 = 1;
  public startingPlayer: 1 | 2 = 1;
  public turnCount = 1;
  public shrinkSteps = 0;

  // Physics mode (Classic = arcade feel, Real = rigid-body sim)
  public physicsMode: PhysicsModeConfig = PHYSICS_MODES.classic;

  public outerDesk = { x: 24, y: 56, w: 500, h: 800 };
  public activeBounds = { x: 24, y: 56, w: 500, h: 800 };

  // Fixed timestep accumulator
  private accumulator = 0;

  public aim: AimDragState = {
    active: false,
    penIndex: 0,
    grabOffsetRatio: 0,
    pullX: 0,
    pullY: 0,
    powerRatio: 0,
    lastTickBucket: 0,
  };

  public aiPlan = {
    thinkTimerMs: 0,
    pullTimerMs: 0,
    pullDurationMs: 260,
    grabOffsetRatio: 0,
    targetPullX: 0,
    targetPullY: 0,
    targetPowerRatio: 0.58,
  };

  public impactRings: ImpactRingEffect[] = [];
  public screenShake = 0;
  public simulationElapsedMs = 0;
  public turnToastTimerMs = 0;
  public turnToastText = 'Your turn';
  public turnIdleSec = 0;

  // Audio/VFX callbacks
  public onHitSound?: (intensity: number) => void;
  public onFlickSound?: (power: number) => void;
  public onSlideSound?: (intensity: number) => void;
  public onFallSound?: () => void;
  public onAimTick?: (bucket: number) => void;
  public onRoundEnd?: (winner: 0 | 1 | 2, reason: string) => void;
  private slideSoundTimerMs = 0;

  // ════════════════════════════════════════════════════════════════════════
  // PHYSICS MODE
  // ════════════════════════════════════════════════════════════════════════
  public setPhysicsMode(mode: PhysicsMode): void {
    this.physicsMode = PHYSICS_MODES[mode] || PHYSICS_MODES.classic;
  }

  // ════════════════════════════════════════════════════════════════════════
  // DESK GEOMETRY
  // ════════════════════════════════════════════════════════════════════════
  public updateDeskGeometry(canvasW: number, canvasH: number): void {
    const marginX = Math.max(16, Math.round(canvasW * 0.035));
    const marginTop = Math.max(54, Math.round(canvasH * 0.068));
    const marginBottom = Math.max(18, Math.round(canvasH * 0.025));

    const oldW = this.outerDesk.w || 1;
    const oldH = this.outerDesk.h || 1;
    const oldX = this.outerDesk.x;
    const oldY = this.outerDesk.y;

    this.outerDesk = {
      x: marginX,
      y: marginTop,
      w: Math.max(260, canvasW - marginX * 2),
      h: Math.max(320, canvasH - marginTop - marginBottom),
    };

    if (this.pens.length === 2) {
      for (const pen of this.pens) {
        const relX = (pen.x - oldX) / oldW;
        const relY = (pen.y - oldY) / oldH;
        pen.x = this.outerDesk.x + relX * this.outerDesk.w;
        pen.y = this.outerDesk.y + relY * this.outerDesk.h;
        pen.renderX = pen.x;
        pen.renderY = pen.y;
        pen.prevX = pen.x;
        pen.prevY = pen.y;
      }
    }

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
      h: this.outerDesk.h - insetY * 2,
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // ROUND SETUP
  // ════════════════════════════════════════════════════════════════════════
  public startNewRound(
    p1Spec: PenSpec,
    p2Spec: PenSpec,
    mode: 'ai' | '2p',
    startingPlayer: 1 | 2,
    p1Level = 1,
    p2Level = 1,
    equalLevels = false
  ): void {
    this.turnCount = 1;
    this.shrinkSteps = 0;
    this.startingPlayer = startingPlayer;
    this.activePlayer = startingPlayer;
    this.recalculateActiveBounds();
    this.impactRings = [];
    this.screenShake = 0;
    this.aim.active = false;
    this.turnIdleSec = 0;
    this.accumulator = 0;

    const cx = this.outerDesk.x + this.outerDesk.w * 0.5;
    const cy = this.outerDesk.y + this.outerDesk.h * 0.5;

    const spreadX = Math.min(72, this.outerDesk.w * 0.16);
    const spreadY = Math.min(115, this.outerDesk.h * 0.15);

    const effP1Lvl = equalLevels ? 1 : p1Level;
    const effP2Lvl = equalLevels ? 1 : (mode === 'ai' ? Math.min(p1Level, p2Level) : p2Level);

    const p1 = this.createPenBody(
      1,
      mode === 'ai' ? 'You' : 'Player 1',
      '#e06d3b',
      p1Spec,
      effP1Lvl,
      cx + spreadX,
      cy + spreadY,
      Math.PI + 0.22
    );

    const p2 = this.createPenBody(
      2,
      mode === 'ai' ? 'Computer' : 'Player 2',
      '#3b82f6',
      p2Spec,
      effP2Lvl,
      cx - spreadX,
      cy - spreadY,
      0.22
    );

    this.pens = [p1, p2];

    if (mode === 'ai' && this.activePlayer === 2) {
      this.beginAiTurn('normal');
    } else {
      this.phase = 'AIMING';
      this.triggerTurnToast(
        this.activePlayer === 1 ? (mode === 'ai' ? 'Your turn' : "Player 1's turn") : "Player 2's turn"
      );
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // PEN BODY CREATION (Shunnek Formula 7: Stat-to-Physics Derivation)
  // ════════════════════════════════════════════════════════════════════════
  private createPenBody(
    playerIndex: 1 | 2,
    label: string,
    labelColor: string,
    spec: PenSpec,
    level: number,
    x: number,
    y: number,
    angle: number
  ): PenBody {
    const lvlMult = 1 + (Math.max(1, level) - 1) * 0.025;
    const s = spec.stats;

    // Shunnek Formula 7: Derive physics from 5-bar stats
    // Mass (kg-equivalent in game units)
    const mass = (0.007 + s.weight * 0.0052) * 200; // Scale up for our px/s world
    const invMass = 1 / mass;

    // Barrel length & width
    const L = spec.lengthPx || (116 + s.reach * 9.5);
    const W = spec.widthPx || 13;

    // Moment of inertia: I = 1/12 * m * L², scaled by Spin stat
    const spinEase = 1.35 - s.spin * 0.14;
    const inertia = (1 / 12) * mass * (L * L) * spinEase;
    const invInertia = 1 / inertia;

    // Surface friction (from Grip stat)
    const friction = 0.22 + s.grip * 0.13;

    // Restitution (bounce — lower Grip = higher bounce)
    const restitution = 0.45 + (5 - s.grip) * 0.07;

    // Max flick speed (from Speed stat + level)
    const maxFlickSpeed = (680 + s.speed * 115) * lvlMult;

    // Center-of-mass offset: varies by pen style
    let comOffset = 0;
    if (spec.styleType === 'fountain') comOffset = -4.2;
    else if (spec.styleType === '4colour') comOffset = -2.8;
    else if (spec.styleType === 'metal') comOffset = -1.5;

    // Per-stat multipliers (for passive skill calculations)
    const speedMult = (0.86 + s.speed * 0.055) * lvlMult;
    const spinMult = (0.84 + s.spin * 0.10) * lvlMult;
    const gripMult = (0.98 + s.grip * 0.085) * lvlMult;

    return {
      playerIndex,
      label,
      labelColor,
      spec,
      level,
      x, y, angle,
      vx: 0, vy: 0, omega: 0,
      prevX: x, prevY: y, prevAngle: angle,
      renderX: x, renderY: y, renderAngle: angle,
      lengthPx: L,
      widthPx: W,
      mass, invMass,
      inertia, invInertia,
      friction,
      restitution,
      maxFlickSpeed,
      comOffset,
      speedMult, spinMult, gripMult,
      falling: false,
      fallenOut: false,
      zHeight: 0,
      vz: 0,
      tiltAngle: 0,
      fallEdgeNormalX: 0,
      fallEdgeNormalY: 0,
      fallScale: 1,
      fallAlpha: 1,
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // PEN BODY HELPERS
  // ════════════════════════════════════════════════════════════════════════
  private savePreviousState(pen: PenBody): void {
    pen.prevX = pen.x;
    pen.prevY = pen.y;
    pen.prevAngle = pen.angle;
  }

  private interpolateRenderState(pen: PenBody, alpha: number): void {
    pen.renderX = pen.prevX + (pen.x - pen.prevX) * alpha;
    pen.renderY = pen.prevY + (pen.y - pen.prevY) * alpha;

    // Shortest-angle interpolation to avoid 360° wraparound jitter
    let dTheta = pen.angle - pen.prevAngle;
    while (dTheta > Math.PI) dTheta -= Math.PI * 2;
    while (dTheta < -Math.PI) dTheta += Math.PI * 2;
    pen.renderAngle = pen.prevAngle + dTheta * alpha;
  }

  /** Get Center of Mass, accounting for COM offset + physics mode scaling */
  public getCenterOfMass(pen: PenBody): { x: number; y: number } {
    const ux = Math.cos(pen.angle);
    const uy = Math.sin(pen.angle);
    const offset = pen.comOffset * this.physicsMode.comOffsetScale;
    return {
      x: pen.x + ux * offset,
      y: pen.y + uy * offset,
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ════════════════════════════════════════════════════════════════════════
  public triggerTurnToast(text: string): void {
    this.turnToastText = text;
    this.turnToastTimerMs = 950;
  }

  public getContactWorldPoint(pen: PenBody, grabOffsetRatio: number): { x: number; y: number } {
    const halfUsableL = pen.lengthPx * 0.44;
    return {
      x: pen.x + Math.cos(pen.angle) * (grabOffsetRatio * halfUsableL),
      y: pen.y + Math.sin(pen.angle) * (grabOffsetRatio * halfUsableL),
    };
  }

  public getTurnCountdownStatus(): { remainingSec: number; ratio: number } | null {
    if (this.phase !== 'AIMING' || this.aim.active) return null;
    if (this.turnIdleSec < INACTIVITY_START_SEC) return null;
    const elapsedCountdown = this.turnIdleSec - INACTIVITY_START_SEC;
    const remainingSec = Math.max(0, COUNTDOWN_DURATION_SEC - elapsedCountdown);
    return {
      remainingSec,
      ratio: remainingSec / COUNTDOWN_DURATION_SEC,
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // FLICK / SHOT MECHANICS (Shunnek Formula 2)
  // ════════════════════════════════════════════════════════════════════════
  public fireShot(pen: PenBody, pullX: number, pullY: number, powerRatio: number, grabOffsetRatio: number): void {
    const pullLen = Math.hypot(pullX, pullY) || 1;
    const dirX = -pullX / pullLen;
    const dirY = -pullY / pullLen;

    // Non-linear power curve (γ = 1.15) — Shunnek Formula 2
    const clampedPower = Math.min(1.0, Math.max(0.06, powerRatio));
    const curvedPower = Math.pow(clampedPower, 1.15);

    // Passive skill bonuses per pen style
    let skillSpeedMod = 1.0;
    let skillSpinMod = 1.0;
    if (pen.spec.styleType === 'clicker' && clampedPower < 0.65) {
      skillSpeedMod = 1.08; // Rapid Snap
    }
    if (pen.spec.styleType === 'ballpoint' && Math.abs(grabOffsetRatio) > 0.45) {
      skillSpinMod = 1.12; // Whip-Tip Sweep
    }
    if (pen.spec.styleType === '4colour' && Math.abs(grabOffsetRatio) < 0.25) {
      skillSpeedMod = 1.10; // Straight Ram
    }

    const normOffset = Math.max(-1, Math.min(1, grabOffsetRatio));

    // Linear efficiency reduces when grabbing extreme tip (energy diverts to spin)
    const linearEfficiency = 1.0 - 0.26 * (normOffset * normOffset);
    const launchSpeed = pen.maxFlickSpeed * curvedPower * linearEfficiency * skillSpeedMod;

    pen.vx = dirX * launchSpeed;
    pen.vy = dirY * launchSpeed;

    // Torque: τ = r_grab × F (2D cross product)
    const ux = Math.cos(pen.angle);
    const uy = Math.sin(pen.angle);
    const grabLocal = grabOffsetRatio * (pen.lengthPx * 0.44);
    const rx = ux * grabLocal;
    const ry = uy * grabLocal;
    const crossZ = rx * dirY - ry * dirX;

    // Angular velocity impulse
    const spinFactor = (16.5 * this.physicsMode.spinBoost) / (pen.lengthPx * 0.5);
    pen.omega = (crossZ / (pen.lengthPx * 0.5)) * curvedPower * spinFactor *
      (0.75 + pen.spec.stats.spin * 0.14) * skillSpinMod;

    if (this.onFlickSound) this.onFlickSound(clampedPower);
    this.aim.active = false;
    this.turnIdleSec = 0;
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
    pen.vx += jx * pen.invMass;
    pen.vy += jy * pen.invMass;

    const rx = contactX - pen.x;
    const ry = contactY - pen.y;
    const crossTorque = (rx * jy - ry * jx) * spinBoost;
    pen.omega += crossTorque * pen.invInertia;
  }

  // ════════════════════════════════════════════════════════════════════════
  // AI SHOT CALCULATOR (4-Tier: Easy, Normal, Hard, Master)
  // ════════════════════════════════════════════════════════════════════════
  public beginAiTurn(difficulty: 'easy' | 'normal' | 'hard'): void {
    if (this.pens.length < 2 || !this.pens[0] || !this.pens[1]) return;
    const aiPen = this.pens[1];
    const targetPen = this.pens[0];

    const targetEnds = this.getSegmentEndpoints(targetPen);
    let aimX = targetPen.x;
    let aimY = targetPen.y;

    if (difficulty === 'hard' && Math.random() < 0.72) {
      // Aim at one of the target pen's tips for maximum rotational knockout
      if (Math.random() < 0.5) {
        aimX = (targetPen.x + targetEnds.ax) * 0.5;
        aimY = (targetPen.y + targetEnds.ay) * 0.5;
      } else {
        aimX = (targetPen.x + targetEnds.bx) * 0.5;
        aimY = (targetPen.y + targetEnds.by) * 0.5;
      }
    }

    let grabOffsetRatio = (Math.random() - 0.5) * 0.32;
    if (difficulty !== 'easy' && Math.random() < 0.52) {
      grabOffsetRatio = (Math.random() < 0.5 ? 1 : -1) * (0.42 + Math.random() * 0.35);
    }

    const aiContact = this.getContactWorldPoint(aiPen, grabOffsetRatio);
    const toTargetX = aimX - aiContact.x;
    const toTargetY = aimY - aiContact.y;
    const distPx = Math.hypot(toTargetX, toTargetY) || 1;

    let launchAngle = Math.atan2(toTargetY, toTargetX);
    const errorRad =
      difficulty === 'easy' ? 0.22 : difficulty === 'normal' ? 0.09 : 0.03;
    launchAngle += (Math.random() - 0.5) * errorRad;

    const distRatio = Math.min(1.0, Math.max(0.32, distPx / 340));
    const powerRatio =
      difficulty === 'easy'
        ? 0.42 + Math.random() * 0.26
        : Math.min(0.82, Math.max(0.44, distRatio * (0.66 + Math.random() * 0.16)));

    const pullMag = powerRatio * MAX_PULL_PX;
    this.aiPlan = {
      thinkTimerMs: 180,
      pullTimerMs: 0,
      pullDurationMs: 260,
      grabOffsetRatio,
      targetPullX: -Math.cos(launchAngle) * pullMag,
      targetPullY: -Math.sin(launchAngle) * pullMag,
      targetPowerRatio: powerRatio,
    };

    this.turnIdleSec = 0;
    this.phase = 'AI_THINKING';
  }

  // ════════════════════════════════════════════════════════════════════════
  // MAIN FRAME UPDATE — Fixed Timestep Accumulator (Shunnek Formula 1)
  // ════════════════════════════════════════════════════════════════════════
  public step(dtSec: number, mode: 'ai' | '2p', aiDifficulty: 'easy' | 'normal' | 'hard'): void {
    const clampedDt = Math.min(0.05, Math.max(0.001, dtSec));
    const dtMs = clampedDt * 1000;

    // ── Non-physics UI timers ──
    if (this.turnToastTimerMs > 0) {
      this.turnToastTimerMs = Math.max(0, this.turnToastTimerMs - dtMs);
    }
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake * 0.82 - 0.15);
    }
    for (let i = this.impactRings.length - 1; i >= 0; i--) {
      this.impactRings[i].ageMs += dtMs;
      if (this.impactRings[i].ageMs >= this.impactRings[i].durationMs) {
        this.impactRings.splice(i, 1);
      }
    }

    // ── AIMING phase: just idle timer ──
    if (this.phase === 'AIMING') {
      if (!this.aim.active) {
        this.turnIdleSec += clampedDt;
        if (this.turnIdleSec >= INACTIVITY_START_SEC + COUNTDOWN_DURATION_SEC) {
          this.turnIdleSec = 0;
          this.advanceToNextTurn(mode, aiDifficulty);
          return;
        }
      } else {
        this.turnIdleSec = 0;
      }
      return;
    }

    // ── AI THINKING phase ──
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

    // ── AI PULLING phase ──
    if (this.phase === 'AI_PULLING') {
      this.aiPlan.pullTimerMs += dtMs;
      const t = Math.min(1.0, this.aiPlan.pullTimerMs / this.aiPlan.pullDurationMs);
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

    // ── SIMULATING phase: Fixed Timestep Accumulator ──
    if (this.phase !== 'SIMULATING' || this.pens.length < 2) return;

    this.simulationElapsedMs += dtMs;
    this.slideSoundTimerMs += dtMs;

    // Slide sound
    const p0Speed = this.pens[0] && !this.pens[0].falling ? Math.hypot(this.pens[0].vx, this.pens[0].vy) : 0;
    const p1Speed = this.pens[1] && !this.pens[1].falling ? Math.hypot(this.pens[1].vx, this.pens[1].vy) : 0;
    const maxSpeed = Math.max(p0Speed, p1Speed);

    if (maxSpeed > 45 && this.slideSoundTimerMs >= 180) {
      this.slideSoundTimerMs = 0;
      const intensity = Math.min(1.0, Math.max(0.2, (maxSpeed - 30) / 380));
      if (this.onSlideSound) {
        this.onSlideSound(intensity);
      }
    }

    // ═══ FIXED TIMESTEP ACCUMULATOR (Shunnek Formula 1) ═══
    this.accumulator += clampedDt;
    if (this.accumulator > MAX_ACCUMULATOR) {
      this.accumulator = MAX_ACCUMULATOR; // Prevent spiral of death
    }

    while (this.accumulator >= FIXED_DT) {
      // Save previous state for interpolation
      for (const pen of this.pens) {
        this.savePreviousState(pen);
      }

      // Run 8 sub-steps per fixed tick (960Hz collision precision)
      const subDt = FIXED_DT / SUB_STEPS;
      for (let s = 0; s < SUB_STEPS; s++) {
        this.stepPhysics(subDt);
      }

      this.accumulator -= FIXED_DT;
    }

    // ═══ RENDER INTERPOLATION (Shunnek Formula 1) ═══
    const alpha = this.accumulator / FIXED_DT;
    for (const pen of this.pens) {
      this.interpolateRenderState(pen, alpha);
      // Also update legacy fallScale/fallAlpha from tipping state
      if (pen.falling && !pen.fallenOut) {
        pen.fallScale = Math.max(0.35, 1.0 - Math.abs(pen.zHeight) / 180);
        pen.fallAlpha = Math.max(0, 1.0 - Math.abs(pen.zHeight) / 160);
      }
    }

    // ── Check if simulation is done ──
    let anyMoving = false;
    for (const pen of this.pens) {
      if (pen.fallenOut) continue;
      if (pen.falling) { anyMoving = true; continue; }
      const linearSpeed = Math.hypot(pen.vx, pen.vy);
      if (linearSpeed > 2.5 || Math.abs(pen.omega) > 0.04) {
        anyMoving = true;
      }
    }

    if (!anyMoving || this.simulationElapsedMs >= MAX_SIMULATION_MS) {
      // Force-stop any residual velocities
      for (const pen of this.pens) {
        if (!pen.fallenOut && !pen.falling) {
          pen.vx = 0;
          pen.vy = 0;
          pen.omega = 0;
        }
      }
      this.evaluateEndOfTurn(mode, aiDifficulty);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // PHYSICS SUB-STEP (Shunnek Formulas 3, 5, 6)
  // ════════════════════════════════════════════════════════════════════════
  private stepPhysics(dt: number): void {
    const mode = this.physicsMode;

    // Step 1: Integrate velocities & apply anisotropic surface friction
    for (const pen of this.pens) {
      if (pen.fallenOut) continue;

      // ── Falling pen: apply gravity (Shunnek Formula 6: Tipping) ──
      if (pen.falling) {
        pen.x += pen.vx * dt;
        pen.y += pen.vy * dt;
        pen.angle += pen.omega * dt;
        pen.vz -= 980 * dt; // Gravity acceleration
        pen.zHeight += pen.vz * dt;
        pen.tiltAngle += 4.5 * dt; // Progressive tilt as it falls
        if (pen.zHeight < -180) {
          pen.fallenOut = true;
          pen.vx = 0;
          pen.vy = 0;
          pen.omega = 0;
        }
        continue;
      }

      // ── Normal desk movement ──
      pen.x += pen.vx * dt;
      pen.y += pen.vy * dt;
      pen.angle += pen.omega * dt;

      // Decompose velocity into Axial (along barrel) and Lateral (rolling)
      const ux = Math.cos(pen.angle);
      const uy = Math.sin(pen.angle);
      const nx = -uy;
      const ny = ux;

      let vAxial = pen.vx * ux + pen.vy * uy;
      let vLateral = pen.vx * nx + pen.vy * ny;

      // ── Anisotropic Friction (Shunnek Formula 3) ──
      // Base friction from pen's Grip stat
      let muBase = 2.4 + pen.friction * 3.8;

      // Classic mode edge-assist brake (prevents accidental self-ring-outs)
      if (mode.edgeAssistMarginPx > 0) {
        const m = mode.edgeAssistMarginPx;
        const b = this.activeBounds;
        const nearEdge =
          pen.x - b.x < m ||
          b.x + b.w - pen.x < m ||
          pen.y - b.y < m ||
          b.y + b.h - pen.y < m;
        if (nearEdge && Math.hypot(pen.vx, pen.vy) < 210) {
          muBase *= mode.edgeAssistBrake;
        }
      }

      // Exponential decay (exp(-μ·k·dt)) — Shunnek's exact formula
      const axialDecay = Math.exp(-muBase * 1.38 * dt);
      const lateralDecay = Math.exp(-muBase * 0.74 * dt);

      vAxial *= axialDecay;
      vLateral *= lateralDecay;

      pen.vx = ux * vAxial + nx * vLateral;
      pen.vy = uy * vAxial + ny * vLateral;

      // Angular damping
      const angDecay = Math.exp(-(2.2 + pen.friction * 2.8) * dt);
      pen.omega *= angDecay;

      // ── Smooth Coulomb Stiction (prevents endless micro-gliding) ──
      const speed = Math.hypot(pen.vx, pen.vy);
      if (speed < mode.stictionSpeedThreshold) {
        const stiction = Math.max(0, 1 - (42 * dt));
        pen.vx *= stiction;
        pen.vy *= stiction;
        if (speed < 1.8) {
          pen.vx = 0;
          pen.vy = 0;
        }
      }
      if (Math.abs(pen.omega) < 0.03) {
        pen.omega = 0;
      }

      // ── Check Desk Edge Overhang & COM Tipping (Shunnek Formula 6) ──
      this.checkDeskOverhang(pen);
    }

    // Step 2: Capsule-to-Capsule Rigid Body Collisions (Shunnek Formula 5)
    if (this.pens.length === 2 && this.pens[0] && this.pens[1]) {
      const pA = this.pens[0];
      const pB = this.pens[1];
      if (!pA.fallenOut && !pB.fallenOut && !pA.falling && !pB.falling) {
        this.resolveCapsuleCollision(pA, pB);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // DESK EDGE OVERHANG & COM TIPPING (Shunnek Formula 6)
  // ════════════════════════════════════════════════════════════════════════
  private checkDeskOverhang(pen: PenBody): void {
    const com = this.getCenterOfMass(pen);
    const b = this.activeBounds;

    let outDirX = 0;
    let outDirY = 0;

    if (com.x < b.x) outDirX = -1;
    else if (com.x > b.x + b.w) outDirX = 1;

    if (com.y < b.y) outDirY = -1;
    else if (com.y > b.y + b.h) outDirY = 1;

    if (outDirX !== 0 || outDirY !== 0) {
      pen.falling = true;
      pen.fallEdgeNormalX = outDirX;
      pen.fallEdgeNormalY = outDirY;
      // Slight outward push as gravity takes over the overhang
      pen.vx += outDirX * 65;
      pen.vy += outDirY * 65;
      pen.vz = -40; // Start falling
      pen.zHeight = 0;
      pen.tiltAngle = 0;

      if (this.onFallSound) this.onFallSound();
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // CAPSULE-TO-CAPSULE COLLISION SOLVER (Shunnek Formula 5)
  // ════════════════════════════════════════════════════════════════════════
  private resolveCapsuleCollision(pA: PenBody, pB: PenBody): void {
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

    // Contact Normal (from A to B)
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

    const penetration = minDist - dist;

    // 1. Positional Slop Correction
    const percent = 0.82;
    const slop = 0.05;
    const corrMag = (Math.max(penetration - slop, 0) / (pA.invMass + pB.invMass)) * percent;
    pA.x -= nx * corrMag * pA.invMass;
    pA.y -= ny * corrMag * pA.invMass;
    pB.x += nx * corrMag * pB.invMass;
    pB.y += ny * corrMag * pB.invMass;

    // 2. Contact Point & Lever Arms relative to each pen's center
    const contactX = cp.c1x + nx * (pA.widthPx * 0.5);
    const contactY = cp.c1y + ny * (pA.widthPx * 0.5);

    const comA = this.getCenterOfMass(pA);
    const comB = this.getCenterOfMass(pB);

    const rAx = contactX - comA.x;
    const rAy = contactY - comA.y;
    const rBx = contactX - comB.x;
    const rBy = contactY - comB.y;

    // 3. Velocity at contact point: v_contact = v + ω × r
    const vAx = pA.vx - pA.omega * rAy;
    const vAy = pA.vy + pA.omega * rAx;
    const vBx = pB.vx - pB.omega * rBy;
    const vBy = pB.vy + pB.omega * rBx;

    const relVx = vBx - vAx;
    const relVy = vBy - vAy;
    const velAlongNormal = relVx * nx + relVy * ny;

    // Don't resolve if separating
    if (velAlongNormal > 0) return;

    // 4. Rotational Impulse Denominator
    const rACrossN = rAx * ny - rAy * nx;
    const rBCrossN = rBx * ny - rBy * nx;

    const invMassSum =
      pA.invMass +
      pB.invMass +
      (rACrossN * rACrossN) * pA.invInertia +
      (rBCrossN * rBCrossN) * pB.invInertia;

    // Restitution: geometric mean × physics mode multiplier
    const e = Math.min(0.95,
      Math.sqrt(pA.restitution * pB.restitution) * this.physicsMode.restitutionMultiplier
    );

    const j = -(1 + e) * velAlongNormal / invMassSum;

    const impulseX = j * nx;
    const impulseY = j * ny;

    // Apply Normal Impulse
    pA.vx -= impulseX * pA.invMass;
    pA.vy -= impulseY * pA.invMass;
    pA.omega -= (rAx * impulseY - rAy * impulseX) * pA.invInertia * this.physicsMode.spinBoost;

    pB.vx += impulseX * pB.invMass;
    pB.vy += impulseY * pB.invMass;
    pB.omega += (rBx * impulseY - rBy * impulseX) * pB.invInertia * this.physicsMode.spinBoost;

    // 5. Tangential Friction Impulse (spin transfer on glancing blows)
    let tx = relVx - velAlongNormal * nx;
    let ty = relVy - velAlongNormal * ny;
    const tLen = Math.hypot(tx, ty);
    if (tLen > 1e-4) {
      tx /= tLen;
      ty /= tLen;
      const rAcrossT = rAx * ty - rAy * tx;
      const rBcrossT = rBx * ty - rBy * tx;
      const invMassTan =
        pA.invMass +
        pB.invMass +
        (rAcrossT * rAcrossT) * pA.invInertia +
        (rBcrossT * rBcrossT) * pB.invInertia;

      let jt = -(relVx * tx + relVy * ty) / invMassTan;
      const muCombined = Math.sqrt(pA.friction * pB.friction) * 0.45;
      const maxJt = j * muCombined;
      jt = Math.max(-maxJt, Math.min(maxJt, jt));

      const tanImpX = jt * tx;
      const tanImpY = jt * ty;

      pA.vx -= tanImpX * pA.invMass;
      pA.vy -= tanImpY * pA.invMass;
      pA.omega -= (rAx * tanImpY - rAy * tanImpX) * pA.invInertia;

      pB.vx += tanImpX * pB.invMass;
      pB.vy += tanImpY * pB.invMass;
      pB.omega += (rBx * tanImpY - rBy * tanImpX) * pB.invInertia;
    }

    // 6. Impact VFX & Sound
    const impactSpeed = Math.abs(velAlongNormal);
    if (impactSpeed > 25) {
      const intensity = Math.min(1.0, impactSpeed / 440);
      this.screenShake = Math.max(this.screenShake, intensity * 6.5);
      if (this.onHitSound) this.onHitSound(intensity);

      if (
        this.impactRings.length === 0 ||
        Math.hypot(
          this.impactRings[this.impactRings.length - 1].x - contactX,
          this.impactRings[this.impactRings.length - 1].y - contactY
        ) > 16
      ) {
        this.impactRings.push({
          x: contactX,
          y: contactY,
          ageMs: 0,
          durationMs: 220,
          maxRadius: 18 + intensity * 18,
        });
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // GEOMETRY HELPERS
  // ════════════════════════════════════════════════════════════════════════
  public getSegmentEndpoints(pen: PenBody): { ax: number; ay: number; bx: number; by: number } {
    const halfL = (pen.lengthPx - pen.widthPx) * 0.5;
    const cos = Math.cos(pen.angle);
    const sin = Math.sin(pen.angle);
    return {
      ax: pen.x - cos * halfL,
      ay: pen.y - sin * halfL,
      bx: pen.x + cos * halfL,
      by: pen.y + sin * halfL,
    };
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
      c2y: p2y + d2y * t,
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // TURN & ROUND LOGIC
  // ════════════════════════════════════════════════════════════════════════
  private evaluateEndOfTurn(mode: 'ai' | '2p', aiDifficulty: 'easy' | 'normal' | 'hard'): void {
    if (this.pens.length < 2 || !this.pens[0] || !this.pens[1]) return;
    const p1 = this.pens[0];
    const p2 = this.pens[1];
    const p1Out = p1.falling || p1.fallenOut;
    const p2Out = p2.falling || p2.fallenOut;

    if (p1Out || p2Out) {
      this.phase = 'ROUND_OVER';
      let winner: 1 | 2 = 1;
      let reason = '';

      if (p1Out && p2Out) {
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

    if (SHRINK_TURNS.includes(this.turnCount)) {
      this.shrinkSteps++;
      this.recalculateActiveBounds();

      const b2 = this.activeBounds;
      for (const pen of this.pens) {
        if (pen.x < b2.x || pen.x > b2.x + b2.w || pen.y < b2.y || pen.y > b2.y + b2.h) {
          pen.falling = true;
          pen.vz = -40;
          pen.zHeight = 0;
          pen.tiltAngle = 0;
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

    this.advanceToNextTurn(mode, aiDifficulty);
  }

  private advanceToNextTurn(mode: 'ai' | '2p', aiDifficulty: 'easy' | 'normal' | 'hard'): void {
    this.turnCount++;
    this.activePlayer = this.activePlayer === 1 ? 2 : 1;
    this.turnIdleSec = 0;

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
