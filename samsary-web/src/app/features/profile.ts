import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h4 class="mb-3">My profile</h4>
    <div class="row g-4">
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
              <i class="bi bi-upload me-1"></i> Change avatar
              <input type="file" hidden accept="image/*" (change)="uploadAvatar($event)">
            </label>
            @if (avatarMsg()) { <div class="small text-success mt-2">{{ avatarMsg() }}</div> }
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <h6 class="mb-3">Details</h6>
            <form [formGroup]="form" (ngSubmit)="save()">
              <div class="mb-3">
                <label class="form-label">Display name</label>
                <input class="form-control" formControlName="displayName">
              </div>
              <div class="mb-3">
                <label class="form-label">Bio</label>
                <textarea class="form-control" rows="3" formControlName="bio"></textarea>
              </div>
              <button class="btn btn-samsary" [disabled]="form.invalid || saving()">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> } Save
              </button>
              @if (saveMsg()) { <span class="text-success ms-2 small">{{ saveMsg() }}</span> }
            </form>
          </div>
        </div>

        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 class="mb-3">Change password</h6>
            <form [formGroup]="pwForm" (ngSubmit)="changePassword()">
              <div class="row g-2">
                <div class="col-md-6">
                  <input class="form-control" type="password" formControlName="currentPassword" placeholder="Current password">
                </div>
                <div class="col-md-6">
                  <input class="form-control" type="password" formControlName="newPassword" placeholder="New password (min 8)">
                </div>
              </div>
              <button class="btn btn-outline-primary mt-3" [disabled]="pwForm.invalid || pwSaving()">
                @if (pwSaving()) { <span class="spinner-border spinner-border-sm me-2"></span> } Update password
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
  auth = inject(AuthService);

  saving = signal(false);
  saveMsg = signal<string | null>(null);
  avatarMsg = signal<string | null>(null);
  pwSaving = signal(false);
  pwMsg = signal<string | null>(null);
  pwOk = signal(true);

  form = this.fb.nonNullable.group({
    displayName: [this.auth.user()?.displayName ?? '', [Validators.required, Validators.maxLength(80)]],
    bio: [this.auth.user()?.bio ?? '']
  });

  pwForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  save() {
    this.saving.set(true); this.saveMsg.set(null);
    this.api.updateProfile(this.form.getRawValue()).subscribe({
      next: u => { this.auth.updateLocalUser(u); this.saveMsg.set('Saved'); this.saving.set(false); },
      error: () => { this.saveMsg.set('Failed'); this.saving.set(false); }
    });
  }

  uploadAvatar(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0]; if (!f) return;
    this.avatarMsg.set(null);
    this.api.uploadAvatar(f).subscribe({
      next: u => { this.auth.updateLocalUser(u); this.avatarMsg.set('Avatar updated'); },
      error: () => this.avatarMsg.set('Upload failed')
    });
  }

  changePassword() {
    if (this.pwForm.invalid) return;
    this.pwSaving.set(true); this.pwMsg.set(null);
    this.api.changePassword(this.pwForm.getRawValue()).subscribe({
      next: () => { this.pwOk.set(true); this.pwMsg.set('Password changed.'); this.pwForm.reset({ currentPassword: '', newPassword: '' }); this.pwSaving.set(false); },
      error: e => { this.pwOk.set(false); this.pwMsg.set((e?.error?.errors || ['Failed'])[0]); this.pwSaving.set(false); }
    });
  }
}
