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
    <div class="card auth-card shadow-sm border-0">
      <div class="card-body p-4">
        <h4 class="mb-3 text-center fw-bold"><i class="bi bi-bag-heart-fill text-primary me-2"></i>{{ 'auth.welcomeBack' | t }}</h4>
        <form [formGroup]="form" (ngSubmit)="submit()">
          @if (error()) { <div class="alert alert-danger py-2 small">{{ error() }}</div> }
          <div class="mb-3">
            <label class="form-label">{{ 'auth.email' | t }}</label>
            <input class="form-control" type="email" formControlName="email" autocomplete="email">
          </div>
          <div class="mb-3">
            <label class="form-label">{{ 'auth.password' | t }}</label>
            <input class="form-control" type="password" formControlName="password" autocomplete="current-password">
          </div>
          <button class="btn btn-samsary w-100" [disabled]="form.invalid || loading()">
            @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
            {{ 'auth.signIn' | t }}
          </button>
        </form>
        <p class="text-center mt-3 mb-0 small">
          {{ 'auth.noAccount' | t }} <a routerLink="/register">{{ 'auth.createOne' | t }}</a>
        </p>
      </div>
    </div>
  `
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
      this.error.set(e?.error?.detail || e?.error?.error || 'Sign in failed.');
    } finally { this.loading.set(false); }
  }
}
