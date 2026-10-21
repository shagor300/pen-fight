import { PenFightEngine, PenBody, SHRINK_TURNS, MAX_PULL_PX, CANCEL_PULL_PX } from '../physics/PenFightEngine';

export class ArenaRenderer {
  /**
   * Renders the entire Desk Wars arena, pens, floating labels, starburst rings,
   * thermometer aiming UI, and "Your turn" center toast
   */
  public static renderArena(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    engine: PenFightEngine,
    deskStyle: 'clean' | 'old',
    penLook: 'real' | 'classic'
  ): void {
    ctx.clearRect(0, 0, canvasW, canvasH);

    // 1. Draw Full-Bleed Wooden School Desk
    this.drawSchoolDesk(ctx, canvasW, canvasH, engine, deskStyle);

    // 2. Draw Floating "You" / "Computer" Labels under stopped pens
    for (const pen of engine.pens) {
      this.drawFloatingPenLabel(ctx, pen, engine);
    }

    // 3. Draw Both Pens (8-layer Real 3D or Classic Vector)
    for (const pen of engine.pens) {
      this.drawPen(ctx, pen, penLook);
    }

    // 4. Draw 8-Spike Starburst Collision Rings on impact
    for (const ring of engine.impactRings) {
      this.drawStarburstImpactRing(ctx, ring.x, ring.y, ring.ageMs / ring.durationMs, ring.maxRadius);
    }

    // 5. Draw Thermometer Power Gauge + White Contact Dot + Forward Push Arrow + Curved Spin Arc
    if (engine.aim.active && (engine.phase === 'AIMING' || engine.phase === 'AI_PULLING')) {
      const activePen = engine.pens[engine.aim.penIndex];
      if (activePen) {
        this.drawThermometerAimGauge(ctx, activePen, engine);
      }
    }

    // 6. Draw Center "Your turn" / "Player 2's turn" Tactile Toast Card
    if (engine.turnToastTimerMs > 0 && engine.phase === 'AIMING') {
      this.drawCenterTurnToast(ctx, canvasW, canvasH, engine.turnToastText, engine.turnToastTimerMs / 850);
    }
  }

  private static drawSchoolDesk(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    engine: PenFightEngine,
    deskStyle: 'clean' | 'old'
  ): void {
    // Classroom background
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const d = engine.outerDesk;

    ctx.save();
    // Outer desk dark wood frame
    ctx.fillStyle = '#6d4c3d';
    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(d.x - 6, d.y - 6, d.w + 12, d.h + 12, 22);
    ctx.fill();
    ctx.stroke();

    // Main vertical oak wood grain gradient
    const woodGrad = ctx.createLinearGradient(d.x, d.y, d.x + d.w, d.y);
    if (deskStyle === 'clean') {
      woodGrad.addColorStop(0, '#d8b48e');
      woodGrad.addColorStop(0.25, '#cfa77e');
      woodGrad.addColorStop(0.5, '#d9b58f');
      woodGrad.addColorStop(0.75, '#cca379');
      woodGrad.addColorStop(1, '#d5af88');
    } else {
      woodGrad.addColorStop(0, '#b88f68');
      woodGrad.addColorStop(0.5, '#a87e56');
      woodGrad.addColorStop(1, '#9c724b');
    }

    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(d.x, d.y, d.w, d.h, 16);
    ctx.fill();
    ctx.clip();

    // Subtle vertical wood grain fibers (matches vertical grain in mobile video!)
    ctx.strokeStyle = deskStyle === 'clean' ? 'rgba(120, 82, 48, 0.13)' : 'rgba(72, 44, 22, 0.24)';
    ctx.lineWidth = 1.2;
    const grainStep = 14;
    for (let gx = d.x + 10; gx < d.x + d.w; gx += grainStep) {
      ctx.beginPath();
      ctx.moveTo(gx, d.y);
      ctx.bezierCurveTo(
        gx + Math.sin(gx * 0.05) * 4,
        d.y + d.h * 0.33,
        gx - Math.cos(gx * 0.05) * 4,
        d.y + d.h * 0.66,
        gx,
        d.y + d.h
      );
      ctx.stroke();
    }

    // If desk has shrunk (Turn > 15), darken the out-of-bounds margin outside activeBounds
    if (engine.shrinkSteps > 0) {
      const b = engine.activeBounds;
      ctx.fillStyle = 'rgba(28, 19, 14, 0.34)';
      // Top, bottom, left, right darkened margins
      ctx.fillRect(d.x, d.y, d.w, b.y - d.y);
      ctx.fillRect(d.x, b.y + b.h, d.w, d.y + d.h - (b.y + b.h));
      ctx.fillRect(d.x, b.y, b.x - d.x, b.h);
      ctx.fillRect(b.x + b.w, b.y, d.x + d.w - (b.x + b.w), b.h);

      // Inner dashed boundary line ("Desk smaller · stay inside the line")
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([9, 7]);
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 12);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Next-turn shrink warning red pulsing border on turns 15, 19, 23, 27
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

  /**
   * Renders the floating "You" (orange) and "Computer" (blue) labels directly below each pen
   */
  private static drawFloatingPenLabel(
    ctx: CanvasRenderingContext2D,
    pen: PenBody,
    engine: PenFightEngine
  ): void {
    if (pen.falling || pen.fallenOut) return;
    const speed = Math.hypot(pen.vx, pen.vy);
    if (speed > 40) return; // Hide label while pen is moving fast

    const isCurrentTurn = pen.playerIndex === engine.activePlayer;
    ctx.save();
    ctx.font = '800 13px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isCurrentTurn ? pen.labelColor : 'rgba(92, 75, 60, 0.72)';

    const labelY = pen.y + 38;
    const text = isCurrentTurn && pen.playerIndex === 1 ? `▸ ${pen.label}` : pen.label;
    ctx.fillText(text, pen.x, labelY);
    ctx.restore();
  }

  /**
   * Renders the 8-spike dark starburst ring at collision points (exact match to 00:16, 00:20, 00:53 in video)
   */
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
    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 2.2;

    // Central circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 8 radiating impact spikes
    const spikes = 8;
    for (let i = 0; i < spikes; i++) {
      const ang = (i * Math.PI * 2) / spikes + 0.2;
      const innerR = radius * 0.85;
      const outerR = radius * 1.48;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * innerR, Math.sin(ang) * innerR);
      ctx.lineTo(Math.cos(ang) * outerR, Math.sin(ang) * outerR);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Renders the exact Thermometer Power Bar + White Contact Dot + Forward Push Arrow + Curved Spin Arc (`↻`/`↺`)
   * seen in reference videos
   */
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

      // Dynamic color from green -> yellow -> orange -> red
      const gaugeColor =
        powerRatio < 0.35
          ? '#65a30d'
          : powerRatio < 0.65
          ? '#eab308'
          : powerRatio < 0.85
          ? '#f97316'
          : '#dc2626';

      // =====================================================================
      // A. FORWARD LAUNCH ARROW (extends in front of the white contact dot)
      // =====================================================================
      const arrowLen = 26 + powerRatio * 48;
      ctx.save();
      ctx.translate(contact.x, contact.y);
      ctx.rotate(launchAng);

      // Arrow shaft with dark outline
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

      // Arrowhead triangle
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

      // =====================================================================
      // B. CURVED SPIN INDICATOR ARROW (`↻` / `↺`) around the contact dot
      // =====================================================================
      const halfL = pen.lengthPx * 0.44;
      const rx = Math.cos(pen.angle) * (grabOffsetRatio * halfL);
      const ry = Math.sin(pen.angle) * (grabOffsetRatio * halfL);
      const fx = Math.cos(launchAng);
      const fy = Math.sin(launchAng);
      // Normalized cross product (r × F) determines spin direction and magnitude
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

        // Tiny arrowhead at the end of the curved spin arc
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

      // =====================================================================
      // C. SEGMENTED THERMOMETER POWER BAR (extends behind the contact dot)
      // =====================================================================
      const tubeMaxLen = 104;
      const tubeWidth = 13;
      const fillLen = Math.max(8, powerRatio * tubeMaxLen);

      ctx.save();
      ctx.translate(contact.x, contact.y);
      ctx.rotate(pullAng);

      // Outer white capsule frame with dark border
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = '#2b302a';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(12, -tubeWidth / 2, tubeMaxLen, tubeWidth, tubeWidth / 2);
      ctx.fill();
      ctx.stroke();

      // Inner colored power fill
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(14, -tubeWidth / 2 + 2, tubeMaxLen - 4, tubeWidth - 4, (tubeWidth - 4) / 2);
      ctx.clip();

      ctx.fillStyle = gaugeColor;
      ctx.fillRect(14, -tubeWidth / 2, fillLen, tubeWidth);

      // 3 segment divider ticks inside the thermometer (25%, 50%, 75%)
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

    // =====================================================================
    // D. WHITE CONTACT DOT ON THE PEN BARREL (always visible while grabbing)
    // =====================================================================
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2b302a';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(contact.x, contact.y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Renders the photorealistic 8-layer Real pen or Classic cartoon pen
   */
  private static drawPen(
    ctx: CanvasRenderingContext2D,
    pen: PenBody,
    mode: 'real' | 'classic'
  ): void {
    if (pen.fallenOut) return;

    const L = pen.lengthPx;
    const W = pen.widthPx;
    const halfL = L / 2;
    const halfW = W / 2;

    ctx.save();
    ctx.globalAlpha = pen.fallAlpha;

    // World-space soft drop shadow on the wooden desk
    if (mode === 'real' && !pen.falling) {
      ctx.save();
      ctx.translate(pen.x + 3, pen.y + 6);
      ctx.rotate(pen.angle);
      ctx.fillStyle = 'rgba(20, 14, 10, 0.32)';
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW, L, W, halfW);
      ctx.fill();
      ctx.restore();
    }

    ctx.translate(pen.x, pen.y);
    ctx.scale(pen.fallScale, pen.fallScale);
    ctx.rotate(pen.angle);

    // 1. Main Barrel
    ctx.fillStyle = pen.spec.transparent ? 'rgba(226, 232, 240, 0.65)' : pen.spec.colors.barrel;
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.82, -halfW, L * 0.82, W, 4);
    ctx.fill();

    // 2. Visible inner ink refill tube for translucent pens (Cheap Ballpoint & Gel Pen)
    if (pen.spec.transparent) {
      ctx.fillStyle = pen.spec.colors.ink;
      ctx.fillRect(-halfL * 0.62, -2.2, L * 0.68, 4.4);
    }

    // 3. Rubber Grip Zone near front
    ctx.fillStyle = pen.spec.colors.grip;
    ctx.fillRect(halfL * 0.22, -halfW, L * 0.24, W);

    // 4. Tapered Nose Cone & Ballpoint Nib (+X end)
    ctx.fillStyle = pen.spec.colors.tip;
    ctx.beginPath();
    ctx.moveTo(halfL * 0.64, -halfW);
    ctx.lineTo(halfL, -2.0);
    ctx.lineTo(halfL, 2.0);
    ctx.lineTo(halfL * 0.64, halfW);
    ctx.closePath();
    ctx.fill();

    // 5. Back Cap (-X end) & Pocket Clip
    ctx.fillStyle = pen.spec.colors.cap;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW - 1.2, L * 0.3, W + 2.4, 4);
    ctx.fill();

    ctx.fillStyle = pen.spec.colors.clip;
    ctx.beginPath();
    ctx.roundRect(-halfL + 5, -halfW - 3.6, L * 0.22, 2.6, 1.5);
    ctx.fill();

    // 6. Cylindrical 3D Specular Highlight (Real Mode) vs Bold Ink Outline (Classic Mode)
    if (mode === 'real') {
      const cyl = ctx.createLinearGradient(0, -halfW, 0, halfW);
      cyl.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
      cyl.addColorStop(0.28, 'rgba(255, 255, 255, 0.62)');
      cyl.addColorStop(0.55, 'rgba(255, 255, 255, 0.0)');
      cyl.addColorStop(0.85, 'rgba(0, 0, 0, 0.24)');
      cyl.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
      ctx.fillStyle = cyl;
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW, L * 0.86, W, 4);
      ctx.fill();

      ctx.strokeStyle = 'rgba(43, 48, 42, 0.55)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW, L * 0.86, W, 4);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#2b302a';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.roundRect(-halfL, -halfW, L * 0.86, W, 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Renders the tactile center toast card ("Your turn" / "Player 2's turn") seen in the reference videos
   */
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

    const w = 156;
    const h = 44;

    // Hard tactile neo-brutalist bottom shadow
    ctx.fillStyle = '#2b302a';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2 + 4, w, h, 12);
    ctx.fill();

    // Card surface
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
