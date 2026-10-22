import { Preferences } from '@capacitor/preferences';

export type UiThemeMode = 'light' | 'dark';
export type DeskThemeMode = 'coffee' | 'oak' | 'mahogany' | 'slate' | 'clean' | 'old-school';
export type PenLookMode = 'classic' | 'real';

export interface DeskWoodDef {
  id: 'coffee' | 'oak' | 'mahogany' | 'slate';
  label: string;
  sub: string;
  icon: string;
  color: number;
  accent: number;
  previewBg: string;
}

export const DESK_WOOD_THEMES: DeskWoodDef[] = [
  { id: 'coffee', label: 'Espresso', sub: 'Dark Coffee', icon: '☕', color: 0x2E180E, accent: 0xD97706, previewBg: '#2E180E' },
  { id: 'oak', label: 'Teak', sub: 'Classic Oak', icon: '🪵', color: 0xC08E52, accent: 0xF59E0B, previewBg: '#C08E52' },
  { id: 'mahogany', label: 'Mahogany', sub: 'Royal Red', icon: '🍷', color: 0x4A1A16, accent: 0xEF4444, previewBg: '#4A1A16' },
  { id: 'slate', label: 'Slate', sub: 'Midnight Wood', icon: '🌑', color: 0x1E222A, accent: 0x64748B, previewBg: '#1E222A' },
];

export interface VisualPreferences {
  uiTheme: UiThemeMode;
  deskTheme: DeskThemeMode;
  penLook: PenLookMode;
}

const PREF_KEY = 'shunnek_pen_fight_visual_prefs';

export class ThemeManager {
  public prefs: VisualPreferences = {
    uiTheme: 'light',
    deskTheme: 'coffee',
    penLook: 'real'
  };

  public getNormalizedDeskTheme(): 'coffee' | 'oak' | 'mahogany' | 'slate' {
    const t = this.prefs.deskTheme;
    if (t === 'clean') return 'oak';
    if (t === 'old-school') return 'coffee';
    if (t === 'coffee' || t === 'oak' || t === 'mahogany' || t === 'slate') return t;
    return 'coffee';
  }

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
