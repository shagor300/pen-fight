/**
 * src/rendering/ArenaRenderer.ts
 * Ultra-HD 2x-3x Retina Playground & School Desk Map Renderer.
 * Supports:
 * - "Old School Carved" Map ('old'): Rich dark vintage oak with a brass-edged 15cm ruler on the left,
 *   a two-tone pink/blue rubber eraser & pencil shavings on the right, a taped notebook formula note,
 *   carved Tic-Tac-Toe grid, carved 5-point star, "SK" emblem stamp, and fountain-pen blue ink stain.
 * - "Clean Tournament Oak" Map ('clean'): Sleek warm polished oak planks with subtle classroom carvings.
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

    const woodGrad = c.createLinearGradient(0, 0, w, 0);
    if (deskStyle === 'clean') {
      woodGrad.addColorStop(0, '#d8b48e');
      woodGrad.addColorStop(0.25, '#cfa77e');
      woodGrad.addColorStop(0.5, '#d9b58f');
      woodGrad.addColorStop(0.75, '#cca379');
      woodGrad.addColorStop(1, '#d5af88');
    } else {
      woodGrad.addColorStop(0, '#ae8257');
      woodGrad.addColorStop(0.35, '#9d7248');
      woodGrad.addColorStop(0.7, '#91663d');
      woodGrad.addColorStop(1, '#a47950');
    }
    c.fillStyle = woodGrad;
    c.fillRect(0, 0, w, h);

    const plankCount = 5;
    const plankW = w / plankCount;
    for (let p = 1; p < plankCount; p++) {
      const px = Math.round(p * plankW);
      c.fillStyle = 'rgba(65, 38, 15, 0.16)';
      c.fillRect(px, 0, 1.4, h);
      c.fillStyle = 'rgba(255, 244, 222, 0.13)';
      c.fillRect(px + 1.4, 0, 1.8, h);
    }

    c.strokeStyle = deskStyle === 'clean' ? 'rgba(115, 76, 42, 0.12)' : 'rgba(58, 33, 12, 0.22)';
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
    c.fillStyle = 'rgba(58, 32, 12, 0.28)';
    c.beginPath();
    c.roundRect(w * 0.22, 15, w * 0.56, 6, 3);
    c.fill();
    c.fillStyle = 'rgba(255, 255, 255, 0.16)';
    c.fillRect(w * 0.23, 20.5, w * 0.54, 1.1);

    // Classroom Desk Carvings & Props
    c.save();
    const carveAlpha = deskStyle === 'old' ? 0.38 : 0.18;
    c.strokeStyle = `rgba(54, 30, 10, ${carveAlpha})`;
    c.fillStyle = `rgba(54, 30, 10, ${carveAlpha})`;
    c.lineWidth = 1.4;

    // 1. Top-Right: Carved Tic-Tac-Toe Grid
    const ttx = w - 66;
    const tty = 34;
    const tts = 30;
    c.beginPath();
    c.moveTo(ttx + 10, tty); c.lineTo(ttx + 10, tty + tts);
    c.moveTo(ttx + 20, tty); c.lineTo(ttx + 20, tty + tts);
    c.moveTo(ttx, tty + 10); c.lineTo(ttx + tts, tty + 10);
    c.moveTo(ttx, tty + 20); c.lineTo(ttx + tts, tty + 20);
    c.stroke();
    c.beginPath();
    c.arc(ttx + 15, tty + 15, 3.4, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(ttx + 2, tty + 2); c.lineTo(ttx + 8, tty + 8);
    c.moveTo(ttx + 8, tty + 2); c.lineTo(ttx + 2, tty + 8);
    c.stroke();

    // 2. Bottom-Right: Carved 5-Point Star Doodle
    const stX = w - 46;
    const stY = h - 46;
    c.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const sx = stX + Math.cos(a1) * 12;
      const sy = stY + Math.sin(a1) * 12;
      if (i === 0) c.moveTo(sx, sy);
      else c.lineTo(sx, sy);
    }
    c.closePath();
    c.stroke();

    // 3. Bottom-Left: "SK" Square Logo Stamp
    const skX = 20;
    const skY = h - 46;
    c.beginPath();
    c.roundRect(skX, skY, 24, 24, 4);
    c.stroke();
    c.font = '800 10px Fredoka, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('SK', skX + 12, skY + 12.5);

    // 4. Lower-Middle: Fountain Pen Blue Ink Stain
    c.fillStyle = deskStyle === 'old' ? 'rgba(29, 78, 216, 0.20)' : 'rgba(29, 78, 216, 0.09)';
    c.beginPath();
    c.arc(w * 0.46, h * 0.77, 10.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(w * 0.46 + 11, h * 0.77 + 5, 4.8, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(w * 0.46 - 9, h * 0.77 - 6, 3.5, 0, Math.PI * 2);
    c.fill();

    // 5. Rich Old School Desk Map Props (Brass-Edged Ruler, Two-Tone Eraser, Taped Note)
    if (deskStyle === 'old') {
      // Left: Detailed Wooden/Brass 15cm Ruler
      c.save();
      c.translate(19, h * 0.46);
      c.rotate(-Math.PI / 2 + 0.03);
      c.fillStyle = 'rgba(234, 179, 8, 0.42)';
      c.strokeStyle = 'rgba(92, 52, 16, 0.48)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.roundRect(-66, -10, 132, 20, 3);
      c.fill();
      c.stroke();
      for (let rx = -60; rx <= 60; rx += 5) {
        c.beginPath();
        c.moveTo(rx, -10);
        c.lineTo(rx, rx % 15 === 0 ? -2 : -6);
        c.stroke();
      }
      c.restore();

      // Right: Two-Tone Pink/Blue Rubber Eraser & Pencil Shavings
      c.save();
      c.translate(w - 24, h * 0.52);
      c.rotate(0.28);
      c.fillStyle = 'rgba(244, 114, 182, 0.48)';
      c.beginPath();
      c.roundRect(-12, -7, 15, 14, 2);
      c.fill();
      c.fillStyle = 'rgba(59, 130, 246, 0.48)';
      c.beginPath();
      c.roundRect(3, -7, 9, 14, 2);
      c.fill();
      c.strokeStyle = 'rgba(43, 51, 62, 0.42)';
      c.lineWidth = 1.1;
      c.strokeRect(-12, -7, 24, 14);
      c.restore();

      // Top-Left Corner: Taped Notebook Paper Scrap
      c.save();
      c.translate(38, 42);
      c.rotate(-0.12);
      c.fillStyle = 'rgba(254, 249, 195, 0.35)';
      c.strokeStyle = 'rgba(113, 63, 18, 0.28)';
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(-22, -14, 44, 28, 3);
      c.fill();
      c.stroke();
      c.fillStyle = 'rgba(71, 85, 105, 0.45)';
      c.font = '700 8px Nunito, sans-serif';
      c.fillText('F = m·a', 0, 1);
      c.restore();
    }

    c.restore();

    const vig = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36, w / 2, h / 2, Math.max(w, h) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(38, 20, 6, 0.17)');
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
    ctx.fillStyle = '#f5edd6';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const d = engine.outerDesk;

    ctx.save();
    ctx.fillStyle = '#5c3a21';
    ctx.strokeStyle = '#2b333e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(d.x - 6, d.y - 5, d.w + 12, d.h + 14, 22);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(212, 163, 106, 0.58)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(d.x - 2, d.y - 1.5, d.w + 4, d.h + 5, 18);
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

