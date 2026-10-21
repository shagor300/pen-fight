/**
 * src/ui/PenSelectorModal.ts
 * Professional Pen Locker & Match Setup Modal.
 *
 * Key Fixes & Upgrades:
 * 1. PixiJS v8 GPU Texture Fix: Uses a fresh offscreen canvas + `Texture.from(offCanvas, true)`
 *    and `texture.source.update()` so clicking Next (❯), Prev (❮), or Classic/Real ALWAYS
 *    updates the rendered 3D pen immediately.
 * 2. Professional Segmented Skill Bars & Signature Skill Pill:
 *    Displays each pen's unique passive skill (e.g., "🌀 Cyclone Nib", "🔨 Titanium Impact")
 *    and 5 color-coded segmented skill bars (Weight, Speed, Spin, Grip, Reach) without covering up the pen.
 * 3. Sequential 2-Player Flow ("Pick your pen, Player 1" -> "Next: P2 picks" -> "Pick your pen, Player 2" -> "Fight").
 */
import { Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { PENS_ROSTER } from '../config/pensConfig';
import { ProgressionManager } from '../core/ProgressionManager';
import { COLORS } from '../config/gameConstants';
import { renderPenToCanvas } from '../rendering/RealPenRenderer';
import { AIDifficulty } from '../core/GameManager';
import { soundManager } from '../audio/SoundAndHaptics';
import EventEmitter from 'eventemitter3';

export class PenSelectorModal extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;
  private progression: ProgressionManager;

  public selectedIndex = 0;
  public p2SelectedIndex = 1;
  private pickingForPlayer: 1 | 2 = 1;
  private showSkillDetail = false;

  private mode: 'VS_AI' | 'TWO_PLAYER' = 'VS_AI';
  private selectedDifficulty: AIDifficulty = 'normal';
  private penLook: 'real' | 'classic' = 'real';
  private equalLevels = true;
  private mirrorMatch = false;

  private backdrop: Graphics;
  private topBarContainer: Container;
  private mainCard: Container;
  private mainCardSurface: Graphics;
  private penSprite: Sprite;
  private skillBadgeContainer: Container;
  private skillBarsContainer: Container;

  private titleText: Text;
  private taglineText: Text;
  private levelBadgeText: Text;
  private dotsContainer: Container;
  private lookToggleContainer: Container;

  private controlsContainer: Container;
  private fightBtn: Container;

  constructor(
    screenWidth: number,
    screenHeight: number,
    progression: ProgressionManager,
  ) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.progression = progression;

    this.container = new Container();
    this.container.visible = false;

    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.container.addChild(this.backdrop);

    this.topBarContainer = new Container();
    this.container.addChild(this.topBarContainer);

    this.mainCard = new Container();
    this.mainCardSurface = new Graphics();
    this.mainCard.addChild(this.mainCardSurface);
    this.container.addChild(this.mainCard);

    this.penSprite = new Sprite(Texture.EMPTY);
    this.penSprite.anchor.set(0.5, 0.5);
    this.penSprite.scale.set(0.5);
    this.mainCard.addChild(this.penSprite);

    this.titleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 23,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    this.titleText.anchor.set(0.5, 0);
    this.mainCard.addChild(this.titleText);

    this.taglineText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 12,
        fill: COLORS.textMuted,
        fontWeight: '700',
      })
    });
    this.taglineText.anchor.set(0.5, 0);
    this.mainCard.addChild(this.taglineText);

    this.levelBadgeText = new Text({
      text: 'Lv1',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 13,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    this.levelBadgeText.anchor.set(0.5, 0.5);

    this.dotsContainer = new Container();
    this.mainCard.addChild(this.dotsContainer);

    this.lookToggleContainer = new Container();
    this.mainCard.addChild(this.lookToggleContainer);

    this.skillBadgeContainer = new Container();
    this.mainCard.addChild(this.skillBadgeContainer);

    this.skillBarsContainer = new Container();
    this.mainCard.addChild(this.skillBarsContainer);

    this.controlsContainer = new Container();
    this.container.addChild(this.controlsContainer);

    this.fightBtn = this.createFightButton();
    this.container.addChild(this.fightBtn);

    this.layout();
  }

  public show(p1Index = 0, mode: 'VS_AI' | 'TWO_PLAYER' = 'VS_AI', diff: AIDifficulty = 'normal'): void {
    this.selectedIndex = p1Index;
    this.pickingForPlayer = 1;
    this.mode = mode;
    this.selectedDifficulty = diff;
    this.container.visible = true;
    this.layout();
    this.updateCard();
  }

  public hide(): void {
    this.container.visible = false;
  }

  private getCurrentActivePenIndex(): number {
    return this.mode === 'TWO_PLAYER' && this.pickingForPlayer === 2
      ? this.p2SelectedIndex
      : this.selectedIndex;
  }

  private setCurrentActivePenIndex(idx: number): void {
    if (this.mode === 'TWO_PLAYER' && this.pickingForPlayer === 2) {
      this.p2SelectedIndex = idx;
    } else {
      this.selectedIndex = idx;
    }
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.backdrop.clear()
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: 0x0F172A, alpha: 0.72 });

    this.topBarContainer.removeChildren();
    const topY = Math.max(16, screenHeight * 0.024);

    const backBtn = this.createSquareButton('⇦', COLORS.butterYellow, () => {
      soundManager.play('ui_click');
      if (this.mode === 'TWO_PLAYER' && this.pickingForPlayer === 2) {
        this.pickingForPlayer = 1;
        this.layout();
        this.updateCard();
        return;
      }
      this.hide();
      this.emit('back');
    });
    backBtn.x = 20;
    backBtn.y = topY;
    this.topBarContainer.addChild(backBtn);

    const titleStyle = new TextStyle({
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: 22,
      fill: COLORS.cardCream,
      stroke: { color: COLORS.navyBorder, width: 4 },
      fontWeight: 'bold',
    });
    const headerStr = this.mode === 'TWO_PLAYER'
      ? `Pick your pen · P${this.pickingForPlayer}`
      : 'Pick your pen';
    const headerTitle = new Text({ text: headerStr, style: titleStyle });
    headerTitle.anchor.set(0, 0.5);
    headerTitle.x = 76;
    headerTitle.y = topY + 21;
    this.topBarContainer.addChild(headerTitle);

    const modePill = this.createModeBadge(this.mode === 'VS_AI' ? '🤖 vs Computer' : '👥 2 players');
    modePill.x = screenWidth - 20;
    modePill.y = topY + 21;
    this.topBarContainer.addChild(modePill);

    const cardW = Math.min(screenWidth - 28, 392);
    const cardH = 418;
    this.mainCard.x = screenWidth / 2;
    this.mainCard.y = topY + 54 + cardH / 2;

    this.mainCardSurface.removeChildren();
    this.mainCardSurface.clear();
    this.mainCardSurface
      .roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 24)
      .fill({ color: COLORS.navyShadow });
    this.mainCardSurface
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 24)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3.5 });

    // Top-left Level Pill
    const badgeW = 54;
    const badgeH = 26;
    this.mainCardSurface
      .roundRect(-cardW / 2 + 16, -cardH / 2 + 12, badgeW, badgeH, 10)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });
    this.levelBadgeText.x = -cardW / 2 + 16 + badgeW / 2;
    this.levelBadgeText.y = -cardH / 2 + 12 + badgeH / 2;
    this.mainCardSurface.addChild(this.levelBadgeText);

    // Top-right Classic / Real Switch
    this.buildLookToggle(cardW / 2 - 78, -cardH / 2 + 11);

    // Wooden Showcase Frame for the 3D Pen
    const frameW = cardW - 32;
    const frameH = 142;
    const frameY = -cardH / 2 + 46;

    this.mainCardSurface
      .roundRect(-frameW / 2, frameY, frameW, frameH, 16)
      .fill({ color: 0xA4784B })
      .stroke({ color: COLORS.navyBorder, width: 2.8 });

    // Subtle wood plank lines inside showcase
    for (let x = -frameW / 2 + 44; x < frameW / 2; x += 58) {
      this.mainCardSurface
        .rect(x, frameY + 2, 2, frameH - 4)
        .fill({ color: 0x6E4522, alpha: 0.22 });
    }

    const prevArrow = this.createArrowButton('❮', () => this.prevPen());
    prevArrow.x = -frameW / 2 + 24;
    prevArrow.y = frameY + frameH / 2;
    this.mainCardSurface.addChild(prevArrow);

    const nextArrow = this.createArrowButton('❯', () => this.nextPen());
    nextArrow.x = frameW / 2 - 24;
    nextArrow.y = frameY + frameH / 2;
    this.mainCardSurface.addChild(nextArrow);

    this.penSprite.x = 0;
    this.penSprite.y = frameY + frameH / 2;

    this.dotsContainer.y = -cardH / 2 + 25;
    this.titleText.y = frameY + frameH + 8;
    this.taglineText.y = frameY + frameH + 35;

    this.skillBadgeContainer.y = frameY + frameH + 56;
    this.skillBarsContainer.y = frameY + frameH + 92;

    this.controlsContainer.x = screenWidth / 2;
    this.controlsContainer.y = this.mainCard.y + cardH / 2 + 10;
    this.buildControls(cardW);

    this.container.removeChild(this.fightBtn);
    this.fightBtn = this.createFightButton();
    this.container.addChild(this.fightBtn);
    this.fightBtn.x = screenWidth / 2;
    this.fightBtn.y = Math.min(screenHeight - 40, this.controlsContainer.y + 128);
  }

  private buildLookToggle(x: number, y: number): void {
    this.lookToggleContainer.removeChildren();
    this.lookToggleContainer.x = x;
    this.lookToggleContainer.y = y;

    const pillW = 124;
    const pillH = 28;
    const pillR = 9999;

    const bg = new Graphics()
      .roundRect(-pillW / 2, 0, pillW, pillH, pillR)
      .fill({ color: 0xEAE4D2 })
      .stroke({ color: COLORS.navyBorder, width: 2 });
    this.lookToggleContainer.addChild(bg);

    const isReal = this.penLook === 'real';
    const activeW = pillW / 2 - 3;
    const activeX = isReal ? 1 : -pillW / 2 + 2;
    const activeG = new Graphics()
      .roundRect(activeX, 2, activeW, pillH - 4, pillR)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: COLORS.navyBorder, width: 1.8 });
    this.lookToggleContainer.addChild(activeG);

    const classicTxt = new Text({
      text: 'Classic',
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 11,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    classicTxt.anchor.set(0.5, 0.5);
    classicTxt.x = -pillW / 4;
    classicTxt.y = pillH / 2;
    this.lookToggleContainer.addChild(classicTxt);

    const realTxt = new Text({
      text: 'Real 3D',
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 11,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    realTxt.anchor.set(0.5, 0.5);
    realTxt.x = pillW / 4;
    realTxt.y = pillH / 2;
    this.lookToggleContainer.addChild(realTxt);

    this.lookToggleContainer.eventMode = 'static';
    this.lookToggleContainer.cursor = 'pointer';
    this.lookToggleContainer.removeAllListeners();
    this.lookToggleContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      this.penLook = this.penLook === 'real' ? 'classic' : 'real';
      this.layout();
      this.updateCard();
    });
  }

  private buildControls(w: number): void {
    this.controlsContainer.removeChildren();

    if (this.mode === 'VS_AI') {
      const compLabel = new Text({
        text: 'AI DIFFICULTY',
        style: new TextStyle({
          fontFamily: 'Nunito, sans-serif',
          fontSize: 10.5,
          fill: 0xE2D9C5,
          fontWeight: '800',
          letterSpacing: 1.4,
        })
      });
      compLabel.anchor.set(0.5, 0);
      compLabel.y = 0;
      this.controlsContainer.addChild(compLabel);

      const diffRow = new Container();
      diffRow.y = 16;

      const diffs: { id: AIDifficulty; label: string }[] = [
        { id: 'easy', label: 'Easy' },
        { id: 'normal', label: 'Normal' },
        { id: 'hard', label: 'Hard' },
      ];

      const btnW = (w - 24) / 4;
      const btnH = 34;
      const startX = -w / 2;

      diffs.forEach((d, i) => {
        const btn = new Container();
        btn.x = startX + i * (btnW + 8) + btnW / 2;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';

        const isSel = this.selectedDifficulty === d.id;
        const bg = new Graphics()
          .roundRect(-btnW / 2, 0, btnW, btnH, 11)
          .fill({ color: isSel ? COLORS.skyBlue : COLORS.cardCream })
          .stroke({ color: COLORS.navyBorder, width: isSel ? 2.6 : 2 });
        btn.addChild(bg);

        const txt = new Text({
          text: d.label,
          style: new TextStyle({
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 12.5,
            fill: COLORS.textDark,
            fontWeight: 'bold',
          })
        });
        txt.anchor.set(0.5, 0.5);
        txt.y = btnH / 2;
        btn.addChild(txt);

        btn.on('pointerdown', () => {
          soundManager.play('ui_click');
          this.selectedDifficulty = d.id;
          this.buildControls(w);
        });

        diffRow.addChild(btn);
      });

      const masterBtn = new Container();
      masterBtn.x = startX + 3 * (btnW + 8) + btnW / 2;
      const masterBg = new Graphics()
        .roundRect(-btnW / 2, 0, btnW, btnH, 11)
        .fill({ color: 0xEAE4D2, alpha: 0.65 })
        .stroke({ color: COLORS.navyBorder, width: 2 });
      masterBtn.addChild(masterBg);

      const masterTxt = new Text({
        text: 'Master 🔒',
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 11.5,
          fill: COLORS.textMuted,
          fontWeight: 'bold',
        })
      });
      masterTxt.anchor.set(0.5, 0.5);
      masterTxt.y = btnH / 2;
      masterBtn.addChild(masterTxt);
      diffRow.addChild(masterBtn);

      this.controlsContainer.addChild(diffRow);
    } else {
      const namePill = new Container();
      namePill.x = -w / 2;
      namePill.y = 12;
      const pillW = w;
      const pillH = 34;
      namePill.addChild(
        new Graphics()
          .roundRect(0, 0, pillW, pillH, 11)
          .fill({ color: COLORS.cardCream })
          .stroke({ color: COLORS.navyBorder, width: 2 })
      );
      const nameTxt = new Text({
        text: `✎ Selecting Pen for Player ${this.pickingForPlayer}  ·  Tap arrows above to switch`,
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 12, fill: COLORS.textDark, fontWeight: '800' })
      });
      nameTxt.anchor.set(0.5, 0.5);
      nameTxt.x = pillW / 2;
      nameTxt.y = pillH / 2;
      namePill.addChild(nameTxt);
      this.controlsContainer.addChild(namePill);
    }

    const optsRow = new Container();
    optsRow.y = 56;
    const optW = (w - 12) / 2;

    const eqBtn = this.createTogglePill(optW, 'Equal levels', this.equalLevels, () => {
      soundManager.play('ui_click');
      this.equalLevels = !this.equalLevels;
      this.buildControls(w);
    });
    eqBtn.x = -w / 2 + optW / 2;
    optsRow.addChild(eqBtn);

    const mirrorBtn = this.createTogglePill(optW, 'Mirror match', this.mirrorMatch, () => {
      soundManager.play('ui_click');
      this.mirrorMatch = !this.mirrorMatch;
      this.buildControls(w);
      this.layout();
    });
    mirrorBtn.x = w / 2 - optW / 2;
    optsRow.addChild(mirrorBtn);

    this.controlsContainer.addChild(optsRow);
  }

  private createTogglePill(w: number, label: string, active: boolean, onToggle: () => void): Container {
    const pill = new Container();
    pill.eventMode = 'static';
    pill.cursor = 'pointer';

    const h = 34;
    const bg = new Graphics()
      .roundRect(-w / 2, 0, w, h, 11)
      .fill({ color: active ? 0xDCECD0 : COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2 });
    pill.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 12,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    txt.anchor.set(0, 0.5);
    txt.x = -w / 2 + 12;
    txt.y = h / 2;
    pill.addChild(txt);

    const swW = 32;
    const swH = 18;
    const swX = w / 2 - 12 - swW;
    const swY = (h - swH) / 2;

    const swBg = new Graphics()
      .roundRect(swX, swY, swW, swH, 9999)
      .fill({ color: active ? COLORS.mintGreen : 0xD1D5DB })
      .stroke({ color: COLORS.navyBorder, width: 1.5 });
    pill.addChild(swBg);

    const knobX = active ? swX + swW - 9 : swX + 9;
    const knob = new Graphics()
      .circle(knobX, swY + swH / 2, 7)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 1.5 });
    pill.addChild(knob);

    pill.on('pointerdown', onToggle);
    return pill;
  }

  private createFightButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const w = Math.min(this.screenWidth - 28, 392);
    const h = 58;
    const r = 9999;

    const shadow = new Graphics()
      .roundRect(-w / 2, 5, w, h, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-w / 2, 0, w, h, r)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: COLORS.navyBorder, width: 3.2 });
    btn.addChild(surface);

    const content = new Container();
    const playIcon = new Text({
      text: '▷',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 28,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    playIcon.anchor.set(1, 0.5);
    playIcon.y = h / 2 - 1;
    content.addChild(playIcon);

    const isStep1TwoPlayer = this.mode === 'TWO_PLAYER' && this.pickingForPlayer === 1 && !this.mirrorMatch;
    const label = new Text({
      text: isStep1TwoPlayer ? 'Next: P2 picks' : 'Fight',
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: isStep1TwoPlayer ? 22 : 28,
        fill: COLORS.textDark,
        fontWeight: 'bold',
        letterSpacing: 0.5,
      })
    });
    label.anchor.set(0.5, 0.5);
    label.x = 12;
    label.y = h / 2 - 1;
    playIcon.x = label.x - label.width / 2 - 8;
    content.addChild(label);

    surface.addChild(content);

    btn.on('pointerdown', () => { surface.y = 3; });
    btn.on('pointerup', () => {
      surface.y = 0;
      soundManager.play('ui_click');
      if (this.mode === 'TWO_PLAYER' && this.pickingForPlayer === 1 && !this.mirrorMatch) {
        this.pickingForPlayer = 2;
        this.layout();
        this.updateCard();
        return;
      }
      this.hide();
      this.emit('start_fight', {
        penIndex: this.selectedIndex,
        p2PenIndex: this.p2SelectedIndex,
        mode: this.mode,
        difficulty: this.selectedDifficulty,
        look: this.penLook,
        mirror: this.mirrorMatch,
        equalLevels: this.equalLevels
      });
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });

    return btn;
  }

  private createSquareButton(icon: string, color: number, onClick: () => void): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const s = 42;
    const r = 13;

    const shadow = new Graphics().roundRect(0, 4, s, s, r).fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const body = new Graphics()
      .roundRect(0, 0, s, s, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.8 });
    btn.addChild(body);

    const txt = new Text({
      text: icon,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 22,
        fill: color,
        stroke: { color: COLORS.navyBorder, width: 2.2 },
        fontWeight: 'bold',
      })
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = s / 2;
    txt.y = s / 2 - 1;
    body.addChild(txt);

    btn.on('pointerdown', () => { body.y = 3; });
    btn.on('pointerup', () => {
      body.y = 0;
      onClick();
    });
    btn.on('pointerupoutside', () => { body.y = 0; });

    return btn;
  }

  private createModeBadge(text: string): Container {
    const badge = new Container();
    const w = 122;
    const h = 32;

    const bg = new Graphics()
      .roundRect(-w, -h / 2, w, h, 9999)
      .fill({ color: COLORS.skyBlue })
      .stroke({ color: COLORS.navyBorder, width: 2 });
    badge.addChild(bg);

    const txt = new Text({
      text,
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 11.5,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = -w / 2;
    badge.addChild(txt);

    return badge;
  }

  private createArrowButton(label: string, onClick: () => void): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const s = 38;
    const r = 12;

    const shadow = new Graphics().roundRect(-s / 2, -s / 2 + 3, s, s, r).fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-s / 2, -s / 2, s, s, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.5 });
    btn.addChild(surface);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 16,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    txt.anchor.set(0.5, 0.5);
    surface.addChild(txt);

    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      surface.y = 2;
    });
    btn.on('pointerup', (e) => {
      e.stopPropagation();
      surface.y = 0;
      soundManager.play('ui_click');
      onClick();
    });
    btn.on('pointerupoutside', () => { surface.y = 0; });

    return btn;
  }

  private prevPen(): void {
    const cur = this.getCurrentActivePenIndex();
    this.setCurrentActivePenIndex((cur - 1 + PENS_ROSTER.length) % PENS_ROSTER.length);
    this.updateCard();
  }

  private nextPen(): void {
    const cur = this.getCurrentActivePenIndex();
    this.setCurrentActivePenIndex((cur + 1) % PENS_ROSTER.length);
    this.updateCard();
  }

  public updateCard(): void {
    const activeIdx = this.getCurrentActivePenIndex();
    const pen = PENS_ROSTER[activeIdx];
    if (!pen) return;

    const prog = this.progression.getProgress(pen.id);
    this.levelBadgeText.text = `Lv${prog.level}`;

    this.titleText.text = pen.name;
    this.taglineText.text = pen.tagline || pen.description || '';

    // CRITICAL PIXI.JS v8 FIX: Create a fresh 2x Retina canvas and generate a new Texture
    // so WebGL always uploads the new pen graphic immediately when clicking Next/Prev!
    const freshCanvas = document.createElement('canvas');
    freshCanvas.width = 640;
    freshCanvas.height = 260;
    const fCtx = freshCanvas.getContext('2d')!;
    fCtx.save();
    fCtx.scale(2, 2);
    renderPenToCanvas(
      fCtx,
      pen,
      160,
      65,
      -Math.PI / 5.5,
      this.penLook,
      1.18,
      1.0,
      prog.level
    );
    fCtx.restore();

    const oldTex = this.penSprite.texture;
    this.penSprite.texture = Texture.from(freshCanvas);
    this.penSprite.texture.source?.update();
    if (oldTex && oldTex !== Texture.EMPTY) {
      oldTex.destroy(true);
    }

    // 1. Signature Passive Skill Badge Pill
    this.skillBadgeContainer.removeChildren();
    const cardW = Math.min(this.screenWidth - 28, 392);
    const pillW = cardW - 36;
    const pillH = 28;
    const skillBg = new Graphics()
      .roundRect(-pillW / 2, 0, pillW, pillH, 10)
      .fill({ color: 0xF2E9D4 })
      .stroke({ color: 0xC8B99E, width: 1.5 });
    this.skillBadgeContainer.addChild(skillBg);

    const skillText = new Text({
      text: `${pen.skillName || '⚡ Signature Skill'} — ${pen.skillDesc || ''}`,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10.5,
        fill: 0x2B333E,
        fontWeight: '800',
      })
    });
    skillText.anchor.set(0.5, 0.5);
    skillText.x = 0;
    skillText.y = pillH / 2;
    this.skillBadgeContainer.addChild(skillText);

    // 2. Professional Segmented 5-Stat Skill Bars (2-column compact layout)
    this.skillBarsContainer.removeChildren();
    const statsList: { label: string; val: number; color: number }[] = [
      { label: 'WEIGHT', val: pen.stats.weight, color: 0xF59E0B },
      { label: 'SPEED', val: pen.stats.speed, color: 0x10B981 },
      { label: 'SPIN', val: pen.stats.spin, color: 0x3B82F6 },
      { label: 'GRIP', val: pen.stats.grip, color: 0x8B5CF6 },
      { label: 'REACH', val: pen.stats.reach, color: 0xEC4899 },
    ];

    const colW = (cardW - 48) / 2;
    statsList.forEach((st, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const sx = col === 0 ? -colW - 6 : 6;
      const sy = row * 32;

      const item = new Container();
      item.x = sx;
      item.y = sy;

      const lbl = new Text({
        text: `${st.label}`,
        style: new TextStyle({
          fontFamily: 'Nunito, sans-serif',
          fontSize: 10,
          fill: 0x52525B,
          fontWeight: '800',
          letterSpacing: 0.8
        })
      });
      lbl.x = 0;
      lbl.y = 0;
      item.addChild(lbl);

      const num = new Text({
        text: `${st.val}/5`,
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 10.5,
          fill: 0x2B333E,
          fontWeight: 'bold'
        })
      });
      num.anchor.set(1, 0);
      num.x = colW;
      num.y = -1;
      item.addChild(num);

      const segGap = 4;
      const segW = (colW - segGap * 4) / 5;
      const segH = 8;
      const barG = new Graphics();
      for (let s = 0; s < 5; s++) {
        const bx = s * (segW + segGap);
        const filled = s < st.val;
        barG
          .roundRect(bx, 15, segW, segH, 3)
          .fill({ color: filled ? st.color : 0xE2DAC9 })
          .stroke({ color: 0x2B333E, width: filled ? 1.4 : 1.0 });
      }
      item.addChild(barG);

      this.skillBarsContainer.addChild(item);
    });

    // 3. Pagination Dots
    this.dotsContainer.removeChildren();
    const dotGap = 11;
    const totalDotsW = (PENS_ROSTER.length - 1) * dotGap;
    const startX = -totalDotsW / 2;

    PENS_ROSTER.forEach((_, i) => {
      const isCur = i === activeIdx;
      const dot = new Graphics();
      if (isCur) {
        dot.roundRect(startX + i * dotGap - 6, -3, 14, 6, 3).fill({ color: 0xEA580C });
      } else {
        dot.circle(startX + i * dotGap, 0, 3).fill({ color: 0xC8BFA8 });
      }
      this.dotsContainer.addChild(dot);
    });
  }
}
