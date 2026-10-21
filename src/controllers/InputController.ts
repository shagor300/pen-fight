/**
 * InputController.ts
 * Handles touch/mouse pull-back aiming, aim guide arrow, and shot firing.
 * PRD §4.2: Pull-back + Spin mechanic specification.
 */
import { Container, Graphics } from 'pixi.js';
import * as planck from 'planck';
import { PenEntity } from '../entities/PenEntity';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import {
  MIN_PULL_PX,
  MAX_PULL_PX,
  BASE_IMPULSE,
  SCALE,
} from '../config/gameConstants';
import EventEmitter from 'eventemitter3';

export interface ShotFiredEvent {
  pen: PenEntity;
  impulse: planck.Vec2;
  grabWorldPoint: planck.Vec2;
}

export class InputController extends EventEmitter {
  private pen: PenEntity | null = null;
  private stage: Container;
  private aimGuide: Graphics;
  private powerDots: Graphics;

  private isDragging = false;
  private startPx = { x: 0, y: 0 };
  private currentPx = { x: 0, y: 0 };
  private grabLocalPoint: planck.Vec2 = planck.Vec2(0, 0);
  private enabled = false;

  constructor(stage: Container) {
    super();
    this.stage = stage;

    // Aim guide arrow overlay
    this.aimGuide = new Graphics();
    this.aimGuide.visible = false;
    this.stage.addChild(this.aimGuide);

    // Power indicator dots
    this.powerDots = new Graphics();
    this.powerDots.visible = false;
    this.stage.addChild(this.powerDots);
  }

  /** Set the active pen that can be controlled */
  setActivePen(pen: PenEntity | null): void {
    this.pen = pen;
    this.isDragging = false;
    this.aimGuide.visible = false;
    this.powerDots.visible = false;
  }

  /** Enable/disable input processing */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.isDragging = false;
      this.aimGuide.visible = false;
      this.powerDots.visible = false;
    }
  }

  /** Bind to a canvas element's interaction events */
  bindEvents(view: HTMLCanvasElement): void {
    view.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    view.addEventListener('pointermove', (e) => this.onPointerMove(e));
    view.addEventListener('pointerup', (e) => this.onPointerUp(e));
    view.addEventListener('pointercancel', () => this.cancelDrag());
  }

  private onPointerDown(e: PointerEvent): void {
    if (!this.enabled || !this.pen || this.pen.state !== 'IDLE') return;

    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Check if pointer is on the pen
    const penPos = this.pen.body.getPosition();
    const penPx = { x: PhysicsWorld.m2px(penPos.x), y: PhysicsWorld.m2px(penPos.y) };

    // Simple distance check (generous hit area)
    const maxHitDist = Math.max(this.pen.lengthPx, this.pen.widthPx) * 0.7;
    const dx = px - penPx.x;
    const dy = py - penPx.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxHitDist) return;

    this.isDragging = true;
    this.startPx = { x: px, y: py };
    this.currentPx = { x: px, y: py };
    this.pen.state = 'AIMING';

    // Store grab point in body-local coordinates
    const worldPoint = planck.Vec2(px / SCALE, py / SCALE);
    this.grabLocalPoint = this.pen.body.getLocalPoint(worldPoint);

    this.aimGuide.visible = true;
    this.powerDots.visible = true;

    this.emit('aim_start');
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.pen) return;

    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    this.currentPx = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    this.updateAimGuide();
  }

  private onPointerUp(_e: PointerEvent): void {
    if (!this.isDragging || !this.pen) return;

    const dragVec = {
      x: this.startPx.x - this.currentPx.x,
      y: this.startPx.y - this.currentPx.y,
    };
    const dragDist = Math.sqrt(dragVec.x * dragVec.x + dragVec.y * dragVec.y);

    this.isDragging = false;
    this.aimGuide.visible = false;
    this.powerDots.visible = false;

    // Cancel zone — too short a drag
    if (dragDist < MIN_PULL_PX) {
      this.pen.state = 'IDLE';
      this.emit('aim_cancel');
      return;
    }

    // Clamp drag distance
    const clampedDist = Math.min(dragDist, MAX_PULL_PX);
    const powerRatio = clampedDist / MAX_PULL_PX;

    // Direction unit vector
    const dirX = dragVec.x / dragDist;
    const dirY = dragVec.y / dragDist;

    // Calculate impulse
    const impulseMag = powerRatio * BASE_IMPULSE * this.pen.speedMultiplier;
    const impulseVec = planck.Vec2(
      dirX * impulseMag / SCALE,
      dirY * impulseMag / SCALE,
    );

    // Get grab world point for torque generation
    const grabWorldPoint = this.pen.body.getWorldPoint(this.grabLocalPoint);

    // Apply impulse at the grab point (PRD §4.2)
    // When grab point is off-center, this naturally creates torque
    this.pen.body.applyLinearImpulse(impulseVec, grabWorldPoint, true);

    // Additional spin boost based on pen's Spin stat
    const centerOfMass = this.pen.body.getWorldCenter();
    const r = planck.Vec2(
      grabWorldPoint.x - centerOfMass.x,
      grabWorldPoint.y - centerOfMass.y,
    );
    const crossProduct = r.x * impulseVec.y - r.y * impulseVec.x;
    const extraAngular = crossProduct * (this.pen.torqueMultiplier - 1) * 0.5;
    this.pen.body.setAngularVelocity(
      this.pen.body.getAngularVelocity() + extraAngular,
    );

    this.pen.state = 'MOVING';

    const event: ShotFiredEvent = {
      pen: this.pen,
      impulse: impulseVec,
      grabWorldPoint,
    };
    this.emit('shot_fired', event);
  }

  private cancelDrag(): void {
    if (this.isDragging && this.pen) {
      this.pen.state = 'IDLE';
    }
    this.isDragging = false;
    this.aimGuide.visible = false;
    this.powerDots.visible = false;
  }

  /** Draw the aim guide arrow showing shot direction & power */
  private updateAimGuide(): void {
    if (!this.pen) return;

    const g = this.aimGuide;
    g.clear();

    const dragVec = {
      x: this.startPx.x - this.currentPx.x,
      y: this.startPx.y - this.currentPx.y,
    };
    const dragDist = Math.sqrt(dragVec.x * dragVec.x + dragVec.y * dragVec.y);

    if (dragDist < 3) return;

    const clampedDist = Math.min(dragDist, MAX_PULL_PX);
    const powerRatio = clampedDist / MAX_PULL_PX;

    // Arrow origin at pen center
    const penPos = this.pen.body.getPosition();
    const ox = PhysicsWorld.m2px(penPos.x);
    const oy = PhysicsWorld.m2px(penPos.y);

    // Arrow direction (toward where pen will go)
    const dirX = dragVec.x / dragDist;
    const dirY = dragVec.y / dragDist;

    // Arrow length proportional to power
    const arrowLen = 40 + powerRatio * 120;

    const endX = ox + dirX * arrowLen;
    const endY = oy + dirY * arrowLen;

    // Arrow color: green → yellow → red based on power
    const r = Math.min(255, Math.floor(powerRatio * 2 * 255));
    const gVal = Math.min(255, Math.floor((1 - powerRatio) * 2 * 255));
    const color = (r << 16) | (gVal << 8) | 0;

    // Draw dashed arrow line
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      if (i % 2 === 0) {
        const t0 = i / segments;
        const t1 = (i + 1) / segments;
        const x0 = ox + dirX * arrowLen * t0;
        const y0 = oy + dirY * arrowLen * t0;
        const x1 = ox + dirX * arrowLen * t1;
        const y1 = oy + dirY * arrowLen * t1;
        g.moveTo(x0, y0)
          .lineTo(x1, y1)
          .stroke({ color, width: 3, alpha: 0.7 });
      }
    }

    // Arrowhead
    const headSize = 10;
    const angle = Math.atan2(dirY, dirX);
    g.moveTo(endX, endY)
      .lineTo(
        endX - headSize * Math.cos(angle - 0.4),
        endY - headSize * Math.sin(angle - 0.4),
      )
      .stroke({ color, width: 3, alpha: 0.7 });
    g.moveTo(endX, endY)
      .lineTo(
        endX - headSize * Math.cos(angle + 0.4),
        endY - headSize * Math.sin(angle + 0.4),
      )
      .stroke({ color, width: 3, alpha: 0.7 });

    // ── Pull-back elastic line (from pen to finger) ──
    const pGfx = this.powerDots;
    pGfx.clear()
      .moveTo(ox, oy)
      .lineTo(this.currentPx.x, this.currentPx.y)
      .stroke({ color: 0xFFFFFF, width: 2, alpha: 0.4 })
      .circle(this.currentPx.x, this.currentPx.y, 6)
      .fill({ color: 0xFFFFFF, alpha: 0.5 });
  }
}
