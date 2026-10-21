/**
 * ArenaRenderer.ts
 * 100% Authentic Ultra-HD Retina Playground & Desk Renderer matching https://shunneklabs.app/games/pen-fight/.
 * Features:
 * - Warm cream outer background (#f5edd6)
 * - Dark wooden desk frame with bronze/gold inner trim & 2x-3x Retina supersampled wood grain
 * - Authentic classroom desk carvings & details (left ruler markings, right pencil/eraser,
 *   top-right tic-tac-toe grid, bottom-right carved star, bottom-left SK stamp, lower-middle blue ink blot)
 * - 8-Spike Dark Starburst Impact Ring & Thermometer Slingshot Gauge
 */
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
    penLook: 'real' | 'classic',
    showAimGuide = true,
    reduceMotion = false
  ): void {
    ctx.clearRect(0, 0, canvasW, canvasH);

    ctx.save();
    if (!reduceMotion && engine.screenShake > 0.25) {
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
        this.drawThermometerAimGauge(ctx, activePen, engine, showAimGuide);
      }
    }

    ctx.restore();

    if (engine.turnToastTimerMs > 0 && engine.phase === 'AIMING') {
      this.drawCenterTurnToast(ctx, canvasW, canvasH, engine.turnToastText, engine.turnToastTimerMs / 950);
    }
  }

  private static getOrBuildDeskTexture(w: number, h: number, deskStyle: 'clean' | 'old'): HTMLCanvasElement {
    const texScale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
    const key = `${Math.round(w)}x${Math.round(h)}_${deskStyle}_${texScale}`;
    if (this.cachedDeskCanvas && this.cachedDeskKey === key) {
      return this.cachedDeskCanvas;
    }

    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(w * texScale));
    off.height = Math.max(1, Math.round(h * texScale));
    const c = off.getContext('2d')!;
    c.scale(texScale, texScale);

    // Rich polished school desk wood surface
    const woodGrad = c.createLinearGradient(0, 0, w, 0);
    if (deskStyle === 'clean') {
      woodGrad.addColorStop(0, '#d8b48e');
      woodGrad.addColorStop(0.25, '#cfa77e');
      woodGrad.addColorStop(0.5, '#d9b58f');
      woodGrad.addColorStop(0.75, '#cca379');
      woodGrad.addColorStop(1, '#d5af88');
    } else {
      woodGrad.addColorStop(0, '#b58960');
      woodGrad.addColorStop(0.35, '#a47951');
      woodGrad.addColorStop(0.7, '#986d46');
      woodGrad.addColorStop(1, '#ab8058');
    }
    c.fillStyle = woodGrad;
    c.fillRect(0, 0, w, h);

    // Vertical wood planks & highlights
    const plankCount = 5;
    const plankW = w / plankCount;
    for (let p = 1; p < plankCount; p++) {
      const px = Math.round(p * plankW);
      c.fillStyle = 'rgba(65, 38, 15, 0.15)';
      c.fillRect(px, 0, 1.4, h);
      c.fillStyle = 'rgba(255, 244, 222, 0.13)';
      c.fillRect(px + 1.4, 0, 1.8, h);
    }

    // Fine organic wood grain fibers
    c.strokeStyle = deskStyle === 'clean' ? 'rgba(115, 76, 42, 0.12)' : 'rgba(64, 38, 16, 0.20)';
    c.lineWidth = 1.0;
    for (let gx = 7; gx < w; gx += 10) {
      c.beginPath();
      c.moveTo(gx, 0);
      c.bezierCurveTo(
        gx + Math.sin(gx * 0.07) * 4.5,
        h * 0.33,
        gx - Math.cos(gx * 0.06) * 4.5,
        h * 0.66,
        gx + Math.sin(gx * 0.05) * 2,
        h
      );
      c.stroke();
    }

    // Top horizontal pencil groove
    c.fillStyle = 'rgba(65, 38, 16, 0.24)';
    c.beginPath();
    c.roundRect(w * 0.22, 15, w * 0.56, 5.5, 3);
    c.fill();
    c.fillStyle = 'rgba(255, 255, 255, 0.16)';
    c.fillRect(w * 0.23, 20, w * 0.54, 1.1);

    // Authentic Classroom Carvings & Doodles (verified from shunneklabs.app/games/pen-fight/)
    c.save();
    const carveAlpha = deskStyle === 'old' ? 0.34 : 0.16;
    c.strokeStyle = `rgba(58, 34, 14, ${carveAlpha})`;
    c.fillStyle = `rgba(58, 34, 14, ${carveAlpha})`;
    c.lineWidth = 1.35;

    // 1. Top-Right: Carved Tic-Tac-Toe Grid
    const ttx = w - 68;
    const tty = 36;
    const tts = 28;
    c.beginPath();
    c.moveTo(ttx + 9, tty); c.lineTo(ttx + 9, tty + tts);
    c.moveTo(ttx + 19, tty); c.lineTo(ttx + 19, tty + tts);
    c.moveTo(ttx, tty + 9); c.lineTo(ttx + tts, tty + 9);
    c.moveTo(ttx, tty + 19); c.lineTo(ttx + tts, tty + 19);
    c.stroke();
    c.beginPath();
    c.arc(ttx + 14, tty + 14, 3.2, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(ttx + 2, tty + 2); c.lineTo(ttx + 7, tty + 7);
    c.moveTo(ttx + 7, tty + 2); c.lineTo(ttx + 2, tty + 7);
    c.stroke();

    // 2. Bottom-Right: Carved 5-Point Star Doodle
    const stX = w - 48;
    const stY = h - 48;
    c.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const sx = stX + Math.cos(a1) * 11;
      const sy = stY + Math.sin(a1) * 11;
      if (i === 0) c.moveTo(sx, sy);
      else c.lineTo(sx, sy);
    }
    c.closePath();
    c.stroke();

    // 3. Bottom-Left: "SK" Square Logo Stamp
    const skX = 22;
    const skY = h - 46;
    c.beginPath();
    c.roundRect(skX, skY, 24, 24, 4);
    c.stroke();
    c.font = '800 10px Fredoka, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('SK', skX + 12, skY + 12.5);

    // 4. Lower-Middle: Blue Ink Blot Stain
    c.fillStyle = deskStyle === 'old' ? 'rgba(29, 78, 216, 0.16)' : 'rgba(29, 78, 216, 0.08)';
    c.beginPath();
    c.arc(w * 0.46, h * 0.78, 10, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(w * 0.46 + 11, h * 0.78 + 5, 4.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(w * 0.46 - 9, h * 0.78 - 6, 3.2, 0, Math.PI * 2);
    c.fill();

    // 5. Left Edge: Subtle Yellow Ruler Graphic
    if (deskStyle === 'old') {
      c.save();
      c.translate(18, h * 0.46);
      c.rotate(-Math.PI / 2 + 0.04);
      c.fillStyle = 'rgba(234, 179, 8, 0.24)';
      c.strokeStyle = 'rgba(113, 63, 18, 0.30)';
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(-55, -8, 110, 16, 2);
      c.fill();
      c.stroke();
      for (let rx = -48; rx <= 48; rx += 6) {
        c.beginPath();
        c.moveTo(rx, -8);
        c.lineTo(rx, rx % 12 === 0 ? -2 : -5);
        c.stroke();
      }
      c.restore();
    }

    c.restore();

    // Soft edge vignette
    const vig = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36, w / 2, h / 2, Math.max(w, h) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(38, 20, 6, 0.16)');
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
    // 1. Authentic Warm Cream Outer Background (#f5edd6)
    ctx.fillStyle = '#f5edd6';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const d = engine.outerDesk;

    ctx.save();
    // 2. Dark Wooden Frame with Bronze/Gold Trim (#5c3a21 + #c89d66 + #2b333e)
    ctx.fillStyle = '#5c3a21';
    ctx.strokeStyle = '#2b333e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(d.x - 6, d.y - 5, d.w + 12, d.h + 14, 22);
    ctx.fill();
    ctx.stroke();

    // Bronze/Gold inner bevel trim along desk border
    ctx.strokeStyle = 'rgba(212, 163, 106, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(d.x - 2, d.y - 1.5, d.w + 4, d.h + 5, 18);
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(d.x, d.y, d.w, d.h, 16);
    ctx.clip();

    const woodTex = this.getOrBuildDeskTexture(d.w, d.h, deskStyle);
    ctx.drawImage(woodTex, d.x, d.y, d.w, d.h);

    // 3. Active Shrunk Zone Overlay
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

    // 4. Next-Turn Shrink Warning Dashed Red Line (Turns 15, 19, 23, 27)
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
    ctx.fillStyle = isCurrentTurn ? pen.labelColor : 'rgba(92, 75, 60, 0.78)';

    const labelY = pen.y + 36;
    ctx.fillText(pen.label, pen.x, labelY);
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
    engine: PenFightEngine,
    showAimGuide = true
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

      // When Aim guide is ON, draw the forward trajectory arrow and curved spin indicator
      if (showAimGuide) {
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
      }

      // Thermometer Power Bar (Always shown, even when Aim guide is OFF)
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

    ctx.fillStyle = '#2b333e';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2 + 4, w, h, 12);
    ctx.fill();

    ctx.fillStyle = cardBg;
    ctx.strokeStyle = '#2b333e';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2b333e';
    ctx.font = '800 17px Fredoka, Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1);

    ctx.restore();
  }
}
