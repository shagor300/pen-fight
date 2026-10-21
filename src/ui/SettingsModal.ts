/**
 * src/ui/SettingsModal.ts
 * Professional 3-Tab Settings Studio ("🎨 Visual & Map", "🎮 Gameplay", "🔊 Audio & Data").
 * Eliminates cramped vertical crowding while providing every setting from shunneklabs.app:
 * - Visual & Map: UI Theme (Light / Dark), Desk Map (Clean Oak / Old School Carved), Pen Look (Real 3D / Classic)
 * - Gameplay: Aim Guide, Reduce Motion, Haptic Vibration, Auto Next Match (5s), Series Length (First to 3 / 5 / Endless)
 * - Audio & Data: Master Sound Toggle, Overall Volume, Board & Hit SFX Volume, Music Volume, Reset Progress
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, MatchFormat } from '../config/gameConstants';
import { soundManager } from '../audio/SoundAndHaptics';
import { themeManager, UiThemeMode, PenLookMode } from './ThemeManager';
import EventEmitter from 'eventemitter3';

export type DeskStyle = 'clean' | 'old_school';
export type PenLook = 'classic' | 'real';
type SettingsTab = 'visual' | 'play' | 'audio';

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
  private activeTab: SettingsTab = 'visual';

  public settings: GameSettings = {
    uiTheme: 'light',
    deskStyle: 'old_school',
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
    this.backdrop.on('pointerdown', () => this.hide());
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
      .roundRect(-16, -16, 32, 32, 10)
      .fill({ color: 0xEAE2CF })
      .stroke({ color: 0x2B333E, width: 2 });
    btn.addChild(bg);

    const txt = new Text({
      text: '✕',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 14,
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
      .fill({ color: 0x0F172A, alpha: 0.72 });

    const cardW = Math.min(screenWidth - 24, 412);
    const cardH = Math.min(screenHeight - 36, 540);
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
      .roundRect(screenWidth / 2 - 22, cardY + 9, 44, 4, 2)
      .fill({ color: isDark ? 0x475569 : 0xC8BFA8 });

    this.closeBtn.x = cardX + cardW - 34;
    this.closeBtn.y = cardY + 38;

    this.contentContainer.x = cardX + 20;
    this.contentContainer.y = cardY + 22;
  }

  private renderContent(): void {
    const cc = this.contentContainer;
    cc.removeChildren();

    const isDark = this.settings.uiTheme === 'dark';
    const textPrimary = isDark ? 0xF8FAFC : 0x2B333E;
    const textMuted = isDark ? 0x94A3B8 : 0x6E6658;
    const totalW = Math.min(this.screenWidth - 64, 372);

    // Header
    const gearBadge = new Graphics()
      .roundRect(0, 0, 34, 34, 10)
      .fill({ color: COLORS.butterYellow })
      .stroke({ color: 0x2B333E, width: 2 });
    cc.addChild(gearBadge);

    const gearTxt = new Text({
      text: '⚙',
      style: new TextStyle({ fontSize: 18, fill: 0x2B333E, fontWeight: 'bold' })
    });
    gearTxt.anchor.set(0.5, 0.5);
    gearTxt.x = 17;
    gearTxt.y = 17;
    cc.addChild(gearTxt);

    const title = new Text({
      text: 'Make it yours',
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 22,
        fill: textPrimary,
        fontWeight: 'bold',
      })
    });
    title.x = 44;
    title.y = 3;
    cc.addChild(title);

    // 3 Studio Category Tabs
    const tabsY = 46;
    const tabW = (totalW - 12) / 3;
    const tabs: { id: SettingsTab; label: string }[] = [
      { id: 'visual', label: '🎨 Visual & Map' },
      { id: 'play', label: '🎮 Gameplay' },
      { id: 'audio', label: '🔊 Audio & Data' },
    ];

    tabs.forEach((t, idx) => {
      const isSel = this.activeTab === t.id;
      const tBtn = new Container();
      tBtn.x = idx * (tabW + 6);
      tBtn.y = tabsY;
      tBtn.eventMode = 'static';
      tBtn.cursor = 'pointer';
      tBtn.addChild(
        new Graphics()
          .roundRect(0, 0, tabW, 34, 10)
          .fill({ color: isSel ? COLORS.butterYellow : (isDark ? 0x334155 : 0xEAE2CF) })
          .stroke({ color: 0x2B333E, width: isSel ? 2.4 : 1.6 })
      );
      const lbl = new Text({
        text: t.label,
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 11.5,
          fill: isSel ? 0x2B333E : textPrimary,
          fontWeight: 'bold'
        })
      });
      lbl.anchor.set(0.5, 0.5);
      lbl.x = tabW / 2;
      lbl.y = 17;
      tBtn.addChild(lbl);
      tBtn.on('pointerdown', (e) => {
        e.stopPropagation();
        soundManager.play('ui_click');
        this.activeTab = t.id;
        this.renderContent();
      });
      cc.addChild(tBtn);
    });

    let currY = tabsY + 50;
    const labelStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 11,
      fill: textMuted,
      fontWeight: '800',
      letterSpacing: 1.2
    });

    if (this.activeTab === 'visual') {
      // 1. UI Theme
      const tLbl = new Text({ text: 'INTERFACE THEME', style: labelStyle });
      tLbl.y = currY;
      cc.addChild(tLbl);
      currY += 20;

      const themeRow = this.createSegmentedControl(
        totalW,
        [
          { key: 'light', label: '☀️ Warm Classroom' },
          { key: 'dark', label: '🌙 Midnight Slate' },
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
      currY += 54;

      // 2. Playground Desk Map
      const dLbl = new Text({ text: 'PLAYGROUND DESK MAP', style: labelStyle });
      dLbl.y = currY;
      cc.addChild(dLbl);
      currY += 20;

      const deskRow = this.createSegmentedControl(
        totalW,
        [
          { key: 'old_school', label: '🖍️ Old School Carved' },
          { key: 'clean', label: '✨ Clean Tournament Oak' },
        ],
        this.settings.deskStyle,
        async (val) => {
          this.settings.deskStyle = val as DeskStyle;
          await themeManager.setDeskTheme(val === 'old_school' ? 'old-school' : 'clean');
          this.emit('settings_changed', this.settings);
          this.renderContent();
        }
      );
      deskRow.y = currY;
      cc.addChild(deskRow);
      currY += 54;

      // 3. Pen Shader Mode
      const pLbl = new Text({ text: 'PEN RENDERING ENGINE', style: labelStyle });
      pLbl.y = currY;
      cc.addChild(pLbl);
      currY += 20;

      const penRow = this.createSegmentedControl(
        totalW,
        [
          { key: 'real', label: '✨ Real 3D Shaded' },
          { key: 'classic', label: '🎨 Classic Vector' },
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
      currY += 56;

      // 4. Full Screen Toggle
      const fsRow = this.createToggleCard(
        totalW,
        'Full screen mode',
        'Fills the entire screen. Press Esc to exit.',
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
    } else if (this.activeTab === 'play') {
      const aimRow = this.createToggleCard(
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
      currY += 62;

      const motionRow = this.createToggleCard(
        totalW,
        'Reduce motion',
        'Disables camera impact shake and moving effects.',
        this.settings.reduceMotion,
        (val) => {
          this.settings.reduceMotion = val;
          this.emit('settings_changed', this.settings);
          this.renderContent();
        }
      );
      motionRow.y = currY;
      cc.addChild(motionRow);
      currY += 62;

      const vibRow = this.createToggleCard(
        totalW,
        'Haptic vibration',
        'Tactile buzz on pull ticks and heavy collisions.',
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
      currY += 62;

      const autoRow = this.createToggleCard(
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
      currY += 66;

      const sLbl = new Text({ text: 'SERIES LENGTH (STARTS NEXT SERIES)', style: labelStyle });
      sLbl.y = currY;
      cc.addChild(sLbl);
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
    } else {
      // AUDIO & DATA TAB
      const sndRow = this.createToggleCard(
        totalW,
        'Master sound',
        'Off silences all board effects and background music.',
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
      currY += 68;

      const ovRow = this.createVolumeCard(totalW, 'Overall volume', this.settings.overallVolume, (val) => {
        this.settings.overallVolume = val;
        soundManager.setOverallVolume(val);
        soundManager.play('ui_click');
        this.renderContent();
      });
      ovRow.y = currY;
      cc.addChild(ovRow);
      currY += 62;

      const sfxRow = this.createVolumeCard(totalW, 'Board & Hit SFX volume', this.settings.sfxVolume, (val) => {
        this.settings.sfxVolume = val;
        soundManager.setSFXVolume(val);
        soundManager.play('flick');
        this.renderContent();
      });
      sfxRow.y = currY;
      cc.addChild(sfxRow);
      currY += 62;

      const musRow = this.createVolumeCard(totalW, 'Music volume', this.settings.musicVolume, (val) => {
        this.settings.musicVolume = val;
        soundManager.setMusicVolume(val);
        this.renderContent();
      });
      musRow.y = currY;
      cc.addChild(musRow);
      currY += 68;

      // Reset Progress Card
      const resetCard = new Container();
      resetCard.y = currY;
      resetCard.addChild(
        new Graphics()
          .roundRect(0, 0, totalW, 52, 12)
          .fill({ color: isDark ? 0x334155 : 0xEFE9D8 })
          .stroke({ color: 0x2B333E, width: 1.8 })
      );
      const rTitle = new Text({
        text: 'Reset career progress',
        style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 13.5, fill: textPrimary, fontWeight: 'bold' })
      });
      rTitle.x = 14;
      rTitle.y = 8;
      resetCard.addChild(rTitle);

      const rSub = new Text({
        text: 'Clears XP, levels and streaks. Settings stay.',
        style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 10.5, fill: textMuted, fontWeight: '700' })
      });
      rSub.x = 14;
      rSub.y = 28;
      resetCard.addChild(rSub);

      const rBtn = new Container();
      rBtn.x = totalW - 76;
      rBtn.y = 11;
      rBtn.eventMode = 'static';
      rBtn.cursor = 'pointer';
      rBtn.addChild(
        new Graphics()
          .roundRect(0, 0, 64, 30, 8)
          .fill({ color: 0xFCA5A5 })
          .stroke({ color: 0x2B333E, width: 1.8 })
      );
      const rTxt = new Text({
        text: 'Reset',
        style: new TextStyle({ fontFamily: 'Fredoka, sans-serif', fontSize: 12, fill: 0x2B333E, fontWeight: 'bold' })
      });
      rTxt.anchor.set(0.5, 0.5);
      rTxt.x = 32;
      rTxt.y = 15;
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
      resetCard.addChild(rBtn);
      cc.addChild(resetCard);
    }

    // Footer Version Attribution
    const footer = new Text({
      text: 'Desk Wars · Pen Fight · Version 1.5.1 · Ultra-HD Edition',
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10.5,
        fill: textMuted,
        fontWeight: '700'
      })
    });
    footer.anchor.set(0.5, 0);
    footer.x = totalW / 2;
    footer.y = 474;
    cc.addChild(footer);
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
        .roundRect(0, 0, itemW, 36, 10)
        .fill({ color: isSelected ? COLORS.butterYellow : unselectedBg })
        .stroke({ color: 0x2B333E, width: isSelected ? 2.4 : 1.6 });
      btn.addChild(bg);

      const txt = new Text({
        text: item.label,
        style: new TextStyle({
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 12.5,
          fill: isSelected ? 0x2B333E : (isDark ? 0xF8FAFC : 0x2B333E),
          fontWeight: 'bold',
        }),
      });
      txt.anchor.set(0.5, 0.5);
      txt.x = itemW / 2;
      txt.y = 18;
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

  private createToggleCard(
    totalW: number,
    label: string,
    subtitle: string,
    enabled: boolean,
    onToggle: (val: boolean) => void
  ): Container {
    const card = new Container();
    const isDark = this.settings.uiTheme === 'dark';

    card.addChild(
      new Graphics()
        .roundRect(0, 0, totalW, 54, 12)
        .fill({ color: isDark ? 0x334155 : 0xEFE9D8 })
        .stroke({ color: 0x2B333E, width: 1.8 })
    );

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 13.5,
        fontWeight: 'bold',
        fill: isDark ? 0xF8FAFC : 0x2B333E,
      }),
    });
    txt.x = 14;
    txt.y = 8;
    card.addChild(txt);

    const sub = new Text({
      text: subtitle,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 10.5,
        fontWeight: '700',
        fill: isDark ? 0x94A3B8 : 0x6E6658,
      }),
    });
    sub.x = 14;
    sub.y = 29;
    card.addChild(sub);

    const toggle = new Container();
    toggle.x = totalW - 60;
    toggle.y = 15;

    const track = new Graphics()
      .roundRect(0, 0, 46, 24, 12)
      .fill({ color: enabled ? 0x86EFAC : 0xCBD5E1 })
      .stroke({ color: 0x2B333E, width: 2 });
    toggle.addChild(track);

    const thumb = new Graphics()
      .circle(enabled ? 34 : 12, 12, 8.5)
      .fill({ color: COLORS.white })
      .stroke({ color: 0x2B333E, width: 2 });
    toggle.addChild(thumb);

    card.eventMode = 'static';
    card.cursor = 'pointer';
    card.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.play('ui_click');
      onToggle(!enabled);
    });

    card.addChild(toggle);
    return card;
  }

  private createVolumeCard(
    totalW: number,
    label: string,
    volume: number,
    onChange: (val: number) => void
  ): Container {
    const card = new Container();
    const isDark = this.settings.uiTheme === 'dark';

    card.addChild(
      new Graphics()
        .roundRect(0, 0, totalW, 54, 12)
        .fill({ color: isDark ? 0x334155 : 0xEFE9D8 })
        .stroke({ color: 0x2B333E, width: 1.8 })
    );

    const txt = new Text({
      text: `${label}: ${Math.round(volume * 100)}%`,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: isDark ? 0xF8FAFC : 0x2B333E,
      }),
    });
    txt.x = 14;
    txt.y = 7;
    card.addChild(txt);

    // 10 clickable volume segments + [-] / [+] buttons
    const segCount = 10;
    const barStartX = 14;
    const barW = totalW - 110;
    const segGap = 4;
    const segW = (barW - segGap * (segCount - 1)) / segCount;

    for (let i = 0; i < segCount; i++) {
      const segVal = (i + 1) / segCount;
      const active = volume >= segVal - 0.04;
      const seg = new Graphics()
        .roundRect(barStartX + i * (segW + segGap), 30, segW, 14, 4)
        .fill({ color: active ? COLORS.butterYellow : 0xD5CBB8 })
        .stroke({ color: 0x2B333E, width: 1.4 });
      seg.eventMode = 'static';
      seg.cursor = 'pointer';
      seg.on('pointerdown', (e) => {
        e.stopPropagation();
        onChange(parseFloat(segVal.toFixed(1)));
      });
      card.addChild(seg);
    }

    const btnMinus = this.createSmallBtn('–', () => {
      onChange(Math.max(0, parseFloat((volume - 0.1).toFixed(1))));
    });
    btnMinus.x = totalW - 82;
    btnMinus.y = 14;

    const btnPlus = this.createSmallBtn('+', () => {
      onChange(Math.min(1, parseFloat((volume + 0.1).toFixed(1))));
    });
    btnPlus.x = totalW - 44;
    btnPlus.y = 14;

    card.addChild(btnMinus);
    card.addChild(btnPlus);

    return card;
  }

  private createSmallBtn(label: string, onClick: () => void): Container {
    const btn = new Container();
    const bg = new Graphics()
      .roundRect(0, 0, 32, 26, 7)
      .fill({ color: 0xEAE2CF })
      .stroke({ color: 0x2B333E, width: 1.8 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 15,
        fontWeight: 'bold',
        fill: 0x2B333E,
      }),
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = 16;
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
