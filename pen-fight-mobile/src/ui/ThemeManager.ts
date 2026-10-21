import { Preferences } from '@capacitor/preferences';

export type UiThemeMode = 'light' | 'dark';
export type DeskThemeMode = 'clean' | 'old-school';
export type PenLookMode = 'classic' | 'real';

export interface VisualPreferences {
  uiTheme: UiThemeMode;
  deskTheme: DeskThemeMode;
  penLook: PenLookMode;
}

const PREF_KEY = 'shunnek_pen_fight_visual_prefs';

export class ThemeManager {
  public prefs: VisualPreferences = {
    uiTheme: 'light',
    deskTheme: 'clean',
    penLook: 'real'
  };

  public async loadPreferences(): Promise<VisualPreferences> {
    try {
      const { value } = await Preferences.get({ key: PREF_KEY });
      if (value) {
        this.prefs = { ...this.prefs, ...JSON.parse(value) };
      }
    } catch {
      // Fallback to localStorage on web
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) this.prefs = { ...this.prefs, ...JSON.parse(raw) };
    }
    this.applyDomTheme();
    return this.prefs;
  }

  public async setUiTheme(theme: UiThemeMode): Promise<void> {
    this.prefs.uiTheme = theme;
    this.applyDomTheme();
    await this.save();
  }

  public async setDeskTheme(desk: DeskThemeMode): Promise<void> {
    this.prefs.deskTheme = desk;
    await this.save();
  }

  public async setPenLook(look: PenLookMode): Promise<void> {
    this.prefs.penLook = look;
    await this.save();
  }

  public applyDomTheme(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', this.prefs.uiTheme);
    }
  }

  private async save(): Promise<void> {
    const raw = JSON.stringify(this.prefs);
    try {
      await Preferences.set({ key: PREF_KEY, value: raw });
    } catch {
      localStorage.setItem(PREF_KEY, raw);
    }
  }
}

export const themeManager = new ThemeManager();
