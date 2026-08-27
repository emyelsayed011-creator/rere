import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';
export type ColorTheme = 'rose' | 'ocean' | 'forest' | 'sunset' | 'violet' | 'midnight' | 'gold';

export interface ColorThemeMeta {
  id: ColorTheme;
  label: string;
  primary: string;
  accent: string;
  gradient: string;
}

export const COLOR_THEMES: ColorThemeMeta[] = [
  { id: 'rose',     label: 'Rose',     primary: '#ec4899', accent: '#a855f7', gradient: 'linear-gradient(135deg,#ec4899,#a855f7)' },
  { id: 'ocean',    label: 'Ocean',    primary: '#0ea5e9', accent: '#06b6d4', gradient: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' },
  { id: 'forest',   label: 'Forest',   primary: '#22c55e', accent: '#14b8a6', gradient: 'linear-gradient(135deg,#22c55e,#14b8a6)' },
  { id: 'sunset',   label: 'Sunset',   primary: '#f97316', accent: '#ef4444', gradient: 'linear-gradient(135deg,#f97316,#ef4444)' },
  { id: 'violet',   label: 'Violet',   primary: '#8b5cf6', accent: '#6366f1', gradient: 'linear-gradient(135deg,#8b5cf6,#6366f1)' },
  { id: 'midnight', label: 'Midnight', primary: '#3b82f6', accent: '#1d4ed8', gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
  { id: 'gold',     label: 'Gold',     primary: '#f59e0b', accent: '#d97706', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
];

const MODE_KEY  = 'samsary.theme';
const COLOR_KEY = 'samsary.colorTheme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme      = signal<Theme>(this.initialMode());
  private _colorTheme = signal<ColorTheme>(this.initialColor());

  readonly theme      = this._theme.asReadonly();
  readonly colorTheme = this._colorTheme.asReadonly();
  readonly isDark     = () => this._theme() === 'dark';

  constructor() {
    effect(() => this.apply(this._theme(), this._colorTheme()));
  }

  toggle() {
    this._theme.update(t => (t === 'light' ? 'dark' : 'light'));
    localStorage.setItem(MODE_KEY, this._theme());
  }

  setTheme(t: Theme) {
    this._theme.set(t);
    localStorage.setItem(MODE_KEY, t);
  }

  setColorTheme(c: ColorTheme) {
    this._colorTheme.set(c);
    localStorage.setItem(COLOR_KEY, c);
  }

  private initialMode(): Theme {
    const stored = localStorage.getItem(MODE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private initialColor(): ColorTheme {
    const stored = localStorage.getItem(COLOR_KEY) as ColorTheme | null;
    if (stored && COLOR_THEMES.some(c => c.id === stored)) return stored;
    return 'rose';
  }

  private apply(t: Theme, c: ColorTheme) {
    const el = document.documentElement;
    el.setAttribute('data-bs-theme', t);
    el.setAttribute('data-theme', t);
    el.setAttribute('data-color-theme', c);
  }
}
