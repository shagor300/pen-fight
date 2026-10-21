/**
 * PlanckPhysics.ts
 * Exact Planck.js (Box2D) physics simulation extracted from shunneklabs.app bundle.
 * Blueprint Section 6: Top-down physics world, anisotropic friction, flick shot, and collisions.
 */
import * as planck from 'planck';
import { PenConfig } from '../config/pensConfig';
import { PIXELS_PER_METER } from '../rendering/RealPenRenderer';

export interface PhysicsPenInstance {
  playerIndex: 1 | 2;
  config: PenConfig;
  body: planck.Body;
  falling: boolean;
  fallScale: number;
  fallAlpha: number;
}

export class PenFightPhysicsWorld {
  public world: planck.World;
  public pens: PhysicsPenInstance[] = [];
  public onCollisionCallback?: (impactSpeed: number, pointPx: { x: number; y: number }) => void;

  constructor() {
    // Top-down 2D desk world has zero gravity
    this.world = planck.World(planck.Vec2(0, 0));
    this.setupCollisionListener();
  }

  public createPen(playerIndex: 1 | 2, config: PenConfig, xPx: number, yPx: number, angleRad: number): PhysicsPenInstance {
    const xM = xPx / PIXELS_PER_METER;
    const yM = yPx / PIXELS_PER_METER;

    // Extracted Planck.js damping constants scaled by Grip stat
    const gripRatio = config.stats.grip / 10;
    const linearDamping = 0.85 + gripRatio * 0.55;   // 0.85 - 1.40
    const angularDamping = 1.80 + gripRatio * 1.40;  // 1.80 - 3.20

    const body = this.world.createDynamicBody({
      position: planck.Vec2(xM, yM),
      angle: angleRad,
      linearDamping,
      angularDamping,
      bullet: true,
    });

    const halfL = config.dimensions.lengthMeters / 2;
    const halfW = config.dimensions.widthMeters / 2;
    const density = 1.2 * (0.5 + (config.stats.weight / 10) * 0.9);

    body.createFixture({
      shape: planck.Box(halfL, halfW),
      density,
      friction: 0.55,
      restitution: 0.35,
    });

    const instance: PhysicsPenInstance = {
      playerIndex,
      config,
      body,
      falling: false,
      fallScale: 1.0,
      fallAlpha: 1.0,
    };

    body.setUserData(instance);
    this.pens.push(instance);
    return instance;
  }

  /**
   * Extracted Pull-Back Flick Impulse Calculation
   * Off-center grab points automatically generate spin torque (r x F) in Planck.js!
   */
  public applyFlickShot(
    penInstance: PhysicsPenInstance,
    dragStartPx: { x: number; y: number },
    dragEndPx: { x: number; y: number },
    worldGrabPointPx: { x: number; y: number },
  ): boolean {
    const dx = dragStartPx.x - dragEndPx.x;
    const dy = dragStartPx.y - dragEndPx.y;
    const distancePx = Math.hypot(dx, dy);

    // Cancel shot if dragged less than 16 pixels
    if (distancePx < 16) return false;

    const maxDragPx = 150;
    const clampedDist = Math.min(distancePx, maxDragPx);
    const dirX = dx / (distancePx || 1);
    const dirY = dy / (distancePx || 1);

    const baseForce = 0.08;
    const speedMult = 0.5 + (penInstance.config.stats.speed / 10) * 0.8;
    const forceMagnitude = clampedDist * baseForce * speedMult;

    const impulse = planck.Vec2(dirX * forceMagnitude, dirY * forceMagnitude);
    const grabPointMeters = planck.Vec2(
      worldGrabPointPx.x / PIXELS_PER_METER,
      worldGrabPointPx.y / PIXELS_PER_METER,
    );

    penInstance.body.applyLinearImpulse(impulse, grabPointMeters, true);
    return true;
  }

  /**
   * Extracted Anisotropic Friction Solver
   * Decomposes velocity into forward (axial) and side (transverse) vectors
   */
  public applyAnisotropicFriction(body: planck.Body): void {
    const currentVel = body.getLinearVelocity();
    const forwardVec = body.getWorldVector(planck.Vec2(1, 0));
    const sideVec = body.getWorldVector(planck.Vec2(0, 1));

    const forwardSpeed = planck.Vec2.dot(currentVel, forwardVec);
    const sideSpeed = planck.Vec2.dot(currentVel, sideVec);

    const sideDragImpulse = sideVec.clone().mul(-sideSpeed * body.getMass() * 0.045);
    const forwardDragImpulse = forwardVec.clone().mul(-forwardSpeed * body.getMass() * 0.095);

    body.applyLinearImpulse(sideDragImpulse, body.getWorldCenter(), true);
    body.applyLinearImpulse(forwardDragImpulse, body.getWorldCenter(), true);
  }

  public step(dt = 1 / 60): boolean {
    this.world.step(dt, 8, 3);

    let anyMoving = false;
    for (const pen of this.pens) {
      if (pen.falling) {
        pen.fallScale = Math.max(0.25, pen.fallScale - 0.045);
        pen.fallAlpha = Math.max(0, pen.fallAlpha - 0.055);
        if (pen.fallAlpha > 0.02) anyMoving = true;
        continue;
      }

      this.applyAnisotropicFriction(pen.body);

      const v = pen.body.getLinearVelocity();
      const w = pen.body.getAngularVelocity();
      if (v.length() < 0.04 && Math.abs(w) < 0.06) {
        pen.body.setLinearVelocity(planck.Vec2(0, 0));
        pen.body.setAngularVelocity(0);
      } else {
        anyMoving = true;
      }
    }
    return anyMoving;
  }

  private setupCollisionListener(): void {
    (this.world as any).on('post-solve', (contact: any, impulse: any) => {
      const normalImpulses = impulse.normalImpulses;
      const maxImpulse = normalImpulses && normalImpulses.length > 0 ? normalImpulses[0] : 0;
      if (maxImpulse > 0.15 && this.onCollisionCallback) {
        const worldManifold = contact.getWorldManifold(null);
        const pt = worldManifold?.points?.[0];
        if (pt) {
          this.onCollisionCallback(maxImpulse, {
            x: pt.x * PIXELS_PER_METER,
            y: pt.y * PIXELS_PER_METER,
          });
        }
      }
    });
  }
}
