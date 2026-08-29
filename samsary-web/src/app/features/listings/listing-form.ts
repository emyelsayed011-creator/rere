import { Component, ElementRef, inject, OnInit, signal, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { I18nService, TranslatePipe } from '../../core/i18n.service';
import { Category, Listing, ListingType } from '../../core/models';

const CURRENCIES = [
  { code: 'EGP', label: 'EGP' },
  { code: 'USD', label: 'USD' },
  { code: 'SAR', label: 'SAR' },
  { code: 'AED', label: 'AED' },
  { code: 'EUR', label: 'EUR' },
  { code: 'GBP', label: 'GBP' },
];

@Component({
  selector: 'app-listing-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  template: `
    <h4 class="mb-3 fw-bold">{{ (editing() ? 'form.editTitle' : 'form.newTitle') | t }}</h4>
    <div class="card border-0 shadow-sm animate-fade-up">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="save()" class="row g-3">
          <div class="col-md-8">
            <label class="form-label fw-medium">{{ 'form.title' | t }}</label>
            <input class="form-control" formControlName="title" maxlength="200">
            @if (fieldError('title')) { <div class="invalid-feedback d-block">{{ fieldError('title') }}</div> }
          </div>
          <div class="col-md-4">
            <label class="form-label fw-medium">{{ 'form.type' | t }}</label>
            <select class="form-select" formControlName="type">
              <option [ngValue]="1">{{ 'common.sell' | t }}</option>
              <option [ngValue]="2">{{ 'common.rentShort' | t }}</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-medium">{{ 'form.category' | t }}</label>
            <select class="form-select" formControlName="categoryId">
              @for (c of categories(); track c.id) {
                <option [ngValue]="c.id">{{ i18n.lang() === 'ar' ? (c.nameAr || c.name) : c.name }}</option>
              }
            </select>
            @if (fieldError('categoryId')) { <div class="invalid-feedback d-block">{{ fieldError('categoryId') }}</div> }
          </div>
          <div class="col-md-4">
            <label class="form-label fw-medium">{{ 'form.price' | t }}</label>
            <input class="form-control" type="number" formControlName="price" min="0">
            @if (fieldError('price')) { <div class="invalid-feedback d-block">{{ fieldError('price') }}</div> }
          </div>
          <div class="col-md-2">
            <label class="form-label fw-medium">{{ 'form.currency' | t }}</label>
            <select class="form-select" formControlName="currency">
              @for (c of currencies; track c.code) { <option [value]="c.code">{{ c.code }}</option> }
            </select>
          </div>
          <div class="col-md-6">
            <div class="listing-form-panel h-100">
              <label class="form-label fw-medium">
                {{ 'form.location' | t }} <span class="text-danger">*</span>
              </label>
              <div class="input-group mb-2">
                <input class="form-control" formControlName="location" maxlength="200"
                       [placeholder]="'form.locationPlaceholder' | t" readonly>
                <button type="button" class="btn btn-outline-secondary" (click)="detectLocation()"
                        [title]="'form.detectLocation' | t" [disabled]="locating()">
                  @if (locating()) { <span class="spinner-border spinner-border-sm"></span> }
                  @else { <i class="bi bi-geo-alt-fill"></i> }
                </button>
              </div>
              @if (form.controls.location.invalid && form.controls.location.touched) {
                <div class="text-danger small mb-1">{{ 'form.locationRequired' | t }}</div>
              }
              <div class="small text-muted mb-1"><i class="bi bi-info-circle me-1"></i>{{ 'form.mapHint' | t }}</div>
              <div #mapEl style="height:240px;border-radius:.75rem;overflow:hidden;border:1px solid #dee2e6"></div>
            </div>
          </div>
          <div class="col-12">
            <label class="form-label fw-medium">{{ 'form.description' | t }}</label>
            <textarea class="form-control" formControlName="description" rows="6" maxlength="4000"></textarea>
            @if (fieldError('description')) { <div class="invalid-feedback d-block">{{ fieldError('description') }}</div> }
          </div>
          @if (error()) {
            <div class="col-12"><div class="alert alert-danger py-2 small mb-0">{{ error() }}</div></div>
          }

          <!-- Contact phone (readonly from profile) -->
          <div class="col-md-6">
            <label class="form-label fw-medium">{{ 'form.contactPhone' | t }}</label>
            <div class="input-group">
              <span class="input-group-text bg-light"><i class="bi bi-telephone text-muted"></i></span>
              <input class="form-control bg-light" [value]="auth.user()?.phone || ''" readonly>
              <a routerLink="/profile" class="btn btn-outline-secondary" [title]="'form.editPhone' | t">
                <i class="bi bi-pencil"></i>
              </a>
            </div>
            @if (!auth.user()?.phone) {
              <div class="text-warning small mt-1"><i class="bi bi-exclamation-triangle me-1"></i>{{ 'form.phoneRequired' | t }}</div>
            }
          </div>

          <div class="col-12 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-light" (click)="cancel()">{{ 'common.cancel' | t }}</button>
            <button class="btn btn-samsary" [disabled]="form.invalid || saving()">
              @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
              {{ (editing() ? 'form.save' : 'form.createContinue') | t }}
            </button>
          </div>
        </form>
      </div>
    </div>
    @if (created(); as listing) {
      <div class="card border-0 shadow-sm mt-4 animate-fade-up">
        <div class="card-body">
          <h6 class="fw-bold">{{ 'form.uploadMedia' | t }}</h6>
          <div class="alert alert-info small mb-3">
            <i class="bi bi-info-circle me-1"></i>{{ 'form.videoInfo' | t }}
          </div>
          <div class="row g-3 mb-3 listing-media-box">
            <div class="col-md-7">
              <label class="form-label fw-semibold">
                <i class="bi bi-images me-1 text-primary"></i>{{ 'form.addImages' | t }}
                <span class="text-muted fw-normal small ms-1">({{ 'form.optional' | t }})</span>
              </label>
              <input type="file" class="form-control" accept="image/*" multiple
                     (change)="uploadImages($event, listing.id)">
              <div class="form-text">{{ 'form.multiImageHint' | t }}</div>
              @if (uploadingImgs()) {
                <div class="progress mt-2" style="height:4px">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" style="width:100%"></div>
                </div>
              }
            </div>
            <div class="col-md-5">
              <label class="form-label fw-semibold">
                <i class="bi bi-camera-video me-1 text-primary"></i>{{ 'form.addVideo' | t }}
                <span class="text-muted fw-normal small ms-1">({{ 'form.optional' | t }})</span>
              </label>
              <input type="file" class="form-control" accept="video/*" (change)="uploadVid($event, listing.id)">
              <div class="form-text">{{ 'form.videoHint' | t }}</div>
              @if (uploadingVid()) {
                <div class="progress mt-2" style="height:4px">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" style="width:100%"></div>
                </div>
              }
            </div>
          </div>
          @if (mediaError()) { <div class="alert alert-danger py-2 small">{{ mediaError() }}</div> }

          <!-- Media gallery -->
          @if (listing.media.length > 0) {
            <div class="mb-3">
              <h6 class="fw-semibold mb-2">{{ 'form.uploadedMedia' | t }} ({{ listing.media.length }})</h6>
              <div class="row g-2">
                @for (m of listing.media; track m.id) {
                  <div class="col-6 col-sm-4 col-md-3">
                    <div class="position-relative rounded overflow-hidden border" style="aspect-ratio:4/3;background:#f0f0f0">
                      @if (m.mediaType === 1) {
                        <img [src]="m.thumbnailUrl || m.url" class="w-100 h-100 object-fit-cover" alt="">
                        <div class="position-absolute top-0 start-0 m-1">
                          <span class="badge bg-primary small"><i class="bi bi-image"></i></span>
                        </div>
                      } @else {
                        <video [src]="m.url" class="w-100 h-100 object-fit-cover" preload="metadata"></video>
                        <div class="position-absolute top-0 start-0 m-1">
                          <span class="badge bg-warning text-dark small"><i class="bi bi-play-fill"></i> Video</span>
                        </div>
                      }
                      <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle d-flex align-items-center justify-content-center"
                              style="width:26px;height:26px;padding:0"
                              (click)="removeMedia(listing.id, m.id)" type="button"
                              [title]="'common.delete' | t">
                        <i class="bi bi-x" style="font-size:.8rem"></i>
                      </button>
                      @if (m.mediaType === 2) {
                        <a [href]="m.url" target="_blank"
                           class="btn btn-sm btn-light position-absolute bottom-0 start-0 m-1 rounded-pill small">
                          <i class="bi bi-play-circle me-1"></i>{{ 'form.viewVideo' | t }}
                        </a>
                      }
                    </div>
                  </div>
                }
              </div>
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
  `
})
export class ListingFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);

  @ViewChild('mapEl') mapEl?: ElementRef<HTMLDivElement>;

  readonly currencies = CURRENCIES;
  categories = signal<Category[]>([]);
  saving = signal(false);
  locating = signal(false);
  uploadingVid = signal(false);
  uploadingImgs = signal(false);
  showMap = signal(true); // map open by default
  error = signal<string | null>(null);
  mediaError = signal<string | null>(null);
  editing = signal(false);
  created = signal<Listing | null>(null);
  validationErrors = signal<Record<string, string[]>>({});
  editingId: number | null = null;

  private map?: L.Map;
  private marker?: L.Marker;

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(4000)]],
    price: [0, [Validators.required, Validators.min(0)]],
    currency: ['EGP', [Validators.required]],
    type: [ListingType.Sell, [Validators.required]],
    categoryId: [0 as number, [Validators.required]],
    location: ['', [Validators.required]]
  });

  fieldError(field: string): string | null {
    const errs = this.validationErrors()[field];
    return errs?.length ? errs[0] : null;
  }

  private reverseGeocode(lat: number, lng: number) {
    // Use Nominatim (free, no API key needed)
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`)
      .then(r => r.json())
      .then(data => {
        const addr = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        // Show city-level address (not full verbose string)
        const parts = data?.address;
        const label = parts
          ? [parts.suburb, parts.city || parts.town || parts.village, parts.state].filter(Boolean).join(', ')
          : addr;
        this.form.patchValue({ location: label || addr });
      })
      .catch(() => this.form.patchValue({ location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
  }

  ngOnInit() {
    this.api.categories().subscribe(c => {
      this.categories.set(c);
      if (c.length && !this.form.value.categoryId) this.form.patchValue({ categoryId: c[0].id });
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editing.set(true);
      this.editingId = +id;
      this.api.listing(+id).subscribe(l => {
        this.form.patchValue({
          title: l.title, description: l.description, price: l.price,
          currency: l.currency, type: l.type, categoryId: l.category.id,
          location: l.location || ''
        });
        this.created.set(l);
      });
    }
    // Open map by default after DOM is ready
    setTimeout(() => this.initMap(), 100);
  }

  detectLocation() {
    if (!navigator.geolocation) return;
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        this.form.patchValue({ location: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
        this.locating.set(false);
        if (this.showMap() && this.map) this.setMapMarker(latitude, longitude);
      },
      () => this.locating.set(false)
    );
  }

  toggleMap() {
    this.showMap.update(v => !v);
    if (this.showMap()) {
      setTimeout(() => this.initMap(), 50);
    } else {
      this.map?.remove();
      this.map = undefined;
    }
  }

  private initMap() {
    if (!this.mapEl?.nativeElement || this.map) return;
    const [lat, lng] = this.parseLocation() ?? [30.0444, 31.2357]; // default: Cairo

    this.map = L.map(this.mapEl.nativeElement, { zoomControl: true }).setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.marker = L.marker([lat, lng], {
      draggable: true,
      icon: L.divIcon({
        className: 'custom-map-pin',
        iconSize: [18, 18],
        iconAnchor: [9, 18],
        html: '<span></span>'
      })
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
    return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])
      ? [parts[0], parts[1]] : null;
  }

  ngOnDestroy() { this.map?.remove(); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true); this.error.set(null); this.validationErrors.set({});
    const body = this.form.getRawValue();
    const req = this.editingId
      ? this.api.updateListing(this.editingId, body)
      : this.api.createListing(body);
    req.subscribe({
      next: l => { this.created.set(l); this.saving.set(false); },
      error: e => {
        const apiErrors = e?.error?.errors;
        if (apiErrors) this.validationErrors.set(
          Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k.toLowerCase(), v as string[]]))
        );
        this.error.set(e?.error?.detail || e?.error?.title || this.i18n.t('form.saveFailed'));
        this.saving.set(false);
      }
    });
  }

  // Upload multiple images sequentially
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

  uploadImg(ev: Event, id: number) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.mediaError.set(null);
    this.api.uploadImage(id, file).subscribe({
      next: () => this.refresh(id),
      error: e => this.mediaError.set(e?.error?.detail || this.i18n.t('form.imageFailed'))
    });
  }

  uploadVid(ev: Event, id: number) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.mediaError.set(null);
    this.uploadingVid.set(true);
    this.api.uploadVideo(id, file).subscribe({
      next: () => { this.uploadingVid.set(false); this.refresh(id); },
      error: e => { this.uploadingVid.set(false); this.mediaError.set(e?.error?.detail || this.i18n.t('form.videoFailed')); }
    });
  }

  removeMedia(id: number, mediaId: number) {
    this.api.deleteMedia(id, mediaId).subscribe(() => this.refresh(id));
  }

  private refresh(id: number) {
    this.api.listing(id).subscribe(l => this.created.set(l));
  }

  finish() { this.router.navigateByUrl('/my-listings'); }
  cancel() { this.router.navigateByUrl('/my-listings'); }
}
