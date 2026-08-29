import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { TranslatePipe, I18nService } from '../core/i18n.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <h4 class="mb-3 fw-bold">{{ 'profile.title' | t }}</h4>
    <div class="row g-4 animate-fade-up">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm text-center">
          <div class="card-body">
            @if (auth.user()?.avatarUrl) {
              <img [src]="auth.user()!.avatarUrl" class="rounded-circle mb-2" width="120" height="120" alt="">
            } @else {
              <i class="bi bi-person-circle fs-1 text-secondary"></i>
            }
            <h5 class="mb-0 mt-2">{{ auth.user()?.displayName }}</h5>
            <div class="text-muted small">{{ auth.user()?.email }}</div>
            <hr>
            <label class="btn btn-outline-primary btn-sm w-100 mb-0">
              <i class="bi bi-upload me-1"></i> {{ 'profile.changeAvatar' | t }}
              <input type="file" hidden accept="image/*" (change)="uploadAvatar($event)">
            </label>
            @if (avatarMsg()) { <div class="small text-success mt-2">{{ avatarMsg() }}</div> }
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <h6 class="mb-3 fw-bold">{{ 'profile.details' | t }}</h6>
            <form [formGroup]="form" (ngSubmit)="save()">
              <div class="mb-3">
                <label class="form-label">{{ 'profile.displayName' | t }}</label>
                <input class="form-control" formControlName="displayName">
              </div>
              <div class="mb-3">
                <label class="form-label">{{ 'profile.phoneNumber' | t }}</label>
                <input class="form-control" type="tel" formControlName="phoneNumber" placeholder="+966 5xx xxx xxx">
              </div>
              <div class="mb-3">
                <label class="form-label">{{ 'profile.bio' | t }}</label>
                <textarea class="form-control" rows="3" formControlName="bio"></textarea>
              </div>
              <button class="btn btn-samsary" [disabled]="form.invalid || saving()">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> } {{ 'common.save' | t }}
              </button>
              @if (saveMsg()) { <span class="text-success ms-2 small">{{ saveMsg() }}</span> }
            </form>
          </div>
        </div>

        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 class="mb-3 fw-bold">{{ 'profile.changePassword' | t }}</h6>
            <form [formGroup]="pwForm" (ngSubmit)="changePassword()">
              <div class="row g-2">
                <div class="col-md-6">
                  <input class="form-control" type="password" formControlName="currentPassword" [placeholder]="'profile.currentPassword' | t">
                </div>
                <div class="col-md-6">
                  <input class="form-control" type="password" formControlName="newPassword" [placeholder]="'profile.newPassword' | t">
                </div>
              </div>
              <button class="btn btn-outline-primary mt-3" [disabled]="pwForm.invalid || pwSaving()">
                @if (pwSaving()) { <span class="spinner-border spinner-border-sm me-2"></span> } {{ 'profile.updatePassword' | t }}
              </button>
              @if (pwMsg()) { <span class="ms-2 small" [class.text-success]="pwOk()" [class.text-danger]="!pwOk()">{{ pwMsg() }}</span> }
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private i18n = inject(I18nService);
  auth = inject(AuthService);

  saving = signal(false);
  saveMsg = signal<string | null>(null);
  avatarMsg = signal<string | null>(null);
  pwSaving = signal(false);
  pwMsg = signal<string | null>(null);
  pwOk = signal(true);

  form = this.fb.nonNullable.group({
    displayName: [this.auth.user()?.displayName ?? '', [Validators.required, Validators.maxLength(80)]],
    phoneNumber: [this.auth.user()?.phone ?? '', [Validators.required, Validators.pattern(/^(\+?2)?01[0125][0-9]{8}$/)]],
    bio: [this.auth.user()?.bio ?? '']
  });

  pwForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  save() {
    this.saving.set(true); this.saveMsg.set(null);
    this.api.updateProfile(this.form.getRawValue()).subscribe({
      next: u => { this.auth.updateLocalUser(u); this.saveMsg.set(this.i18n.t('common.saved')); this.saving.set(false); },
      error: () => { this.saveMsg.set(this.i18n.t('common.failed')); this.saving.set(false); }
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
      next: () => { this.pwOk.set(true); this.pwMsg.set(this.i18n.t('profile.passwordChanged')); this.pwForm.reset({ currentPassword: '', newPassword: '' }); this.pwSaving.set(false); },
      error: e => { this.pwOk.set(false); this.pwMsg.set((e?.error?.errors || [e?.error?.detail || 'Failed'])[0]); this.pwSaving.set(false); }
    });
  }
}
