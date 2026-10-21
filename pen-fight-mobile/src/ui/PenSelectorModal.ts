/**
 * src/ui/PenSelectorModal.ts
 * Sleek, High-End Pen Locker & Match Setup Modal matching https://shunneklabs.app/games/pen-fight/.
 *
 * Key Upgrades & Fixes:
 * 1. Sleek Uncluttered Showcase Card:
 *    - Top bar inside card: [Lv1] badge on left, pagination dots (• • ▬ • •) in center, circular [ⓘ] button on right.
 *    - Spacious 3D wooden showcase frame (184px tall) with bevelled inner shadow and [❮] / [❯] navigation arrows.
 *    - Bold Pen Name, Tagline, and centered [ Classic | Real ] pill switch at the bottom of the card.
 * 2. Interactive [ⓘ] Tactical Stat & Skill Overlay (Zero Text Overflow!):
 *    - Tapping [ⓘ] toggles a clean Frosted Tactical Overlay right inside the showcase frame showing all 5 Segmented
 *      Stat Bars (WEIGHT, SPEED, SPIN, GRIP, REACH) + the pen's Signature Skill with proper word-wrapping.
 * 3. PixiJS v8 GPU Texture Fix (`Texture.from(freshCanvas)` + `texture.source.update()`) so clicking [❮] / [❯]
 *    always updates the 3D pen immediately!
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
  private showStatsOverlay = false;

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
  private statsOverlayContainer: Container;

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
    this.mainCard.eventMode = 'static';
    this.mainCardSurface = new Graphics();
    this.mainCard.addChild(this.mainCardSurface);
    this.container.addChild(this.mainCard);

    this.penSprite = new Sprite(Texture.EMPTY);
    this.penSprite.anchor.set(0.5, 0.5);
    this.penSprite.scale.set(0.5);
    this.mainCard.addChild(this.penSprite);

    this.statsOverlayContainer = new Container();
    this.statsOverlayContainer.visible = false;
    this.mainCard.addChild(this.statsOverlayContainer);

    this.titleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 25,
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
        fontSize: 13,
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
        fontSize: 13.5,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    this.levelBadgeText.anchor.set(0.5, 0.5);

    this.dotsContainer = new Container();
    this.mainCard.addChild(this.dotsContainer);

    this.lookToggleContainer = new Container();
    this.mainCard.addChild(this.lookToggleContainer);

    this.controlsContainer = new Container();
    this.container.addChild(this.controlsContainer);

    this.fightBtn = this.createFightButton();
    this.container.addChild(this.fightBtn);

    this.layout();
  }

  public show(p1Index = 0, mode: 'VS_AI' | 'TWO_PLAYER' = 'VS_AI', diff: AIDifficulty = 'normal'): void {
    this.selectedIndex = p1Index;
    this.pickingForPlayer = 1;
    this.showStatsOverlay = false;
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
      .fill({ color: 0x0F172A, alpha: 0.58 });

    this.topBarContainer.removeChildren();
    const topY = Math.max(18, screenHeight * 0.028);

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
      stroke: { color: COLORS.navyBorder, width: 4.2 },
      fontWeight: 'bold',
    });
    const headerStr = this.mode === 'TWO_PLAYER'
      ? `Pick your pen, Player ${this.pickingForPlayer}`
      : 'Pick your pen';
    const headerTitle = new Text({ text: headerStr, style: titleStyle });
    headerTitle.anchor.set(0, 0.5);
    headerTitle.x = 76;
    headerTitle.y = topY + 22;
    this.topBarContainer.addChild(headerTitle);

    const modePill = this.createModeBadge(this.mode === 'VS_AI' ? '🤖 vs Computer' : '👥 2 players');
    modePill.x = screenWidth - 20;
    modePill.y = topY + 22;
    this.topBarContainer.addChild(modePill);

    const cardW = Math.min(screenWidth - 32, 384);
    const cardH = 352;
    this.mainCard.x = screenWidth / 2;
    this.mainCard.y = topY + 58 + cardH / 2;

    this.mainCardSurface.removeChildren();
    this.mainCardSurface.clear();
    this.mainCardSurface
      .roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 24)
      .fill({ color: COLORS.navyShadow });
    this.mainCardSurface
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 24)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3.4 });

    // Top-left Level Pill
    const badgeW = 52;
    const badgeH = 26;
    this.mainCardSurface
      .roundRect(-cardW / 2 + 16, -cardH / 2 + 14, badgeW, badgeH, 10)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });
    this.levelBadgeText.x = -cardW / 2 + 16 + badgeW / 2;
    this.levelBadgeText.y = -cardH / 2 + 14 + badgeH / 2;
    this.mainCardSurface.addChild(this.levelBadgeText);

    // Top-right Circular [ⓘ] Stat & Skill Info Button
    const infoBtn = this.createInfoButton();
    infoBtn.x = cardW / 2 - 32;
    infoBtn.y = -cardH / 2 + 27;
    this.mainCardSurface.addChild(infoBtn);

    // Rich 3D Wooden Showcase Frame for the Pen
    const frameW = cardW - 32;
    const frameH = 182;
    const frameY = -cardH / 2 + 48;

    // Outer frame bevel & warm oak surface
    this.mainCardSurface
      .roundRect(-frameW / 2, frameY, frameW, frameH, 16)
      .fill({ color: 0x9E7247 })
      .stroke({ color: COLORS.navyBorder, width: 3 });

    // Inner recessed top shadow inside wooden showcase
    this.mainCardSurface
      .roundRect(-frameW / 2 + 3, frameY + 3, frameW - 6, 12, 6)
      .fill({ color: 0x5C3A1E, alpha: 0.22 });

    // Subtle wood plank seams
    for (let x = -frameW / 2 + 56; x < frameW / 2 - 20; x += 64) {
      this.mainCardSurface
        .rect(x, frameY + 3, 1.8, frameH - 6)
        .fill({ color: 0x6E4522, alpha: 0.24 });
    }

    const prevArrow = this.createArrowButton('❮', () => this.prevPen());
    prevArrow.x = -frameW / 2 + 25;
    prevArrow.y = frameY + frameH / 2;
    this.mainCardSurface.addChild(prevArrow);

    const nextArrow = this.createArrowButton('❯', () => this.nextPen());
    nextArrow.x = frameW / 2 - 25;
    nextArrow.y = frameY + frameH / 2;
    this.mainCardSurface.addChild(nextArrow);

    this.penSprite.x = 0;
    this.penSprite.y = frameY + frameH / 2;

    this.statsOverlayContainer.x = 0;
    this.statsOverlayContainer.y = frameY + frameH / 2;

    this.dotsContainer.y = -cardH / 2 + 27;
    this.titleText.y = frameY + frameH + 10;
    this.taglineText.y = frameY + frameH + 41;

    // Centered [ Classic | Real ] Pill Switch at Bottom of Card
    this.buildLookToggle(0, frameY + frameH + 68);

    this.controlsContainer.x = screenWidth / 2;
    this.controlsContainer.y = this.mainCard.y + cardH / 2 + 12;
    this.buildControls(cardW);

    this.container.removeChild(this.fightBtn);
    this.fightBtn = this.createFightButton();
    this.container.addChild(this.fightBtn);
    this.fightBtn.x = screenWidth / 2;
    this.fightBtn.y = Math.min(screenHeight - 38, this.controlsContainer.y + 132);
  }

  private createInfoButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    const r = 14;
    const bg = new Graphics()
      .circle(0, 0, r)
      .fill({ color: this.showStatsOverlay ? COLORS.butterYellow : COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });
    btn.addChild(bg);

    const txt = new Text({
      text: 'i',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 15,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    txt.anchor.set(0.5, 0.5);
    btn.addChild(txt);

    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      this.showStatsOverlay = !this.showStatsOverlay;
      this.layout();
      this.updateCard();
    });
    return btn;
  }

  private buildLookToggle(x: number, y: number): void {
    this.lookToggleContainer.removeChildren();
    this.lookToggleContainer.x = x;
    this.lookToggleContainer.y = y;

    const pillW = 142;
    const pillH = 32;
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
      .stroke({ color: COLORS.navyBorder, width: 2 });
    this.lookToggleContainer.addChild(activeG);

    const classicTxt = new Text({
      text: 'Classic',
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 12,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    classicTxt.anchor.set(0.5, 0.5);
    classicTxt.x = -pillW / 4;
    classicTxt.y = pillH / 2;
    this.lookToggleContainer.addChild(classicTxt);

    const realTxt = new Text({
      text: 'Real',
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 12,
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
        text: 'COMPUTER',
        style: new TextStyle({
          fontFamily: 'Nunito, sans-serif',
          fontSize: 11,
          fill: 0xE2D9C5,
          fontWeight: '800',
          letterSpacing: 1.5,
        })
      });
      compLabel.anchor.set(0.5, 0);
      compLabel.y = 0;
      this.controlsContainer.addChild(compLabel);

      const diffRow = new Container();
      diffRow.y = 18;

      const diffs: { id: AIDifficulty; label: string }[] = [
        { id: 'easy', label: 'Easy' },
        { id: 'normal', label: 'Normal' },
        { id: 'hard', label: 'Hard' },
      ];

      const btnW = (w - 24) / 4;
      const btnH = 36;
      const startX = -w / 2;

      diffs.forEach((d, i) => {
        const btn = new Container();
        btn.x = startX + i * (btnW + 8) + btnW / 2;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';

        const isSel = this.selectedDifficulty === d.id;
        const bg = new Graphics()
          .roundRect(-btnW / 2, 0, btnW, btnH, 12)
          .fill({ color: isSel ? COLORS.skyBlue : COLORS.cardCream })
          .stroke({ color: COLORS.navyBorder, width: isSel ? 2.6 : 2 });
        btn.addChild(bg);

        const txt = new Text({
          text: d.label,
          style: new TextStyle({
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 13,
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
        .roundRect(-btnW / 2, 0, btnW, btnH, 12)
        .fill({ color: 0xEAE4D2, alpha: 0.65 })
        .stroke({ color: COLORS.navyBorder, width: 2 });
      masterBtn.addChild(masterBg);

      const masterTxt = new Text({
        text: 'Master 🔒',
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 12,
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
      // Compact centered pill like shunneklabs.app: [ ✎ Player 1 | Change name ]
      const pillW = 216;
      const pillH = 34;
      const namePill = new Container();
      namePill.x = -pillW / 2;
      namePill.y = 14;
      namePill.addChild(
        new Graphics()
          .roundRect(0, 0, pillW, pillH, 17)
          .fill({ color: COLORS.cardCream })
          .stroke({ color: COLORS.navyBorder, width: 2.2 })
      );
      const nameTxt = new Text({
        text: `✎  Player ${this.pickingForPlayer}   |   Change name`,
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 12, fill: COLORS.textDark, fontWeight: '800' })
      });
      nameTxt.anchor.set(0.5, 0.5);
      nameTxt.x = pillW / 2;
      nameTxt.y = pillH / 2;
      namePill.addChild(nameTxt);
      this.controlsContainer.addChild(namePill);
    }

    const optsRow = new Container();
    optsRow.y = 60;
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

    const h = 36;
    const bg = new Graphics()
      .roundRect(-w / 2, 0, w, h, 12)
      .fill({ color: active ? 0xDCECD0 : COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });
    pill.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 12.5,
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

    const w = Math.min(this.screenWidth - 32, 384);
    const h = 60;
    const r = 9999;

    const shadow = new Graphics()
      .roundRect(-w / 2, 5, w, h, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-w / 2, 0, w, h, r)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: COLORS.navyBorder, width: 3.4 });
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

    const s = 44;
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
      .stroke({ color: COLORS.navyBorder, width: 2.2 });
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

    // PIXI.JS v8 TEXTURE UPDATE FIX: Always build from a fresh 2x Retina canvas
    const freshCanvas = document.createElement('canvas');
    freshCanvas.width = 640;
    freshCanvas.height = 280;
    const fCtx = freshCanvas.getContext('2d')!;
    fCtx.save();
    fCtx.scale(2, 2);
    renderPenToCanvas(
      fCtx,
      pen,
      160,
      70,
      -Math.PI / 5.5,
      this.penLook,
      1.24,
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

    // Interactive [ⓘ] Tactical Stat & Skill Overlay (Fits neatly inside the showcase frame)
    this.statsOverlayContainer.removeChildren();
    this.statsOverlayContainer.visible = this.showStatsOverlay;
    if (this.showStatsOverlay) {
      const boxW = 248;
      const boxH = 164;
      const bg = new Graphics()
        .roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 14)
        .fill({ color: 0xF7F3E3, alpha: 0.96 })
        .stroke({ color: COLORS.navyBorder, width: 2.5 });
      this.statsOverlayContainer.addChild(bg);

      const skillHdr = new Text({
        text: `${pen.skillName || '⚡ Signature Skill'}`,
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 12,
          fill: 0xD97706,
          fontWeight: 'bold'
        })
      });
      skillHdr.anchor.set(0.5, 0);
      skillHdr.y = -boxH / 2 + 8;
      this.statsOverlayContainer.addChild(skillHdr);

      const statRows: { name: string; val: number; color: number }[] = [
        { name: 'Weight', val: pen.stats.weight, color: 0xF59E0B },
        { name: 'Speed', val: pen.stats.speed, color: 0x10B981 },
        { name: 'Spin', val: pen.stats.spin, color: 0x3B82F6 },
        { name: 'Grip', val: pen.stats.grip, color: 0x8B5CF6 },
        { name: 'Reach', val: pen.stats.reach, color: 0xEC4899 },
      ];

      statRows.forEach((st, idx) => {
        const ry = -boxH / 2 + 30 + idx * 24;
        const lbl = new Text({
          text: st.name,
          style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 11.5, fill: COLORS.textDark, fontWeight: '800' })
        });
        lbl.x = -boxW / 2 + 16;
        lbl.y = ry;
        this.statsOverlayContainer.addChild(lbl);

        const segStartX = -10;
        const segW = 20;
        const segH = 9;
        const segGap = 4;
        const barG = new Graphics();
        for (let s = 0; s < 5; s++) {
          const filled = s < st.val;
          barG
            .roundRect(segStartX + s * (segW + segGap), ry + 3, segW, segH, 3)
            .fill({ color: filled ? st.color : 0xE2DAC9 })
            .stroke({ color: COLORS.navyBorder, width: 1.3 });
        }
        this.statsOverlayContainer.addChild(barG);
      });
    }

    // Pagination Dots
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
