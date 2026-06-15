import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="card auth-card shadow-sm border-0">
      <div class="card-body p-4">
        <h4 class="mb-3 text-center"><i class="bi bi-person-plus text-primary me-2"></i>Create account</h4>
        <form [formGroup]="form" (ngSubmit)="submit()">
          @if (errors().length) {
            <div class="alert alert-danger py-2 small">
              @for (e of errors(); track e) { <div>• {{ e }}</div> }
            </div>
          }
          <div class="mb-3">
            <label class="form-label">Display name</label>
            <input class="form-control" formControlName="displayName" maxlength="80">
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input class="form-control" type="email" formControlName="email" autocomplete="email">
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input class="form-control" type="password" formControlName="password" autocomplete="new-password">
            <div class="form-text">Min 8 chars, uppercase, digit, symbol.</div>
          </div>
          <button class="btn btn-samsary w-100" [disabled]="form.invalid || loading()">
            @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
            Create account
          </button>
        </form>
        <p class="text-center mt-3 mb-0 small">
          Have an account? <a routerLink="/login">Sign in</a>
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
      const msg = e?.error?.errors || [e?.error?.error || 'Registration failed.'];
      this.errors.set(Array.isArray(msg) ? msg : [msg]);
    } finally { this.loading.set(false); }
  }
}
