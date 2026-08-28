import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, effect } from '@angular/core';
import { environment } from '../../environments/environment';

export type Theme = 'light' | 'dark';
export type ColorTheme = 'rose' | 'ocean' | 'forest' | 'sunset' | 'violet' | 'midnight' | 'gold' | 'custom';

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

export interface AdminTheme {
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  siteName?: string;
  fontFamily: string;
  fontSizeBase: number;
}

const MODE_KEY  = 'samsary.theme';
const COLOR_KEY = 'samsary.colorTheme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient);
  private _theme      = signal<Theme>(this.initialMode());
  private _colorTheme = signal<ColorTheme>(this.initialColor());
  readonly adminTheme = signal<AdminTheme | null>(null);

  readonly theme      = this._theme.asReadonly();
  readonly colorTheme = this._colorTheme.asReadonly();
  readonly isDark     = () => this._theme() === 'dark';

  constructor() {
    effect(() => this.apply(this._theme(), this._colorTheme()));
  }

  /** Load admin-configured branding from the API and apply it. */
  loadAdminTheme() {
    this.http.get<AdminTheme>(`${environment.apiBase}/theme`).subscribe({
      next: t => { this.adminTheme.set(t); this.applyAdminTheme(t); },
      error: () => {}
    });
  }

  saveAdminTheme(t: AdminTheme) {
    return this.http.put<AdminTheme>(`${environment.apiBase}/theme`, t);
  }

  applyAdminTheme(t: AdminTheme) {
    const root = document.documentElement;
    root.style.setProperty('--samsary-primary', t.primaryColor);
    root.style.setProperty('--samsary-accent',  t.accentColor);
    root.style.setProperty('--bs-primary',       t.primaryColor);
    root.style.fontSize = `${t.fontSizeBase}px`;
    const rgb = hexToRgb(t.primaryColor);
    if (rgb) root.style.setProperty('--samsary-primary-rgb', rgb);
    root.style.setProperty('--samsary-gradient',
      `linear-gradient(135deg, ${t.primaryColor} 0%, ${t.accentColor} 100%)`);
    this.adminTheme.set(t);
    this._colorTheme.set('custom');
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
    return 'light'; // default to light for professional real-estate look
  }

  private initialColor(): ColorTheme {
    const stored = localStorage.getItem(COLOR_KEY) as ColorTheme | null;
    if (stored && [...COLOR_THEMES.map(c => c.id), 'custom'].includes(stored)) return stored;
    return 'gold';
  }

  private apply(t: Theme, c: ColorTheme) {
    const el = document.documentElement;
    el.setAttribute('data-bs-theme', t);
    el.setAttribute('data-theme', t);
    el.setAttribute('data-color-theme', c);
  }
}

function hexToRgb(hex: string): string | null {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)}, ${parseInt(r[2],16)}, ${parseInt(r[3],16)}` : null;
}
