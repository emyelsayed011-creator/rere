import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminTheme, ThemeService } from '../../core/theme.service';
import { TranslatePipe } from '../../core/i18n.service';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-admin-theme',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <h4 class="mb-4 fw-bold">{{ 'admin.theme' | t }}</h4>
    <div class="row g-4">

      <!-- Preview card -->
      <div class="col-lg-5 order-lg-2">
        <div class="card border-0 shadow-sm sticky-top" style="top:80px">
          <div class="card-body p-0 overflow-hidden rounded">
            <div class="p-4 text-white" [style]="previewGradient()">
              <div class="d-flex align-items-center gap-2 mb-3">
                @if (form.value.logoUrl) {
                  <img [src]="form.value.logoUrl" height="36" class="rounded" alt="">
                } @else {
                  <i class="bi bi-buildings-fill fs-3"></i>
                }
                <div>
                  <div class="fw-bold">{{ form.value.siteName || 'Samsarly' }}</div>
                  @if (form.value.siteNameAr) {
                    <div class="small opacity-75" dir="rtl">{{ form.value.siteNameAr }}</div>
                  }
                </div>
              </div>
              <p class="small opacity-75 mb-0">Preview — هكذا ستبدو المنصة</p>
            </div>
            <div class="p-4">
              <button class="btn w-100 text-white fw-semibold py-2 rounded-pill mb-2"
                      [style]="'background:' + previewGradient()">زر رئيسي</button>
              <div class="row g-2">
                <div class="col-6">
                  <div class="p-3 rounded text-white text-center small"
                       [style]="'background:' + (form.value.primaryColor || '#1a4f7a')">Primary</div>
                </div>
                <div class="col-6">
                  <div class="p-3 rounded text-white text-center small"
                       [style]="'background:' + (form.value.accentColor || '#c9991f')">Accent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div class="col-lg-7 order-lg-1">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <form [formGroup]="form" (ngSubmit)="save()">

              <!-- Site name (bilingual) -->
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-medium">{{ 'admin.themeSiteName' | t }} (EN)</label>
                  <input class="form-control" formControlName="siteName" placeholder="Samsarly">
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-medium">{{ 'admin.themeSiteName' | t }} (AR)</label>
                  <input class="form-control" formControlName="siteNameAr" placeholder="سمسارلي" dir="rtl">
                </div>
              </div>

              <!-- Logo upload -->
              <div class="mb-3">
                <label class="form-label fw-medium">{{ 'admin.themeLogoUrl' | t }}</label>
                <div class="d-flex gap-2 align-items-center">
                  <input class="form-control" formControlName="logoUrl" placeholder="https://...">
                  <label class="btn btn-outline-secondary flex-shrink-0 mb-0" style="cursor:pointer">
                    @if (logoUploading()) { <span class="spinner-border spinner-border-sm"></span> }
                    @else { <i class="bi bi-upload"></i> }
                    <input type="file" class="d-none" accept="image/*" (change)="uploadLogo($event)">
                  </label>
                </div>
                <div class="form-text">{{ 'admin.themeLogoHint' | t }}</div>
                @if (logoError()) { <div class="text-danger small mt-1">{{ logoError() }}</div> }
              </div>

              <!-- Colors -->
              <div class="row g-3 mb-3">
                <div class="col-6">
                  <label class="form-label fw-medium">{{ 'admin.themePrimary' | t }}</label>
                  <div class="input-group">
                    <input type="color" class="form-control form-control-color" formControlName="primaryColor" style="width:48px">
                    <input class="form-control font-monospace" formControlName="primaryColor" maxlength="7">
                  </div>
                </div>
                <div class="col-6">
                  <label class="form-label fw-medium">{{ 'admin.themeAccent' | t }}</label>
                  <div class="input-group">
                    <input type="color" class="form-control form-control-color" formControlName="accentColor" style="width:48px">
                    <input class="form-control font-monospace" formControlName="accentColor" maxlength="7">
                  </div>
                </div>
              </div>

              <!-- Font -->
              <div class="mb-3">
                <label class="form-label fw-medium">{{ 'admin.themeFont' | t }}</label>
                <select class="form-select" formControlName="fontFamily">
                  <option value="Poppins">Poppins</option>
                  <option value="Cairo">Cairo (عربي)</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Tajawal">Tajawal (عربي)</option>
                </select>
              </div>

              <div class="mb-4">
                <label class="form-label fw-medium">{{ 'admin.themeFontSize' | t }}: {{ form.value.fontSizeBase }}px</label>
                <input type="range" class="form-range" formControlName="fontSizeBase" min="12" max="22" step="1">
              </div>

              @if (saved()) { <div class="alert alert-success py-2 small">✓ {{ 'common.saved' | t }}</div> }
              @if (error()) { <div class="alert alert-danger py-2 small">{{ error() }}</div> }

              <div class="d-flex gap-2">
                <button class="btn btn-samsary px-4" [disabled]="saving()">
                  @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  {{ 'common.save' | t }}
                </button>
                <button type="button" class="btn btn-outline-secondary" (click)="preview()">
                  {{ 'admin.themePreview' | t }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminThemeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private themeSvc = inject(ThemeService);
  private api = inject(ApiService);

  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);
  logoUploading = signal(false);
  logoError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    primaryColor: ['#1a4f7a', [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)]],
    accentColor:  ['#c9991f', [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)]],
    logoUrl:      [''],
    siteName:     ['Samsary'],
    siteNameAr:   ['سمسارة'],
    fontFamily:   ['Poppins'],
    fontSizeBase: [16, [Validators.min(12), Validators.max(22)]]
  });

  previewGradient() {
    const p = this.form.value.primaryColor || '#1a4f7a';
    const a = this.form.value.accentColor  || '#c9991f';
    return `linear-gradient(135deg, ${p} 0%, ${a} 100%)`;
  }

  ngOnInit() {
    const t = this.themeSvc.adminTheme();
    if (t) this.form.patchValue(t);
  }

  uploadLogo(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.logoUploading.set(true);
    this.logoError.set(null);
    this.api.uploadThemeLogo(file).subscribe({
      next: r => { this.form.patchValue({ logoUrl: r.url }); this.logoUploading.set(false); },
      error: e => { this.logoError.set(e?.error?.detail || 'Upload failed.'); this.logoUploading.set(false); }
    });
  }

  preview() {
    this.themeSvc.applyAdminTheme(this.form.getRawValue() as AdminTheme);
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true); this.saved.set(false); this.error.set(null);
    const val = this.form.getRawValue() as AdminTheme;
    this.themeSvc.saveAdminTheme(val).subscribe({
      next: t => {
        this.themeSvc.applyAdminTheme(t);
        this.saving.set(false); this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: e => { this.error.set(e?.error?.detail || 'Save failed.'); this.saving.set(false); }
    });
  }
}
