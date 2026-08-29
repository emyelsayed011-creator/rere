import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="auth-split-card shadow-lg border-0 overflow-hidden">
      <!-- Hero panel -->
      <div class="auth-hero d-flex flex-column align-items-center justify-content-center p-5 text-white">
        <i class="bi bi-buildings-fill mb-3" style="font-size:3.5rem;opacity:.9"></i>
        <h2 class="fw-bold mb-1" style="letter-spacing:-.02em">سمسارة</h2>
        <p class="mb-4 opacity-75 small text-center">انضم إلى منصة العقارات الأولى</p>
        <div class="d-flex gap-4 text-center">
          <div><div class="fw-bold fs-5">مجاني</div><div class="opacity-65 small">التسجيل</div></div>
          <div style="border-right:1px solid rgba(255,255,255,.3)"></div>
          <div><div class="fw-bold fs-5">آمن</div><div class="opacity-65 small">ومراقب</div></div>
          <div style="border-right:1px solid rgba(255,255,255,.3)"></div>
          <div><div class="fw-bold fs-5">24/7</div><div class="opacity-65 small">متاح</div></div>
        </div>
      </div>

      <!-- Form panel -->
      <div class="auth-form d-flex flex-column justify-content-center p-4 p-md-5">
        <h4 class="fw-bold mb-1">{{ 'auth.createAccount' | t }}</h4>
        <p class="text-muted small mb-4">{{ 'auth.registerSubtitle' | t }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          @if (errors().length) {
            <div class="alert alert-danger py-2 small mb-3">
              @for (e of errors(); track e) { <div>• {{ e }}</div> }
            </div>
          }

          <div class="mb-3">
            <label class="form-label fw-medium">{{ 'auth.displayName' | t }}</label>
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0"><i class="bi bi-person text-muted"></i></span>
              <input class="form-control border-start-0 ps-0" formControlName="displayName" maxlength="80">
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-medium">{{ 'auth.phone' | t }} <span class="text-danger">*</span></label>
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0"><i class="bi bi-telephone text-muted"></i></span>
              <input class="form-control border-start-0 ps-0" type="tel" formControlName="phone"
                     placeholder="+20 1xx xxx xxxx">
            </div>
            @if (form.controls.phone.invalid && form.controls.phone.touched) {
              <div class="text-danger small mt-1">{{ 'auth.phoneInvalid' | t }}</div>
            }
          </div>

          <div class="mb-3">
            <label class="form-label fw-medium">{{ 'auth.email' | t }}</label>
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0"><i class="bi bi-envelope text-muted"></i></span>
              <input class="form-control border-start-0 ps-0" type="email" formControlName="email" autocomplete="email">
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label fw-medium">{{ 'auth.password' | t }}</label>
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0"><i class="bi bi-lock text-muted"></i></span>
              <input class="form-control border-start-0 ps-0" type="password" formControlName="password" autocomplete="new-password">
            </div>
            <div class="form-text">{{ 'auth.passwordHint' | t }}</div>
          </div>

          <button class="btn btn-samsary w-100 py-2" [disabled]="form.invalid || loading()">
            @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
            {{ 'auth.createAccount' | t }}
          </button>
        </form>

        <p class="text-center mt-4 mb-0 small text-muted">
          {{ 'auth.haveAccount' | t }}
          <a routerLink="/login" class="fw-medium">{{ 'auth.signIn' | t }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .auth-split-card {
      display: grid; grid-template-columns: 1fr 1fr;
      border-radius: 1.5rem; max-width: 820px; width: 100%; margin: 2rem auto;
    }
    .auth-hero { background: var(--samsary-gradient); border-radius: 1.5rem 0 0 1.5rem; }
    .auth-form { background: #fff; border-radius: 0 1.5rem 1.5rem 0; }
    .input-group-text { border-radius: .6rem 0 0 .6rem !important; }
    .form-control { border-radius: 0 .6rem .6rem 0 !important; }
    @media (max-width: 600px) {
      .auth-split-card { grid-template-columns: 1fr; }
      .auth-hero { border-radius: 1.5rem 1.5rem 0 0; }
      .auth-form { border-radius: 0 0 1.5rem 1.5rem; }
    }
    html[dir='rtl'] .auth-hero { border-radius: 0 1.5rem 1.5rem 0; }
    html[dir='rtl'] .auth-form  { border-radius: 1.5rem 0 0 1.5rem; }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = signal(false);
  errors = signal<string[]>([]);

  form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(80)]],
    phone: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9\s\-\(\)]{7,20}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  async submit() {
    if (this.form.invalid) return;
    this.loading.set(true); this.errors.set([]);
    try {
      const v = this.form.getRawValue();
      await this.auth.register(v.email, v.password, v.displayName, v.phone);
      this.router.navigateByUrl('/');
    } catch (e: any) {
      const msg = e?.error?.errors || [e?.error?.detail || e?.error?.error || 'Registration failed.'];
      this.errors.set(Array.isArray(msg) ? msg : Object.values(msg).flat() as string[]);
    } finally { this.loading.set(false); }
  }
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="card auth-card shadow-sm border-0">
      <div class="card-body p-4">
        <h4 class="mb-3 text-center fw-bold"><i class="bi bi-person-plus text-primary me-2"></i>{{ 'auth.createAccount' | t }}</h4>
        <form [formGroup]="form" (ngSubmit)="submit()">
          @if (errors().length) {
            <div class="alert alert-danger py-2 small">
              @for (e of errors(); track e) { <div>• {{ e }}</div> }
            </div>
          }
          <div class="mb-3">
            <label class="form-label">{{ 'auth.displayName' | t }}</label>
            <input class="form-control" formControlName="displayName" maxlength="80">
          </div>
          <div class="mb-3">
            <label class="form-label">{{ 'auth.email' | t }}</label>
            <input class="form-control" type="email" formControlName="email" autocomplete="email">
          </div>
          <div class="mb-3">
            <label class="form-label">{{ 'auth.password' | t }}</label>
            <input class="form-control" type="password" formControlName="password" autocomplete="new-password">
            <div class="form-text">{{ 'auth.passwordHint' | t }}</div>
          </div>
          <button class="btn btn-samsary w-100" [disabled]="form.invalid || loading()">
            @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
            {{ 'auth.createAccount' | t }}
          </button>
        </form>
        <p class="text-center mt-3 mb-0 small">
          {{ 'auth.haveAccount' | t }} <a routerLink="/login">{{ 'auth.signIn' | t }}</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = signal(false);
  errors = signal<string[]>([]);

  form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  async submit() {
    if (this.form.invalid) return;
    this.loading.set(true); this.errors.set([]);
    try {
      const v = this.form.getRawValue();
      await this.auth.register(v.email, v.password, v.displayName);
      this.router.navigateByUrl('/');
    } catch (e: any) {
      const msg = e?.error?.errors || [e?.error?.detail || e?.error?.error || 'Registration failed.'];
      this.errors.set(Array.isArray(msg) ? msg : [msg]);
    } finally { this.loading.set(false); }
  }
}
