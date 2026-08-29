import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="auth-split-card shadow-lg border-0 overflow-hidden">

      <!-- Hero panel -->
      <div class="auth-hero d-flex flex-column align-items-center justify-content-center p-5 text-white">
        <div class="auth-hero-logo mb-4">
          <i class="bi bi-buildings-fill" style="font-size:3.5rem"></i>
        </div>
        <h2 class="fw-bold mb-2" style="letter-spacing:-.02em">Ø³Ù…Ø³Ø§Ø±Ø©</h2>
        <p class="mb-5 opacity-75 small text-center">Ø§Ù„Ù…Ù†ØµØ© Ø§Ù„Ø£Ù…Ø«Ù„ Ù„Ø¨ÙŠØ¹ ÙˆØ´Ø±Ø§Ø¡ ÙˆØªØ£Ø¬ÙŠØ± Ø§Ù„Ø¹Ù‚Ø§Ø±Ø§Øª</p>
        <div class="auth-stats d-flex gap-4 text-center">
          <div><div class="fw-bold fs-5">Ù¡Ù¢Ù Ù +</div><div class="opacity-65 small">Ø¥Ø¹Ù„Ø§Ù†</div></div>
          <div class="auth-stat-div"></div>
          <div><div class="fw-bold fs-5">Ù¥Ù Ù +</div><div class="opacity-65 small">Ù…Ø³ØªØ®Ø¯Ù…</div></div>
          <div class="auth-stat-div"></div>
          <div><div class="fw-bold fs-5">Ù¢Ù¤/Ù§</div><div class="opacity-65 small">Ù…ØªØ§Ø­</div></div>
        </div>
      </div>

      <!-- Form panel -->
      <div class="auth-form d-flex flex-column justify-content-center p-4 p-lg-5">
        <div class="mb-4">
          <h4 class="fw-bold mb-1">{{ 'auth.welcomeBack' | t }}</h4>
          <p class="text-muted small mb-0">{{ 'auth.signInToContinue' | t }}</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          @if (error()) {
            <div class="alert alert-danger py-2 small mb-3 d-flex align-items-center gap-2">
              <i class="bi bi-exclamation-circle-fill"></i> {{ error() }}
            </div>
          }

          <div class="mb-3">
            <label class="form-label fw-medium small">{{ 'auth.email' | t }}</label>
            <div class="auth-input-group">
              <i class="bi bi-envelope auth-input-icon"></i>
              <input class="auth-input" type="email" formControlName="email"
                     autocomplete="email" [placeholder]="'auth.emailPlaceholder' | t">
            </div>
          </div>

          <div class="mb-2">
            <label class="form-label fw-medium small">{{ 'auth.password' | t }}</label>
            <div class="auth-input-group">
              <i class="bi bi-lock auth-input-icon"></i>
              <input class="auth-input" [type]="showPw() ? 'text' : 'password'"
                     formControlName="password" autocomplete="current-password"
                     [placeholder]="'auth.passwordPlaceholder' | t">
              <button type="button" class="auth-eye" (click)="showPw.update(v => !v)">
                <i class="bi" [class.bi-eye]="!showPw()" [class.bi-eye-slash]="showPw()"></i>
              </button>
            </div>
          </div>

          <div class="text-end mb-4">
            <a routerLink="/forgot-password" class="small text-muted" style="text-decoration:none;opacity:.8">
              {{ 'auth.forgotPassword' | t }}?
            </a>
          </div>

          <button class="btn btn-samsary w-100 py-2 fw-semibold" [disabled]="form.invalid || loading()">
            @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
            {{ 'auth.signIn' | t }}
          </button>
        </form>

        <div class="text-center mt-4 pt-3 border-top">
          <span class="text-muted small">{{ 'auth.noAccount' | t }}</span>
          <a routerLink="/register" class="ms-1 small fw-semibold">{{ 'auth.createOne' | t }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--samsary-gradient-soft); }
    .auth-split-card { display: grid; grid-template-columns: 5fr 7fr; border-radius: 1.75rem; max-width: 860px; width: 100%; margin: 2rem auto; }
    .auth-hero { background: var(--samsary-gradient); border-radius: 1.75rem 0 0 1.75rem; position: relative; overflow: hidden; }
    .auth-hero::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.05'%3E%3Cpath d='M20 20.5V18H0v5h20v20.5h5V23h20v-5H25V2.5h-5z'/%3E%3C/g%3E%3C/svg%3E"); }
    .auth-hero-logo { width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;position:relative; }
    .auth-stat-div { width:1px;background:rgba(255,255,255,.3);margin:2px 0; }
    .auth-form { background:#fff; border-radius:0 1.75rem 1.75rem 0; }
    /* Custom input */
    .auth-input-group { position:relative; display:flex; align-items:center; }
    .auth-input-icon { position:absolute; left:14px; color:#9ca3af; font-size:.95rem; pointer-events:none; }
    .auth-input { width:100%; padding:.65rem 2.8rem; border:1.5px solid #e5e7eb; border-radius:.65rem; font-size:.95rem; outline:none; transition:border-color .2s; background:#fafafa; }
    .auth-input:focus { border-color:var(--samsary-primary); background:#fff; box-shadow:0 0 0 3px rgba(var(--samsary-primary-rgb),.1); }
    .auth-eye { position:absolute; right:12px; background:none; border:none; padding:4px; color:#9ca3af; cursor:pointer; font-size:1rem; line-height:1; }
    .auth-eye:hover { color:var(--samsary-primary); }
    @media (max-width: 640px) {
      .auth-split-card { grid-template-columns:1fr; }
      .auth-hero { border-radius:1.75rem 1.75rem 0 0; padding:2rem 1.5rem !important; }
      .auth-form { border-radius:0 0 1.75rem 1.75rem; }
    }
    html[dir='rtl'] .auth-hero { border-radius:0 1.75rem 1.75rem 0; }
    html[dir='rtl'] .auth-form  { border-radius:1.75rem 0 0 1.75rem; }
    html[dir='rtl'] .auth-input { padding:.65rem 2.8rem .65rem 2.8rem; }
    html[dir='rtl'] .auth-input-icon { left:unset; right:14px; }
    html[dir='rtl'] .auth-eye { right:unset; left:12px; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = signal(false);
  error = signal<string | null>(null);
  showPw = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  async submit() {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set(null);
    try {
      await this.auth.login(this.form.value.email!, this.form.value.password!);
      this.router.navigateByUrl('/');
    } catch (e: any) {
      this.error.set(e?.error?.detail || e?.error?.title || 'Sign in failed.');
    } finally { this.loading.set(false); }
  }
}
