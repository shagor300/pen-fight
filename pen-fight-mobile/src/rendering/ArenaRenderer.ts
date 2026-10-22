/**
 * src/rendering/ArenaRenderer.ts
 * Ultra-HD 3D Wooden School Desk Playground & Tactical Aim Renderer.
 *
 * Visual Upgrades:
 * - Multi-layered 3D bevelled walnut/mahogany desk frame with outer drop shadow & inner recessed shadow.
 * - Warm classroom overhead spotlight gradient, multi-plank oak color variation, wood knots,
 *   deep carved top pencil groove with 3D specular lip.
 * - Crisp Classroom Props & Carvings: 3D bevelled 15cm wooden ruler with shadow, two-tone rubber eraser
 *   with shadow, taped formula scrap, carved Tic-Tac-Toe, 5-point Star, "SK" stamp, and blue ink blot.
 */
import { PenFightEngine, PenBody, SHRINK_TURNS, CANCEL_PULL_PX } from '../physics/PenFightEngine';
import { renderPenToCanvas } from './RealPenRenderer';

export class ArenaRenderer {
  private static cachedDeskCanvas: HTMLCanvasElement | null = null;
  private static cachedDeskKey = '';

  public static clearDeskCache(): void {
    this.cachedDeskCanvas = null;
    this.cachedDeskKey = '';
  }

  public static renderArena(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    engine: PenFightEngine,
    deskStyle: string,
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
      // Apply wobble offsets for edge-overhang tremor
      const drawX = pen.renderX + (pen.wobbleOffsetX || 0);
      const drawY = pen.renderY + (pen.wobbleOffsetY || 0);
      const drawAngle = pen.renderAngle + (pen.wobbleAngle || 0);
      renderPenToCanvas(
        ctx,
        pen.spec,
        drawX,
        drawY,
        drawAngle,
        penLook,
        pen.fallScale * (pen.wobbleScale || 1.0),
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

  private static getOrBuildDeskTexture(w: number, h: number, deskStyle: string): HTMLCanvasElement {
    const texScale = 2;
    const style = (deskStyle === 'oak' || deskStyle === 'mahogany' || deskStyle === 'slate' || deskStyle === 'coffee')
      ? deskStyle
      : (deskStyle === 'clean' ? 'oak' : 'coffee');
    const key = `${Math.round(w)}x${Math.round(h)}_${style}_${texScale}`;
    if (this.cachedDeskCanvas && this.cachedDeskKey === key) {
      return this.cachedDeskCanvas;
    }

    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(w * texScale));
    off.height = Math.max(1, Math.round(h * texScale));
    const c = off.getContext('2d')!;
    c.scale(texScale, texScale);

    // 1. Multi-plank wood base with curated palette per style
    const plankCount = 5;
    const plankW = w / plankCount;

    let tones: string[];
    let midTone: string;
    let grainColor: string;
    let knotColor: string;
    let seamDark: string;
    let seamLight: string;

    if (style === 'oak') {
      tones = ['#d9b38c', '#cfa57b', '#dbb68f', '#cda277', '#d6af86'];
      midTone = '#dfb992';
      grainColor = 'rgba(105, 65, 30, 0.14)';
      knotColor = 'rgba(75, 42, 14, 0.28)';
      seamDark = 'rgba(55, 30, 10, 0.24)';
      seamLight = 'rgba(255, 245, 225, 0.18)';
    } else if (style === 'mahogany') {
      tones = ['#4a1c18', '#3e1512', '#54201c', '#3a1310', '#4c1d19'];
      midTone = '#5c2420';
      grainColor = 'rgba(28, 8, 6, 0.35)';
      knotColor = 'rgba(24, 6, 4, 0.46)';
      seamDark = 'rgba(24, 6, 5, 0.52)';
      seamLight = 'rgba(255, 185, 175, 0.14)';
    } else if (style === 'slate') {
      tones = ['#20242c', '#1a1d24', '#262a34', '#171920', '#222630'];
      midTone = '#2c313c';
      grainColor = 'rgba(8, 10, 14, 0.45)';
      knotColor = 'rgba(6, 8, 12, 0.58)';
      seamDark = 'rgba(8, 10, 13, 0.65)';
      seamLight = 'rgba(145, 170, 205, 0.14)';
    } else {
      // Default: 'coffee' (Dark Espresso Hardwood)
      tones = ['#2e180e', '#241209', '#341d11', '#221008', '#2d170d'];
      midTone = '#3a2014';
      grainColor = 'rgba(14, 7, 3, 0.36)';
      knotColor = 'rgba(12, 6, 3, 0.50)';
      seamDark = 'rgba(12, 6, 3, 0.58)';
      seamLight = 'rgba(215, 168, 110, 0.16)';
    }

    for (let p = 0; p < plankCount; p++) {
      const px = p * plankW;
      const pGrad = c.createLinearGradient(px, 0, px + plankW, h);
      const baseCol = tones[p % tones.length];
      pGrad.addColorStop(0, baseCol);
      pGrad.addColorStop(0.5, midTone);
      pGrad.addColorStop(1, baseCol);
      c.fillStyle = pGrad;
      c.fillRect(px, 0, plankW + 1, h);
    }

    // 2. Organic Wood Grain Fibers & Wood Knots
    c.strokeStyle = grainColor;
    c.lineWidth = 1.05;
    for (let gx = 6; gx < w; gx += 8.5) {
      c.beginPath();
      c.moveTo(gx, 0);
      c.bezierCurveTo(
        gx + Math.sin(gx * 0.08) * 5.5,
        h * 0.33,
        gx - Math.cos(gx * 0.07) * 5.5,
        h * 0.66,
        gx + Math.sin(gx * 0.05) * 2.5,
        h
      );
      c.stroke();
    }

    // Subtle wood knots
    const knots = [
      { x: w * 0.28, y: h * 0.32, rx: 8, ry: 18 },
      { x: w * 0.72, y: h * 0.64, rx: 7, ry: 15 },
    ];
    for (const k of knots) {
      c.save();
      c.translate(k.x, k.y);
      c.strokeStyle = knotColor;
      c.lineWidth = 1.1;
      for (let r = 0.4; r <= 1.0; r += 0.3) {
        c.beginPath();
        c.ellipse(0, 0, k.rx * r, k.ry * r, 0.08, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    }

    // 3. Bevelled Plank Seams
    for (let p = 1; p < plankCount; p++) {
      const px = Math.round(p * plankW);
      c.fillStyle = 'rgba(55, 30, 10, 0.22)';
      c.fillRect(px - 0.8, 0, 1.6, h);
      c.fillStyle = 'rgba(255, 245, 225, 0.16)';
      c.fillRect(px + 0.8, 0, 1.5, h);
    }

    // 4. Deep Carved Top Horizontal Pencil Groove
    const grX = w * 0.20;
    const grW = w * 0.60;
    const grGrad = c.createLinearGradient(0, 13, 0, 22);
    grGrad.addColorStop(0, 'rgba(38, 20, 6, 0.48)');
    grGrad.addColorStop(0.6, 'rgba(65, 36, 14, 0.28)');
    grGrad.addColorStop(1, 'rgba(255, 245, 225, 0.35)');
    c.fillStyle = grGrad;
    c.beginPath();
    c.roundRect(grX, 14, grW, 7.5, 3.8);
    c.fill();

    // 5. Classroom Carvings & Props
    c.save();
    const carveAlpha = deskStyle === 'old' ? 0.40 : 0.20;
    c.strokeStyle = `rgba(50, 26, 8, ${carveAlpha})`;
    c.fillStyle = `rgba(50, 26, 8, ${carveAlpha})`;
    c.lineWidth = 1.45;

    // Top-Right: Carved Tic-Tac-Toe Grid
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

    // Bottom-Right: Carved 5-Point Star Doodle
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

    // Bottom-Left: "SK" Square Logo Stamp
    const skX = 20;
    const skY = h - 46;
    c.beginPath();
    c.roundRect(skX, skY, 24, 24, 4);
    c.stroke();
    c.font = '800 10px Fredoka, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('SK', skX + 12, skY + 12.5);

    // Lower-Middle: Fountain Pen Blue Ink Stain
    c.fillStyle = deskStyle === 'old' ? 'rgba(29, 78, 216, 0.22)' : 'rgba(29, 78, 216, 0.11)';
    c.beginPath();
    c.arc(w * 0.46, h * 0.77, 10.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(w * 0.46 + 11, h * 0.77 + 5, 4.8, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(w * 0.46 - 9, h * 0.77 - 6, 3.5, 0, Math.PI * 2);
    c.fill();

    // Old School Carved Map Props (3D Ruler, Two-Tone Eraser, Taped Formula Scrap)
    if (deskStyle === 'old') {
      // Left: 3D Brass-Edged 15cm Ruler with drop shadow
      c.save();
      c.translate(21, h * 0.46);
      c.rotate(-Math.PI / 2 + 0.03);
      c.fillStyle = 'rgba(20, 12, 4, 0.22)';
      c.beginPath();
      c.roundRect(-64, -8, 132, 20, 3);
      c.fill();

      c.fillStyle = 'rgba(234, 179, 8, 0.48)';
      c.strokeStyle = 'rgba(78, 42, 12, 0.55)';
      c.lineWidth = 1.3;
      c.beginPath();
      c.roundRect(-66, -10, 132, 20, 3);
      c.fill();
      c.stroke();
      for (let rx = -60; rx <= 60; rx += 5) {
        c.beginPath();
        c.moveTo(rx, -10);
        c.lineTo(rx, rx % 15 === 0 ? -2 : -5.5);
        c.stroke();
      }
      c.restore();

      // Right: Two-Tone Pink/Blue Rubber Eraser with shadow
      c.save();
      c.translate(w - 25, h * 0.52);
      c.rotate(0.28);
      c.fillStyle = 'rgba(20, 12, 4, 0.22)';
      c.beginPath();
      c.roundRect(-10, -5, 24, 14, 2);
      c.fill();

      c.fillStyle = 'rgba(244, 114, 182, 0.56)';
      c.beginPath();
      c.roundRect(-12, -7, 15, 14, 2);
      c.fill();
      c.fillStyle = 'rgba(59, 130, 246, 0.56)';
      c.beginPath();
      c.roundRect(3, -7, 9, 14, 2);
      c.fill();
      c.strokeStyle = 'rgba(43, 51, 62, 0.48)';
      c.lineWidth = 1.2;
      c.strokeRect(-12, -7, 24, 14);
      c.restore();

      // Top-Left: Taped Notebook Formula Note
      c.save();
      c.translate(40, 42);
      c.rotate(-0.10);
      c.fillStyle = 'rgba(254, 249, 195, 0.42)';
      c.strokeStyle = 'rgba(113, 63, 18, 0.34)';
      c.lineWidth = 1.1;
      c.beginPath();
      c.roundRect(-24, -14, 48, 28, 3);
      c.fill();
      c.stroke();
      c.fillStyle = 'rgba(51, 65, 85, 0.55)';
      c.font = '800 8.5px Nunito, sans-serif';
      c.fillText('F = m·a', 0, 1);
      c.restore();
    }

    c.restore();

    // 6. Warm Overhead Classroom Spotlight & Inner Edge Vignette
    const light = c.createRadialGradient(w * 0.5, h * 0.42, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    light.addColorStop(0, 'rgba(255, 250, 235, 0.14)');
    light.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
    light.addColorStop(1, 'rgba(32, 16, 4, 0.24)');
    c.fillStyle = light;
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
    deskStyle: string
  ): void {
    const style = deskStyle === 'clean' ? 'oak' : (deskStyle === 'old' ? 'coffee' : (deskStyle || 'coffee'));

    // Moody executive ambient floor backdrop (dark, luxury & soothing - zero harsh glare)
    const floorGrad = ctx.createRadialGradient(
      canvasW * 0.5,
      canvasH * 0.45,
      Math.min(canvasW, canvasH) * 0.25,
      canvasW * 0.5,
      canvasH * 0.5,
      Math.max(canvasW, canvasH) * 0.85
    );
    floorGrad.addColorStop(0, '#1c1612');
    floorGrad.addColorStop(0.65, '#130f0c');
    floorGrad.addColorStop(1, '#0a0806');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 0, canvasW, canvasH);

    const d = engine.outerDesk;

    ctx.save();
    // 1. Deep Floor Drop Shadow under the Desk
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(d.x - 4, d.y + 6, d.w + 12, d.h + 16, 24);
    ctx.fill();

    // 2. 3D Outer Desk Bevel Frame
    const frameGrad = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.h);
    let rimStroke = 'rgba(224, 168, 92, 0.65)';
    let frameBorder = '#140804';

    if (style === 'oak') {
      frameGrad.addColorStop(0, '#6d4527');
      frameGrad.addColorStop(0.5, '#54331b');
      frameGrad.addColorStop(1, '#3e2411');
      frameBorder = '#251508';
      rimStroke = 'rgba(235, 195, 135, 0.65)';
    } else if (style === 'mahogany') {
      frameGrad.addColorStop(0, '#541e19');
      frameGrad.addColorStop(0.5, '#3e130f');
      frameGrad.addColorStop(1, '#290a07');
      frameBorder = '#1e0604';
      rimStroke = 'rgba(238, 162, 142, 0.62)';
    } else if (style === 'slate') {
      frameGrad.addColorStop(0, '#2e3541');
      frameGrad.addColorStop(0.5, '#20252e');
      frameGrad.addColorStop(1, '#14171d');
      frameBorder = '#0d0f13';
      rimStroke = 'rgba(130, 160, 195, 0.55)';
    } else {
      // Default: 'coffee' (Dark Espresso Hardwood)
      frameGrad.addColorStop(0, '#462412');
      frameGrad.addColorStop(0.5, '#32180b');
      frameGrad.addColorStop(1, '#1f0d06');
      frameBorder = '#140804';
      rimStroke = 'rgba(224, 168, 92, 0.65)';
    }

    ctx.fillStyle = frameGrad;
    ctx.strokeStyle = frameBorder;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.roundRect(d.x - 7, d.y - 6, d.w + 14, d.h + 15, 22);
    ctx.fill();
    ctx.stroke();

    // 3. Warm Inner Rim Highlight
    ctx.strokeStyle = rimStroke;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(d.x - 2, d.y - 1.5, d.w + 4, d.h + 5, 18);
    ctx.stroke();

    // 4. Clip & Draw Desk Wood Surface
    ctx.beginPath();
    ctx.roundRect(d.x, d.y, d.w, d.h, 16);
    ctx.clip();

    const woodTex = this.getOrBuildDeskTexture(d.w, d.h, deskStyle);
    ctx.drawImage(woodTex, d.x, d.y, d.w, d.h);

    // Inner recessed bevel shadow along the wood border
    ctx.strokeStyle = 'rgba(38, 18, 5, 0.28)';
    ctx.lineWidth = 4;
    ctx.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2);

    if (engine.shrinkSteps > 0) {
      const b = engine.activeBounds;
      ctx.fillStyle = 'rgba(28, 19, 14, 0.38)';
      ctx.fillRect(d.x, d.y, d.w, b.y - d.y);
      ctx.fillRect(d.x, b.y + b.h, d.w, d.y + d.h - (b.y + b.h));
      ctx.fillRect(d.x, b.y, b.x - d.x, b.h);
      ctx.fillRect(b.x + b.w, b.y, d.x + d.w - (b.x + b.w), b.h);

      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 2.6;
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

    const labelY = pen.renderY + 36;
    ctx.fillText(pen.label, pen.renderX, labelY);
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
