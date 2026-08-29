import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="auth-split-card shadow-lg border-0 overflow-hidden">
      <div class="auth-hero d-flex flex-column align-items-center justify-content-center p-5 text-white">
        <i class="bi bi-shield-lock-fill mb-3" style="font-size:3.5rem;opacity:.9"></i>
        <h2 class="fw-bold mb-2">{{ 'auth.forgotPassword' | t }}</h2>
        <p class="opacity-75 small text-center">{{ 'auth.forgotSubtitle' | t }}</p>
      </div>
      <div class="auth-form d-flex flex-column justify-content-center p-4 p-md-5">
        <h4 class="fw-bold mb-1">{{ 'auth.forgotPassword' | t }}</h4>
        <p class="text-muted small mb-4">{{ 'auth.forgotInstructions' | t }}</p>
        @if (sent()) {
          <div class="alert alert-success">
            <i class="bi bi-envelope-check me-2"></i>{{ 'auth.resetEmailSent' | t }}
          </div>
          <a routerLink="/login" class="btn btn-samsary w-100 mt-3">{{ 'auth.backToLogin' | t }}</a>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            @if (error()) { <div class="alert alert-danger py-2 small mb-3">{{ error() }}</div> }
            <div class="mb-4">
              <label class="form-label fw-medium">{{ 'auth.email' | t }}</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0"><i class="bi bi-envelope text-muted"></i></span>
                <input class="form-control border-start-0 ps-0" type="email" formControlName="email" autocomplete="email">
              </div>
            </div>
            <button class="btn btn-samsary w-100 py-2" [disabled]="form.invalid || loading()">
              @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
              {{ 'auth.sendResetLink' | t }}
            </button>
          </form>
          <p class="text-center mt-4 mb-0 small text-muted">
            <a routerLink="/login" class="fw-medium">← {{ 'auth.backToLogin' | t }}</a>
          </p>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .auth-split-card { display: grid; grid-template-columns: 1fr 1fr; border-radius: 1.5rem; max-width: 720px; width: 100%; margin: 2rem auto; }
    .auth-hero { background: var(--samsary-gradient); border-radius: 1.5rem 0 0 1.5rem; }
    .auth-form { background: #fff; border-radius: 0 1.5rem 1.5rem 0; }
    .input-group-text { border-radius: .6rem 0 0 .6rem !important; }
    .form-control { border-radius: 0 .6rem .6rem 0 !important; }
    @media (max-width: 600px) {
      .auth-split-card { grid-template-columns: 1fr; }
      .auth-hero { border-radius: 1.5rem 1.5rem 0 0; }
      .auth-form { border-radius: 0 0 1.5rem 1.5rem; }
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  loading = signal(false);
  sent = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set(null);
    this.api.forgotPassword(this.form.value.email!).subscribe({
      next: () => { this.sent.set(true); this.loading.set(false); },
      error: () => { this.sent.set(true); this.loading.set(false); } // always show success (prevent enumeration)
    });
  }
}
