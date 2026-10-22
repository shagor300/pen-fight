/**
 * src/ui/SettingsModal.ts
 * Authentic Single-Page "Make it yours" Settings Modal matching https://shunneklabs.app/games/pen-fight/.
 *
 * Key Fixes:
 * 1. Tap-Through Bug Fixed: `this.card.eventMode = 'static'` + `stopPropagation()` ensures tapping
 *    anywhere inside the Settings card NEVER triggers the backdrop or closes the modal!
 *    Closing happens ONLY when pressing the top-right `[✕]` button.
 * 2. Restored the clean, cohesive single-page `Make it yours` layout with SCREEN, PLAY, SOUND,
 *    and Reset progress sections separated by crisp dotted dividers.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, MatchFormat } from '../config/gameConstants';
import { soundManager } from '../audio/SoundAndHaptics';
import { themeManager, UiThemeMode, PenLookMode } from './ThemeManager';
import EventEmitter from 'eventemitter3';

export type DeskStyle = 'coffee' | 'oak' | 'mahogany' | 'slate' | 'clean' | 'old_school';
export type PenLook = 'classic' | 'real';

export type PhysicsModeKey = 'classic' | 'real';

export interface GameSettings {
  uiTheme: UiThemeMode;
  deskStyle: DeskStyle;
  penLook: PenLook;
  physicsMode: PhysicsModeKey;
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
    deskStyle: 'coffee',
    penLook: 'real',
    physicsMode: 'classic',
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

    // Backdrop blocks clicks from reaching the menu behind it, without accidentally closing when tapping the card
    this.backdrop = new Graphics();
    this.backdrop.eventMode = 'static';
    this.backdrop.on('pointerdown', (e) => {
      e.stopPropagation();
    });
    this.container.addChild(this.backdrop);

    // Card surface absorbs all taps inside the modal so it NEVER closes on accidental touch
    this.card = new Graphics();
    this.card.eventMode = 'static';
    this.card.on('pointerdown', (e) => {
      e.stopPropagation();
    });
    this.container.addChild(this.card);

    this.contentContainer = new Container();
    this.contentContainer.eventMode = 'static';
    this.contentContainer.on('pointerdown', (e) => {
      e.stopPropagation();
    });
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
      .roundRect(-16, -16, 32, 32, 10)
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
      .fill({ color: 0x0F172A, alpha: 0.68 });

    const cardW = Math.min(screenWidth - 20, 404);
    const cardH = Math.min(screenHeight - 16, 748);
    const cardX = (screenWidth - cardW) / 2;
    const cardY = (screenHeight - cardH) / 2;

    const cardBgColor = isDark ? 0x1E293B : 0xF7F3E3;
    const cardBorderColor = isDark ? 0x0F172A : 0x2B333E;

    this.card.clear()
      .roundRect(cardX, cardY + 6, cardW, cardH, 24)
      .fill({ color: COLORS.navyShadow })
      .roundRect(cardX, cardY, cardW, cardH, 24)
      .fill({ color: cardBgColor })
      .stroke({ color: cardBorderColor, width: 3.4 });

    this.card
      .roundRect(screenWidth / 2 - 22, cardY + 8, 44, 4, 2)
      .fill({ color: isDark ? 0x475569 : 0xC8BFA8 });

    this.closeBtn.x = cardX + cardW - 32;
    this.closeBtn.y = cardY + 32;

    this.contentContainer.x = cardX + 18;
    this.contentContainer.y = cardY + 16;
  }

  private renderContent(): void {
    const cc = this.contentContainer;
    cc.removeChildren();

    const isDark = this.settings.uiTheme === 'dark';
    const textPrimary = isDark ? 0xF8FAFC : 0x2B333E;
    const textMuted = isDark ? 0x94A3B8 : 0x6E6658;
    const totalW = Math.min(this.screenWidth - 56, 368);

    // Header: [⚙] Make it yours
    const gearBadge = new Graphics()
      .roundRect(0, 0, 30, 30, 9)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: 0x2B333E, width: 2 });
    cc.addChild(gearBadge);

    const gearTxt = new Text({
      text: '⚙',
      style: new TextStyle({ fontSize: 16, fill: 0x2B333E, fontWeight: 'bold' })
    });
    gearTxt.anchor.set(0.5, 0.5);
    gearTxt.x = 15;
    gearTxt.y = 15;
    cc.addChild(gearTxt);

    const title = new Text({
      text: 'Make it yours',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 20,
        fill: textPrimary,
        fontWeight: 'bold',
      })
    });
    title.x = 38;
    title.y = 2;
    cc.addChild(title);

    let currY = 38;
    const labelStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 10,
      fill: textMuted,
      fontWeight: '800',
      letterSpacing: 1.2
    });

    // === SECTION 1: SCREEN ===
    const scrHdr = new Text({ text: 'SCREEN', style: labelStyle });
    scrHdr.y = currY;
    cc.addChild(scrHdr);
    currY += 16;

    const themeRow = this.createSegmentedControl(
      totalW,
      [
        { key: 'light', label: '☀️ Light' },
        { key: 'dark', label: '🌙 Dark' },
      ],
      this.settings.uiTheme,
      async (val) => {
        this.settings.uiTheme = val as UiThemeMode;
        await themeManager.setUiTheme(this.settings.uiTheme);
        this.emit('settings_changed', this.settings);
        this.layout();
        this.renderContent();
      }
    );
    themeRow.y = currY;
    cc.addChild(themeRow);
    currY += 38;

    const deskRow = this.createSegmentedControl(
      totalW,
      [
        { key: 'coffee', label: '☕ Espresso' },
        { key: 'oak', label: '🪵 Teak' },
        { key: 'mahogany', label: '🍷 Mahogany' },
        { key: 'slate', label: '🌑 Slate' },
      ],
      themeManager.getNormalizedDeskTheme(),
      async (val) => {
        this.settings.deskStyle = val as DeskStyle;
        await themeManager.setDeskTheme(val as any);
        this.emit('settings_changed', this.settings);
        this.renderContent();
      }
    );
    deskRow.y = currY;
    cc.addChild(deskRow);
    currY += 38;

    const penRow = this.createSegmentedControl(
      totalW,
      [
        { key: 'classic', label: '🎨 Classic look' },
        { key: 'real', label: '✨ Real look' },
      ],
      this.settings.penLook,
      async (val) => {
        this.settings.penLook = val as PenLook;
        await themeManager.setPenLook(val as PenLookMode);
        this.emit('settings_changed', this.settings);
        this.renderContent();
      }
    );
    penRow.y = currY;
    cc.addChild(penRow);
    currY += 38;

    const fsRow = this.createCompactToggleRow(
      totalW,
      'Full screen',
      'Fills the screen. Press Esc to exit.',
      this.settings.fullScreen,
      (val) => {
        this.settings.fullScreen = val;
        if (val && !document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else if (!val && document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        this.renderContent();
      }
    );
    fsRow.y = currY;
    cc.addChild(fsRow);
    currY += 38;

    this.drawDashedDivider(cc, totalW, currY);
    currY += 8;

    // === SECTION 2: PLAY ===
    const playHdr = new Text({ text: 'PLAY', style: labelStyle });
    playHdr.y = currY;
    cc.addChild(playHdr);
    currY += 16;

    const physicsRow = this.createSegmentedControl(
      totalW,
      [
        { key: 'classic', label: '🎮 Classic' },
        { key: 'real', label: '⚙️ Real' },
      ],
      this.settings.physicsMode,
      (val) => {
        this.settings.physicsMode = val as PhysicsModeKey;
        this.emit('settings_changed', this.settings);
        this.renderContent();
      }
    );
    physicsRow.y = currY;
    cc.addChild(physicsRow);
    currY += 38;

    const aimRow = this.createCompactToggleRow(
      totalW,
      'Aim guide',
      'Arrow, path and spin arc. Off keeps the power bar.',
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

    const motionRow = this.createCompactToggleRow(
      totalW,
      'Reduce motion',
      'Calms moving backgrounds and confetti.',
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

    const vibRow = this.createCompactToggleRow(
      totalW,
      'Vibration',
      'Short buzz on hits. Android and supported controllers.',
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

    const autoRow = this.createCompactToggleRow(
      totalW,
      'Automatic next match',
      'Starts the next match 5 seconds after a round ends.',
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
      text: 'Series length · starts next series',
      style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 11, fill: textPrimary, fontWeight: '800' })
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
      }
    );
    formatRow.y = currY;
    cc.addChild(formatRow);
    currY += 38;

    this.drawDashedDivider(cc, totalW, currY);
    currY += 8;

    // === SECTION 3: SOUND ===
    const sndHdr = new Text({ text: 'SOUND', style: labelStyle });
    sndHdr.y = currY;
    cc.addChild(sndHdr);
    currY += 16;

    const sndRow = this.createCompactToggleRow(
      totalW,
      'Sound',
      'Off silences everything.',
      this.settings.soundEnabled,
      (val) => {
        this.settings.soundEnabled = val;
        soundManager.setEnabled(val);
        this.emit('settings_changed', this.settings);
        this.renderContent();
      }
    );
    sndRow.y = currY;
    cc.addChild(sndRow);
    currY += 36;

    const ovRow = this.createCompactVolumeRow(totalW, 'Overall volume', this.settings.overallVolume, (val) => {
      this.settings.overallVolume = val;
      soundManager.setOverallVolume(val);
      soundManager.play('ui_click');
      this.renderContent();
    });
    ovRow.y = currY;
    cc.addChild(ovRow);
    currY += 28;

    const sfxRow = this.createCompactVolumeRow(totalW, 'Effects volume', this.settings.sfxVolume, (val) => {
      this.settings.sfxVolume = val;
      soundManager.setSFXVolume(val);
      soundManager.play('flick');
      this.renderContent();
    });
    sfxRow.y = currY;
    cc.addChild(sfxRow);
    currY += 28;

    const musRow = this.createCompactVolumeRow(totalW, 'Music volume', this.settings.musicVolume, (val) => {
      this.settings.musicVolume = val;
      soundManager.setMusicVolume(val);
      this.renderContent();
    });
    musRow.y = currY;
    cc.addChild(musRow);
    currY += 32;

    this.drawDashedDivider(cc, totalW, currY);
    currY += 8;

    // === SECTION 4: RESET PROGRESS & FOOTER ===
    const resetRow = new Container();
    resetRow.y = currY;
    const rTitle = new Text({
      text: 'Reset progress',
      style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 13, fill: textPrimary, fontWeight: 'bold' })
    });
    rTitle.y = 0;
    resetRow.addChild(rTitle);

    const rSub = new Text({
      text: 'Clears XP, levels and streaks. Settings stay.',
      style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 10, fill: textMuted, fontWeight: '700' })
    });
    rSub.y = 16;
    resetRow.addChild(rSub);

    const rBtn = new Container();
    rBtn.x = totalW - 64;
    rBtn.y = 3;
    rBtn.eventMode = 'static';
    rBtn.cursor = 'pointer';
    rBtn.addChild(
      new Graphics()
        .roundRect(0, 0, 64, 26, 8)
        .fill({ color: isDark ? 0x334155 : 0xEAE2CF })
        .stroke({ color: 0x2B333E, width: 1.8 })
    );
    const rTxt = new Text({
      text: 'Reset',
      style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 12, fill: textPrimary, fontWeight: 'bold' })
    });
    rTxt.anchor.set(0.5, 0.5);
    rTxt.x = 32;
    rTxt.y = 13;
    rBtn.addChild(rTxt);
    rBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      try {
        localStorage.removeItem('pen_fight_progression');
        localStorage.removeItem('pen_fight_stats');
      } catch {}
      this.emit('reset_progress');
    });
    resetRow.addChild(rBtn);
    cc.addChild(resetRow);
    currY += 38;

    const footer = new Text({
      text: 'Version 1.5.1 · Games · Give feedback · Privacy · Terms',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10,
        fill: textMuted,
        fontWeight: '700'
      })
    });
    footer.anchor.set(0.5, 0);
    footer.x = totalW / 2;
    footer.y = currY;
    cc.addChild(footer);
  }

  private drawDashedDivider(parent: Container, totalW: number, y: number): void {
    const g = new Graphics();
    for (let x = 0; x < totalW; x += 10) {
      g.rect(x, y, 5, 1.2).fill({ color: 0xC8BFA8, alpha: 0.7 });
    }
    parent.addChild(g);
  }

  private createSegmentedControl(
    totalW: number,
    items: { key: string; label: string }[],
    currentKey: string,
    onSelect: (key: string) => void
  ): Container {
    const row = new Container();
    const itemW = (totalW - (items.length - 1) * 8) / items.length;
    const isDark = this.settings.uiTheme === 'dark';

    items.forEach((item, idx) => {
      const isSelected = item.key === currentKey;
      const x = idx * (itemW + 8);

      const btn = new Container();
      btn.x = x;

      const unselectedBg = isDark ? 0x334155 : 0xEAE2CF;
      const bg = new Graphics()
        .roundRect(0, 0, itemW, 31, 9)
        .fill({ color: isSelected ? COLORS.butterYellow : unselectedBg })
        .stroke({ color: 0x2B333E, width: isSelected ? 2.2 : 1.6 });
      btn.addChild(bg);

      const txt = new Text({
        text: item.label,
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 12,
          fill: isSelected ? 0x2B333E : (isDark ? 0xF8FAFC : 0x2B333E),
          fontWeight: 'bold',
        }),
      });
      txt.anchor.set(0.5, 0.5);
      txt.x = itemW / 2;
      txt.y = 15.5;
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

  private createCompactToggleRow(
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
        fontSize: 12.5,
        fontWeight: 'bold',
        fill: isDark ? 0xF8FAFC : 0x2B333E,
      }),
    });
    txt.x = 0;
    txt.y = 0;
    row.addChild(txt);

    const sub = new Text({
      text: subtitle,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 9.8,
        fontWeight: '700',
        fill: isDark ? 0x94A3B8 : 0x6E6658,
      }),
    });
    sub.x = 0;
    sub.y = 16;
    row.addChild(sub);

    const toggle = new Container();
    toggle.x = totalW - 44;
    toggle.y = 4;

    const track = new Graphics()
      .roundRect(0, 0, 42, 22, 11)
      .fill({ color: enabled ? 0x86EFAC : 0xCBD5E1 })
      .stroke({ color: 0x2B333E, width: 1.8 });
    toggle.addChild(track);

    const thumb = new Graphics()
      .circle(enabled ? 31 : 11, 11, 7.5)
      .fill({ color: COLORS.white })
      .stroke({ color: 0x2B333E, width: 1.8 });
    toggle.addChild(thumb);

    row.eventMode = 'static';
    row.cursor = 'pointer';
    row.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      onToggle(!enabled);
    });

    row.addChild(toggle);
    return row;
  }

  private createCompactVolumeRow(
    totalW: number,
    label: string,
    volume: number,
    onChange: (val: number) => void
  ): Container {
    const row = new Container();
    const isDark = this.settings.uiTheme === 'dark';

    const txt = new Text({
      text: `${label} (${Math.round(volume * 100)}%)`,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 11.5,
        fontWeight: '800',
        fill: isDark ? 0xF8FAFC : 0x2B333E,
      }),
    });
    txt.x = 0;
    txt.y = 4;
    row.addChild(txt);

    const btnMinus = this.createSmallBtn('–', () => {
      onChange(Math.max(0, parseFloat((volume - 0.1).toFixed(1))));
    });
    btnMinus.x = totalW - 64;
    btnMinus.y = 0;

    const btnPlus = this.createSmallBtn('+', () => {
      onChange(Math.min(1, parseFloat((volume + 0.1).toFixed(1))));
    });
    btnPlus.x = totalW - 30;
    btnPlus.y = 0;

    row.addChild(btnMinus);
    row.addChild(btnPlus);

    return row;
  }

  private createSmallBtn(label: string, onClick: () => void): Container {
    const btn = new Container();
    const bg = new Graphics()
      .roundRect(0, 0, 28, 22, 6)
      .fill({ color: 0xEAE2CF })
      .stroke({ color: 0x2B333E, width: 1.6 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: 0x2B333E,
      }),
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = 14;
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
    this.settings.deskStyle = themeManager.prefs.deskTheme === 'clean' ? 'clean' : 'old_school';
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
