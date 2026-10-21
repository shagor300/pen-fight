import { Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
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
  private penCanvasEl: HTMLCanvasElement;
  private penCanvasCtx: CanvasRenderingContext2D;
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
    this.mainCardSurface = new Graphics();
    this.mainCard.addChild(this.mainCardSurface);
    this.container.addChild(this.mainCard);

    this.penCanvasEl = document.createElement('canvas');
    this.penCanvasEl.width = 460;
    this.penCanvasEl.height = 240;
    this.penCanvasCtx = this.penCanvasEl.getContext('2d')!;
    this.penSprite = Sprite.from(this.penCanvasEl);
    this.penSprite.anchor.set(0.5, 0.5);
    this.mainCard.addChild(this.penSprite);

    this.statsOverlayContainer = new Container();
    this.statsOverlayContainer.visible = false;
    this.mainCard.addChild(this.statsOverlayContainer);

    this.titleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 26,
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
        fontWeight: 'bold',
      })
    });
    this.taglineText.anchor.set(0.5, 0);
    this.mainCard.addChild(this.taglineText);

    this.levelBadgeText = new Text({
      text: 'Lv1',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 14,
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
      .fill({ color: 0x121820, alpha: 0.65 });

    this.topBarContainer.removeChildren();
    const topY = Math.max(24, screenHeight * 0.035);

    const backBtn = this.createSquareButton('⇦', COLORS.butterYellow, () => {
      soundManager.play('ui_click');
      this.hide();
      this.emit('back');
    });
    backBtn.x = 22;
    backBtn.y = topY;
    this.topBarContainer.addChild(backBtn);

    const titleStyle = new TextStyle({
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: 24,
      fill: COLORS.cardCream,
      stroke: { color: COLORS.navyBorder, width: 4 },
      fontWeight: 'bold',
    });
    const headerTitle = new Text({ text: 'Pick your pen', style: titleStyle });
    headerTitle.anchor.set(0, 0.5);
    headerTitle.x = 80;
    headerTitle.y = topY + 22;
    this.topBarContainer.addChild(headerTitle);

    const modePill = this.createModeBadge(this.mode === 'VS_AI' ? '🤖 vs Computer' : '👥 2 players');
    modePill.x = screenWidth - 22;
    modePill.y = topY + 22;
    this.topBarContainer.addChild(modePill);

    const cardW = Math.min(screenWidth - 34, 380);
    const cardH = 340;
    this.mainCard.x = screenWidth / 2;
    this.mainCard.y = Math.max(84, screenHeight * 0.11) + cardH / 2;

    this.mainCardSurface.removeChildren();
    this.mainCardSurface.clear();
    this.mainCardSurface
      .roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 22)
      .fill({ color: COLORS.navyShadow });
    this.mainCardSurface
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 22)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3.5 });

    const badgeW = 52;
    const badgeH = 26;
    this.mainCardSurface
      .roundRect(-cardW / 2 + 16, -cardH / 2 + 14, badgeW, badgeH, 10)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: COLORS.navyBorder, width: 2.2 });
    this.levelBadgeText.x = -cardW / 2 + 16 + badgeW / 2;
    this.levelBadgeText.y = -cardH / 2 + 14 + badgeH / 2;
    this.mainCardSurface.addChild(this.levelBadgeText);

    const infoBtn = this.createInfoButton();
    infoBtn.x = cardW / 2 - 34;
    infoBtn.y = -cardH / 2 + 27;
    this.mainCardSurface.addChild(infoBtn);

    const frameW = cardW - 32;
    const frameH = 176;
    const frameY = -cardH / 2 + 50;

    this.mainCardSurface
      .roundRect(-frameW / 2, frameY, frameW, frameH, 16)
      .fill({ color: 0x986B3E })
      .stroke({ color: COLORS.navyBorder, width: 3 });

    for (let x = -frameW / 2 + 40; x < frameW / 2; x += 60) {
      this.mainCardSurface
        .rect(x, frameY + 2, 2, frameH - 4)
        .fill({ color: 0x6E4522, alpha: 0.25 });
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

    this.statsOverlayContainer.x = 0;
    this.statsOverlayContainer.y = frameY + frameH / 2;

    this.titleText.y = frameY + frameH + 10;
    this.taglineText.y = frameY + frameH + 42;

    this.buildLookToggle(cardW, frameY + frameH + 70);

    this.controlsContainer.x = screenWidth / 2;
    this.controlsContainer.y = this.mainCard.y + cardH / 2 + 14;
    this.buildControls(cardW);

    this.fightBtn.x = screenWidth / 2;
    this.fightBtn.y = Math.min(screenHeight - 48, this.controlsContainer.y + 150);
  }

  private buildLookToggle(_cardW: number, y: number): void {
    this.lookToggleContainer.removeChildren();
    this.lookToggleContainer.y = y;

    const pillW = 140;
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
    this.lookToggleContainer.on('pointerdown', () => {
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
        text: 'COMPUTER DIFFICULTY',
        style: new TextStyle({
          fontFamily: 'Nunito, sans-serif',
          fontSize: 11,
          fill: 0xD6CDBA,
          fontWeight: '800',
          letterSpacing: 1.5,
        })
      });
      compLabel.anchor.set(0.5, 0);
      compLabel.y = 0;
      this.controlsContainer.addChild(compLabel);

      const diffRow = new Container();
      diffRow.y = 20;

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
          .stroke({ color: COLORS.navyBorder, width: isSel ? 2.8 : 2 });
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
        .fill({ color: 0xEAE4D2, alpha: 0.6 })
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
      const pLabel = new Text({
        text: 'SELECT PEN FOR PLAYER',
        style: new TextStyle({
          fontFamily: 'Nunito, sans-serif',
          fontSize: 11,
          fill: 0xD6CDBA,
          fontWeight: '800',
          letterSpacing: 1.5,
        })
      });
      pLabel.anchor.set(0.5, 0);
      pLabel.y = 0;
      this.controlsContainer.addChild(pLabel);

      const tabRow = new Container();
      tabRow.y = 20;
      const tabW = (w - 12) / 2;
      const tabH = 38;

      const p1PenName = PENS_ROSTER[this.selectedIndex]?.name || 'Pen 1';
      const p2PenName = PENS_ROSTER[this.p2SelectedIndex]?.name || 'Pen 2';

      const p1Tab = new Container();
      p1Tab.x = -w / 2 + tabW / 2;
      p1Tab.eventMode = 'static';
      p1Tab.cursor = 'pointer';
      const p1Sel = this.pickingForPlayer === 1;
      p1Tab.addChild(
        new Graphics()
          .roundRect(-tabW / 2, 0, tabW, tabH, 12)
          .fill({ color: p1Sel ? COLORS.peachOrange : COLORS.cardCream })
          .stroke({ color: COLORS.navyBorder, width: p1Sel ? 2.8 : 2 })
      );
      const p1Txt = new Text({
        text: `P1: ${p1PenName}`,
        style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 12, fill: COLORS.textDark, fontWeight: 'bold' })
      });
      p1Txt.anchor.set(0.5, 0.5);
      p1Txt.y = tabH / 2;
      p1Tab.addChild(p1Txt);
      p1Tab.on('pointerdown', () => {
        soundManager.play('ui_click');
        this.pickingForPlayer = 1;
        this.buildControls(w);
        this.updateCard();
      });
      tabRow.addChild(p1Tab);

      const p2Tab = new Container();
      p2Tab.x = w / 2 - tabW / 2;
      p2Tab.eventMode = 'static';
      p2Tab.cursor = 'pointer';
      const p2Sel = this.pickingForPlayer === 2;
      p2Tab.addChild(
        new Graphics()
          .roundRect(-tabW / 2, 0, tabW, tabH, 12)
          .fill({ color: p2Sel ? COLORS.skyBlue : COLORS.cardCream })
          .stroke({ color: COLORS.navyBorder, width: p2Sel ? 2.8 : 2 })
      );
      const p2Txt = new Text({
        text: `P2: ${p2PenName}`,
        style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 12, fill: COLORS.textDark, fontWeight: 'bold' })
      });
      p2Txt.anchor.set(0.5, 0.5);
      p2Txt.y = tabH / 2;
      p2Tab.addChild(p2Txt);
      p2Tab.on('pointerdown', () => {
        soundManager.play('ui_click');
        this.pickingForPlayer = 2;
        this.buildControls(w);
        this.updateCard();
      });
      tabRow.addChild(p2Tab);

      this.controlsContainer.addChild(tabRow);
    }

    const optsRow = new Container();
    optsRow.y = 66;
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

    const w = Math.min(this.screenWidth - 34, 380);
    const h = 64;
    const r = 9999;

    const shadow = new Graphics()
      .roundRect(-w / 2, 6, w, h, r)
      .fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const surface = new Graphics()
      .roundRect(-w / 2, 0, w, h, r)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: COLORS.navyBorder, width: 3.5 });
    btn.addChild(surface);

    const content = new Container();
    const playIcon = new Text({
      text: '▷',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 32,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    playIcon.anchor.set(1, 0.5);
    playIcon.x = -6;
    playIcon.y = h / 2 - 1;
    content.addChild(playIcon);

    const label = new Text({
      text: 'Fight',
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 30,
        fill: COLORS.textDark,
        fontWeight: 'bold',
        letterSpacing: 1,
      })
    });
    label.anchor.set(0, 0.5);
    label.x = 4;
    label.y = h / 2 - 1;
    content.addChild(label);

    surface.addChild(content);

    btn.on('pointerdown', () => { surface.y = 4; });
    btn.on('pointerup', () => {
      surface.y = 0;
      soundManager.play('ui_click');
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

    const s = 46;
    const r = 14;

    const shadow = new Graphics().roundRect(0, 4, s, s, r).fill({ color: COLORS.navyShadow });
    btn.addChild(shadow);

    const body = new Graphics()
      .roundRect(0, 0, s, s, r)
      .fill({ color: COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 3 });
    btn.addChild(body);

    const txt = new Text({
      text: icon,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 24,
        fill: color,
        stroke: { color: COLORS.navyBorder, width: 2.5 },
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
    const w = 126;
    const h = 34;

    const bg = new Graphics()
      .roundRect(-w, -h / 2, w, h, 9999)
      .fill({ color: COLORS.skyBlue })
      .stroke({ color: COLORS.navyBorder, width: 2 });
    badge.addChild(bg);

    const txt = new Text({
      text,
      style: new TextStyle({
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: 12,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      })
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = -w / 2;
    badge.addChild(txt);

    return badge;
  }

  private createInfoButton(): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    const r = 15;
    const bg = new Graphics()
      .circle(0, 0, r)
      .fill({ color: this.showStatsOverlay ? COLORS.butterYellow : COLORS.cardCream })
      .stroke({ color: COLORS.navyBorder, width: 2 });
    btn.addChild(bg);

    const txt = new Text({
      text: 'ⓘ',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 16,
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
    if (this.mode === 'TWO_PLAYER') {
      this.buildControls(Math.min(this.screenWidth - 34, 380));
    }
    this.updateCard();
  }

  private nextPen(): void {
    const cur = this.getCurrentActivePenIndex();
    this.setCurrentActivePenIndex((cur + 1) % PENS_ROSTER.length);
    if (this.mode === 'TWO_PLAYER') {
      this.buildControls(Math.min(this.screenWidth - 34, 380));
    }
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

    this.penCanvasCtx.clearRect(0, 0, this.penCanvasEl.width, this.penCanvasEl.height);
    renderPenToCanvas(
      this.penCanvasCtx,
      pen,
      this.penCanvasEl.width / 2,
      this.penCanvasEl.height / 2,
      -Math.PI / 5,
      this.penLook,
      1.22,
      1.0,
      prog.level
    );

    this.penSprite.texture.update();

    this.statsOverlayContainer.removeChildren();
    this.statsOverlayContainer.visible = this.showStatsOverlay;
    if (this.showStatsOverlay) {
      const boxW = 220;
      const boxH = 142;
      const bg = new Graphics()
        .roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 12)
        .fill({ color: 0x1E2430, alpha: 0.92 })
        .stroke({ color: COLORS.butterYellow, width: 2 });
      this.statsOverlayContainer.addChild(bg);

      const statRows: { name: string; val: number }[] = [
        { name: 'Weight', val: pen.stats.weight },
        { name: 'Speed', val: pen.stats.speed },
        { name: 'Spin', val: pen.stats.spin },
        { name: 'Grip', val: pen.stats.grip },
        { name: 'Reach', val: pen.stats.reach },
      ];

      statRows.forEach((st, idx) => {
        const ry = -boxH / 2 + 16 + idx * 24;
        const lbl = new Text({
          text: st.name,
          style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 12, fill: 0xF8FAFC, fontWeight: 'bold' })
        });
        lbl.x = -boxW / 2 + 16;
        lbl.y = ry;
        this.statsOverlayContainer.addChild(lbl);

        const starsStr = '★'.repeat(st.val) + '☆'.repeat(5 - st.val);
        const stTxt = new Text({
          text: starsStr,
          style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 13, fill: COLORS.butterYellow })
        });
        stTxt.anchor.set(1, 0);
        stTxt.x = boxW / 2 - 16;
        stTxt.y = ry - 1;
        this.statsOverlayContainer.addChild(stTxt);
      });
    }

    this.dotsContainer.removeChildren();
    this.dotsContainer.y = -140;

    const dotGap = 12;
    const totalDotsW = (PENS_ROSTER.length - 1) * dotGap;
    const startX = -totalDotsW / 2;

    PENS_ROSTER.forEach((_, i) => {
      const isCur = i === activeIdx;
      const dot = new Graphics();
      if (isCur) {
        dot.roundRect(startX + i * dotGap - 6, -3, 14, 6, 3).fill({ color: 0xEA580C });
      } else {
        dot.circle(startX + i * dotGap, 0, 3).fill({ color: 0xD6CDBA });
      }
      this.dotsContainer.addChild(dot);
    });
  }
}
