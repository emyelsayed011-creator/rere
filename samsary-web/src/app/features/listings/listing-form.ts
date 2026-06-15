import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Category, Listing, ListingType } from '../../core/models';

@Component({
  selector: 'app-listing-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h4 class="mb-3">{{ editing() ? 'Edit listing' : 'Post a new listing' }}</h4>
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="save()" class="row g-3">
          <div class="col-md-8">
            <label class="form-label">Title</label>
            <input class="form-control" formControlName="title" maxlength="200">
          </div>
          <div class="col-md-4">
            <label class="form-label">Listing type</label>
            <select class="form-select" formControlName="type">
              <option [ngValue]="1">Sell</option>
              <option [ngValue]="2">Rent</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Category</label>
            <select class="form-select" formControlName="categoryId">
              @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Price</label>
            <input class="form-control" type="number" formControlName="price" min="0">
          </div>
          <div class="col-md-2">
            <label class="form-label">Currency</label>
            <input class="form-control" formControlName="currency" maxlength="8">
          </div>

          <div class="col-md-6">
            <label class="form-label">Location</label>
            <input class="form-control" formControlName="location" maxlength="200">
          </div>

          <div class="col-12">
            <label class="form-label">Description</label>
            <textarea class="form-control" formControlName="description" rows="6" maxlength="4000"></textarea>
          </div>

          @if (error()) { <div class="col-12"><div class="alert alert-danger py-2 small mb-0">{{ error() }}</div></div> }

          <div class="col-12 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-light" (click)="cancel()">Cancel</button>
            <button class="btn btn-samsary" [disabled]="form.invalid || saving()">
              @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
              {{ editing() ? 'Save' : 'Create & continue' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    @if (created(); as listing) {
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-body">
          <h6>Upload media (images, video up to 5 min)</h6>
          <div class="alert alert-info small mb-3">
            <i class="bi bi-info-circle"></i>
            Videos are validated by Cloudinary; uploads longer than 5 minutes are rejected automatically.
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Add image</label>
              <input type="file" class="form-control" accept="image/*" (change)="uploadImg($event, listing.id)">
            </div>
            <div class="col-md-6">
              <label class="form-label">Add video</label>
              <input type="file" class="form-control" accept="video/*" (change)="uploadVid($event, listing.id)">
              @if (uploadingVid()) {
                <div class="progress mt-2" style="height: 6px"><div class="progress-bar progress-bar-striped progress-bar-animated" style="width:100%"></div></div>
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
                <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" (click)="removeMedia(listing.id, m.id)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            }
          </div>

          <div class="text-end mt-3">
            <button class="btn btn-samsary" (click)="finish()">
              <i class="bi bi-check2"></i> Submit for review
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ListingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categories = signal<Category[]>([]);
  saving = signal(false);
  uploadingVid = signal(false);
  error = signal<string | null>(null);
  mediaError = signal<string | null>(null);
  editing = signal(false);
  created = signal<Listing | null>(null);
  editingId: number | null = null;

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(4000)]],
    price: [0, [Validators.required, Validators.min(0)]],
    currency: ['USD', [Validators.required, Validators.maxLength(8)]],
    type: [ListingType.Sell, [Validators.required]],
    categoryId: [0 as number, [Validators.required]],
    location: ['']
  });

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
          title: l.title, description: l.description, price: l.price, currency: l.currency,
          type: l.type, categoryId: l.category.id, location: l.location || ''
        });
        this.created.set(l);
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true); this.error.set(null);
    const body = this.form.getRawValue();
    const req = this.editingId
      ? this.api.updateListing(this.editingId, body)
      : this.api.createListing(body);
    req.subscribe({
      next: l => { this.created.set(l); this.saving.set(false); },
      error: e => { this.error.set(e?.error?.error || 'Failed to save.'); this.saving.set(false); }
    });
  }

  uploadImg(ev: Event, id: number) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.mediaError.set(null);
    this.api.uploadImage(id, file).subscribe({
      next: m => this.refresh(id),
      error: e => this.mediaError.set(e?.error?.error || 'Image upload failed.')
    });
  }

  uploadVid(ev: Event, id: number) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.mediaError.set(null);
    this.uploadingVid.set(true);
    this.api.uploadVideo(id, file).subscribe({
      next: () => { this.uploadingVid.set(false); this.refresh(id); },
      error: e => { this.uploadingVid.set(false); this.mediaError.set(e?.error?.error || 'Video upload failed.'); }
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
