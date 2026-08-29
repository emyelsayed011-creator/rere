import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="auth-split-card shadow-lg border-0 overflow-hidden">
      <div class="auth-hero d-flex flex-column align-items-center justify-content-center p-5 text-white">
        <i class="bi bi-key-fill mb-3" style="font-size:3.5rem;opacity:.9"></i>
        <h2 class="fw-bold mb-2">{{ 'auth.resetPassword' | t }}</h2>
        <p class="opacity-75 small text-center">{{ 'auth.resetSubtitle' | t }}</p>
      </div>
      <div class="auth-form d-flex flex-column justify-content-center p-4 p-md-5">
        <h4 class="fw-bold mb-4">{{ 'auth.resetPassword' | t }}</h4>
        @if (done()) {
          <div class="alert alert-success"><i class="bi bi-check2-circle me-2"></i>{{ 'auth.passwordResetSuccess' | t }}</div>
          <a routerLink="/login" class="btn btn-samsary w-100 mt-3">{{ 'auth.signIn' | t }}</a>
        } @else if (invalidLink()) {
          <div class="alert alert-danger">{{ 'auth.invalidResetLink' | t }}</div>
          <a routerLink="/forgot-password" class="btn btn-outline-primary w-100 mt-3">{{ 'auth.requestNewLink' | t }}</a>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            @if (error()) { <div class="alert alert-danger py-2 small mb-3">{{ error() }}</div> }
            <div class="mb-3">
              <label class="form-label fw-medium">{{ 'auth.newPassword' | t }}</label>
              <input class="form-control" type="password" formControlName="password">
              <div class="form-text">{{ 'auth.passwordHint' | t }}</div>
            </div>
            <div class="mb-4">
              <label class="form-label fw-medium">{{ 'auth.confirmPassword' | t }}</label>
              <input class="form-control" type="password" formControlName="confirm">
              @if (form.errors?.['mismatch'] && form.controls.confirm.touched) {
                <div class="text-danger small mt-1">{{ 'auth.passwordMismatch' | t }}</div>
              }
            </div>
            <button class="btn btn-samsary w-100 py-2" [disabled]="form.invalid || loading()">
              @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
              {{ 'auth.resetPassword' | t }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .auth-split-card { display: grid; grid-template-columns: 1fr 1fr; border-radius: 1.5rem; max-width: 720px; width: 100%; margin: 2rem auto; }
    .auth-hero { background: var(--samsary-gradient); border-radius: 1.5rem 0 0 1.5rem; }
    .auth-form { background: #fff; border-radius: 0 1.5rem 1.5rem 0; }
    @media (max-width: 600px) {
      .auth-split-card { grid-template-columns: 1fr; }
      .auth-hero { border-radius: 1.5rem 1.5rem 0 0; }
      .auth-form { border-radius: 0 0 1.5rem 1.5rem; }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  loading = signal(false);
  done = signal(false);
  invalidLink = signal(false);
  error = signal<string | null>(null);

  private email = '';
  private token = '';

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required]]
  }, { validators: g => g.value.password !== g.value.confirm ? { mismatch: true } : null });

  ngOnInit() {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.email || !this.token) this.invalidLink.set(true);
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set(null);
    this.api.resetPassword(this.email, this.token, this.form.value.password!).subscribe({
      next: () => { this.done.set(true); this.loading.set(false); },
      error: e => { this.error.set(e?.error?.detail || 'Reset failed.'); this.loading.set(false); }
    });
  }
}
