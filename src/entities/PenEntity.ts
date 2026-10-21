/**
 * PenEntity.ts
 * Integrates Planck.js rigid body with PixiJS Rendering.
 * Uses 8-layer photorealistic RealPenRenderer (Blueprint Section 5)
 * and vectorized Classic cartoon mode.
 */
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import * as planck from 'planck';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import {
  PenConfig,
  deriveMass,
  deriveSpeedMultiplier,
  deriveTorqueMultiplier,
  deriveDampingFactor,
  deriveLengthPx,
} from '../config/pensConfig';
import { FALL_DURATION_MS, FALL_SCALE, SCALE } from '../config/gameConstants';
import { renderPenToCanvas, PIXELS_PER_METER } from '../rendering/RealPenRenderer';
import { DeskBounds } from '../core/DeskManager';

export type PenState = 'IDLE' | 'AIMING' | 'MOVING' | 'FALLING' | 'DEAD';

export class PenEntity {
  public config: PenConfig;
  public body: planck.Body;
  public container: Container;
  public shadowGraphics: Graphics;
  public penSprite: Sprite | null = null;
  public effectsGraphics: Graphics;
  public state: PenState = 'IDLE';
  public playerIndex: 0 | 1;

  // Derived physics values
  public mass: number;
  public speedMultiplier: number;
  public torqueMultiplier: number;
  public dampingFactor: number;
  public lengthPx: number;
  public widthPx: number;

  // Level bonuses (from XP progression)
  public level = 1;
  public statBonus = 0; // percentage 0–0.08
  public visualLook: 'classic' | 'real' = 'classic';

  constructor(
    config: PenConfig,
    playerIndex: 0 | 1,
    physicsWorld: PhysicsWorld,
    xPx: number,
    yPx: number,
    angle: number,
  ) {
    this.config = config;
    this.playerIndex = playerIndex;

    // Dimensions in pixels
    this.lengthPx = config.dimensions.lengthMeters * PIXELS_PER_METER;
    this.widthPx = config.dimensions.widthMeters * PIXELS_PER_METER;

    // Derive physics stats
    this.mass = deriveMass(config.stats.weight);
    this.speedMultiplier = deriveSpeedMultiplier(config.stats.speed);
    this.torqueMultiplier = deriveTorqueMultiplier(config.stats.spin);
    this.dampingFactor = deriveDampingFactor(config.stats.grip);

    // Build polygon vertices for physics
    const halfL = this.lengthPx / 2;
    const halfW = this.widthPx / 2;
    const vertices = [
      planck.Vec2(-halfL, -halfW),
      planck.Vec2(halfL, -halfW),
      planck.Vec2(halfL, halfW),
      planck.Vec2(-halfL, halfW),
    ];

    this.body = physicsWorld.createPenBody(
      xPx,
      yPx,
      angle,
      vertices,
      this.mass,
      0.55, // fixture friction (PlanckPhysics.ts)
      0.35, // fixture restitution (PlanckPhysics.ts)
    );

    // Store reference to entity in body userData
    this.body.setUserData(this);

    // ─── Build PixiJS visual ────────────────────────────────────
    this.container = new Container();

    // World-anchored shadow (underneath pen)
    this.shadowGraphics = new Graphics();
    this.drawShadow();
    this.container.addChild(this.shadowGraphics);

    // Effects graphics (Aura, Stickers, Glow)
    this.effectsGraphics = new Graphics();
    this.container.addChild(this.effectsGraphics);

    // Initial render
    this.redrawPen();
    this.syncVisuals();
  }

  public setVisualLook(look: 'classic' | 'real'): void {
    if (this.visualLook !== look) {
      this.visualLook = look;
      this.redrawPen();
    }
  }

  public setProgression(level: number, bonus: number): void {
    this.level = level;
    this.statBonus = bonus;
    this.redrawPen();
  }

  public redrawPen(): void {
    if (this.penSprite) {
      this.container.removeChild(this.penSprite);
      this.penSprite.destroy();
      this.penSprite = null;
    }

    const L = Math.ceil(this.lengthPx);
    const W = Math.ceil(this.widthPx);
    const pad = 20;
    const canvasW = L + pad * 2;
    const canvasH = W + pad * 2;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvasW;
    offscreen.height = canvasH;
    const ctx = offscreen.getContext('2d')!;

    // Call 8-layer photorealistic or classic vector renderer
    renderPenToCanvas(ctx, this.config, canvasW / 2, canvasH / 2, 0, this.visualLook);

    const texture = Texture.from(offscreen);
    this.penSprite = new Sprite(texture);
    this.penSprite.anchor.set(0.5, 0.5);
    this.container.addChild(this.penSprite);

    this.drawLevelEffects();
  }

  /** Draw a soft shadow ellipse beneath the pen */
  private drawShadow(): void {
    const g = this.shadowGraphics;
    const halfL = this.lengthPx / 2;
    const halfW = this.widthPx / 2;

    g.clear()
      .ellipse(4, 7, halfL + 4, halfW + 4)
      .fill({ color: 0x000000, alpha: 0.28 });
  }

  private drawLevelEffects(): void {
    const g = this.effectsGraphics;
    g.clear();
    const halfL = this.lengthPx / 2;
    const halfW = this.widthPx / 2;

    // Golden Master Aura for Level 5
    if (this.level >= 5) {
      g.roundRect(-halfL - 3, -halfW - 3, this.lengthPx + 6, this.widthPx + 6, 6)
        .stroke({ color: 0xFFD700, width: 2, alpha: 0.8 });
    } else if (this.level >= 4) {
      // Neon cyan outline for Level 4
      g.roundRect(-halfL - 2, -halfW - 2, this.lengthPx + 4, this.widthPx + 4, 4)
        .stroke({ color: 0x00E5FF, width: 1.5, alpha: 0.7 });
    }

    // Level 3 custom sticker
    if (this.level >= 3) {
      g.roundRect(0, -halfW + 2, 12, this.widthPx - 4, 2)
        .fill({ color: 0xFFFFFF, alpha: 0.9 })
        .stroke({ color: 0xEE3333, width: 0.8 });
    }
  }

  /** Sync PixiJS container position/rotation with Planck body */
  public syncVisuals(): void {
    const pos = this.body.getPosition();
    this.container.x = PhysicsWorld.m2px(pos.x);
    this.container.y = PhysicsWorld.m2px(pos.y);
    this.container.rotation = this.body.getAngle();
  }

  /** Start the fall-off-desk animation */
  public startFallAnimation(onComplete: () => void): void {
    this.state = 'FALLING';

    const fixture = this.body.getFixtureList();
    if (fixture) {
      fixture.setSensor(true);
    }

    const startTime = performance.now();
    const startScale = this.container.scale.x;
    const startAlpha = this.container.alpha;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / FALL_DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic

      const scale = startScale * (1 - (1 - FALL_SCALE) * eased);
      this.container.scale.set(scale);
      this.container.alpha = startAlpha * (1 - eased);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.state = 'DEAD';
        this.container.visible = false;
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }

  /** Check if the pen's center is outside the given desk bounds */
  public isOutsideBounds(bounds: DeskBounds): boolean {
    const pos = this.body.getPosition();
    const px = PhysicsWorld.m2px(pos.x);
    const py = PhysicsWorld.m2px(pos.y);

    return (
      px < bounds.left ||
      px > bounds.right ||
      py < bounds.top ||
      py > bounds.bottom
    );
  }
}
