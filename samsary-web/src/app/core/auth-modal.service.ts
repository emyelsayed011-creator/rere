import { Injectable, signal } from '@angular/core';

export type AuthModalMode = 'login' | 'register' | null;

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  readonly mode = signal<AuthModalMode>(null);
  open(mode: AuthModalMode = 'login') { this.mode.set(mode); }
  close() { this.mode.set(null); }
  switchTo(mode: AuthModalMode) { this.mode.set(mode); }
}
