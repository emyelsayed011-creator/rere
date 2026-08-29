import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { I18nService, TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h4 class="mb-0 fw-bold">{{ 'profile.title' | t }}</h4>
    </div>

    <div class="row g-4 animate-fade-up">
      <!-- Avatar card -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm text-center">
          <div class="card-body p-4">
            @if (auth.user()?.avatarUrl) {
              <img [src]="auth.user()!.avatarUrl" class="rounded-circle mb-3 border border-3" style="border-color:var(--samsary-primary)!important;width:110px;height:110px;object-fit:cover" alt="">
            } @else {
              <div class="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                   style="width:110px;height:110px;background:var(--samsary-gradient-soft)">
                <i class="bi bi-person-fill fs-1" style="color:var(--samsary-primary)"></i>
              </div>
            }
            <h5 class="fw-bold mb-0">{{ auth.user()?.displayName }}</h5>
            <div class="text-muted small mb-1">{{ auth.user()?.email }}</div>
            @if (auth.user()?.phone) {
              <div class="text-muted small mb-2"><i class="bi bi-telephone me-1"></i>{{ auth.user()?.phone }}</div>
            }
            <div class="d-flex flex-wrap justify-content-center gap-1 mb-3">
              @for (r of (auth.user()?.roles ?? []); track r) {
                <span class="badge rounded-pill" style="background:var(--samsary-gradient)">{{ r }}</span>
              }
            </div>
            <label class="btn btn-outline-primary btn-sm w-100 mb-0">
              <i class="bi bi-camera me-1"></i> {{ 'profile.changeAvatar' | t }}
              <input type="file" hidden accept="image/*" (change)="uploadAvatar($event)">
            </label>
            @if (avatarMsg()) { <div class="small text-success mt-2">{{ avatarMsg() }}</div> }
          </div>
        </div>
      </div>

      <!-- Edit form -->
      <div class="col-md-8">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <h6 class="fw-bold mb-3"><i class="bi bi-pencil-square me-2 text-primary"></i>{{ 'profile.details' | t }}</h6>
            @if (loading()) {
              <div class="text-center py-3"><span class="spinner-border spinner-border-sm"></span></div>
            }
            <form [formGroup]="form" (ngSubmit)="save()">
              <!-- Email — readonly -->
              <div class="mb-3">
                <label class="form-label fw-medium">{{ 'auth.email' | t }}</label>
                <input class="form-control bg-light" [value]="auth.user()?.email || ''" readonly>
              </div>
              <div class="mb-3">
                <label class="form-label fw-medium">{{ 'profile.displayName' | t }}</label>
                <input class="form-control" formControlName="displayName" maxlength="80">
              </div>
              <div class="mb-3">
                <label class="form-label fw-medium">{{ 'profile.phoneNumber' | t }}</label>
                <input class="form-control" type="tel" formControlName="phoneNumber" placeholder="01xxxxxxxxx">
                @if (form.controls.phoneNumber.invalid && form.controls.phoneNumber.touched) {
                  <div class="text-danger small mt-1">{{ 'auth.phoneInvalid' | t }}</div>
                }
              </div>
              <div class="mb-3">
                <label class="form-label fw-medium">{{ 'profile.bio' | t }}</label>
                <textarea class="form-control" rows="3" formControlName="bio" maxlength="500"></textarea>
              </div>
              @if (saveMsg()) { <div class="alert py-2 small mb-2" [class.alert-success]="saveOk()" [class.alert-danger]="!saveOk()">{{ saveMsg() }}</div> }
              <button class="btn btn-samsary" [disabled]="form.invalid || saving()">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                {{ 'common.save' | t }}
              </button>
            </form>
          </div>
        </div>

        <!-- Change password -->
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 class="fw-bold mb-3"><i class="bi bi-shield-lock me-2 text-primary"></i>{{ 'profile.changePassword' | t }}</h6>
            <form [formGroup]="pwForm" (ngSubmit)="changePassword()">
              <div class="row g-2">
                <div class="col-md-6">
                  <label class="form-label fw-medium small">{{ 'profile.currentPassword' | t }}</label>
                  <input class="form-control" type="password" formControlName="currentPassword">
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-medium small">{{ 'profile.newPassword' | t }}</label>
                  <input class="form-control" type="password" formControlName="newPassword">
                </div>
              </div>
              @if (pwMsg()) { <div class="mt-2 small" [class.text-success]="pwOk()" [class.text-danger]="!pwOk()">{{ pwMsg() }}</div> }
              <button class="btn btn-outline-primary mt-3" [disabled]="pwForm.invalid || pwSaving()">
                @if (pwSaving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                {{ 'profile.updatePassword' | t }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private i18n = inject(I18nService);
  auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  saveMsg = signal<string | null>(null);
  saveOk = signal(true);
  avatarMsg = signal<string | null>(null);
  pwSaving = signal(false);
  pwMsg = signal<string | null>(null);
  pwOk = signal(true);

  form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(80)]],
    phoneNumber: ['', [Validators.pattern(/^(\+?2)?01[0125][0-9]{8}$/)]],
    bio: ['']
  });

  pwForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit() {
    // Fetch fresh user data from API
    this.api.me().subscribe({
      next: u => {
        this.auth.updateLocalUser(u);
        this.form.patchValue({
          displayName: u.displayName ?? '',
          phoneNumber: (u as any).phone ?? '',
          bio: u.bio ?? ''
        });
        this.loading.set(false);
      },
      error: () => {
        // Fall back to cached user
        const u = this.auth.user();
        if (u) this.form.patchValue({ displayName: u.displayName, phoneNumber: (u as any).phone ?? '', bio: u.bio ?? '' });
        this.loading.set(false);
      }
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true); this.saveMsg.set(null);
    const v = this.form.getRawValue();
    this.api.updateProfile({
      displayName: v.displayName,
      bio: v.bio,
      phone: v.phoneNumber || undefined
    }).subscribe({
      next: u => {
        this.auth.updateLocalUser(u);
        this.saveOk.set(true);
        this.saveMsg.set(this.i18n.t('common.saved'));
        this.saving.set(false);
      },
      error: () => { this.saveOk.set(false); this.saveMsg.set(this.i18n.t('common.failed')); this.saving.set(false); }
    });
  }

  uploadAvatar(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0]; if (!f) return;
    this.avatarMsg.set(null);
    this.api.uploadAvatar(f).subscribe({
      next: u => { this.auth.updateLocalUser(u); this.avatarMsg.set(this.i18n.t('profile.avatarUpdated')); },
      error: () => this.avatarMsg.set(this.i18n.t('profile.uploadFailed'))
    });
  }

  changePassword() {
    if (this.pwForm.invalid) return;
    this.pwSaving.set(true); this.pwMsg.set(null);
    this.api.changePassword(this.pwForm.getRawValue()).subscribe({
      next: () => { this.pwOk.set(true); this.pwMsg.set(this.i18n.t('profile.passwordChanged')); this.pwForm.reset(); this.pwSaving.set(false); },
      error: e => { this.pwOk.set(false); this.pwMsg.set(e?.error?.detail || 'Failed'); this.pwSaving.set(false); }
    });
  }
}
