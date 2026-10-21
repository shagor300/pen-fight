/**
 * SettingsModal.ts
 * 100% Authentic "Make it yours" Settings Modal matching https://shunneklabs.app/games/pen-fight/ (v1.5.1).
 * Includes:
 * - Cream dialog card (#f7f3e3), dark charcoal border (#2b333e), top drag handle, and dotted dividers
 * - SCREEN: Theme (System / Light / Dark), Desk style (Clean / Old school), Pen look (Classic / Real)
 * - PLAY: Aim guide ("Arrow, path and spin. Off keeps the power bar."), Reduce motion, Vibration,
 *         Automatic next match ("Starts 5 seconds after a win."), Full screen, Series length (First to 3 / 5 / Endless)
 * - SOUND: Sound toggle ("Off silences effects and music."), Overall volume (80%), Effects volume (70%), Music volume (30%)
 * - PROGRESS & ABOUT: Reset progress button & Desk Wars · Pen Fight · Version 1.5.1 footer
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, MatchFormat } from '../config/gameConstants';
import { soundManager } from '../audio/SoundAndHaptics';
import { themeManager, UiThemeMode, PenLookMode } from './ThemeManager';
import EventEmitter from 'eventemitter3';

export type DeskStyle = 'clean' | 'old_school';
export type PenLook = 'classic' | 'real';

export interface GameSettings {
  uiTheme: UiThemeMode;
  deskStyle: DeskStyle;
  penLook: PenLook;
  aimGuide: boolean;
  reduceMotion: boolean;
  vibration: boolean;
  automaticNextMatch: boolean;
  fullScreen: boolean;
  matchFormat: MatchFormat;
  equalLevels: boolean;
  soundEnabled: boolean;
  overallVolume: number;
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
    aimGuide: true,
    reduceMotion: false,
    vibration: true,
    automaticNextMatch: false,
    fullScreen: false,
    matchFormat: 'first_to_3',
    equalLevels: true,
    soundEnabled: true,
    overallVolume: 0.8,
    sfxVolume: 0.7,
    musicVolume: 0.3,
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

    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'default';
    this.backdrop.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(this.backdrop);

    this.card = new Graphics();
    this.container.addChild(this.card);

    this.contentContainer = new Container();
    this.container.addChild(this.contentContainer);

    this.closeBtn = this.createCloseButton();
    this.container.addChild(this.closeBtn);

    this.loadSettings();
    this.layout();
    this.renderContent();
  }

  private createCloseButton(): Container {
    const btn = new Container();
    const bg = new Graphics()
      .roundRect(-17, -17, 34, 34, 10)
      .fill({ color: 0xEAE2CF })
      .stroke({ color: 0x2B333E, width: 2.2 });
    btn.addChild(bg);

    const txt = new Text({
      text: '✕',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 15,
        fill: 0x2B333E,
        fontWeight: 'bold',
      }),
    });
    txt.anchor.set(0.5, 0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
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
      .fill({ color: 0x121820, alpha: 0.68 });

    const cardW = Math.min(screenWidth - 24, 416);
    const cardH = Math.min(screenHeight - 20, 670);
    const cardX = (screenWidth - cardW) / 2;
    const cardY = (screenHeight - cardH) / 2;

    const cardBgColor = isDark ? 0x222938 : 0xF7F3E3;
    const cardBorderColor = isDark ? 0x11161D : 0x2B333E;

    this.card.clear()
      .roundRect(cardX, cardY + 5, cardW, cardH, 24)
      .fill({ color: COLORS.navyShadow })
      .roundRect(cardX, cardY, cardW, cardH, 24)
      .fill({ color: cardBgColor })
      .stroke({ color: cardBorderColor, width: 3.2 });

    // Top horizontal drag handle (---)
    this.card
      .roundRect(screenWidth / 2 - 22, cardY + 9, 44, 4, 2)
      .fill({ color: isDark ? 0x475569 : 0xC8BFA8 });

    this.closeBtn.x = cardX + cardW - 28;
    this.closeBtn.y = cardY + 30;

    this.contentContainer.x = cardX + 20;
    this.contentContainer.y = cardY + 18;
  }

  private drawDottedDivider(g: Graphics, y: number, w: number, isDark: boolean): void {
    const col = isDark ? 0x374151 : 0xD2C7B0;
    for (let x = 0; x < w; x += 8) {
      g.circle(x, y, 1.1).fill({ color: col });
    }
  }

  private renderContent(): void {
    const cc = this.contentContainer;
    cc.removeChildren();

    const isDark = this.settings.uiTheme === 'dark';
    const textPrimaryColor = isDark ? 0xF3F4F6 : 0x2B333E;
    const textSecColor = isDark ? 0x9CA3AF : 0x6E6658;
    const totalW = Math.min(this.screenWidth - 64, 376);

    const dividers = new Graphics();
    cc.addChild(dividers);

    // Header: [⚙] Make it yours
    const gearBadge = new Graphics()
      .roundRect(0, 2, 32, 32, 10)
      .fill({ color: 0xFAD24B })
      .stroke({ color: 0x2B333E, width: 2 });
    cc.addChild(gearBadge);

    const gearTxt = new Text({
      text: '⚙',
      style: new TextStyle({ fontSize: 17, fill: 0x2B333E, fontWeight: 'bold' })
    });
    gearTxt.anchor.set(0.5, 0.5);
    gearTxt.x = 16;
    gearTxt.y = 18;
    cc.addChild(gearTxt);

    const title = new Text({
      text: 'Make it yours',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 21,
        fill: textPrimaryColor,
        fontWeight: 'bold',
      })
    });
    title.x = 40;
    title.y = 5;
    cc.addChild(title);

    let currY = 44;
    this.drawDottedDivider(dividers, currY - 5, totalW, isDark);

    const sectionStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 10.5,
      fill: textSecColor,
      fontWeight: '800',
      letterSpacing: 1.4,
    });

    // ── SECTION 1: SCREEN ──────────────────────────────────────────
    const screenSec = new Text({ text: 'SCREEN', style: sectionStyle });
    screenSec.y = currY;
    cc.addChild(screenSec);
    currY += 16;

    const themeRow = this.createSegmentedControl(
      totalW,
      [
        { key: 'light', label: 'Light' },
        { key: 'dark', label: 'Dark' },
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
    currY += 34;

    const deskRow = this.createSegmentedControl(
      totalW,
      [
        { key: 'clean', label: 'Clean desk' },
        { key: 'old_school', label: 'Old school desk' },
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
    currY += 34;

    const penRow = this.createSegmentedControl(
      totalW,
      [
        { key: 'classic', label: 'Classic look' },
        { key: 'real', label: 'Real look' },
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
    currY += 38;

    this.drawDottedDivider(dividers, currY - 4, totalW, isDark);

    // ── SECTION 2: PLAY ────────────────────────────────────────────
    const playSec = new Text({ text: 'PLAY', style: sectionStyle });
    playSec.y = currY;
    cc.addChild(playSec);
    currY += 16;

    const aimRow = this.createToggleRow(
      totalW,
      'Aim guide',
      'Arrow, path and spin. Off keeps the power bar.',
      this.settings.aimGuide,
      (val) => {
        this.settings.aimGuide = val;
        this.emit('settings_changed', this.settings);
        this.renderContent();
      }
    );
    aimRow.y = currY;
    cc.addChild(aimRow);
    currY += 36;

    const motionRow = this.createToggleRow(
      totalW,
      'Reduce motion',
      'No shake, zoom or moving effects.',
      this.settings.reduceMotion,
      (val) => {
        this.settings.reduceMotion = val;
        this.emit('settings_changed', this.settings);
        this.renderContent();
      }
    );
    motionRow.y = currY;
    cc.addChild(motionRow);
    currY += 36;

    const vibRow = this.createToggleRow(
      totalW,
      'Vibration',
      'A light buzz while you pull.',
      this.settings.vibration,
      (val) => {
        this.settings.vibration = val;
        soundManager.setVibrationEnabled(val);
        this.emit('settings_changed', this.settings);
        this.renderContent();
      }
    );
    vibRow.y = currY;
    cc.addChild(vibRow);
    currY += 36;

    const autoRow = this.createToggleRow(
      totalW,
      'Automatic next match',
      'Starts 5 seconds after a win.',
      this.settings.automaticNextMatch,
      (val) => {
        this.settings.automaticNextMatch = val;
        this.emit('settings_changed', this.settings);
        this.renderContent();
      }
    );
    autoRow.y = currY;
    cc.addChild(autoRow);
    currY += 38;

    const seriesLbl = new Text({
      text: 'Series length · Starts with the next series.',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 11.5,
        fill: textPrimaryColor,
        fontWeight: 'bold'
      })
    });
    seriesLbl.y = currY;
    cc.addChild(seriesLbl);
    currY += 18;

    const formatRow = this.createSegmentedControl(
      totalW,
      [
        { key: 'first_to_3', label: 'First to 3' },
        { key: 'first_to_5', label: 'First to 5' },
        { key: 'endless', label: 'Endless' },
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
    currY += 38;

    this.drawDottedDivider(dividers, currY - 4, totalW, isDark);

    // ── SECTION 3: SOUND ───────────────────────────────────────────
    const soundSec = new Text({ text: 'SOUND', style: sectionStyle });
    soundSec.y = currY;
    cc.addChild(soundSec);
    currY += 16;

    const sndToggle = this.createToggleRow(
      totalW,
      'Sound',
      'Off silences effects and music.',
      this.settings.soundEnabled,
      (val) => {
        this.settings.soundEnabled = val;
        soundManager.setEnabled(val);
        this.emit('settings_changed', this.settings);
        this.renderContent();
      }
    );
    sndToggle.y = currY;
    cc.addChild(sndToggle);
    currY += 36;

    const overallRow = this.createVolumeRow(totalW, 'Overall volume', this.settings.overallVolume, (val) => {
      this.settings.overallVolume = val;
      soundManager.setOverallVolume(val);
      soundManager.play('ui_click');
      this.renderContent();
    });
    overallRow.y = currY;
    cc.addChild(overallRow);
    currY += 30;

    const sfxRow = this.createVolumeRow(totalW, 'Effects volume', this.settings.sfxVolume, (val) => {
      this.settings.sfxVolume = val;
      soundManager.setSFXVolume(val);
      soundManager.play('flick');
      this.renderContent();
    });
    sfxRow.y = currY;
    cc.addChild(sfxRow);
    currY += 30;

    const musicRow = this.createVolumeRow(totalW, 'Music volume', this.settings.musicVolume, (val) => {
      this.settings.musicVolume = val;
      soundManager.setMusicVolume(val);
      this.renderContent();
    });
    musicRow.y = currY;
    cc.addChild(musicRow);
    currY += 34;

    this.drawDottedDivider(dividers, currY - 4, totalW, isDark);

    // ── SECTION 4: PROGRESS & ABOUT ────────────────────────────────
    const progRow = new Container();
    progRow.y = currY;
    const resetLbl = new Text({
      text: 'Reset progress · Pens, XP and streaks',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 11.5,
        fill: textPrimaryColor,
        fontWeight: 'bold'
      })
    });
    resetLbl.y = 5;
    progRow.addChild(resetLbl);

    const resetBtn = new Container();
    resetBtn.x = totalW - 64;
    resetBtn.eventMode = 'static';
    resetBtn.cursor = 'pointer';
    const rBg = new Graphics()
      .roundRect(0, 0, 64, 26, 8)
      .fill({ color: 0xFCA5A5 })
      .stroke({ color: 0x2B333E, width: 1.8 });
    resetBtn.addChild(rBg);
    const rTxt = new Text({
      text: 'Reset',
      style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 12, fill: 0x2B333E, fontWeight: 'bold' })
    });
    rTxt.anchor.set(0.5, 0.5);
    rTxt.x = 32;
    rTxt.y = 13;
    resetBtn.addChild(rTxt);
    resetBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      try {
        localStorage.removeItem('pen_fight_progression');
      } catch {}
      this.emit('reset_progress');
    });
    progRow.addChild(resetBtn);
    cc.addChild(progRow);
    currY += 32;

    const aboutTxt = new Text({
      text: 'Desk Wars · Pen Fight · Version 1.5.1 · Fonts: Fredoka & Nunito',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10.5,
        fill: textSecColor,
        fontWeight: '700'
      })
    });
    aboutTxt.anchor.set(0.5, 0);
    aboutTxt.x = totalW / 2;
    aboutTxt.y = currY;
    cc.addChild(aboutTxt);
  }

  private createSegmentedControl(
    totalW: number,
    items: { key: string; label: string }[],
    currentKey: string,
    onSelect: (key: string) => void,
  ): Container {
    const row = new Container();
    const itemW = (totalW - (items.length - 1) * 6) / items.length;
    const isDark = this.settings.uiTheme === 'dark';

    items.forEach((item, idx) => {
      const isSelected = item.key === currentKey;
      const x = idx * (itemW + 6);

      const btn = new Container();
      btn.x = x;

      const unselectedBg = isDark ? 0x2A3244 : 0xEAE2CF;
      const unselectedBorder = isDark ? 0x374151 : 0xBFB5A0;

      const bg = new Graphics()
        .roundRect(0, 0, itemW, 28, 9)
        .fill({ color: isSelected ? 0xFAD24B : unselectedBg })
        .stroke({ color: isSelected ? 0x2B333E : unselectedBorder, width: isSelected ? 2.2 : 1.5 });
      btn.addChild(bg);

      const txt = new Text({
        text: item.label,
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 12,
          fill: isSelected ? 0x2B333E : (isDark ? 0xCBD5E1 : 0x2B333E),
          fontWeight: 'bold',
        }),
      });
      txt.anchor.set(0.5, 0.5);
      txt.x = itemW / 2;
      txt.y = 14;
      btn.addChild(txt);

      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', (e) => {
        e.stopPropagation();
        soundManager.play('ui_click');
        onSelect(item.key);
      });

      row.addChild(btn);
    });

    return row;
  }

  private createToggleRow(
    totalW: number,
    label: string,
    subtitle: string,
    enabled: boolean,
    onToggle: (val: boolean) => void
  ): Container {
    const row = new Container();
    const isDark = this.settings.uiTheme === 'dark';

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: isDark ? 0xF3F4F6 : 0x2B333E,
      }),
    });
    txt.x = 0;
    txt.y = 0;
    row.addChild(txt);

    const sub = new Text({
      text: subtitle,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10.5,
        fontWeight: '700',
        fill: isDark ? 0x9CA3AF : 0x6E6658,
      }),
    });
    sub.x = 0;
    sub.y = 16;
    row.addChild(sub);

    const toggle = new Container();
    toggle.x = totalW - 46;
    toggle.y = 4;

    const track = new Graphics()
      .roundRect(0, 0, 44, 22, 11)
      .fill({ color: enabled ? 0xA7CC8D : (isDark ? 0x374151 : 0xD5CBB8) })
      .stroke({ color: 0x2B333E, width: 2 });
    toggle.addChild(track);

    const thumb = new Graphics()
      .circle(enabled ? 33 : 11, 11, 8)
      .fill({ color: COLORS.white })
      .stroke({ color: 0x2B333E, width: 2 });
    toggle.addChild(thumb);

    toggle.eventMode = 'static';
    toggle.cursor = 'pointer';
    toggle.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      onToggle(!enabled);
    });

    row.addChild(toggle);
    return row;
  }

  private createVolumeRow(totalW: number, label: string, volume: number, onChange: (val: number) => void): Container {
    const row = new Container();
    const isDark = this.settings.uiTheme === 'dark';

    const txt = new Text({
      text: `${label} (${Math.round(volume * 100)}%)`,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 12,
        fontWeight: 'bold',
        fill: isDark ? 0xF3F4F6 : 0x2B333E,
      }),
    });
    txt.x = 0;
    txt.y = 3;
    row.addChild(txt);

    // Visual slider bar + [-]/[+] steppers
    const barW = 92;
    const barX = totalW - 168;
    const barG = new Graphics()
      .roundRect(barX, 8, barW, 8, 4)
      .fill({ color: 0xD5CBB8 })
      .stroke({ color: 0x2B333E, width: 1.4 });
    if (volume > 0.01) {
      barG.roundRect(barX, 8, Math.max(8, barW * volume), 8, 4)
        .fill({ color: 0xFAD24B })
        .stroke({ color: 0x2B333E, width: 1.4 });
    }
    row.addChild(barG);

    const btnMinus = this.createSmallBtn('–', () => {
      onChange(Math.max(0, parseFloat((volume - 0.1).toFixed(1))));
    });
    btnMinus.x = totalW - 68;

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
      .roundRect(0, 0, 32, 22, 6)
      .fill({ color: isDark ? 0x2A3244 : 0xEAE2CF })
      .stroke({ color: isDark ? 0x11161D : 0x2B333E, width: 1.6 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 14,
        fontWeight: 'bold',
        fill: isDark ? 0xF3F4F6 : 0x2B333E,
      }),
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = 16;
    txt.y = 11;
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
    this.settings.uiTheme = themeManager.prefs.uiTheme;
    this.settings.deskStyle = themeManager.prefs.deskTheme === 'old-school' ? 'old_school' : 'clean';
    this.settings.penLook = themeManager.prefs.penLook;

    try {
      const raw = localStorage.getItem('pen_fight_settings');
      if (raw) {
        this.settings = { ...this.settings, ...JSON.parse(raw) };
      }
    } catch {}

    soundManager.setEnabled(this.settings.soundEnabled);
    soundManager.setOverallVolume(this.settings.overallVolume);
    soundManager.setSFXVolume(this.settings.sfxVolume);
    soundManager.setMusicVolume(this.settings.musicVolume);
    soundManager.setVibrationEnabled(this.settings.vibration);
  }
}
