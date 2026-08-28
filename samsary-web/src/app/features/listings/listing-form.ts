import { Component, ElementRef, inject, OnInit, signal, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { ApiService } from '../../core/api.service';
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
  imports: [ReactiveFormsModule, TranslatePipe],
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
            <label class="form-label fw-medium">{{ 'form.location' | t }}</label>
            <div class="input-group mb-2">
              <input class="form-control" formControlName="location" maxlength="200"
                     [placeholder]="'form.locationPlaceholder' | t">
              <button type="button" class="btn btn-outline-secondary" (click)="detectLocation()"
                      [title]="'form.detectLocation' | t" [disabled]="locating()">
                @if (locating()) { <span class="spinner-border spinner-border-sm"></span> }
                @else { <i class="bi bi-geo-alt-fill"></i> }
              </button>
              <button type="button" class="btn btn-outline-primary" (click)="toggleMap()"
                      [title]="'form.pickOnMap' | t">
                <i class="bi bi-map"></i>
              </button>
            </div>
            @if (showMap()) {
              <div class="small text-muted mb-1"><i class="bi bi-info-circle me-1"></i>{{ 'form.mapHint' | t }}</div>
              <div #mapEl style="height:260px;border-radius:.75rem;overflow:hidden;border:1px solid #dee2e6"></div>
            }
          </div>
          <div class="col-12">
            <label class="form-label fw-medium">{{ 'form.description' | t }}</label>
            <textarea class="form-control" formControlName="description" rows="6" maxlength="4000"></textarea>
            @if (fieldError('description')) { <div class="invalid-feedback d-block">{{ fieldError('description') }}</div> }
          </div>
          @if (error()) {
            <div class="col-12"><div class="alert alert-danger py-2 small mb-0">{{ error() }}</div></div>
          }
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
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'form.addImage' | t }}</label>
              <input type="file" class="form-control" accept="image/*" (change)="uploadImg($event, listing.id)">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'form.addVideo' | t }}</label>
              <input type="file" class="form-control" accept="video/*" (change)="uploadVid($event, listing.id)">
              @if (uploadingVid()) {
                <div class="progress mt-2" style="height:6px">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" style="width:100%"></div>
                </div>
              }
            </div>
          </div>
          @if (mediaError()) { <div class="alert alert-danger py-2 small">{{ mediaError() }}</div> }
          <div class="row g-2">
            @for (m of listing.media; track m.id) {
              <div class="col-6 col-md-3 position-relative">
                @if (m.mediaType === 1) {
                  <img [src]="m.url" class="img-fluid rounded border" alt="">
                } @else {
                  <video [src]="m.url" class="w-100 rounded border" controls></video>
                }
                <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                        (click)="removeMedia(listing.id, m.id)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            }
          </div>
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

  @ViewChild('mapEl') mapEl?: ElementRef<HTMLDivElement>;

  readonly currencies = CURRENCIES;
  categories = signal<Category[]>([]);
  saving = signal(false);
  locating = signal(false);
  uploadingVid = signal(false);
  showMap = signal(false);
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
    location: ['']
  });

  fieldError(field: string): string | null {
    const errs = this.validationErrors()[field];
    return errs?.length ? errs[0] : null;
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
      // defer until the DOM renders the map container
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

    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    this.marker.on('dragend', () => {
      const { lat: la, lng: lo } = this.marker!.getLatLng();
      this.form.patchValue({ location: `${la.toFixed(5)}, ${lo.toFixed(5)}` });
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker!.setLatLng(e.latlng);
      this.form.patchValue({ location: `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}` });
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
        this.error.set(e?.error?.detail || e?.error?.title || 'Failed to save.');
        this.saving.set(false);
      }
    });
  }

  uploadImg(ev: Event, id: number) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.mediaError.set(null);
    this.api.uploadImage(id, file).subscribe({
      next: () => this.refresh(id),
      error: e => this.mediaError.set(e?.error?.detail || 'Image upload failed.')
    });
  }

  uploadVid(ev: Event, id: number) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.mediaError.set(null);
    this.uploadingVid.set(true);
    this.api.uploadVideo(id, file).subscribe({
      next: () => { this.uploadingVid.set(false); this.refresh(id); },
      error: e => { this.uploadingVid.set(false); this.mediaError.set(e?.error?.detail || 'Video upload failed.'); }
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
