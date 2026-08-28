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
        <i class="bi bi-buildings-fill mb-3" style="font-size:3.5rem;opacity:.9"></i>
        <h2 class="fw-bold mb-1" style="letter-spacing:-.02em">سمسارة</h2>
        <p class="mb-4 opacity-75 small text-center">المنصة الأمثل لبيع وشراء وتأجير العقارات</p>
        <div class="d-flex gap-4 text-center">
          <div><div class="fw-bold fs-5">١٢٠٠+</div><div class="opacity-65 small">إعلان</div></div>
          <div style="border-right:1px solid rgba(255,255,255,.3)"></div>
          <div><div class="fw-bold fs-5">٥٠٠+</div><div class="opacity-65 small">مستخدم</div></div>
          <div style="border-right:1px solid rgba(255,255,255,.3)"></div>
          <div><div class="fw-bold fs-5">٢٤/٧</div><div class="opacity-65 small">متاح</div></div>
        </div>
      </div>

      <!-- Form panel -->
      <div class="auth-form d-flex flex-column justify-content-center p-4 p-md-5">
        <h4 class="fw-bold mb-1">{{ 'auth.welcomeBack' | t }}</h4>
        <p class="text-muted small mb-4">{{ 'auth.signInToContinue' | t }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          @if (error()) { <div class="alert alert-danger py-2 small mb-3">{{ error() }}</div> }

          <div class="mb-3">
            <label class="form-label fw-medium">{{ 'auth.email' | t }}</label>
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0"><i class="bi bi-envelope text-muted"></i></span>
              <input class="form-control border-start-0 ps-0" type="email" formControlName="email"
                     autocomplete="email" [placeholder]="'auth.emailPlaceholder' | t">
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label fw-medium">{{ 'auth.password' | t }}</label>
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0"><i class="bi bi-lock text-muted"></i></span>
              <input class="form-control border-start-0 ps-0" type="password" formControlName="password"
                     autocomplete="current-password" [placeholder]="'auth.passwordPlaceholder' | t">
            </div>
          </div>

          <button class="btn btn-samsary w-100 py-2" [disabled]="form.invalid || loading()">
            @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
            {{ 'auth.signIn' | t }}
          </button>
        </form>

        <p class="text-center mt-4 mb-0 small text-muted">
          {{ 'auth.noAccount' | t }}
          <a routerLink="/register" class="fw-medium">{{ 'auth.createOne' | t }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .auth-split-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-radius: 1.5rem;
      max-width: 820px;
      width: 100%;
      margin: 2rem auto;
    }
    .auth-hero {
      background: var(--samsary-gradient);
      border-radius: 1.5rem 0 0 1.5rem;
    }
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
    html[dir='rtl'] .input-group-text { border-radius: 0 .6rem .6rem 0 !important; }
    html[dir='rtl'] .form-control      { border-radius: .6rem 0 0 .6rem !important; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = signal(false);
  error = signal<string | null>(null);

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
