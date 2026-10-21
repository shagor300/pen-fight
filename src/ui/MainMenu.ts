/**
 * MainMenu.ts
 * Main Menu Screen: Title, Mode Selection (vs Computer, 2 Players, Online),
 * Quick Navigation to Pens Garage and Settings.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '../config/gameConstants';
import { AIDifficulty } from '../controllers/AIController';
import EventEmitter from 'eventemitter3';

export class MainMenu extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;

  private bgGraphics: Graphics;
  private titleContainer: Container;
  private buttonsContainer: Container;

  private selectedDifficulty: AIDifficulty = 'normal';

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.container = new Container();

    this.bgGraphics = new Graphics();
    this.container.addChild(this.bgGraphics);

    this.titleContainer = new Container();
    this.container.addChild(this.titleContainer);

    this.buttonsContainer = new Container();
    this.container.addChild(this.buttonsContainer);

    this.layout();
    this.renderMenu();
  }

  public show(): void {
    this.container.visible = true;
  }

  public hide(): void {
    this.container.visible = false;
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.bgGraphics.clear()
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: COLORS.woodDark });

    // Classroom desk doodle lines on background
    const dg = this.bgGraphics;
    for (let y = 40; y < screenHeight; y += 45) {
      dg.moveTo(20, y);
      dg.lineTo(screenWidth - 20, y);
      dg.stroke({ color: COLORS.woodMid, width: 1, alpha: 0.15 });
    }

    // Centering elements
    this.titleContainer.x = screenWidth / 2;
    this.titleContainer.y = Math.max(50, screenHeight * 0.12);

    this.buttonsContainer.x = screenWidth / 2;
    this.buttonsContainer.y = Math.max(220, screenHeight * 0.38);
  }

  private renderMenu(): void {
    // ── Title & Logo ────────────────────────────────────────────────
    this.titleContainer.removeChildren();

    const subtitleStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 18,
      fill: COLORS.accent,
      letterSpacing: 4,
      fontWeight: 'bold',
    });
    const sub = new Text({ text: 'DESK WARS', style: subtitleStyle });
    sub.anchor.set(0.5, 0);
    sub.y = 0;
    this.titleContainer.addChild(sub);

    const titleStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 44,
      fill: COLORS.white,
      stroke: { color: COLORS.textDark, width: 6 },
      letterSpacing: 2,
    });
    const title = new Text({ text: 'PEN FIGHT', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.y = 22;
    this.titleContainer.addChild(title);

    // Decorative underline
    const lineG = new Graphics()
      .roundRect(-120, 80, 240, 4, 2)
      .fill({ color: COLORS.accent });
    this.titleContainer.addChild(lineG);

    // ── Menu Buttons ────────────────────────────────────────────────
    this.buttonsContainer.removeChildren();
    let currY = 0;

    // 1. VS COMPUTER BUTTON
    const vsAiBtn = this.createMenuButton('🤖  PLAY VS COMPUTER', COLORS.accent, () => {
      this.emit('start_game', { mode: 'VS_AI', difficulty: this.selectedDifficulty });
    });
    vsAiBtn.y = currY;
    this.buttonsContainer.addChild(vsAiBtn);
    currY += 56;

    // AI Difficulty Selector Row
    const diffRow = this.createDifficultyRow();
    diffRow.y = currY;
    this.buttonsContainer.addChild(diffRow);
    currY += 46;

    // 2. 2 PLAYERS LOCAL BUTTON
    const twoPlayerBtn = this.createMenuButton('👥  2 PLAYERS (PASS & PLAY)', 0x3A86FF, () => {
      this.emit('start_game', { mode: 'TWO_PLAYER', difficulty: this.selectedDifficulty });
    });
    twoPlayerBtn.y = currY;
    this.buttonsContainer.addChild(twoPlayerBtn);
    currY += 66;

    // 3. ONLINE MULTIPLAYER (Coming soon)
    const onlineBtn = this.createDisabledButton('🌐  ONLINE MULTIPLAYER', 'SOON');
    onlineBtn.y = currY;
    this.buttonsContainer.addChild(onlineBtn);
    currY += 76;

    // 4. BOTTOM ACTION BUTTONS: PENS & SETTINGS
    const bottomRow = new Container();
    const pensBtn = this.createSecondaryButton('🖋️ PENS GARAGE', () => this.emit('open_pens'));
    pensBtn.x = -80;
    bottomRow.addChild(pensBtn);

    const settingsBtn = this.createSecondaryButton('⚙️ SETTINGS', () => this.emit('open_settings'));
    settingsBtn.x = 80;
    bottomRow.addChild(settingsBtn);

    bottomRow.y = currY;
    this.buttonsContainer.addChild(bottomRow);
  }

  private createMenuButton(label: string, color: number, onClick: () => void): Container {
    const btn = new Container();
    const btnW = Math.min(this.screenWidth - 60, 320);
    const btnH = 48;

    const bg = new Graphics()
      .roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 16)
      .fill({ color })
      .stroke({ color: COLORS.white, width: 2 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 16,
        fill: COLORS.white,
        fontWeight: 'bold',
      }),
    });
    txt.anchor.set(0.5, 0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      onClick();
    });

    return btn;
  }

  private createDisabledButton(label: string, badge: string): Container {
    const btn = new Container();
    const btnW = Math.min(this.screenWidth - 60, 320);
    const btnH = 44;

    const bg = new Graphics()
      .roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 14)
      .fill({ color: 0x4A3B32, alpha: 0.6 })
      .stroke({ color: 0x665544, width: 1 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 14,
        fill: 0x9E8B7D,
      }),
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = -24;
    btn.addChild(txt);

    // Badge
    const badgeG = new Graphics()
      .roundRect(btnW / 2 - 58, -10, 46, 20, 6)
      .fill({ color: COLORS.danger, alpha: 0.8 });
    btn.addChild(badgeG);

    const badgeTxt = new Text({
      text: badge,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 10,
        fill: COLORS.white,
        fontWeight: 'bold',
      }),
    });
    badgeTxt.anchor.set(0.5, 0.5);
    badgeTxt.x = btnW / 2 - 35;
    btn.addChild(badgeTxt);

    return btn;
  }

  private createDifficultyRow(): Container {
    const row = new Container();
    const diffs: { key: AIDifficulty; label: string }[] = [
      { key: 'easy', label: 'EASY' },
      { key: 'normal', label: 'NORMAL' },
      { key: 'hard', label: 'HARD' },
    ];

    const totalW = Math.min(this.screenWidth - 80, 280);
    const itemW = (totalW - 16) / 3;

    diffs.forEach((d, idx) => {
      const isSelected = d.key === this.selectedDifficulty;
      const x = -totalW / 2 + idx * (itemW + 8);

      const btn = new Container();
      btn.x = x + itemW / 2;

      const bg = new Graphics()
        .roundRect(-itemW / 2, -14, itemW, 28, 8)
        .fill({ color: isSelected ? COLORS.cream : 0x3E2D22, alpha: isSelected ? 1 : 0.6 })
        .stroke({ color: isSelected ? COLORS.accent : 0x6B5242, width: isSelected ? 2 : 1 });
      btn.addChild(bg);

      const txt = new Text({
        text: d.label,
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 12,
          fill: isSelected ? COLORS.textDark : COLORS.cream,
          fontWeight: isSelected ? 'bold' : 'normal',
        }),
      });
      txt.anchor.set(0.5, 0.5);
      btn.addChild(txt);

      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', (e) => {
        e.stopPropagation();
        this.selectedDifficulty = d.key;
        this.renderMenu();
      });

      row.addChild(btn);
    });

    return row;
  }

  private createSecondaryButton(label: string, onClick: () => void): Container {
    const btn = new Container();
    const btnW = 140;
    const btnH = 38;

    const bg = new Graphics()
      .roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 12)
      .fill({ color: COLORS.cream, alpha: 0.95 })
      .stroke({ color: COLORS.woodMid, width: 2 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 13,
        fill: COLORS.textDark,
        fontWeight: 'bold',
      }),
    });
    txt.anchor.set(0.5, 0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      onClick();
    });

    return btn;
  }
}
