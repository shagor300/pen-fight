/**
 * SettingsModal.ts
 * Configures UI Theme (Light/Dark), Desk Style, Pen Visual Look, Match Format, Equal Levels, and Audio.
 * Synchronized with ThemeManager (Capacitor Preferences / Web LocalStorage).
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, MatchFormat } from '../config/gameConstants';
import { soundManager } from '../audio/SoundAndHaptics';
import { themeManager, UiThemeMode, DeskThemeMode, PenLookMode } from './ThemeManager';
import EventEmitter from 'eventemitter3';

export type DeskStyle = 'clean' | 'old_school';
export type PenLook = 'classic' | 'real';

export interface GameSettings {
  uiTheme: UiThemeMode;
  deskStyle: DeskStyle;
  penLook: PenLook;
  matchFormat: MatchFormat;
  equalLevels: boolean;
  sfxVolume: number;
  musicVolume: number;
}

export class SettingsModal extends EventEmitter {
  public container: Container;
  private screenWidth: number;
  private screenHeight: number;

  public settings: GameSettings = {
    uiTheme: 'light',
    deskStyle: 'clean',
    penLook: 'real',
    matchFormat: 'first_to_3',
    equalLevels: false,
    sfxVolume: 0.7,
    musicVolume: 0.5,
  };

  private backdrop: Graphics;
  private card: Graphics;
  private contentContainer: Container;
  private closeBtn: Container;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.container = new Container();
    this.container.visible = false;

    // Backdrop
    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'default';
    this.backdrop.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(this.backdrop);

    // Card
    this.card = new Graphics();
    this.container.addChild(this.card);

    this.contentContainer = new Container();
    this.container.addChild(this.contentContainer);

    // Close button
    this.closeBtn = this.createCloseButton();
    this.container.addChild(this.closeBtn);

    this.loadSettings();
    this.layout();
    this.renderContent();
  }

  private createCloseButton(): Container {
    const btn = new Container();
    const bg = new Graphics()
      .circle(0, 0, 15)
      .fill({ color: 0x2B302A, alpha: 0.85 });
    btn.addChild(bg);

    const txt = new Text({
      text: '✕',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 14,
        fill: COLORS.white,
      }),
    });
    txt.anchor.set(0.5, 0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hide();
    });
    return btn;
  }

  public show(): void {
    this.container.visible = true;
    this.layout();
    this.renderContent();
  }

  public hide(): void {
    this.container.visible = false;
    this.saveSettings();
    this.emit('settings_changed', this.settings);
  }

  public layout(screenWidth = this.screenWidth, screenHeight = this.screenHeight): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    const isDark = this.settings.uiTheme === 'dark';

    this.backdrop.clear()
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: 0x000000, alpha: 0.72 });

    const cardW = Math.min(screenWidth - 32, 410);
    const cardH = Math.min(screenHeight - 30, 620);
    const cardX = (screenWidth - cardW) / 2;
    const cardY = (screenHeight - cardH) / 2;

    const cardBgColor = isDark ? 0x222938 : 0xFBF5E5;
    const cardBorderColor = isDark ? 0x11161D : 0x2B302A;

    // Tactile Neo-Brutalist Card with solid border & bottom shadow offset
    this.card.clear()
      .roundRect(cardX, cardY + 4, cardW, cardH, 20)
      .fill({ color: cardBorderColor, alpha: 0.4 })
      .roundRect(cardX, cardY, cardW, cardH, 20)
      .fill({ color: cardBgColor })
      .stroke({ color: cardBorderColor, width: 3 });

    this.closeBtn.x = cardX + cardW - 22;
    this.closeBtn.y = cardY + 22;

    this.contentContainer.x = cardX + 24;
    this.contentContainer.y = cardY + 22;
  }

  private renderContent(): void {
    const cc = this.contentContainer;
    cc.removeChildren();

    const isDark = this.settings.uiTheme === 'dark';
    const textPrimaryColor = isDark ? 0xF3F4F6 : 0x2B302A;
    const textSecColor = isDark ? 0x9CA3AF : 0x6B7280;

    const titleStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 22,
      fill: textPrimaryColor,
      fontWeight: 'bold',
    });
    const headingStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 13,
      fill: textSecColor,
      fontWeight: 'bold',
    });

    // Modal Title
    const title = new Text({ text: '⚙️ GAME SETTINGS', style: titleStyle });
    title.x = 0;
    title.y = 0;
    cc.addChild(title);

    let currY = 38;

    // ── UI Theme (Light / Dark) ──────────────────────────────────
    const themeLabel = new Text({ text: 'UI THEME', style: headingStyle });
    themeLabel.x = 0;
    themeLabel.y = currY;
    cc.addChild(themeLabel);
    currY += 22;

    const themeRow = this.createSegmentedControl(
      [
        { key: 'light', label: '☀️ LIGHT (CLASS)' },
        { key: 'dark', label: '🌙 DARK (NIGHT)' },
      ],
      this.settings.uiTheme,
      async (val) => {
        this.settings.uiTheme = val as UiThemeMode;
        await themeManager.setUiTheme(this.settings.uiTheme);
        this.emit('settings_changed', this.settings);
        this.layout();
        this.renderContent();
      },
    );
    themeRow.y = currY;
    cc.addChild(themeRow);
    currY += 44;

    // ── Desk Theme ──────────────────────────────────────────────
    const deskLabel = new Text({ text: 'DESK THEME', style: headingStyle });
    deskLabel.x = 0;
    deskLabel.y = currY;
    cc.addChild(deskLabel);
    currY += 22;

    const deskRow = this.createSegmentedControl(
      [
        { key: 'clean', label: 'CLEAN DESK' },
        { key: 'old_school', label: 'OLD SCHOOL (DOODLES)' },
      ],
      this.settings.deskStyle,
      async (val) => {
        this.settings.deskStyle = val as DeskStyle;
        await themeManager.setDeskTheme(val === 'old_school' ? 'old-school' : 'clean');
        this.emit('settings_changed', this.settings);
        this.renderContent();
      },
    );
    deskRow.y = currY;
    cc.addChild(deskRow);
    currY += 44;

    // ── Pen Look ────────────────────────────────────────────────
    const penLookLabel = new Text({ text: 'PEN GRAPHICS LOOK', style: headingStyle });
    penLookLabel.x = 0;
    penLookLabel.y = currY;
    cc.addChild(penLookLabel);
    currY += 22;

    const penRow = this.createSegmentedControl(
      [
        { key: 'classic', label: 'CLASSIC VECTOR' },
        { key: 'real', label: 'REAL 3D SHADED' },
      ],
      this.settings.penLook,
      async (val) => {
        this.settings.penLook = val as PenLook;
        await themeManager.setPenLook(val as PenLookMode);
        this.emit('settings_changed', this.settings);
        this.renderContent();
      },
    );
    penRow.y = currY;
    cc.addChild(penRow);
    currY += 44;

    // ── Match Format ────────────────────────────────────────────
    const formatLabel = new Text({ text: 'MATCH FORMAT', style: headingStyle });
    formatLabel.x = 0;
    formatLabel.y = currY;
    cc.addChild(formatLabel);
    currY += 22;

    const formatRow = this.createSegmentedControl(
      [
        { key: 'first_to_3', label: 'FIRST TO 3' },
        { key: 'first_to_5', label: 'FIRST TO 5' },
        { key: 'endless', label: 'ENDLESS' },
      ],
      this.settings.matchFormat,
      (val) => {
        this.settings.matchFormat = val as MatchFormat;
        this.emit('settings_changed', this.settings);
        this.renderContent();
      },
    );
    formatRow.y = currY;
    cc.addChild(formatRow);
    currY += 44;

    // ── Equal Levels Toggle ─────────────────────────────────────
    const equalRow = this.createToggleRow(
      'EQUAL LEVELS (Lv1 BASE STATS)',
      this.settings.equalLevels,
      (val) => {
        this.settings.equalLevels = val;
        this.emit('settings_changed', this.settings);
        this.renderContent();
      },
    );
    equalRow.y = currY;
    cc.addChild(equalRow);
    currY += 40;

    // ── SFX Volume ──────────────────────────────────────────────
    const sfxRow = this.createVolumeRow('SFX VOLUME', this.settings.sfxVolume, (val) => {
      this.settings.sfxVolume = val;
      soundManager.setSFXVolume(val);
      soundManager.play('flick');
      this.renderContent();
    });
    sfxRow.y = currY;
    cc.addChild(sfxRow);
    currY += 40;

    // ── Music Volume ────────────────────────────────────────────
    const musicRow = this.createVolumeRow('MUSIC VOLUME', this.settings.musicVolume, (val) => {
      this.settings.musicVolume = val;
      soundManager.setMusicVolume(val);
      this.renderContent();
    });
    musicRow.y = currY;
    cc.addChild(musicRow);
  }

  private createSegmentedControl(
    items: { key: string; label: string }[],
    currentKey: string,
    onSelect: (key: string) => void,
  ): Container {
    const row = new Container();
    const totalW = Math.min(this.screenWidth - 80, 360);
    const itemW = (totalW - (items.length - 1) * 6) / items.length;
    const isDark = this.settings.uiTheme === 'dark';

    items.forEach((item, idx) => {
      const isSelected = item.key === currentKey;
      const x = idx * (itemW + 6);

      const btn = new Container();
      btn.x = x;

      const unselectedBg = isDark ? 0x2A3244 : 0xE4DDD3;
      const unselectedBorder = isDark ? 0x374151 : 0xC0B8AE;

      const bg = new Graphics()
        .roundRect(0, 0, itemW, 32, 8)
        .fill({ color: isSelected ? 0xF3CD57 : unselectedBg })
        .stroke({ color: isSelected ? 0x2B302A : unselectedBorder, width: isSelected ? 2.5 : 1.5 });
      btn.addChild(bg);

      const txt = new Text({
        text: item.label,
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: items.length > 2 ? 11 : 12,
          fill: isSelected ? 0x2B302A : (isDark ? 0xCBD5E1 : 0x2B302A),
          fontWeight: isSelected ? 'bold' : 'normal',
        }),
      });
      txt.anchor.set(0.5, 0.5);
      txt.x = itemW / 2;
      txt.y = 16;
      btn.addChild(txt);

      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', (e) => {
        e.stopPropagation();
        onSelect(item.key);
      });

      row.addChild(btn);
    });

    return row;
  }

  private createToggleRow(label: string, enabled: boolean, onToggle: (val: boolean) => void): Container {
    const row = new Container();
    const totalW = Math.min(this.screenWidth - 80, 360);
    const isDark = this.settings.uiTheme === 'dark';

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: isDark ? 0xF3F4F6 : 0x2B302A,
      }),
    });
    txt.x = 0;
    txt.y = 4;
    row.addChild(txt);

    // Toggle switch
    const toggle = new Container();
    toggle.x = totalW - 54;

    const track = new Graphics()
      .roundRect(0, 0, 50, 24, 12)
      .fill({ color: enabled ? 0xA7CC8D : (isDark ? 0x374151 : 0xCCCCCC) })
      .stroke({ color: 0x2B302A, width: 2 });
    toggle.addChild(track);

    const thumb = new Graphics()
      .circle(enabled ? 38 : 12, 12, 9)
      .fill({ color: COLORS.white })
      .stroke({ color: 0x2B302A, width: 2 });
    toggle.addChild(thumb);

    toggle.eventMode = 'static';
    toggle.cursor = 'pointer';
    toggle.on('pointerdown', (e) => {
      e.stopPropagation();
      onToggle(!enabled);
    });

    row.addChild(toggle);
    return row;
  }

  private createVolumeRow(label: string, volume: number, onChange: (val: number) => void): Container {
    const row = new Container();
    const totalW = Math.min(this.screenWidth - 80, 360);
    const isDark = this.settings.uiTheme === 'dark';

    const txt = new Text({
      text: `${label} (${Math.round(volume * 100)}%)`,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: isDark ? 0xF3F4F6 : 0x2B302A,
      }),
    });
    txt.x = 0;
    txt.y = 4;
    row.addChild(txt);

    // Stepper buttons (- and +)
    const btnMinus = this.createSmallBtn('–', () => {
      onChange(Math.max(0, parseFloat((volume - 0.1).toFixed(1))));
    });
    btnMinus.x = totalW - 80;

    const btnPlus = this.createSmallBtn('+', () => {
      onChange(Math.min(1, parseFloat((volume + 0.1).toFixed(1))));
    });
    btnPlus.x = totalW - 32;

    row.addChild(btnMinus);
    row.addChild(btnPlus);

    return row;
  }

  private createSmallBtn(label: string, onClick: () => void): Container {
    const btn = new Container();
    const isDark = this.settings.uiTheme === 'dark';

    const bg = new Graphics()
      .roundRect(0, 0, 36, 26, 6)
      .fill({ color: isDark ? 0x2A3244 : 0xE0D8CE })
      .stroke({ color: isDark ? 0x11161D : 0x2B302A, width: 1.5 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 16,
        fontWeight: 'bold',
        fill: isDark ? 0xF3F4F6 : 0x2B302A,
      }),
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = 18;
    txt.y = 13;
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('pen_fight_settings', JSON.stringify(this.settings));
    } catch {}
  }

  private loadSettings(): void {
    // Start with themeManager preferences
    this.settings.uiTheme = themeManager.prefs.uiTheme;
    this.settings.deskStyle = themeManager.prefs.deskTheme === 'old-school' ? 'old_school' : 'clean';
    this.settings.penLook = themeManager.prefs.penLook;

    try {
      const raw = localStorage.getItem('pen_fight_settings');
      if (raw) {
        this.settings = { ...this.settings, ...JSON.parse(raw) };
      }
    } catch {}
  }
}
