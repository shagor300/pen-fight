/**
 * DeskAndAI.ts
 * Desk shrinking, bounds calculation, fall checking, and AI shot impulse calculation.
 * Extracted from Desk Wars: Pen Fight (shunneklabs.app bundle) — Blueprint Section 7.
 */
import * as planck from 'planck';
import { PhysicsPenInstance } from '../physics/PlanckPhysics';
import { PIXELS_PER_METER } from '../rendering/RealPenRenderer';

export interface DeskBoundsPx {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const SHRINK_WARNING_TURNS = [15, 19, 23, 27] as const;

export function calculateDeskBoundsForTurn(
  initialBounds: DeskBoundsPx,
  shrinkStepsApplied: number,
): DeskBoundsPx {
  const shrinkFactor = Math.min(0.32, shrinkStepsApplied * 0.068);
  const width = initialBounds.maxX - initialBounds.minX;
  const height = initialBounds.maxY - initialBounds.minY;
  const insetX = (width * shrinkFactor) / 2;
  const insetY = (height * shrinkFactor) / 2;

  return {
    minX: initialBounds.minX + insetX,
    maxX: initialBounds.maxX - insetX,
    minY: initialBounds.minY + insetY,
    maxY: initialBounds.maxY - insetY,
  };
}

export function checkPenFellOffDesk(pen: PhysicsPenInstance, boundsPx: DeskBoundsPx): boolean {
  const centerM = pen.body.getWorldCenter();
  const cx = centerM.x * PIXELS_PER_METER;
  const cy = centerM.y * PIXELS_PER_METER;
  return cx < boundsPx.minX || cx > boundsPx.maxX || cy < boundsPx.minY || cy > boundsPx.maxY;
}

/**
 * Extracted AI Shot Calculation from shunneklabs.app bundle
 */
export function calculateAIShotImpulse(
  aiPen: PhysicsPenInstance,
  playerPen: PhysicsPenInstance,
  difficulty: 'Easy' | 'Normal' | 'Hard',
): { impulse: planck.Vec2; applyPoint: planck.Vec2 } {
  const aiPos = aiPen.body.getPosition();
  const playerPos = playerPen.body.getPosition();

  let targetAngle = Math.atan2(playerPos.y - aiPos.y, playerPos.x - aiPos.x);

  const noiseMap = { Easy: 0.35, Normal: 0.14, Hard: 0.035 };
  const errorNoise = (Math.random() - 0.5) * noiseMap[difficulty];
  targetAngle += errorNoise;

  const distMeters = Math.hypot(playerPos.x - aiPos.x, playerPos.y - aiPos.y);
  const powerScale = difficulty === 'Easy' ? 3.2 : difficulty === 'Normal' ? 4.4 : 5.2;
  const impulseMag = Math.min(14, Math.max(4.5, distMeters * powerScale));

  // On Hard/Normal, apply impulse slightly off-center to induce spin attack
  const spinOffset = difficulty === 'Easy' ? 0 : (Math.random() < 0.6 ? 0.35 : -0.35);
  const localGrab = planck.Vec2(spinOffset, 0);
  const worldGrab = aiPen.body.getWorldPoint(localGrab);

  return {
    impulse: planck.Vec2(Math.cos(targetAngle) * impulseMag, Math.sin(targetAngle) * impulseMag),
    applyPoint: worldGrab,
  };
}
