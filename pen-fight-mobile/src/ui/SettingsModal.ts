/**
 * src/ui/SettingsModal.ts
 * 100% Authentic Single-Page "Make it yours" Settings Modal matching shunneklabs.app reference (Image 2).
 *
 * Features:
 * - Header: Gear icon in cream rounded square, title `Make it yours`, close button [ ✕ ].
 * - SCREEN section:
 *   - Theme: [ ☀️ System ] [ ☀️ Light ] [ 🌙 Dark ]
 *   - Language: [ Deutsch ] [ English ]
 * - Dotted divider line.
 * - PLAY section with rounded icon badges + Neobrutalist mint-green sliding toggle switches:
 *   - 🔎 Aim guide (Arrow, path and spin. Off keeps the power bar.)
 *   - 〰️ Reduce motion (No shake, zoom or moving effects.)
 *   - 📳 Vibration (A light buzz while you pull.)
 *   - ⏱️ Automatic next match (Starts 5 seconds after a win.)
 *   - ⛶ Full screen (Hides the browser bar when a match starts.)
 *   - Series length: [ First to 3 ] [ First to 5 ] [ Endless ]
 * - Dotted divider line.
 * - MATCH DESK WOOD section (allows changing the board gameplay wood):
 *   - [ ☕ Espresso ] [ 🪵 Teak ] [ 🍷 Mahogany ] [ 🌑 Slate ]
 * - SOUND section & Reset progress.
 * - Tap-Through Bug Free: `card.eventMode = 'static'` and `stopPropagation()` prevent accidental dismissals.
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
  language: 'de' | 'en';
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
    uiTheme: 'system',
    language: 'en',
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

    // Backdrop blocks clicks from reaching the menu behind it
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
    const cardH = Math.min(screenHeight - 16, 756);
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

    // Top pill drag indicator
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
    const sectionHdrStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 10,
      fill: textMuted,
      fontWeight: '800',
      letterSpacing: 1.2
    });

    const subLabelStyle = new TextStyle({
      fontFamily: 'Fredoka, sans-serif',
      fontSize: 12,
      fill: textPrimary,
      fontWeight: 'bold',
    });

    // === SECTION 1: SCREEN ===
    const scrHdr = new Text({ text: 'SCREEN', style: sectionHdrStyle });
    scrHdr.y = currY;
    cc.addChild(scrHdr);
    currY += 15;

    const themeLbl = new Text({ text: 'Theme', style: subLabelStyle });
    themeLbl.y = currY;
    cc.addChild(themeLbl);
    currY += 16;

    const themeRow = this.createSegmentedControl(
      totalW,
      [
        { key: 'system', label: '⚙️ System' },
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
    currY += 36;

    const langLbl = new Text({ text: 'Language', style: subLabelStyle });
    langLbl.y = currY;
    cc.addChild(langLbl);
    currY += 16;

    const langRow = this.createSegmentedControl(
      totalW,
      [
        { key: 'de', label: 'Deutsch' },
        { key: 'en', label: 'English' },
      ],
      this.settings.language || 'en',
      (val) => {
        this.settings.language = val as 'de' | 'en';
        this.emit('settings_changed', this.settings);
        this.renderContent();
      }
    );
    langRow.y = currY;
    cc.addChild(langRow);
    currY += 38;

    this.drawDashedDivider(cc, totalW, currY);
    currY += 8;

    // === SECTION 2: PLAY ===
    const playHdr = new Text({ text: 'PLAY', style: sectionHdrStyle });
    playHdr.y = currY;
    cc.addChild(playHdr);
    currY += 15;

    const aimRow = this.createCompactToggleRow(
      totalW,
      '🔎',
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
    currY += 38;

    const motionRow = this.createCompactToggleRow(
      totalW,
      '〰️',
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
    currY += 38;

    const vibRow = this.createCompactToggleRow(
      totalW,
      '📳',
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
    currY += 38;

    const autoRow = this.createCompactToggleRow(
      totalW,
      '⏱️',
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

    const fsRow = this.createCompactToggleRow(
      totalW,
      '⛶',
      'Full screen',
      'Hides the browser bar when a match starts.',
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
    currY += 40;

    const seriesLbl = new Text({
      text: 'Series length',
      style: subLabelStyle,
    });
    seriesLbl.y = currY;
    cc.addChild(seriesLbl);
    currY += 16;

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

    // === SECTION 3: MATCH DESK WOOD (Gameplay Arena Board) ===
    const deskHdr = new Text({ text: 'MATCH DESK WOOD', style: sectionHdrStyle });
    deskHdr.y = currY;
    cc.addChild(deskHdr);
    currY += 15;

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

    this.drawDashedDivider(cc, totalW, currY);
    currY += 8;

    // === SECTION 4: SOUND ===
    const sndHdr = new Text({ text: 'SOUND', style: sectionHdrStyle });
    sndHdr.y = currY;
    cc.addChild(sndHdr);
    currY += 15;

    const sndRow = this.createCompactToggleRow(
      totalW,
      '🔊',
      'Sound FX & Music',
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
    currY += 26;

    const sfxRow = this.createCompactVolumeRow(totalW, 'Effects volume', this.settings.sfxVolume, (val) => {
      this.settings.sfxVolume = val;
      soundManager.setSFXVolume(val);
      soundManager.play('flick');
      this.renderContent();
    });
    sfxRow.y = currY;
    cc.addChild(sfxRow);
    currY += 26;

    const musRow = this.createCompactVolumeRow(totalW, 'Music volume', this.settings.musicVolume, (val) => {
      this.settings.musicVolume = val;
      soundManager.setMusicVolume(val);
      this.renderContent();
    });
    musRow.y = currY;
    cc.addChild(musRow);
    currY += 30;

    this.drawDashedDivider(cc, totalW, currY);
    currY += 8;

    // === SECTION 5: RESET PROGRESS & FOOTER ===
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

    const resetBtn = new Container();
    resetBtn.x = totalW - 68;
    resetBtn.y = 2;
    const rBg = new Graphics()
      .roundRect(0, 0, 68, 28, 8)
      .fill({ color: 0xFEE2E2 })
      .stroke({ color: 0xDC2626, width: 1.8 });
    resetBtn.addChild(rBg);

    const rBtnTxt = new Text({
      text: 'Reset',
      style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 11, fill: 0xDC2626, fontWeight: 'bold' })
    });
    rBtnTxt.anchor.set(0.5, 0.5);
    rBtnTxt.x = 34;
    rBtnTxt.y = 14;
    resetBtn.addChild(rBtnTxt);

    resetBtn.eventMode = 'static';
    resetBtn.cursor = 'pointer';
    resetBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      try {
        localStorage.removeItem('shunnek_pen_fight_progression');
        soundManager.play('round_lose');
        window.location.reload();
      } catch {}
    });
    resetRow.addChild(resetBtn);

    cc.addChild(resetRow);
  }

  private drawDashedDivider(parent: Container, totalW: number, y: number): void {
    const isDark = this.settings.uiTheme === 'dark';
    const div = new Graphics();
    const dotW = 4;
    const dotGap = 4;
    const col = isDark ? 0x334155 : 0xD5CCBE;

    for (let x = 0; x < totalW; x += dotW + dotGap) {
      div.rect(x, y, dotW, 1.2).fill({ color: col });
    }
    parent.addChild(div);
  }

  private createSegmentedControl(
    totalW: number,
    items: { key: string; label: string }[],
    selectedKey: string,
    onSelect: (key: string) => void
  ): Container {
    const row = new Container();
    const count = items.length;
    const gap = 6;
    const itemW = (totalW - (count - 1) * gap) / count;
    const isDark = this.settings.uiTheme === 'dark';

    items.forEach((item, idx) => {
      const isSelected = item.key === selectedKey;
      const x = idx * (itemW + gap);

      const btn = new Container();
      btn.x = x;

      const unselectedBg = isDark ? 0x334155 : 0xEAE2CF;
      const selectedBg = item.key === 'system' ? 0x93C5FD : COLORS.butterYellow;

      const bg = new Graphics()
        .roundRect(0, 0, itemW, 30, 9)
        .fill({ color: isSelected ? selectedBg : unselectedBg })
        .stroke({ color: 0x2B333E, width: isSelected ? 2.2 : 1.6 });
      btn.addChild(bg);

      const txt = new Text({
        text: item.label,
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 11.5,
          fill: 0x2B333E,
          fontWeight: 'bold',
        }),
      });
      txt.anchor.set(0.5, 0.5);
      txt.x = itemW / 2;
      txt.y = 15;
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
    iconStr: string,
    label: string,
    subtitle: string,
    enabled: boolean,
    onToggle: (val: boolean) => void
  ): Container {
    const row = new Container();
    const isDark = this.settings.uiTheme === 'dark';

    // Left Square Icon Tile
    const iconTile = new Graphics()
      .roundRect(0, 0, 30, 30, 9)
      .fill({ color: isDark ? 0x334155 : 0xEAE2CF })
      .stroke({ color: 0x2B333E, width: 1.8 });
    row.addChild(iconTile);

    const iconTxt = new Text({
      text: iconStr,
      style: new TextStyle({ fontSize: 15 }),
    });
    iconTxt.anchor.set(0.5, 0.5);
    iconTxt.x = 15;
    iconTxt.y = 15;
    row.addChild(iconTxt);

    // Label & Subtitle
    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 12.5,
        fontWeight: 'bold',
        fill: isDark ? 0xF8FAFC : 0x2B333E,
      }),
    });
    txt.x = 38;
    txt.y = 0;
    row.addChild(txt);

    const sub = new Text({
      text: subtitle,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 9.6,
        fontWeight: '700',
        fill: isDark ? 0x94A3B8 : 0x6E6658,
      }),
    });
    sub.x = 38;
    sub.y = 16;
    row.addChild(sub);

    // Neobrutalist Sliding Toggle Switch
    const toggle = new Container();
    toggle.x = totalW - 44;
    toggle.y = 3;

    const track = new Graphics()
      .roundRect(0, 0, 42, 22, 11)
      .fill({ color: enabled ? 0x4ADE80 : (isDark ? 0x475569 : 0xD5CCBE) })
      .stroke({ color: 0x2B333E, width: 2 });
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
        fontSize: 11,
        fontWeight: '800',
        fill: isDark ? 0xF8FAFC : 0x2B333E,
      }),
    });
    txt.x = 0;
    txt.y = 3;
    row.addChild(txt);

    const btnMinus = this.createSmallBtn('–', () => {
      onChange(Math.max(0, parseFloat((volume - 0.1).toFixed(1))));
    });
    btnMinus.x = totalW - 60;
    btnMinus.y = 0;

    const btnPlus = this.createSmallBtn('+', () => {
      onChange(Math.min(1, parseFloat((volume + 0.1).toFixed(1))));
    });
    btnPlus.x = totalW - 28;
    btnPlus.y = 0;

    row.addChild(btnMinus);
    row.addChild(btnPlus);

    return row;
  }

  private createSmallBtn(label: string, onClick: () => void): Container {
    const btn = new Container();
    const bg = new Graphics()
      .roundRect(0, 0, 26, 20, 6)
      .fill({ color: 0xEAE2CF })
      .stroke({ color: 0x2B333E, width: 1.6 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0x2B333E,
      }),
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = 13;
    txt.y = 10;
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
