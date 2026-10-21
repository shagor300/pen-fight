/**
 * PhysicsWorld.ts
 * Sets up the Planck.js world (zero gravity for top-down view)
 * and runs the fixed-timestep simulation loop.
 */
import * as planck from 'planck';
import {
  SCALE,
  TIME_STEP,
  VELOCITY_ITERATIONS,
  POSITION_ITERATIONS,
} from '../config/gameConstants';

export class PhysicsWorld {
  public world: planck.World;
  private accumulator = 0;

  constructor() {
    // Zero gravity — top-down desk game
    this.world = new planck.World({ gravity: planck.Vec2(0, 0) });
  }

  /** Convert pixel coords to physics meters */
  static px2m(px: number): number {
    return px / SCALE;
  }

  /** Convert physics meters to pixel coords */
  static m2px(m: number): number {
    return m * SCALE;
  }

  /** Convert a pixel Vec2 to meter Vec2 */
  static pxVec2m(x: number, y: number): planck.Vec2 {
    return planck.Vec2(x / SCALE, y / SCALE);
  }

  /**
   * Advance the simulation by `dt` seconds (variable frame dt).
   * Internally uses a fixed timestep with accumulator.
   */
  step(dt: number): void {
    this.accumulator += dt;
    while (this.accumulator >= TIME_STEP) {
      this.world.step(TIME_STEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
      this.accumulator -= TIME_STEP;
    }
  }

  /** Create a dynamic rigid body from a polygon (vertices in pixels). */
  createPenBody(
    xPx: number,
    yPx: number,
    angle: number,
    vertices: { x: number; y: number }[],
    mass: number,
    friction: number,
    restitution: number,
  ): planck.Body {
    const body = this.world.createBody({
      type: 'dynamic',
      position: planck.Vec2(xPx / SCALE, yPx / SCALE),
      angle,
      linearDamping: 0,   // we apply custom anisotropic damping
      angularDamping: 0,
      bullet: true,        // continuous collision for fast pens
    });

    const scaledVerts: planck.Vec2[] = vertices.map(v =>
      planck.Vec2(v.x / SCALE, v.y / SCALE),
    );

    const fixDef: planck.FixtureDef = {
      shape: planck.Polygon(scaledVerts as planck.Vec2[]),
      density: mass / 1,  // Will be overridden by MassData
      friction,
      restitution,
    };

    body.createFixture(fixDef);

    // Override mass to match the pen's stat
    body.setMassData({
      mass,
      center: planck.Vec2(0, 0),
      I: mass * 0.02, // moment of inertia — thin rod approximation
    });

    return body;
  }

  /** Remove a body from the world */
  destroyBody(body: planck.Body): void {
    this.world.destroyBody(body);
  }
}
