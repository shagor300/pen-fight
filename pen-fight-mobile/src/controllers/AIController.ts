/**
 * AIController.ts
 * Implements Computer Opponent logic across Easy, Normal, and Hard difficulties.
 * Follows PRD §7: AI Opponent Logic.
 */
import * as planck from 'planck';
import { PenEntity } from '../entities/PenEntity';
import { DeskBounds } from '../core/DeskManager';
import { ShotFiredEvent } from './InputController';
import { BASE_IMPULSE, MAX_PULL_PX, SCALE } from '../config/gameConstants';

export type AIDifficulty = 'easy' | 'normal' | 'hard' | 'master';

export interface AIShotDecision {
  impulseVec: planck.Vec2;
  grabWorldPoint: planck.Vec2;
  powerRatio: number;
  aimAngle: number;
}

export class AIController {
  private timeoutId: any = null;

  /** Cancel any pending AI shot */
  public cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Schedule and execute an AI shot after a natural thinking delay.
   */
  public executeTurn(
    aiPen: PenEntity,
    playerPen: PenEntity,
    bounds: DeskBounds,
    difficulty: AIDifficulty,
    onShot: (event: ShotFiredEvent) => void,
  ): void {
    this.cancel();

    // Natural human-like reaction delay
    const delay = difficulty === 'easy' ? 950 : difficulty === 'normal' ? 800 : difficulty === 'hard' ? 650 : 480;

    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      if (aiPen.state !== 'IDLE' || playerPen.state === 'DEAD') return;

      const decision = this.computeShot(aiPen, playerPen, bounds, difficulty);
      this.applyShot(aiPen, decision, onShot);
    }, delay);
  }

  /**
   * Compute the shot impulse, aim direction, and grab point according to difficulty rules.
   */
  public computeShot(
    aiPen: PenEntity,
    playerPen: PenEntity,
    bounds: DeskBounds,
    difficulty: AIDifficulty,
  ): AIShotDecision {
    const aiPos = aiPen.body.getPosition();
    const playerPos = playerPen.body.getPosition();

    const dx = playerPos.x - aiPos.x;
    const dy = playerPos.y - aiPos.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);
    let baseAngle = Math.atan2(dy, dx);

    let powerRatio = 0.65;
    let grabOffsetLength = 0; // along the pen's primary axis

    if (difficulty === 'easy') {
      // ±18 degrees variance (approx ±0.314 rad)
      const varianceDeg = (Math.random() - 0.5) * 36;
      baseAngle += (varianceDeg * Math.PI) / 180;

      // 50% - 75% power
      powerRatio = 0.5 + Math.random() * 0.25;

      // No spin shot (grab dead center)
      grabOffsetLength = 0;
    } else if (difficulty === 'normal') {
      // ±6 degrees variance (approx ±0.105 rad)
      const varianceDeg = (Math.random() - 0.5) * 12;
      baseAngle += (varianceDeg * Math.PI) / 180;

      // Distance-aware power (0.60 to 0.90)
      const normalizedDist = Math.min(1, Math.max(0.3, distToPlayer / (bounds.height / SCALE)));
      powerRatio = Math.min(0.92, 0.60 + normalizedDist * 0.3 + (Math.random() - 0.5) * 0.1);

      // 40% chance of spin shot
      if (Math.random() < 0.4) {
        // Grab towards cap or nib (e.g. ±35% of length)
        const sign = Math.random() < 0.5 ? -1 : 1;
        grabOffsetLength = sign * (aiPen.lengthPx / 2) * 0.7 * (1 / SCALE);
      }
    } else if (difficulty === 'hard') {
      // HARD AI:
      // 1. Determine which desk boundary is closest to the player's pen
      const distToLeft = (playerPos.x * SCALE) - bounds.left;
      const distToRight = bounds.right - (playerPos.x * SCALE);
      const distToTop = (playerPos.y * SCALE) - bounds.top;
      const distToBottom = bounds.bottom - (playerPos.y * SCALE);

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      let targetPushAngle = 0;
      if (minDist === distToLeft) {
        targetPushAngle = Math.PI; // push left
      } else if (minDist === distToRight) {
        targetPushAngle = 0; // push right
      } else if (minDist === distToTop) {
        targetPushAngle = -Math.PI / 2; // push up
      } else {
        targetPushAngle = Math.PI / 2; // push down
      }

      // Blend direct aim with push angle to glance the player pen towards edge
      const directAngle = Math.atan2(dy, dx);
      // Slight glance angle (10% bias towards pushing direction)
      const angleDiff = targetPushAngle - directAngle;
      const glanceBias = Math.sin(angleDiff) * 0.12;
      baseAngle = directAngle + glanceBias + (Math.random() - 0.5) * 0.04;

      // Safe impulse calculation: enough to push player off, but not so excessive AI flies off
      const deskSpan = bounds.width / SCALE;
      const safeRatio = Math.min(0.95, Math.max(0.68, (distToPlayer * 1.5) / deskSpan));
      powerRatio = safeRatio;

      // 70% spin shot for maximum angular push
      if (Math.random() < 0.7) {
        const sign = Math.random() < 0.5 ? -1 : 1;
        grabOffsetLength = sign * (aiPen.lengthPx / 2) * 0.8 * (1 / SCALE);
      }
    } else {
      // MASTER AI: Pinpoint accuracy and aggressive edge knockout
      const distToLeft = (playerPos.x * SCALE) - bounds.left;
      const distToRight = bounds.right - (playerPos.x * SCALE);
      const distToTop = (playerPos.y * SCALE) - bounds.top;
      const distToBottom = bounds.bottom - (playerPos.y * SCALE);

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      let targetPushAngle = 0;
      if (minDist === distToLeft) targetPushAngle = Math.PI;
      else if (minDist === distToRight) targetPushAngle = 0;
      else if (minDist === distToTop) targetPushAngle = -Math.PI / 2;
      else targetPushAngle = Math.PI / 2;

      const directAngle = Math.atan2(dy, dx);
      const angleDiff = targetPushAngle - directAngle;
      baseAngle = directAngle + Math.sin(angleDiff) * 0.15 + (Math.random() - 0.5) * 0.01;
      powerRatio = 0.98;

      const sign = Math.random() < 0.5 ? -1 : 1;
      grabOffsetLength = sign * (aiPen.lengthPx / 2) * 0.88 * (1 / SCALE);
    }

    // Direction unit vector
    const dirX = Math.cos(baseAngle);
    const dirY = Math.sin(baseAngle);

    // Compute impulse magnitude with pen speed multiplier
    const impulseMag = powerRatio * BASE_IMPULSE * aiPen.speedMultiplier;
    const impulseVec = planck.Vec2(
      (dirX * impulseMag) / SCALE,
      (dirY * impulseMag) / SCALE,
    );

    // Grab point calculation in world coords
    let grabWorldPoint = aiPen.body.getWorldCenter();
    if (grabOffsetLength !== 0) {
      const penAngle = aiPen.body.getAngle();
      const localVec = planck.Vec2(grabOffsetLength, 0);
      grabWorldPoint = aiPen.body.getWorldPoint(localVec);
    }

    return {
      impulseVec,
      grabWorldPoint,
      powerRatio,
      aimAngle: baseAngle,
    };
  }

  /**
   * Apply calculated impulse to the AI pen and dispatch shot event.
   */
  private applyShot(
    aiPen: PenEntity,
    decision: AIShotDecision,
    onShot: (event: ShotFiredEvent) => void,
  ): void {
    aiPen.state = 'MOVING';

    // Apply linear impulse at grab point
    aiPen.body.applyLinearImpulse(decision.impulseVec, decision.grabWorldPoint, true);

    // Additional spin calculation matching InputController
    const centerOfMass = aiPen.body.getWorldCenter();
    const r = planck.Vec2(
      decision.grabWorldPoint.x - centerOfMass.x,
      decision.grabWorldPoint.y - centerOfMass.y,
    );
    const crossProduct = r.x * decision.impulseVec.y - r.y * decision.impulseVec.x;
    const extraAngular = crossProduct * (aiPen.torqueMultiplier - 1) * 0.5;
    aiPen.body.setAngularVelocity(aiPen.body.getAngularVelocity() + extraAngular);

    onShot({
      pen: aiPen,
      impulse: decision.impulseVec,
      grabWorldPoint: decision.grabWorldPoint,
    });
  }
}
