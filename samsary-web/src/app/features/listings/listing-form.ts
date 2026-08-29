import { Component, ElementRef, inject, OnInit, signal, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import * as L from 'leaflet';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { I18nService, TranslatePipe } from '../../core/i18n.service';
import { Category, Listing, ListingStatus, ListingType } from '../../core/models';

const CURRENCIES = [
  { code: 'EGP', label: 'EGP' },
  { code: 'USD', label: 'USD' },
  { code: 'SAR', label: 'SAR' },
  { code: 'AED', label: 'AED' },
  { code: 'EUR', label: 'EUR' },
  { code: 'GBP', label: 'GBP' },
];

const WIZARD_STEPS = [
  { num: 1, en: 'Type & Category', ar: 'النوع والفئة' },
  { num: 2, en: 'Details',         ar: 'التفاصيل' },
  { num: 3, en: 'Location',        ar: 'الموقع' },
];

@Component({
  selector: 'app-listing-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink, SlicePipe],
  template: `
    <!-- Email verification warning -->
    @if (auth.isAuthenticated() && auth.user()?.emailConfirmed === false) {
      <div class="email-verify-bar mb-3">
        <i class="bi bi-envelope-slash-fill"></i>
        <span class="flex-grow-1">
          {{ i18n.lang() === 'ar' ? 'يرجى تأكيد بريدك الإلكتروني لتتمكن من نشر إعلانات' : 'Please verify your email to post listings' }}
        </span>
        <button class="btn btn-sm btn-outline-primary rounded-pill" (click)="resendVerification()" [disabled]="resendingVerification()">
          @if (resendingVerification()) { <span class="spinner-border spinner-border-sm"></span> }
          @else { {{ i18n.lang() === 'ar' ? 'إرسال رابط التأكيد' : 'Send verification link' }} }
        </button>
      </div>
    }

    <h4 class="mb-4 fw-bold">{{ (editing() ? 'form.editTitle' : 'form.newTitle') | t }}</h4>

    <!-- Wizard step bar (new listing only) -->
    @if (!editing() && !created()) {
      <div class="wizard-steps mb-4">
        @for (s of wizardSteps; track s.num) {
          <div class="wiz-item" [class.active]="step() === s.num" [class.done]="step() > s.num">
            <div class="wiz-circle">
              @if (step() > s.num) { <i class="bi bi-check-lg"></i> }
              @else { {{ s.num }} }
            </div>
            <span class="wiz-label">{{ i18n.lang() === 'ar' ? s.ar : s.en }}</span>
          </div>
          @if (s.num < 3) {
            <div class="wiz-line" [class.done]="step() > s.num"></div>
          }
        }
      </div>
    }

    <div class="card border-0 shadow-sm animate-fade-up">
      <div class="card-body p-4">
        <form [formGroup]="form" (ngSubmit)="save()">

          <!-- ── STEP 1: Type & Category ─────────────────────────── -->
          @if (step() === 1 || editing()) {
            <div class="row g-4">
              @if (!editing()) {
                <div class="col-12">
                  <p class="fw-semibold text-muted small mb-3">
                    <i class="bi bi-tag-fill me-1 text-primary"></i>
                    {{ i18n.lang() === 'ar' ? 'اختر نوع الإعلان' : 'Select listing type' }}
                  </p>
                  <div class="d-flex gap-3 flex-wrap">
                    <div class="listing-type-card" [class.selected]="form.controls.type.value === 1"
                         (click)="form.patchValue({type: 1})" role="button">
                      <i class="bi bi-currency-exchange fs-2 mb-2 d-block"></i>
                      <div class="fw-bold">{{ 'common.sell' | t }}</div>
                      <div class="small opacity-75">{{ 'common.sale' | t }}</div>
                    </div>
                    <div class="listing-type-card" [class.selected]="form.controls.type.value === 2"
                         (click)="form.patchValue({type: 2})" role="button">
                      <i class="bi bi-house-door fs-2 mb-2 d-block"></i>
                      <div class="fw-bold">{{ 'common.rentShort' | t }}</div>
                      <div class="small opacity-75">{{ 'common.rent' | t }}</div>
                    </div>
                  </div>
                </div>
              }
              <div [class]="editing() ? 'col-md-6' : 'col-12'">
                <label class="form-label fw-medium">{{ 'form.category' | t }}</label>
                <select class="form-select" formControlName="categoryId">
                  @for (c of categories(); track c.id) {
                    <option [ngValue]="c.id">{{ i18n.lang() === 'ar' ? (c.nameAr || c.name) : c.name }}</option>
                  }
                </select>
                @if (fieldError('categoryId')) { <div class="invalid-feedback d-block">{{ fieldError('categoryId') }}</div> }
              </div>
              @if (editing()) {
                <div class="col-md-6">
                  <label class="form-label fw-medium">{{ 'form.type' | t }}</label>
                  <select class="form-select" formControlName="type">
                    <option [ngValue]="1">{{ 'common.sell' | t }}</option>
                    <option [ngValue]="2">{{ 'common.rentShort' | t }}</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-medium">
                    {{ i18n.lang() === 'ar' ? 'حالة الإعلان' : 'Listing Status' }}
                  </label>
                  <select class="form-select" formControlName="status">
                    <option [ngValue]="1">
                      {{ i18n.lang() === 'ar' ? 'متاح' : 'Available' }}
                    </option>
                    <option [ngValue]="3">
                      {{ i18n.lang() === 'ar' ? 'تم البيع' : 'Sold' }}
                    </option>
                    <option [ngValue]="4">
                      {{ i18n.lang() === 'ar' ? 'تم التأجير' : 'Rented' }}
                    </option>
                  </select>
                  <div class="form-text">
                    <i class="bi bi-info-circle me-1"></i>
                    {{ i18n.lang() === 'ar' ? 'حدد إذا كان الإعلان لا يزال متاحاً أو تم البيع/التأجير' : 'Mark if sold/rented to hide from search results' }}
                  </div>
                </div>
              }
            </div>
          }

          <!-- ── STEP 2: Details ─────────────────────────────────── -->
          @if (step() === 2 || editing()) {
            <div class="row g-3" [class.mt-2]="editing()">
              <div class="col-12">
                <label class="form-label fw-medium">{{ 'form.title' | t }}</label>
                <input class="form-control" formControlName="title" maxlength="200">
                @if (fieldError('title')) { <div class="invalid-feedback d-block">{{ fieldError('title') }}</div> }
              </div>
              <div class="col-md-5">
                <label class="form-label fw-medium">{{ 'form.price' | t }}</label>
                <input class="form-control" type="number" formControlName="price" min="1">
                @if (form.controls.price.invalid && form.controls.price.touched) {
                  <div class="invalid-feedback d-block">
                    {{ i18n.lang() === 'ar' ? 'السعر يجب أن يكون أكبر من 0' : 'Price must be greater than 0' }}
                  </div>
                }
                @if (fieldError('price')) { <div class="invalid-feedback d-block">{{ fieldError('price') }}</div> }
              </div>
              <div class="col-md-3">
                <label class="form-label fw-medium">{{ 'form.currency' | t }}</label>
                <select class="form-select" formControlName="currency">
                  @for (c of currencies; track c.code) { <option [value]="c.code">{{ c.code }}</option> }
                </select>
              </div>
              <div class="col-md-4 d-flex align-items-end pb-1">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="isNegotiable" formControlName="isNegotiable">
                  <label class="form-check-label fw-medium" for="isNegotiable">
                    <i class="bi bi-chat-left-dots me-1 text-primary"></i>
                    {{ i18n.lang() === 'ar' ? 'السعر قابل للتفاوض' : 'Negotiable price' }}
                  </label>
                </div>
              </div>
              <div class="col-12">
                <label class="form-label fw-medium">{{ 'form.description' | t }}</label>
                <textarea class="form-control" formControlName="description" rows="5" maxlength="4000"></textarea>
                @if (fieldError('description')) { <div class="invalid-feedback d-block">{{ fieldError('description') }}</div> }
              </div>
              <div class="col-md-6">
                <label class="form-label fw-medium">
                  <i class="bi bi-telephone-fill me-1 text-primary" style="font-size:.85rem"></i>
                  {{ 'form.contactPhone' | t }}
                </label>
                <input class="form-control" type="tel" formControlName="contactPhone"
                       placeholder="01xxxxxxxxx" dir="ltr">
                @if (form.controls.contactPhone.invalid && form.controls.contactPhone.touched) {
                  <div class="invalid-feedback d-block">{{ 'auth.phoneInvalid' | t }}</div>
                }
                <div class="form-text" style="font-size:.75rem">
                  {{ i18n.lang() === 'ar'
                    ? 'هذا الرقم سيظهر للمهتمين بإعلانك — يتم تحديثه في ملفك الشخصي تلقائياً'
                    : 'Shown to interested buyers — auto-synced to your profile' }}
                </div>
              </div>
            </div>
          }

          <!-- ── STEP 3: Location ────────────────────────────────── -->
          @if (step() === 3 || editing()) {
            <div class="row g-3" [class.mt-2]="editing()">
              <div class="col-12">
                <label class="form-label fw-medium">
                  {{ 'form.location' | t }} <span class="text-danger">*</span>
                </label>
                <input class="form-control mb-3" formControlName="location" maxlength="200"
                       [placeholder]="'form.locationPlaceholder' | t" readonly>
                @if (form.controls.location.invalid && form.controls.location.touched) {
                  <div class="text-danger small mb-2">{{ 'form.locationRequired' | t }}</div>
                }
                <!-- Location action buttons side by side -->
                <div class="location-actions mb-3">
                  <button type="button" class="loc-btn loc-btn-primary"
                          (click)="detectLocation()" [disabled]="locating()">
                    @if (locating()) { <span class="spinner-border spinner-border-sm"></span> }
                    @else { <i class="bi bi-geo-alt-fill"></i> }
                    <span>{{ 'form.detectLocation' | t }}</span>
                  </button>
                  <button type="button" class="loc-btn loc-btn-secondary" (click)="scrollToMap()">
                    <i class="bi bi-map"></i>
                    <span>{{ 'form.pickOnMap' | t }}</span>
                  </button>
                </div>
                <div class="small text-muted mb-2">
                  <i class="bi bi-info-circle me-1"></i>{{ 'form.mapHint' | t }}
                </div>
                <div #mapEl style="height:280px;border-radius:.75rem;overflow:hidden;border:1px solid #dee2e6"></div>
              </div>
            </div>
          }

          @if (error()) {
            <div class="alert alert-danger py-2 small mt-3 mb-0">{{ error() }}</div>
          }

          <!-- ── Navigation ──────────────────────────────────────── -->
          @if (!created()) {
            <div class="d-flex mt-4 pt-3 border-top"
                 [class.justify-content-between]="step() > 1 && !editing()"
                 [class.justify-content-end]="step() === 1 || editing()">
              @if (step() > 1 && !editing()) {
                <button type="button" class="btn btn-outline-secondary px-4" (click)="prevStep()">
                  <i class="bi bi-arrow-{{ i18n.isRtl() ? 'right' : 'left' }} me-1"></i>{{ 'form.back' | t }}
                </button>
              }
              @if (!editing() && step() < 3) {
                <button type="button" class="btn btn-samsary px-4" (click)="nextStep()" [disabled]="!canNext()">
                  {{ 'form.next' | t }}<i class="bi bi-arrow-{{ i18n.isRtl() ? 'left' : 'right' }} ms-1"></i>
                </button>
              }
              @if (step() === 3 || editing()) {
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-light" (click)="cancel()">{{ 'common.cancel' | t }}</button>
                  <button class="btn btn-samsary" [disabled]="form.invalid || saving() || !emailOk()">
                    @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                    {{ (editing() ? 'form.save' : 'form.createContinue') | t }}
                  </button>
                </div>
              }
            </div>
          }

        </form>
      </div>
    </div>

    <!-- ── Step 4: Media upload (after listing is created) ─────── -->
    @if (created(); as listing) {
      <div class="card border-0 shadow-sm mt-4 animate-fade-up">
        <div class="card-header bg-white border-bottom py-3">
          <div class="d-flex align-items-center gap-3">
            <div class="wiz-done-badge"><i class="bi bi-check-lg"></i></div>
            <div>
              <h6 class="fw-bold mb-0">{{ 'form.uploadMedia' | t }}</h6>
              <div class="small text-success"><i class="bi bi-check-circle me-1"></i>{{ 'form.createdOk' | t }}</div>
            </div>
          </div>
        </div>
        <div class="card-body p-4">
          <!-- ── Upload drop zones ── -->
          <div class="row g-3 mb-4">
            <!-- Images -->
            <div class="col-md-7">
              <label class="form-label fw-semibold">
                <i class="bi bi-images me-1 text-primary"></i>{{ 'form.addImages' | t }}
              </label>
              <div class="dropzone" [class.dropzone--over]="dragging()"
                   (dragover)="$event.preventDefault(); dragging.set(true)"
                   (dragleave)="dragging.set(false)"
                   (drop)="onDrop($event)"
                   (click)="imgInput.click()" role="button" tabindex="0"
                   (keydown.enter)="imgInput.click()">
                <i class="bi bi-cloud-upload fs-2 text-primary mb-1"></i>
                <div class="fw-semibold small">
                  {{ i18n.lang() === 'ar' ? 'اسحب الصور هنا أو اضغط للاختيار' : 'Drag images here or click' }}
                </div>
                <div class="text-muted" style="font-size:.75rem">JPG, PNG, WEBP</div>
                <input #imgInput type="file" accept="image/*" multiple hidden (change)="onFileSelected($event)">
              </div>
              @if (pendingFiles().length > 0) {
                <div class="row g-2 mt-2">
                  @for (f of pendingFiles(); track f.name; let i = $index) {
                    <div class="col-6 col-sm-4">
                      <div class="media-thumb">
                        <img [src]="previewUrl(f)" class="media-thumb__img" alt="">
                        <button class="media-thumb__del" (click)="removePending(i)" type="button"><i class="bi bi-x-lg"></i></button>
                        <div class="media-thumb__name">{{ f.name }}</div>
                      </div>
                    </div>
                  }
                </div>
                <div class="d-flex gap-2 mt-2">
                  <button type="button" class="btn btn-samsary btn-sm"
                          (click)="uploadPending(listing.id)" [disabled]="uploadingImgs()">
                    @if (uploadingImgs()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                    @else { <i class="bi bi-cloud-upload me-1"></i> }
                    {{ i18n.lang() === 'ar' ? 'رفع' : 'Upload' }} ({{ pendingFiles().length }})
                  </button>
                  <button type="button" class="btn btn-light btn-sm" (click)="clearPending()" [disabled]="uploadingImgs()">
                    {{ 'common.cancel' | t }}
                  </button>
                </div>
              }
              @if (uploadingImgs()) {
                <div class="progress mt-2" style="height:3px">
                  <div class="progress-bar progress-bar-striped progress-bar-animated w-100"></div>
                </div>
              }
            </div>

            <!-- Video -->
            <div class="col-md-5">
              <label class="form-label fw-semibold">
                <i class="bi bi-camera-video me-1 text-primary"></i>{{ 'form.addVideo' | t }}
              </label>
              @if (!pendingVid()) {
                <div class="dropzone" [class.dropzone--over]="draggingVid()"
                     (dragover)="$event.preventDefault(); draggingVid.set(true)"
                     (dragleave)="draggingVid.set(false)"
                     (drop)="onDropVid($event)"
                     (click)="vidInput.click()" role="button" tabindex="0"
                     (keydown.enter)="vidInput.click()">
                  <i class="bi bi-play-circle fs-2 text-primary mb-1"></i>
                  <div class="fw-semibold small">
                    {{ i18n.lang() === 'ar' ? 'اسحب الفيديو هنا أو اضغط' : 'Drag video here or click' }}
                  </div>
                  <div class="text-muted" style="font-size:.75rem">MP4, MOV — {{ 'form.videoHint' | t }}</div>
                  <input #vidInput type="file" accept="video/*" hidden (change)="onVidSelected($event)">
                </div>
              } @else {
                <div class="media-thumb" style="aspect-ratio:16/9">
                  <video [src]="pendingVidUrl()" class="media-thumb__img" preload="metadata"></video>
                  <span class="position-absolute top-0 start-0 m-1 badge bg-dark bg-opacity-75 small">
                    <i class="bi bi-play-fill me-1"></i>{{ pendingVid()!.name | slice:0:20 }}
                  </span>
                  <button class="media-thumb__del" (click)="pendingVid.set(null); clearPendingVidUrl()" type="button">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
                <div class="d-flex gap-2 mt-2">
                  <button type="button" class="btn btn-samsary btn-sm"
                          (click)="uploadPendingVid(listing.id)" [disabled]="uploadingVid()">
                    @if (uploadingVid()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                    @else { <i class="bi bi-cloud-upload me-1"></i> }
                    {{ i18n.lang() === 'ar' ? 'رفع الفيديو' : 'Upload video' }}
                  </button>
                  <button type="button" class="btn btn-light btn-sm" (click)="pendingVid.set(null); clearPendingVidUrl()"
                          [disabled]="uploadingVid()">{{ 'common.cancel' | t }}</button>
                </div>
              }
              @if (uploadingVid()) {
                <div class="progress mt-2" style="height:3px">
                  <div class="progress-bar progress-bar-striped progress-bar-animated w-100"></div>
                </div>
              }
            </div>
          </div>

          @if (mediaError()) { <div class="alert alert-danger py-2 small mb-3">{{ mediaError() }}</div> }

          <!-- ── Uploaded media carousel ── -->
          @if (listing.media.length > 0) {
            <div class="mb-3">
              <h6 class="fw-semibold mb-2 d-flex align-items-center gap-2">
                {{ 'form.uploadedMedia' | t }}
                <span class="badge rounded-pill bg-primary-subtle text-primary">{{ listing.media.length }}</span>
              </h6>
              @if (listing.media.length === 1) {
                <!-- Single item — no carousel needed -->
                <div class="rounded-3 overflow-hidden border position-relative" style="aspect-ratio:16/9;background:#f0f0f0">
                  @if (listing.media[0].mediaType === 1) {
                    <img [src]="listing.media[0].thumbnailUrl || listing.media[0].url" class="w-100 h-100 object-fit-cover" alt="">
                  } @else {
                    <video [src]="listing.media[0].url" controls class="w-100 h-100 object-fit-cover"
                           [poster]="listing.media[0].thumbnailUrl || ''"></video>
                  }
                  <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
                          style="width:28px;height:28px;padding:0"
                          (click)="removeMedia(listing.id, listing.media[0].id)" type="button">
                    <i class="bi bi-trash" style="font-size:.75rem"></i>
                  </button>
                </div>
              } @else {
                <!-- Multi-item Bootstrap carousel -->
                <div id="uploadedCarousel" class="carousel slide rounded-3 overflow-hidden border" data-bs-interval="false">
                  <div class="carousel-inner">
                    @for (m of listing.media; track m.id; let i = $index) {
                      <div class="carousel-item" [class.active]="i === 0" style="background:#f0f0f0">
                        <div style="aspect-ratio:16/9;position:relative">
                          @if (m.mediaType === 1) {
                            <img [src]="m.thumbnailUrl || m.url" class="w-100 h-100 object-fit-cover" alt="">
                            <span class="position-absolute top-0 start-0 m-2 badge bg-primary bg-opacity-75">
                              <i class="bi bi-image me-1"></i>{{ i + 1 }}/{{ listing.media.length }}
                            </span>
                          } @else {
                            <video [src]="m.url" controls class="w-100 h-100 object-fit-cover"
                                   [poster]="m.thumbnailUrl || ''"></video>
                            <span class="position-absolute top-0 start-0 m-2 badge bg-dark bg-opacity-75">
                              <i class="bi bi-play-fill me-1"></i>{{ i18n.lang() === 'ar' ? 'فيديو' : 'Video' }}
                            </span>
                          }
                          <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
                                  style="width:28px;height:28px;padding:0"
                                  (click)="removeMedia(listing.id, m.id)" type="button">
                            <i class="bi bi-trash" style="font-size:.75rem"></i>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                  <button class="carousel-control-prev" type="button" data-bs-target="#uploadedCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon"></span>
                  </button>
                  <button class="carousel-control-next" type="button" data-bs-target="#uploadedCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon"></span>
                  </button>
                  <!-- Thumbnail strip -->
                  <div class="d-flex gap-1 p-2 bg-dark bg-opacity-10 overflow-auto">
                    @for (m of listing.media; track m.id; let i = $index) {
                      <div class="thumb-strip-item" [attr.data-bs-target]="'#uploadedCarousel'" [attr.data-bs-slide-to]="i">
                        @if (m.mediaType === 1) {
                          <img [src]="m.thumbnailUrl || m.url" class="w-100 h-100 object-fit-cover" alt="">
                        } @else {
                          <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-dark text-white">
                            <i class="bi bi-play-fill"></i>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <div class="text-end mt-3">
            <button class="btn btn-samsary" (click)="finish()">
              <i class="bi bi-check2 me-1"></i>{{ 'form.submitReview' | t }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .wizard-steps { display: flex; align-items: center; }
    .wiz-item { display: flex; align-items: center; gap: .5rem; flex-shrink: 0; }
    .wiz-circle {
      width: 2rem; height: 2rem; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: .85rem;
      border: 2px solid #dee2e6; background: #fff; color: #6c757d;
      transition: all .2s;
    }
    .wiz-item.active .wiz-circle { background: var(--samsary-primary); border-color: var(--samsary-primary); color: #fff; }
    .wiz-item.done  .wiz-circle  { background: #198754; border-color: #198754; color: #fff; }
    .wiz-label { font-size: .82rem; color: #6c757d; white-space: nowrap; }
    .wiz-item.active .wiz-label { color: var(--samsary-primary); font-weight: 600; }
    .wiz-item.done  .wiz-label  { color: #198754; }
    .wiz-line { flex: 1; height: 2px; background: #dee2e6; margin: 0 .75rem; transition: background .3s; }
    .wiz-line.done { background: #198754; }
    .wiz-done-badge {
      width: 2.5rem; height: 2.5rem; border-radius: 50%;
      background: #d1e7dd; color: #198754;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0;
    }
    .listing-type-card {
      flex: 0 0 auto; min-width: 140px; max-width: 180px;
      padding: 1.25rem 1rem; border: 2px solid #dee2e6;
      border-radius: 1rem; cursor: pointer; text-align: center;
      transition: all .15s; background: #fff; user-select: none;
    }
    .listing-type-card:hover { border-color: var(--samsary-primary); background: rgba(var(--samsary-primary-rgb),.04); }
    .listing-type-card.selected {
      border-color: var(--samsary-primary); background: rgba(var(--samsary-primary-rgb),.08);
      color: var(--samsary-primary); box-shadow: 0 0 0 3px rgba(var(--samsary-primary-rgb),.15);
    }
    .location-actions { display: flex; gap: .75rem; }
    .loc-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: .5rem;
      padding: .6rem 1rem; border-radius: .65rem; font-size: .9rem; font-weight: 500;
      border: 1.5px solid; cursor: pointer; transition: all .15s; background: none;
    }
    .loc-btn:disabled { opacity: .6; cursor: not-allowed; }
    .loc-btn-primary  { border-color: var(--samsary-primary); color: var(--samsary-primary); background: rgba(var(--samsary-primary-rgb),.05); }
    .loc-btn-primary:hover:not(:disabled) { background: var(--samsary-primary); color: #fff; }
    .loc-btn-secondary { border-color: #ced4da; color: #495057; }
    .loc-btn-secondary:hover:not(:disabled) { background: #f8f9fa; border-color: #adb5bd; }
    /* Dropzone */
    .dropzone {
      border: 2px dashed #ced4da; border-radius: .75rem;
      background: #f8f9fa; padding: 1.5rem 1rem;
      text-align: center; cursor: pointer; transition: all .2s;
      display: flex; flex-direction: column; align-items: center; gap: .25rem;
    }
    .dropzone:hover, .dropzone--over {
      border-color: var(--samsary-primary);
      background: rgba(var(--samsary-primary-rgb), .05);
    }
    /* Media thumbnail card */
    .media-thumb {
      position: relative; border-radius: .5rem; overflow: hidden;
      border: 1px solid #dee2e6; aspect-ratio: 4/3; background: #f0f0f0;
    }
    .media-thumb__img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .media-thumb__del {
      position: absolute; top: 4px; inset-inline-end: 4px;
      width: 22px; height: 22px; border-radius: 50%; padding: 0;
      background: rgba(220,53,69,.85); color: #fff; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: .7rem;
    }
    .media-thumb__name {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: rgba(0,0,0,.5); color: #fff; font-size: .65rem;
      padding: 2px 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    /* Thumbnail strip below carousel */
    .thumb-strip-item {
      flex: 0 0 56px; height: 40px; border-radius: .35rem; overflow: hidden;
      cursor: pointer; border: 2px solid transparent; transition: border-color .15s;
    }
    .thumb-strip-item:hover { border-color: var(--samsary-primary); }
    /* Email verify bar */
    .email-verify-bar {
      display: flex; align-items: center; gap: .75rem;
      padding: .6rem 1rem; border-radius: .75rem;
      background: rgba(var(--samsary-primary-rgb), .06);
      border: 1px solid rgba(var(--samsary-primary-rgb), .2);
      font-size: .85rem; color: var(--samsary-primary);
    }
    @media (max-width: 576px) {
      .wiz-label { display: none; }
      .wiz-line { margin: 0 .4rem; }
      .location-actions { flex-direction: column; }
    }
  `]
})
export class ListingFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirm = inject(ConfirmService);
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);

  @ViewChild('mapEl') mapEl?: ElementRef<HTMLDivElement>;

  readonly currencies = CURRENCIES;
  readonly wizardSteps = WIZARD_STEPS;

  categories = signal<Category[]>([]);
  saving = signal(false);
  locating = signal(false);
  uploadingVid = signal(false);
  uploadingImgs = signal(false);
  dragging = signal(false);
  draggingVid = signal(false);
  pendingFiles = signal<File[]>([]);
  pendingVid = signal<File | null>(null);
  resendingVerification = signal(false);
  error = signal<string | null>(null);
  mediaError = signal<string | null>(null);
  editing = signal(false);
  created = signal<Listing | null>(null);
  validationErrors = signal<Record<string, string[]>>({});
  step = signal(1);
  editingId: number | null = null;

  private map?: L.Map;
  private marker?: L.Marker;
  private objectUrls: string[] = [];

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(4000)]],
    price: [0, [Validators.required, Validators.min(1)]],
    currency: ['EGP', [Validators.required]],
    type: [ListingType.Sell, [Validators.required]],
    categoryId: [0 as number, [Validators.required]],
    location: ['', [Validators.required]],
    isNegotiable: [false],
    status: [ListingStatus.Approved as ListingStatus],
    contactPhone: ['', [Validators.required, Validators.pattern(/^(\+?2)?01[0125][0-9]{8}$/)]]
  });

  fieldError(field: string): string | null {
    const errs = this.validationErrors()[field];
    return errs?.length ? errs[0] : null;
  }

  // Email must be confirmed before creating a new listing
  emailOk(): boolean {
    return this.editing() || this.auth.user()?.emailConfirmed !== false;
  }

  canNext(): boolean {
    if (!this.emailOk()) return false;
    const f = this.form.controls;
    if (this.step() === 1) return f.type.valid && f.categoryId.valid && !!f.categoryId.value;
    if (this.step() === 2) return f.title.valid && f.price.valid && f.currency.valid && f.description.valid && f.contactPhone.valid;
    return false;
  }

  nextStep() {
    if (this.step() < 3 && this.canNext()) {
      this.step.update(s => s + 1);
      if (this.step() === 3) setTimeout(() => this.initMap(), 100);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    if (this.step() > 1) {
      this.step.update(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  scrollToMap() {
    this.mapEl?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private reverseGeocode(lat: number, lng: number) {
    const lang = this.i18n.lang() === 'ar' ? 'ar' : 'en';
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${lang}`)
      .then(r => r.json())
      .then(data => {
        const parts = data?.address;
        const label = parts
          ? [parts.suburb, parts.city || parts.town || parts.village, parts.state].filter(Boolean).join(', ')
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        this.form.patchValue({ location: label || data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      })
      .catch(() => this.form.patchValue({ location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
  }

  ngOnInit() {
    this.api.categories().subscribe(c => {
      this.categories.set(c);
      if (c.length && !this.form.value.categoryId) this.form.patchValue({ categoryId: c[0].id });
    });
    // Pre-fill phone from logged-in user
    const userPhone = this.auth.user()?.phone;
    if (userPhone) this.form.patchValue({ contactPhone: userPhone });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editing.set(true);
      this.editingId = +id;
      this.api.listing(+id).subscribe(l => {
        this.form.patchValue({
          title: l.title, description: l.description, price: l.price,
          currency: l.currency, type: l.type, categoryId: l.category.id,
          location: l.location || '', isNegotiable: l.isNegotiable,
          status: (l.status === ListingStatus.Sold || l.status === ListingStatus.Rented)
            ? l.status : ListingStatus.Approved,
          contactPhone: l.ownerPhone || this.auth.user()?.phone || ''
        });
        this.created.set(l);
        // In edit mode all steps render together, so map is available
        setTimeout(() => this.initMap(), 100);
      });
    }
  }

  detectLocation() {
    if (!navigator.geolocation) return;
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        this.locating.set(false);
        this.reverseGeocode(latitude, longitude);
        if (this.map) this.setMapMarker(latitude, longitude);
      },
      () => this.locating.set(false)
    );
  }

  private initMap() {
    if (!this.mapEl?.nativeElement || this.map) return;
    const [lat, lng] = this.parseLocation() ?? [30.0444, 31.2357];

    this.map = L.map(this.mapEl.nativeElement, { zoomControl: true }).setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.marker = L.marker([lat, lng], {
      draggable: true,
      icon: L.divIcon({ className: 'custom-map-pin', iconSize: [18, 18], iconAnchor: [9, 18], html: '<span></span>' })
    }).addTo(this.map);

    this.marker.on('dragend', () => {
      const { lat: la, lng: lo } = this.marker!.getLatLng();
      this.reverseGeocode(la, lo);
    });
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker!.setLatLng(e.latlng);
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  private setMapMarker(lat: number, lng: number) {
    this.marker?.setLatLng([lat, lng]);
    this.map?.setView([lat, lng], 14);
  }

  private parseLocation(): [number, number] | null {
    const loc = this.form.value.location || '';
    const parts = loc.split(',').map(Number);
    return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) ? [parts[0], parts[1]] : null;
  }

  ngOnDestroy() {
    this.map?.remove();
    this.objectUrls.forEach(u => URL.revokeObjectURL(u));
    this.clearPendingVidUrl();
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.dragging.set(false);
    const files = Array.from(ev.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
    if (files.length) this.pendingFiles.update(p => [...p, ...files]);
  }

  onFileSelected(ev: Event) {
    const files = Array.from((ev.target as HTMLInputElement).files ?? []);
    if (files.length) this.pendingFiles.update(p => [...p, ...files]);
    (ev.target as HTMLInputElement).value = '';
  }

  previewUrl(file: File): string {
    const url = URL.createObjectURL(file);
    this.objectUrls.push(url);
    return url;
  }

  removePending(index: number) {
    this.pendingFiles.update(p => p.filter((_, i) => i !== index));
  }

  clearPending() { this.pendingFiles.set([]); }

  // ── Video drop & preview ───────────────────────────────────────────────
  private _vidUrl: string | null = null;

  onDropVid(ev: DragEvent) {
    ev.preventDefault();
    this.draggingVid.set(false);
    const f = Array.from(ev.dataTransfer?.files ?? []).find(f => f.type.startsWith('video/'));
    if (f) { this.clearPendingVidUrl(); this.pendingVid.set(f); }
  }

  onVidSelected(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (f) { this.clearPendingVidUrl(); this.pendingVid.set(f); }
    (ev.target as HTMLInputElement).value = '';
  }

  pendingVidUrl(): string {
    if (!this._vidUrl && this.pendingVid()) {
      this._vidUrl = URL.createObjectURL(this.pendingVid()!);
      this.objectUrls.push(this._vidUrl);
    }
    return this._vidUrl ?? '';
  }

  clearPendingVidUrl() {
    if (this._vidUrl) { URL.revokeObjectURL(this._vidUrl); this._vidUrl = null; }
  }

  uploadPendingVid(id: number) {
    const f = this.pendingVid();
    if (!f) return;
    this.mediaError.set(null);
    this.uploadingVid.set(true);
    this.api.uploadVideo(id, f).subscribe({
      next: () => {
        this.uploadingVid.set(false);
        this.pendingVid.set(null);
        this.clearPendingVidUrl();
        this.refresh(id);
      },
      error: e => {
        this.uploadingVid.set(false);
        this.mediaError.set(e?.error?.detail || this.i18n.t('form.videoFailed'));
      }
    });
  }

  uploadPending(id: number) {
    const files = this.pendingFiles();
    if (!files.length) return;
    this.mediaError.set(null);
    this.uploadingImgs.set(true);
    const upload = (index: number) => {
      if (index >= files.length) {
        this.uploadingImgs.set(false);
        this.pendingFiles.set([]);
        this.refresh(id);
        return;
      }
      this.api.uploadImage(id, files[index]).subscribe({
        next: () => upload(index + 1),
        error: e => {
          this.uploadingImgs.set(false);
          this.mediaError.set(e?.error?.detail || this.i18n.t('form.imageFailed'));
        }
      });
    };
    upload(0);
  }

  // ── Email verification ──────────────────────────────────────────────────
  resendVerification() {
    this.resendingVerification.set(true);
    this.api.resendVerificationEmail().subscribe({
      next: () => this.resendingVerification.set(false),
      error: () => this.resendingVerification.set(false)
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    this.validationErrors.set({});
    const body = this.form.getRawValue();

    // Sync phone to user profile if it changed
    const currentPhone = this.auth.user()?.phone;
    const newPhone = body.contactPhone?.trim();
    const syncPhone$ = (newPhone && newPhone !== currentPhone)
      ? this.api.updateProfile({
          displayName: this.auth.user()?.displayName ?? '',
          phone: newPhone
        })
      : null;

    const doSave = () => {
      const req = this.editingId
        ? this.api.updateListing(this.editingId, body)
        : this.api.createListing(body);
      req.subscribe({
        next: l => {
          this.created.set(l);
          this.saving.set(false);
          if (!this.editing()) window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: e => {
          const apiErrors = e?.error?.errors;
          if (apiErrors) {
            this.validationErrors.set(
              Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k.toLowerCase(), v as string[]]))
            );
          }
          this.error.set(e?.error?.detail || e?.error?.title || this.i18n.t('form.saveFailed'));
          this.saving.set(false);
        }
      });
    };

    if (syncPhone$) {
      syncPhone$.subscribe({
        next: u => { this.auth.updateLocalUser(u); doSave(); },
        error: () => doSave() // profile update failed — still save listing
      });
    } else {
      doSave();
    }
  }

  uploadImages(ev: Event, id: number) {
    const files = Array.from((ev.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    this.mediaError.set(null);
    this.uploadingImgs.set(true);
    const upload = (index: number) => {
      if (index >= files.length) { this.uploadingImgs.set(false); this.refresh(id); return; }
      this.api.uploadImage(id, files[index]).subscribe({
        next: () => upload(index + 1),
        error: e => { this.uploadingImgs.set(false); this.mediaError.set(e?.error?.detail || this.i18n.t('form.imageFailed')); }
      });
    };
    upload(0);
  }

  async removeMedia(id: number, mediaId: number) {
    const ok = await this.confirm.confirm({
      title: this.i18n.lang() === 'ar' ? 'حذف الصورة' : 'Delete Image',
      message: this.i18n.lang() === 'ar' ? 'هل أنت متأكد من حذف هذه الصورة؟ لن تتمكن من استعادتها.' : 'Are you sure you want to delete this image? This cannot be undone.',
      danger: true,
      confirmLabel: this.i18n.lang() === 'ar' ? 'حذف' : 'Delete'
    });
    if (!ok) return;
    this.api.deleteMedia(id, mediaId).subscribe(() => this.refresh(id));
  }

  private refresh(id: number) {
    this.api.listing(id).subscribe(l => this.created.set(l));
  }

  finish() { this.router.navigateByUrl('/my-listings'); }
  cancel() { this.router.navigateByUrl('/my-listings'); }
}
