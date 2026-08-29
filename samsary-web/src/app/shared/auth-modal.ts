import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { AuthModalService } from '../core/auth-modal.service';
import { I18nService, TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    @if (modal.mode(); as mode) {
      <!-- Backdrop -->
      <div class="auth-modal-backdrop" (click)="modal.close()"></div>

      <!-- Dialog -->
      <div class="auth-modal-dialog" role="dialog" aria-modal="true">
        <button class="auth-modal-close" type="button" (click)="modal.close()" [attr.aria-label]="'common.cancel' | t">
          <i class="bi bi-x-lg"></i>
        </button>

        <div class="auth-modal-split">
          <!-- Hero panel -->
          <div class="auth-hero d-flex flex-column align-items-center justify-content-center p-4 text-white">
            <div class="auth-hero-logo mb-3">
              <i class="bi bi-buildings-fill" style="font-size:2.2rem"></i>
            </div>
            <h5 class="fw-bold mb-1">سمسارة</h5>
            <p class="opacity-75 small text-center mb-4">المنصة الأمثل لبيع وشراء وتأجير العقارات</p>
            <div class="d-flex gap-3 text-center">
              <div><div class="fw-bold">120+</div><div class="opacity-65" style="font-size:.75rem">إعلان</div></div>
              <div style="border-right:1px solid rgba(255,255,255,.25)"></div>
              <div><div class="fw-bold">50+</div><div class="opacity-65" style="font-size:.75rem">مستخدم</div></div>
              <div style="border-right:1px solid rgba(255,255,255,.25)"></div>
              <div><div class="fw-bold">24/7</div><div class="opacity-65" style="font-size:.75rem">متاح</div></div>
            </div>
          </div>

          <!-- Form panel -->
          <div class="auth-modal-form p-4 p-md-5">
            @if (mode === 'login') {
              <h5 class="fw-bold mb-1">{{ 'auth.welcomeBack' | t }}</h5>
              <p class="text-muted small mb-4">{{ 'auth.signInToContinue' | t }}</p>

              <form [formGroup]="loginForm" (ngSubmit)="login()">
                @if (loginError()) {
                  <div class="alert alert-danger py-2 small mb-3 d-flex align-items-center gap-2">
                    <i class="bi bi-exclamation-circle-fill flex-shrink-0"></i>
                    <span>{{ loginError() }}</span>
                  </div>
                }
                <div class="mb-3">
                  <label class="form-label fw-medium small">{{ 'auth.email' | t }}</label>
                  <div class="auth-input-group">
                    <i class="bi bi-envelope auth-input-icon"></i>
                    <input class="auth-input" type="email" formControlName="email"
                           autocomplete="email" [placeholder]="'auth.emailPlaceholder' | t">
                  </div>
                  @if (loginForm.controls.email.invalid && loginForm.controls.email.touched) {
                    <div class="text-danger small mt-1">{{ 'auth.emailInvalid' | t }}</div>
                  }
                </div>
                <div class="mb-4">
                  <label class="form-label fw-medium small">{{ 'auth.password' | t }}</label>
                  <div class="auth-input-group">
                    <i class="bi bi-lock auth-input-icon"></i>
                    <input class="auth-input" [type]="showLoginPw() ? 'text' : 'password'"
                           formControlName="password" autocomplete="current-password"
                           [placeholder]="'auth.passwordPlaceholder' | t">
                    <button type="button" class="auth-eye" (click)="showLoginPw.update(v => !v)">
                      <i class="bi" [class.bi-eye]="!showLoginPw()" [class.bi-eye-slash]="showLoginPw()"></i>
                    </button>
                  </div>
                </div>
                <button class="btn btn-samsary w-100 py-2 fw-semibold" [disabled]="loginForm.invalid || loginLoading()">
                  @if (loginLoading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  {{ 'auth.signIn' | t }}
                </button>
              </form>

              <div class="text-center mt-3 pt-3 border-top small text-muted">
                {{ 'auth.noAccount' | t }}
                <button class="btn btn-link btn-sm p-0 ms-1 fw-semibold" (click)="modal.switchTo('register')">
                  {{ 'auth.createOne' | t }}
                </button>
              </div>
            } @else {
              <h5 class="fw-bold mb-1">{{ 'auth.createAccount' | t }}</h5>
              <p class="text-muted small mb-4">{{ 'auth.registerSubtitle' | t }}</p>

              <form [formGroup]="registerForm" (ngSubmit)="register()">
                @if (registerErrors().length) {
                  <div class="alert alert-danger py-2 small mb-3">
                    @for (e of registerErrors(); track e) { <div>• {{ e }}</div> }
                  </div>
                }
                <div class="mb-3">
                  <label class="form-label fw-medium small">{{ 'auth.displayName' | t }}</label>
                  <div class="auth-input-group">
                    <i class="bi bi-person auth-input-icon"></i>
                    <input class="auth-input" formControlName="displayName" maxlength="80">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-medium small">{{ 'auth.phone' | t }} <span class="text-danger">*</span></label>
                  <div class="auth-input-group">
                    <i class="bi bi-telephone auth-input-icon"></i>
                    <input class="auth-input" type="tel" formControlName="phone" placeholder="+20 1xx xxx xxxx">
                  </div>
                  @if (registerForm.controls.phone.invalid && registerForm.controls.phone.touched) {
                    <div class="text-danger small mt-1">{{ 'auth.phoneInvalid' | t }}</div>
                  }
                </div>
                <div class="mb-3">
                  <label class="form-label fw-medium small">{{ 'auth.email' | t }}</label>
                  <div class="auth-input-group">
                    <i class="bi bi-envelope auth-input-icon"></i>
                    <input class="auth-input" type="email" formControlName="email"
                           autocomplete="email" [placeholder]="'auth.emailPlaceholder' | t">
                  </div>
                  @if (registerForm.controls.email.invalid && registerForm.controls.email.touched) {
                    <div class="text-danger small mt-1">{{ 'auth.emailInvalid' | t }}</div>
                  }
                </div>
                <div class="mb-4">
                  <label class="form-label fw-medium small">{{ 'auth.password' | t }}</label>
                  <div class="auth-input-group">
                    <i class="bi bi-lock auth-input-icon"></i>
                    <input class="auth-input" [type]="showRegPw() ? 'text' : 'password'"
                           formControlName="password" autocomplete="new-password"
                           [placeholder]="'auth.passwordPlaceholder' | t">
                    <button type="button" class="auth-eye" (click)="showRegPw.update(v => !v)">
                      <i class="bi" [class.bi-eye]="!showRegPw()" [class.bi-eye-slash]="showRegPw()"></i>
                    </button>
                  </div>
                  <div class="form-text small">{{ 'auth.passwordHint' | t }}</div>
                </div>
                <button class="btn btn-samsary w-100 py-2 fw-semibold" [disabled]="registerForm.invalid || registerLoading()">
                  @if (registerLoading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  {{ 'auth.createAccount' | t }}
                </button>
              </form>

              <div class="text-center mt-3 pt-3 border-top small text-muted">
                {{ 'auth.haveAccount' | t }}
                <button class="btn btn-link btn-sm p-0 ms-1 fw-semibold" (click)="modal.switchTo('login')">
                  {{ 'auth.signIn' | t }}
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .auth-modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.55);
      z-index: 1040;
      backdrop-filter: blur(3px);
      animation: fadeIn .15s ease;
    }
    .auth-modal-dialog {
      position: fixed; inset: 0;
      z-index: 1050;
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
      pointer-events: none;
    }
    .auth-modal-split {
      display: grid;
      grid-template-columns: 5fr 7fr;
      max-width: 820px; width: 100%;
      background: #fff;
      border-radius: 1.5rem;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,.3);
      pointer-events: all;
      animation: slideUp .2s ease;
      position: relative;
    }
    .auth-hero { background: var(--samsary-gradient); }
    .auth-hero-logo {
      width: 64px; height: 64px; border-radius: 50%;
      background: rgba(255,255,255,.15);
      display: flex; align-items: center; justify-content: center;
    }
    .auth-modal-close {
      position: absolute; top: .75rem; right: .75rem; z-index: 10;
      background: rgba(255,255,255,.9); border: none; border-radius: 50%;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #374151;
      pointer-events: all;
      transition: background .15s;
    }
    .auth-modal-close:hover { background: #fff; }
    .auth-modal-form { overflow-y: auto; max-height: 90vh; }

    .auth-input-group { position: relative; display: flex; align-items: center; }
    .auth-input-icon { position: absolute; left: 14px; color: #9ca3af; font-size: .95rem; pointer-events: none; }
    .auth-input {
      width: 100%; padding: .65rem 2.8rem;
      border: 1.5px solid #e5e7eb; border-radius: .65rem;
      font-size: .95rem; outline: none;
      transition: border-color .2s; background: #fafafa;
    }
    .auth-input:focus { border-color: var(--samsary-primary); background: #fff; box-shadow: 0 0 0 3px rgba(var(--samsary-primary-rgb),.1); }
    .auth-eye {
      position: absolute; right: 12px;
      background: none; border: none; cursor: pointer;
      color: #9ca3af; padding: 0; line-height: 1;
    }

    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

    @media (max-width: 600px) {
      .auth-modal-split { grid-template-columns: 1fr; }
      .auth-hero { display: none !important; }
    }
    html[dir='rtl'] .auth-input-icon { left: unset; right: 14px; }
    html[dir='rtl'] .auth-input { padding: .65rem 2.8rem; }
    html[dir='rtl'] .auth-eye { right: unset; left: 12px; }
    html[dir='rtl'] .auth-modal-close { right: unset; left: .75rem; }
  `]
})
export class AuthModalComponent {
  readonly modal = inject(AuthModalService);
  private fb = inject(FormBuilder);
  private authSvc = inject(AuthService);
  readonly i18n = inject(I18nService);

  loginLoading = signal(false);
  loginError = signal<string | null>(null);
  showLoginPw = signal(false);

  registerLoading = signal(false);
  registerErrors = signal<string[]>([]);
  showRegPw = signal(false);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  registerForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(80)]],
    phone: ['', [Validators.required, Validators.pattern(/^(\+?2)?01[0125][0-9]{8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  async login() {
    if (this.loginForm.invalid) return;
    this.loginLoading.set(true);
    this.loginError.set(null);
    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.authSvc.login(email, password);
      this.modal.close();
      this.loginForm.reset();
    } catch (e: any) {
      const detail = e?.error?.detail || e?.error?.title;
      this.loginError.set(detail || this.i18n.t('auth.signInFailed'));
      this.loginLoading.set(false);
    }
  }

  async register() {
    if (this.registerForm.invalid) return;
    this.registerLoading.set(true);
    this.registerErrors.set([]);
    try {
      const v = this.registerForm.getRawValue();
      await this.authSvc.register(v.email, v.password, v.displayName, v.phone);
      this.modal.close();
      this.registerForm.reset();
    } catch (e: any) {
      const errs: string[] = [];
      const apiErrors = e?.error?.errors;
      if (apiErrors) {
        Object.values(apiErrors).forEach((v: any) => errs.push(...(Array.isArray(v) ? v : [v])));
      } else {
        errs.push(e?.error?.detail || e?.error?.title || this.i18n.t('auth.registerFailed'));
      }
      this.registerErrors.set(errs);
      this.registerLoading.set(false);
    }
  }
}
