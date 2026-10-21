import { PenSpec } from '../config/pensConfig';

export type GamePhase =
  | 'AIMING'
  | 'AI_THINKING'
  | 'AI_PULLING'
  | 'SIMULATING'
  | 'ROUND_OVER';

export interface PenBody {
  playerIndex: 1 | 2;
  label: string;
  labelColor: string;
  spec: PenSpec;
  level: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  omega: number;
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

export interface ImpactSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  radius: number;
}

export const SHRINK_TURNS = [15, 19, 23, 27];
export const MAX_PULL_PX = 138;
export const CANCEL_PULL_PX = 14;
export const MAX_SIMULATION_MS = 2400;
export const INACTIVITY_START_SEC = 10;
export const COUNTDOWN_DURATION_SEC = 20;

export class PenFightEngine {
  public pens: [PenBody, PenBody] | [] = [];
  public phase: GamePhase = 'AIMING';
  public activePlayer: 1 | 2 = 1;
  public startingPlayer: 1 | 2 = 1;
  public turnCount = 1;
  public shrinkSteps = 0;

  public outerDesk = { x: 24, y: 56, w: 500, h: 800 };
  public activeBounds = { x: 24, y: 56, w: 500, h: 800 };

  public aim: AimDragState = {
    active: false,
    penIndex: 0,
    grabOffsetRatio: 0,
    pullX: 0,
    pullY: 0,
    powerRatio: 0,
    lastTickBucket: 0
  };

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
  public sparks: ImpactSpark[] = [];
  public screenShake = 0;
  public simulationElapsedMs = 0;
  public turnToastTimerMs = 0;
  public turnToastText = 'Your turn';
  public turnIdleSec = 0;

  public onHitSound?: (intensity: number) => void;
  public onFlickSound?: (power: number) => void;
  public onFallSound?: () => void;
  public onAimTick?: (bucket: number) => void;
  public onRoundEnd?: (winner: 0 | 1 | 2, reason: string) => void;

  public updateDeskGeometry(canvasW: number, canvasH: number): void {
    const marginX = Math.max(16, Math.round(canvasW * 0.032));
    const marginTop = Math.max(52, Math.round(canvasH * 0.065));
    const marginBottom = Math.max(18, Math.round(canvasH * 0.025));

    const oldW = this.outerDesk.w || 1;
    const oldH = this.outerDesk.h || 1;
    const oldX = this.outerDesk.x;
    const oldY = this.outerDesk.y;

    this.outerDesk = {
      x: marginX,
      y: marginTop,
      w: Math.max(260, canvasW - marginX * 2),
      h: Math.max(320, canvasH - marginTop - marginBottom)
    };

    if (this.pens.length === 2) {
      for (const pen of this.pens) {
        const relX = (pen.x - oldX) / oldW;
        const relY = (pen.y - oldY) / oldH;
        pen.x = this.outerDesk.x + relX * this.outerDesk.w;
        pen.y = this.outerDesk.y + relY * this.outerDesk.h;
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
      h: this.outerDesk.h - insetY * 2
    };
  }

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
    this.sparks = [];
    this.screenShake = 0;
    this.aim.active = false;
    this.turnIdleSec = 0;

    const cx = this.outerDesk.x + this.outerDesk.w * 0.5;
    const cy = this.outerDesk.y + this.outerDesk.h * 0.5;
    const spreadX = Math.min(120, this.outerDesk.w * 0.21);

    const effP1Lvl = equalLevels ? 1 : p1Level;
    const effP2Lvl = equalLevels ? 1 : (mode === 'ai' ? Math.min(p1Level, p2Level) : p2Level);

    const p1 = this.createPenBody(
      1,
      mode === 'ai' ? 'You' : 'Player 1',
      '#e06d3b',
      p1Spec,
      effP1Lvl,
      cx + spreadX,
      cy + 4,
      Math.PI + 0.18
    );

    const p2 = this.createPenBody(
      2,
      mode === 'ai' ? 'Computer' : 'Player 2',
      '#3b82f6',
      p2Spec,
      effP2Lvl,
      cx - spreadX,
      cy - 4,
      0.18
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
    const lvlBonus = 1 + (Math.max(1, level) - 1) * 0.02;
    const mass = (0.85 + spec.stats.weight * 0.24) * lvlBonus;
    const speedMult = (0.88 + spec.stats.speed * 0.08) * lvlBonus;
    const spinMult = (0.85 + spec.stats.spin * 0.14) * lvlBonus;
    const gripMult = (0.92 + spec.stats.grip * 0.07) * lvlBonus;
    const L = spec.lengthPx;
    const W = spec.widthPx;
    const inertia = (mass * (L * L + W * W)) / 14.5;

    return {
      playerIndex,
      label,
      labelColor,
      spec,
      level,
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
    this.turnToastTimerMs = 950;
  }

  public getContactWorldPoint(pen: PenBody, grabOffsetRatio: number): { x: number; y: number } {
    const halfUsableL = pen.lengthPx * 0.44;
    return {
      x: pen.x + Math.cos(pen.angle) * (grabOffsetRatio * halfUsableL),
      y: pen.y + Math.sin(pen.angle) * (grabOffsetRatio * halfUsableL)
    };
  }

  public fireShot(pen: PenBody, pullX: number, pullY: number, powerRatio: number, grabOffsetRatio: number): void {
    const pullLen = Math.hypot(pullX, pullY) || 1;
    const dirX = -pullX / pullLen;
    const dirY = -pullY / pullLen;

    const clampedPower = Math.min(1.0, Math.max(0.08, powerRatio));
    const baseImpulse = (290 + clampedPower * 960) * pen.speedMult;

    const jx = dirX * baseImpulse;
    const jy = dirY * baseImpulse;

    const contact = this.getContactWorldPoint(pen, grabOffsetRatio);
    this.applyWorldImpulse(pen, jx, jy, contact.x, contact.y, pen.spinMult * 1.15);

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
    pen.vx += jx / pen.mass;
    pen.vy += jy / pen.mass;

    const rx = contactX - pen.x;
    const ry = contactY - pen.y;
    const crossTorque = (rx * jy - ry * jx) * spinBoost;
    pen.omega += crossTorque / pen.inertia;
  }

  public beginAiTurn(difficulty: 'easy' | 'normal' | 'hard'): void {
    if (this.pens.length < 2 || !this.pens[0] || !this.pens[1]) return;
    const aiPen = this.pens[1];
    const targetPen = this.pens[0];

    const targetEnds = this.getSegmentEndpoints(targetPen);
    let aimX = targetPen.x;
    let aimY = targetPen.y;

    if (difficulty === 'hard' && Math.random() < 0.72) {
      if (Math.random() < 0.5) {
        aimX = (targetPen.x + targetEnds.ax) * 0.5;
        aimY = (targetPen.y + targetEnds.ay) * 0.5;
      } else {
        aimX = (targetPen.x + targetEnds.bx) * 0.5;
        aimY = (targetPen.y + targetEnds.by) * 0.5;
      }
    }

    let grabOffsetRatio = (Math.random() - 0.5) * 0.35;
    if (difficulty !== 'easy' && Math.random() < 0.55) {
      grabOffsetRatio = (Math.random() < 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.38);
    }

    const aiContact = this.getContactWorldPoint(aiPen, grabOffsetRatio);
    const toTargetX = aimX - aiContact.x;
    const toTargetY = aimY - aiContact.y;
    const distPx = Math.hypot(toTargetX, toTargetY) || 1;

    let launchAngle = Math.atan2(toTargetY, toTargetX);
    const errorRad =
      difficulty === 'easy' ? 0.25 : difficulty === 'normal' ? 0.09 : 0.028;
    launchAngle += (Math.random() - 0.5) * errorRad;

    const distRatio = Math.min(1.0, Math.max(0.28, distPx / 380));
    const powerRatio =
      difficulty === 'easy'
        ? 0.35 + Math.random() * 0.30
        : Math.min(0.84, Math.max(0.36, distRatio * (0.68 + Math.random() * 0.16)));

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

    this.turnIdleSec = 0;
    this.phase = 'AI_THINKING';
  }

  public getTurnCountdownStatus(): { remainingSec: number; ratio: number } | null {
    if (this.phase !== 'AIMING' || this.aim.active) return null;
    if (this.turnIdleSec < INACTIVITY_START_SEC) return null;
    const elapsedCountdown = this.turnIdleSec - INACTIVITY_START_SEC;
    const remainingSec = Math.max(0, COUNTDOWN_DURATION_SEC - elapsedCountdown);
    return {
      remainingSec,
      ratio: remainingSec / COUNTDOWN_DURATION_SEC
    };
  }

  public step(dtSec: number, mode: 'ai' | '2p', aiDifficulty: 'easy' | 'normal' | 'hard'): void {
    const clampedDt = Math.min(0.033, Math.max(0.001, dtSec));
    const dtMs = clampedDt * 1000;

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

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.x += sp.vx * clampedDt;
      sp.y += sp.vy * clampedDt;
      sp.alpha -= clampedDt * 2.8;
      if (sp.alpha <= 0) this.sparks.splice(i, 1);
    }

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

    const subSteps = 8;
    const subDt = clampedDt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      for (const pen of this.pens) {
        if (pen.fallenOut) continue;
        pen.x += pen.vx * subDt;
        pen.y += pen.vy * subDt;
        pen.angle += pen.omega * subDt;

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

      const ux = Math.cos(pen.angle);
      const uy = Math.sin(pen.angle);
      const lx = -uy;
      const ly = ux;

      let vAxial = pen.vx * ux + pen.vy * uy;
      let vLateral = pen.vx * lx + pen.vy * ly;

      const axialDecay = Math.pow(0.032 / pen.gripMult, clampedDt);
      const lateralDecay = Math.pow(0.095 / pen.gripMult, clampedDt);
      vAxial *= axialDecay;
      vLateral *= lateralDecay;

      const axialCoulomb = 210 * pen.gripMult * clampedDt;
      const lateralCoulomb = 115 * pen.gripMult * clampedDt;

      if (Math.abs(vAxial) <= axialCoulomb) vAxial = 0;
      else vAxial -= Math.sign(vAxial) * axialCoulomb;

      if (Math.abs(vLateral) <= lateralCoulomb) vLateral = 0;
      else vLateral -= Math.sign(vLateral) * lateralCoulomb;

      pen.vx = ux * vAxial + lx * vLateral;
      pen.vy = uy * vAxial + ly * vLateral;

      pen.omega *= Math.pow(0.042 / pen.gripMult, clampedDt);
      const angularCoulomb = 3.8 * pen.gripMult * clampedDt;
      if (Math.abs(pen.omega) <= angularCoulomb) pen.omega = 0;
      else pen.omega -= Math.sign(pen.omega) * angularCoulomb;

      const linearSpeed = Math.hypot(pen.vx, pen.vy);

      if (pen.level >= 2 && linearSpeed > 220 && Math.random() < 0.35) {
        this.sparks.push({
          x: pen.x + (Math.random() - 0.5) * 6,
          y: pen.y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          color: pen.spec.colors.ink,
          alpha: 0.55,
          radius: 2.2
        });
      }

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

    const overlap = minDist - dist + 0.6;
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
    const restitution = 0.78;

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

    const tx = -ny;
    const ty = nx;
    const relTan = relVx * tx + relVy * ty;
    const jt = (-relTan * 0.34) / denom;
    this.applyWorldImpulse(pA, -jt * tx, -jt * ty, contactX, contactY, 0.95);
    this.applyWorldImpulse(pB, jt * tx, jt * ty, contactX, contactY, 0.95);

    const impactSpeed = Math.abs(velAlongNormal);
    if (impactSpeed > 38) {
      const intensity = Math.min(1.0, impactSpeed / 580);
      this.screenShake = Math.max(this.screenShake, intensity * 7.5);
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
          maxRadius: 18 + intensity * 18
        });

        for (let i = 0; i < 10; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 60 + Math.random() * 190 * intensity;
          this.sparks.push({
            x: contactX,
            y: contactY,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            color: i % 2 === 0 ? '#facc15' : '#ffffff',
            alpha: 0.95,
            radius: 2 + Math.random() * 2
          });
        }
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
