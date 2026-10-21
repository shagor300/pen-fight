/**
 * AnisotropicFriction.ts
 * Applies directional friction to each pen every physics frame.
 *
 * Real pens on a desk:
 *  - Roll easily sideways (low lateral friction)
 *  - Stop quickly when pushed lengthwise (high forward friction)
 *
 * PRD §4.3 specification.
 */
import * as planck from 'planck';
import {
  FORWARD_DRAG,
  LATERAL_DRAG,
  ANGULAR_DRAG,
  LINEAR_STOP_THRESHOLD,
  ANGULAR_STOP_THRESHOLD,
} from '../config/gameConstants';

export interface FrictionTarget {
  body: planck.Body;
  gripFactor: number; // derived from pen's Grip stat
}

/**
 * Apply anisotropic (direction-dependent) friction to all pen bodies.
 * Should be called once per physics step (inside the update loop).
 */
export function applyAnisotropicFriction(targets: FrictionTarget[]): void {
  for (const { body, gripFactor } of targets) {
    const vel = body.getLinearVelocity();
    const speed = vel.length();
    const angVel = body.getAngularVelocity();

    // If already nearly stopped, fully stop
    if (speed < LINEAR_STOP_THRESHOLD && Math.abs(angVel) < ANGULAR_STOP_THRESHOLD) {
      body.setLinearVelocity(planck.Vec2(0, 0));
      body.setAngularVelocity(0);
      continue;
    }

    const angle = body.getAngle();

    // Forward (lengthwise) unit vector
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const fwdX = cosA;
    const fwdY = sinA;

    // Lateral (sideways) unit vector
    const latX = -sinA;
    const latY = cosA;

    // Decompose velocity into forward and lateral components
    const vForward = vel.x * fwdX + vel.y * fwdY; // dot product
    const vLateral = vel.x * latX + vel.y * latY;

    // Apply directional damping
    const fDrag = FORWARD_DRAG * gripFactor;
    const lDrag = LATERAL_DRAG * gripFactor;
    // Clamp drags to 0..1 range
    const fDragClamped = Math.min(1, Math.max(0, fDrag));
    const lDragClamped = Math.min(1, Math.max(0, lDrag));

    const newVForward = vForward * fDragClamped;
    const newVLateral = vLateral * lDragClamped;

    // Reconstruct velocity vector
    const newVx = newVForward * fwdX + newVLateral * latX;
    const newVy = newVForward * fwdY + newVLateral * latY;

    body.setLinearVelocity(planck.Vec2(newVx, newVy));

    // Angular damping
    body.setAngularVelocity(angVel * ANGULAR_DRAG);
  }
}

/**
 * Check if a pen body has come to a complete stop.
 */
export function isPenStopped(body: planck.Body): boolean {
  const speed = body.getLinearVelocity().length();
  const angVel = Math.abs(body.getAngularVelocity());
  return speed < LINEAR_STOP_THRESHOLD && angVel < ANGULAR_STOP_THRESHOLD;
}
