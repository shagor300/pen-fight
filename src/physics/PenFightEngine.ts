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
    if (this.pens.length < 2 || !this.pens[0] || !this.pens[1]) return;
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

      if (this.pens[0] && this.pens[1]) {
        this.resolveCapsuleCollision(this.pens[0], this.pens[1]);
      }
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
