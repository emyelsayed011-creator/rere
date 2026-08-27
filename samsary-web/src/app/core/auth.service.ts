import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, AuthUser, ModeratorPermission } from './models';

const TOKEN_KEY = 'samsary.token';
const USER_KEY  = 'samsary.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly user = signal<AuthUser | null>(null);
  readonly token = signal<string | null>(null);
  readonly isAuthenticated = computed(() => !!this.token());
  readonly isAdmin = computed(() => this.user()?.roles.includes('Admin') ?? false);
  readonly isModerator = computed(() => this.user()?.roles.includes('Moderator') ?? false);
  readonly isStaff = computed(() => this.isAdmin() || this.isModerator());

  hasPermission(perm: ModeratorPermission): boolean {
    if (this.isAdmin()) return true;
    const bits = this.user()?.modPermissions ?? 0;
    return (bits & perm) === perm;
  }

  bootstrap() {
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t && u) {
      this.token.set(t);
      this.user.set(JSON.parse(u));
    }
  }

  async login(email: string, password: string) {
    const r = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiBase}/auth/login`, { email, password })
    );
    this.persist(r);
  }

  async register(email: string, password: string, displayName: string) {
    const r = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiBase}/auth/register`, { email, password, displayName })
    );
    this.persist(r);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
    this.router.navigateByUrl('/');
  }

  updateLocalUser(u: AuthUser) {
    this.user.set(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }

  private persist(r: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, r.token);
    // Decode JWT to extract moderator permissions claim
    const user = { ...r.user };
    try {
      const payload = JSON.parse(atob(r.token.split('.')[1]));
      if (payload['mod_permissions'] !== undefined)
        user.modPermissions = Number(payload['mod_permissions']);
    } catch { /* ignore malformed JWT */ }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.token.set(r.token);
    this.user.set(user);
  }
}
