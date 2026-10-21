import { PenFightEngine, PenBody, SHRINK_TURNS, CANCEL_PULL_PX } from '../physics/PenFightEngine';
import { renderPenToCanvas } from './RealPenRenderer';

export class ArenaRenderer {
  private static cachedDeskCanvas: HTMLCanvasElement | null = null;
  private static cachedDeskKey = '';

  public static renderArena(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    engine: PenFightEngine,
    deskStyle: 'clean' | 'old',
    penLook: 'real' | 'classic'
  ): void {
    ctx.clearRect(0, 0, canvasW, canvasH);

    ctx.save();
    if (engine.screenShake > 0.25) {
      const sx = (Math.random() - 0.5) * engine.screenShake;
      const sy = (Math.random() - 0.5) * engine.screenShake;
      ctx.translate(sx, sy);
    }

    this.drawSchoolDesk(ctx, canvasW, canvasH, engine, deskStyle);

    for (const pen of engine.pens) {
      this.drawFloatingPenLabel(ctx, pen, engine);
    }

    for (const pen of engine.pens) {
      if (pen.fallenOut) continue;
      renderPenToCanvas(
        ctx,
        pen.spec,
        pen.x,
        pen.y,
        pen.angle,
        penLook,
        pen.fallScale,
        pen.fallAlpha,
        pen.level
      );
    }

    for (const ring of engine.impactRings) {
      this.drawStarburstImpactRing(ctx, ring.x, ring.y, ring.ageMs / ring.durationMs, ring.maxRadius);
    }

    if (engine.aim.active && (engine.phase === 'AIMING' || engine.phase === 'AI_PULLING')) {
      const activePen = engine.pens[engine.aim.penIndex];
      if (activePen) {
        this.drawThermometerAimGauge(ctx, activePen, engine);
      }
    }

    ctx.restore();

    if (engine.turnToastTimerMs > 0 && engine.phase === 'AIMING') {
      this.drawCenterTurnToast(ctx, canvasW, canvasH, engine.turnToastText, engine.turnToastTimerMs / 950);
    }
  }

  private static getOrBuildDeskTexture(w: number, h: number, deskStyle: 'clean' | 'old'): HTMLCanvasElement {
    const key = `${Math.round(w)}x${Math.round(h)}_${deskStyle}`;
    if (this.cachedDeskCanvas && this.cachedDeskKey === key) {
      return this.cachedDeskCanvas;
    }

    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(w));
    off.height = Math.max(1, Math.round(h));
    const c = off.getContext('2d')!;

    const woodGrad = c.createLinearGradient(0, 0, w, 0);
    if (deskStyle === 'clean') {
      woodGrad.addColorStop(0, '#d8b48e');
      woodGrad.addColorStop(0.25, '#cfa77e');
      woodGrad.addColorStop(0.5, '#d9b58f');
      woodGrad.addColorStop(0.75, '#cca379');
      woodGrad.addColorStop(1, '#d5af88');
    } else {
      woodGrad.addColorStop(0, '#b88f68');
      woodGrad.addColorStop(0.35, '#a87e56');
      woodGrad.addColorStop(0.7, '#9c724b');
      woodGrad.addColorStop(1, '#ae845c');
    }
    c.fillStyle = woodGrad;
    c.fillRect(0, 0, w, h);

    const plankCount = 5;
    const plankW = w / plankCount;
    for (let p = 1; p < plankCount; p++) {
      const px = Math.round(p * plankW);
      c.fillStyle = 'rgba(65, 38, 15, 0.16)';
      c.fillRect(px, 0, 1.5, h);
      c.fillStyle = 'rgba(255, 240, 215, 0.12)';
      c.fillRect(px + 1.5, 0, 2, h);
    }

    c.strokeStyle = deskStyle === 'clean' ? 'rgba(115, 76, 42, 0.13)' : 'rgba(68, 40, 18, 0.22)';
    c.lineWidth = 1.2;
    for (let gx = 8; gx < w; gx += 11) {
      c.beginPath();
      c.moveTo(gx, 0);
      c.bezierCurveTo(
        gx + Math.sin(gx * 0.07) * 5,
        h * 0.33,
        gx - Math.cos(gx * 0.06) * 5,
        h * 0.66,
        gx + Math.sin(gx * 0.05) * 2,
        h
      );
      c.stroke();
    }

    c.fillStyle = 'rgba(65, 38, 16, 0.26)';
    c.beginPath();
    c.roundRect(w * 0.22, 16, w * 0.56, 6, 3);
    c.fill();
    c.fillStyle = 'rgba(255, 255, 255, 0.16)';
    c.fillRect(w * 0.23, 21, w * 0.54, 1.2);

    if (deskStyle === 'old') {
      c.save();
      c.strokeStyle = 'rgba(58, 34, 14, 0.34)';
      c.lineWidth = 1.4;

      const cx = w * 0.78;
      const cy = h * 0.24;
      c.beginPath();
      c.arc(cx, cy, 24, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(cx, cy, 11, 0, Math.PI * 2);
      c.stroke();

      const tx = w * 0.20;
      const ty = h * 0.76;
      c.beginPath();
      c.moveTo(tx - 16, ty - 6); c.lineTo(tx + 16, ty - 6);
      c.moveTo(tx - 16, ty + 6); c.lineTo(tx + 16, ty + 6);
      c.moveTo(tx - 6, ty - 16); c.lineTo(tx - 6, ty + 16);
      c.moveTo(tx + 6, ty - 16); c.lineTo(tx + 6, ty + 16);
      c.stroke();

      c.fillStyle = 'rgba(29, 78, 216, 0.14)';
      c.beginPath();
      c.arc(w * 0.25, h * 0.28, 13, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(w * 0.28, h * 0.30, 6, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    const vig = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(38, 20, 6, 0.18)');
    c.fillStyle = vig;
    c.fillRect(0, 0, w, h);

    this.cachedDeskCanvas = off;
    this.cachedDeskKey = key;
    return off;
  }

  private static drawSchoolDesk(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    engine: PenFightEngine,
    deskStyle: 'clean' | 'old'
  ): void {
    ctx.fillStyle = '#f5f2e9';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const d = engine.outerDesk;

    ctx.save();
    ctx.fillStyle = '#5c3a21';
    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(d.x - 6, d.y - 5, d.w + 12, d.h + 14, 22);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(d.x, d.y, d.w, d.h, 16);
    ctx.clip();

    const woodTex = this.getOrBuildDeskTexture(d.w, d.h, deskStyle);
    ctx.drawImage(woodTex, d.x, d.y, d.w, d.h);

    if (engine.shrinkSteps > 0) {
      const b = engine.activeBounds;
      ctx.fillStyle = 'rgba(28, 19, 14, 0.36)';
      ctx.fillRect(d.x, d.y, d.w, b.y - d.y);
      ctx.fillRect(d.x, b.y + b.h, d.w, d.y + d.h - (b.y + b.h));
      ctx.fillRect(d.x, b.y, b.x - d.x, b.h);
      ctx.fillRect(b.x + b.w, b.y, d.x + d.w - (b.x + b.w), b.h);

      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([9, 7]);
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 12);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (SHRINK_TURNS.includes(engine.turnCount) && engine.phase !== 'ROUND_OVER') {
      const nextRatio = Math.min(0.32, (engine.shrinkSteps + 1) * 0.07);
      const inX = (d.w * nextRatio) / 2;
      const inY = (d.h * nextRatio) / 2;
      const pulse = 0.55 + Math.sin(performance.now() * 0.008) * 0.3;

      ctx.strokeStyle = `rgba(220, 38, 38, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.roundRect(d.x + inX, d.y + inY, d.w - inX * 2, d.h - inY * 2, 12);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  private static drawFloatingPenLabel(
    ctx: CanvasRenderingContext2D,
    pen: PenBody,
    engine: PenFightEngine
  ): void {
    if (pen.falling || pen.fallenOut) return;
    const speed = Math.hypot(pen.vx, pen.vy);
    if (speed > 40) return;

    const isCurrentTurn = pen.playerIndex === engine.activePlayer;
    ctx.save();
    ctx.font = '800 13px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isCurrentTurn ? pen.labelColor : 'rgba(92, 75, 60, 0.75)';

    const labelY = pen.y + 38;
    const text = isCurrentTurn && pen.playerIndex === 1 ? `▸ ${pen.label}` : pen.label;
    ctx.fillText(text, pen.x, labelY);
    ctx.restore();
  }

  private static drawStarburstImpactRing(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    progress: number,
    maxRadius: number
  ): void {
    const p = Math.min(1, Math.max(0, progress));
    const radius = maxRadius * (0.45 + 0.55 * p);
    const alpha = 1 - p;

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha * 0.88;
    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 2.4;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    const spikes = 8;
    for (let i = 0; i < spikes; i++) {
      const ang = (i * Math.PI * 2) / spikes + 0.2;
      const innerR = radius * 0.85;
      const outerR = radius * 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * innerR, Math.sin(ang) * innerR);
      ctx.lineTo(Math.cos(ang) * outerR, Math.sin(ang) * outerR);
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawThermometerAimGauge(
    ctx: CanvasRenderingContext2D,
    pen: PenBody,
    engine: PenFightEngine
  ): void {
    const { grabOffsetRatio, pullX, pullY, powerRatio } = engine.aim;
    const contact = engine.getContactWorldPoint(pen, grabOffsetRatio);
    const pullDist = Math.hypot(pullX, pullY);

    ctx.save();

    if (pullDist >= CANCEL_PULL_PX && powerRatio > 0.04) {
      const pullAng = Math.atan2(pullY, pullX);
      const launchAng = pullAng + Math.PI;

      const gaugeColor =
        powerRatio < 0.35
          ? '#65a30d'
          : powerRatio < 0.65
          ? '#eab308'
          : powerRatio < 0.85
          ? '#f97316'
          : '#dc2626';

      const arrowLen = 26 + powerRatio * 48;
      ctx.save();
      ctx.translate(contact.x, contact.y);
      ctx.rotate(launchAng);

      ctx.strokeStyle = '#2b302a';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(arrowLen, 0);
      ctx.stroke();

      ctx.strokeStyle = gaugeColor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(arrowLen, 0);
      ctx.stroke();

      ctx.fillStyle = gaugeColor;
      ctx.strokeStyle = '#2b302a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(arrowLen + 9, 0);
      ctx.lineTo(arrowLen - 5, -8);
      ctx.lineTo(arrowLen - 5, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      const halfL = pen.lengthPx * 0.44;
      const rx = Math.cos(pen.angle) * (grabOffsetRatio * halfL);
      const ry = Math.sin(pen.angle) * (grabOffsetRatio * halfL);
      const fx = Math.cos(launchAng);
      const fy = Math.sin(launchAng);
      const normalizedTorque = (rx * fy - ry * fx) / (halfL || 1);

      if (Math.abs(normalizedTorque) > 0.14) {
        const spinDir = normalizedTorque > 0 ? 1 : -1;
        const arcRadius = 18;
        const arcSpan = Math.min(Math.PI * 1.15, (0.45 + Math.abs(normalizedTorque) * 0.75) * Math.PI);
        const startA = launchAng - spinDir * (arcSpan * 0.45);
        const endA = launchAng + spinDir * (arcSpan * 0.55);

        ctx.save();
        ctx.translate(contact.x, contact.y);
        ctx.strokeStyle = '#2b302a';
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, arcRadius, startA, endA, spinDir < 0);
        ctx.stroke();

        ctx.strokeStyle = gaugeColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, arcRadius, startA, endA, spinDir < 0);
        ctx.stroke();

        const tipX = Math.cos(endA) * arcRadius;
        const tipY = Math.sin(endA) * arcRadius;
        const tangentAng = endA + (spinDir > 0 ? Math.PI / 2 : -Math.PI / 2);
        ctx.translate(tipX, tipY);
        ctx.rotate(tangentAng);
        ctx.fillStyle = gaugeColor;
        ctx.strokeStyle = '#2b302a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      const tubeMaxLen = 104;
      const tubeWidth = 13;
      const fillLen = Math.max(8, powerRatio * tubeMaxLen);

      ctx.save();
      ctx.translate(contact.x, contact.y);
      ctx.rotate(pullAng);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = '#2b302a';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(12, -tubeWidth / 2, tubeMaxLen, tubeWidth, tubeWidth / 2);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(14, -tubeWidth / 2 + 2, tubeMaxLen - 4, tubeWidth - 4, (tubeWidth - 4) / 2);
      ctx.clip();

      ctx.fillStyle = gaugeColor;
      ctx.fillRect(14, -tubeWidth / 2, fillLen, tubeWidth);

      ctx.strokeStyle = 'rgba(43, 48, 42, 0.45)';
      ctx.lineWidth = 1.5;
      for (const frac of [0.25, 0.5, 0.75]) {
        const tx = 14 + (tubeMaxLen - 4) * frac;
        ctx.beginPath();
        ctx.moveTo(tx, -tubeWidth / 2);
        ctx.lineTo(tx, tubeWidth / 2);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    }

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(contact.x, contact.y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private static drawCenterTurnToast(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    text: string,
    lifeRatio: number
  ): void {
    const alpha = Math.min(1, lifeRatio * 2.5);
    const isPlayer2 = text.includes('2');
    const cardBg = isPlayer2 ? '#9ec5e8' : '#fbf5e5';

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvasW / 2, canvasH / 2 - 18);

    const w = 160;
    const h = 44;

    ctx.fillStyle = '#2b302a';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2 + 4, w, h, 12);
    ctx.fill();

    ctx.fillStyle = cardBg;
    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2b302a';
    ctx.font = '800 17px Fredoka, Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1);

    ctx.restore();
  }
}
