import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { Advertisement } from '../../core/models';
import { TranslatePipe } from '../../core/i18n.service';

interface ListingOption { id: number; title: string; price?: number; currency?: string; imageUrl?: string; location?: string; }

interface AdForm {
  title: string; description: string; imageUrl: string; linkUrl: string;
  placement: string; isActive: boolean; startsAt: string; endsAt: string;
  // Linked listing
  listingId: number | null; listingSearch: string;
  // Targeting
  targetAudience: string;
  targetCountries: string;
  targetGenders: string[];
  targetMinAge: number | null; targetMaxAge: number | null;
  targetLocations: string;
}

const emptyForm = (): AdForm => ({
  title: '', description: '', imageUrl: '', linkUrl: '',
  placement: 'banner', isActive: true,
  startsAt: new Date().toISOString().slice(0, 16), endsAt: '',
  listingId: null, listingSearch: '',
  targetAudience: 'all',
  targetCountries: '', targetGenders: [],
  targetMinAge: null, targetMaxAge: null, targetLocations: ''
});

@Component({
  selector: 'app-admin-ads',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyPipe, TranslatePipe],
  template: `
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h4 class="fw-bold mb-0"><i class="bi bi-megaphone-fill text-primary me-2"></i>{{ 'admin.ads' | t }}</h4>
      <button class="btn btn-samsary btn-sm" (click)="startNew()">
        <i class="bi bi-plus-lg me-1"></i>{{ 'admin.ads.new' | t }}
      </button>
    </div>

    <!-- â”€â”€ Form â”€â”€ -->
    @if (showForm()) {
      <div class="card border-0 shadow-sm mb-4 animate-fade-up">
        <div class="card-body p-4">
          <h6 class="fw-bold mb-4">{{ editing() ? ('common.edit' | t) : ('admin.ads.new' | t) }}</h6>

          <!-- SECTION 1: Basic info -->
          <p class="text-uppercase small fw-bold text-muted mb-2">{{ 'admin.ads.sectionBasic' | t }}</p>
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label small fw-semibold">{{ 'admin.ads.title' | t }}</label>
              <input class="form-control" [(ngModel)]="form.title" maxlength="100">
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-semibold">{{ 'admin.ads.placement' | t }}</label>
              <select class="form-select" [(ngModel)]="form.placement">
                <option value="banner">{{ 'admin.ads.placementBanner' | t }}</option>
                <option value="home-hero">{{ 'admin.ads.placementHero' | t }}</option>
                <option value="sidebar">{{ 'admin.ads.placementSidebar' | t }}</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label small fw-semibold">{{ 'admin.ads.imageUrl' | t }}</label>
              <input class="form-control" [(ngModel)]="form.imageUrl" type="url" placeholder="https://â€¦">
              @if (form.imageUrl) {
                <img [src]="form.imageUrl" class="mt-2 rounded" style="max-height:80px;object-fit:cover" alt="">
              }
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-semibold">{{ 'admin.ads.linkUrl' | t }}</label>
              <input class="form-control" [(ngModel)]="form.linkUrl" type="url" placeholder="https://â€¦">
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-semibold">{{ 'admin.ads.description' | t }}</label>
              <input class="form-control" [(ngModel)]="form.description" maxlength="200">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-semibold">{{ 'admin.ads.startsAt' | t }}</label>
              <input class="form-control" [(ngModel)]="form.startsAt" type="datetime-local">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-semibold">{{ 'admin.ads.endsAt' | t }}</label>
              <input class="form-control" [(ngModel)]="form.endsAt" type="datetime-local">
            </div>
            <div class="col-md-4 d-flex align-items-end pb-2">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" [(ngModel)]="form.isActive" id="adActive">
                <label class="form-check-label fw-semibold" for="adActive">{{ 'admin.ads.active' | t }}</label>
              </div>
            </div>
          </div>

          <!-- SECTION 2: Linked listing -->
          <hr class="my-3">
          <p class="text-uppercase small fw-bold text-muted mb-2">
            <i class="bi bi-tag-fill me-1 text-primary"></i>{{ 'admin.ads.sectionListing' | t }}
          </p>
          <div class="row g-3 mb-3">
            <div class="col-12">
              <label class="form-label small fw-semibold">{{ 'ad.selectListing' | t }}</label>
              <div class="input-group">
                <input class="form-control" [(ngModel)]="form.listingSearch"
                       [placeholder]="'ad.searchListings' | t"
                       (ngModelChange)="searchListings($event)">
                @if (form.listingId) {
                  <button class="btn btn-outline-danger" type="button" (click)="clearListing()">
                    <i class="bi bi-x-lg"></i>
                  </button>
                }
              </div>
              <!-- Search results dropdown -->
              @if (listingResults().length > 0) {
                <div class="border rounded mt-1 shadow-sm" style="max-height:200px;overflow-y:auto;background:var(--bs-body-bg)">
                  @for (r of listingResults(); track r.id) {
                    <button class="d-flex align-items-center gap-2 w-100 border-0 text-start p-2 listing-pick-row"
                            (click)="pickListing(r)" type="button">
                      @if (r.imageUrl) {
                        <img [src]="r.imageUrl" style="width:40px;height:28px;object-fit:cover;border-radius:4px" alt="">
                      }
                      <div class="flex-grow-1 small">
                        <div class="fw-semibold">{{ r.title }}</div>
                        @if (r.price) {
                          <div class="text-muted">{{ r.price | currency:(r.currency||'USD'):'symbol':'1.0-0' }}</div>
                        }
                      </div>
                    </button>
                  }
                </div>
              }
              <!-- Selected listing chip -->
              @if (form.listingId && selectedListing()) {
                <div class="d-flex align-items-center gap-2 mt-2 p-2 rounded border">
                  @if (selectedListing()!.imageUrl) {
                    <img [src]="selectedListing()!.imageUrl" style="width:50px;height:36px;object-fit:cover;border-radius:6px" alt="">
                  }
                  <div class="small flex-grow-1">
                    <div class="fw-semibold">{{ selectedListing()!.title }}</div>
                    @if (selectedListing()!.price) {
                      <div class="text-muted">{{ selectedListing()!.price | currency:(selectedListing()!.currency||'USD'):'symbol':'1.0-0' }}</div>
                    }
                  </div>
                  <span class="badge bg-success-subtle text-success rounded-pill small">
                    <i class="bi bi-check2 me-1"></i>{{ 'ad.listingLinked' | t }}
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- SECTION 3: Targeting -->
          <hr class="my-3">
          <p class="text-uppercase small fw-bold text-muted mb-2">
            <i class="bi bi-crosshair me-1 text-primary"></i>{{ 'admin.ads.sectionTargeting' | t }}
          </p>
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label small fw-semibold">{{ 'ad.targetAudience' | t }}</label>
              <div class="d-flex gap-3">
                <div class="form-check">
                  <input class="form-check-input" type="radio" [(ngModel)]="form.targetAudience"
                         value="all" id="targAll">
                  <label class="form-check-label" for="targAll">
                    <i class="bi bi-globe2 me-1"></i>{{ 'ad.targetAll' | t }}
                  </label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" [(ngModel)]="form.targetAudience"
                         value="specific" id="targSpec">
                  <label class="form-check-label" for="targSpec">
                    <i class="bi bi-funnel-fill me-1"></i>{{ 'ad.targetSpecific' | t }}
                  </label>
                </div>
              </div>
            </div>

            @if (form.targetAudience === 'specific') {
              <!-- Countries -->
              <div class="col-md-6">
                <label class="form-label small fw-semibold">
                  <i class="bi bi-flag me-1"></i>{{ 'ad.targetCountries' | t }}
                  <span class="text-muted fw-normal">({{ 'ad.targetCommaHint' | t }})</span>
                </label>
                <input class="form-control form-control-sm font-monospace" [(ngModel)]="form.targetCountries"
                       placeholder="SA,US,AE" maxlength="200">
              </div>

              <!-- Locations -->
              <div class="col-md-6">
                <label class="form-label small fw-semibold">
                  <i class="bi bi-geo-alt me-1"></i>{{ 'ad.targetLocation' | t }}
                  <span class="text-muted fw-normal">({{ 'ad.targetCommaHint' | t }})</span>
                </label>
                <input class="form-control form-control-sm" [(ngModel)]="form.targetLocations"
                       placeholder="Riyadh,Jeddah,Dubai" maxlength="500">
              </div>

              <!-- Genders -->
              <div class="col-12">
                <label class="form-label small fw-semibold">
                  <i class="bi bi-gender-ambiguous me-1"></i>{{ 'ad.targetGenders' | t }}
                </label>
                <div class="d-flex gap-3 flex-wrap">
                  @for (g of ['male','female','other']; track g) {
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox"
                             [id]="'tg-' + g"
                             [checked]="form.targetGenders.includes(g)"
                             (change)="toggleGender(g)">
                      <label class="form-check-label text-capitalize" [for]="'tg-' + g">{{ g }}</label>
                    </div>
                  }
                </div>
              </div>

              <!-- Age range -->
              <div class="col-md-4">
                <label class="form-label small fw-semibold">
                  <i class="bi bi-person me-1"></i>{{ 'ad.targetMinAge' | t }}
                </label>
                <input class="form-control form-control-sm" type="number"
                       [(ngModel)]="form.targetMinAge" min="13" max="120" placeholder="e.g. 18">
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-semibold">{{ 'ad.targetMaxAge' | t }}</label>
                <input class="form-control form-control-sm" type="number"
                       [(ngModel)]="form.targetMaxAge" min="13" max="120" placeholder="e.g. 65">
              </div>
              <div class="col-md-4 d-flex align-items-end">
                <div class="alert alert-info py-2 px-3 mb-0 small w-100">
                  <i class="bi bi-info-circle me-1"></i>{{ 'ad.targetHint' | t }}
                </div>
              </div>
            }
          </div>

          <div class="d-flex gap-2 mt-4">
            <button class="btn btn-samsary" (click)="save()" [disabled]="saving()">
              @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
              {{ 'common.save' | t }}
            </button>
            <button class="btn btn-outline-secondary" (click)="cancelForm()">{{ 'common.cancel' | t }}</button>
          </div>
          @if (message()) { <div class="alert alert-success mt-3 mb-0 py-2">{{ message() }}</div> }
        </div>
      </div>
    }

    <!-- â”€â”€ Table â”€â”€ -->
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>{{ 'admin.ads.title' | t }}</th>
              <th>{{ 'admin.ads.placement' | t }}</th>
              <th>{{ 'ad.targetAudience' | t }}</th>
              <th>{{ 'admin.ads.active' | t }}</th>
              <th>{{ 'admin.ads.schedule' | t }}</th>
              <th class="text-center">{{ 'admin.ads.clicks' | t }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (ad of ads(); track ad.id) {
              <tr>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <img [src]="ad.listingImageUrl || ad.imageUrl"
                         class="rounded" style="width:48px;height:32px;object-fit:cover" alt="">
                    <div>
                      <div class="fw-semibold">{{ ad.title }}</div>
                      @if (ad.listingId) {
                        <div class="badge bg-primary-subtle text-primary rounded-pill" style="font-size:.65rem">
                          <i class="bi bi-tag-fill me-1"></i>{{ 'ad.listingPromo' | t }}
                        </div>
                      }
                    </div>
                  </div>
                </td>
                <td><span class="badge rounded-pill bg-primary-subtle text-primary">{{ ad.placement }}</span></td>
                <td>
                  @if (ad.targetAudience === 'all') {
                    <span class="badge bg-secondary-subtle text-secondary rounded-pill">
                      <i class="bi bi-globe2 me-1"></i>{{ 'ad.targetAll' | t }}
                    </span>
                  } @else {
                    <span class="badge bg-warning-subtle text-warning rounded-pill">
                      <i class="bi bi-funnel-fill me-1"></i>{{ 'ad.targetSpecific' | t }}
                    </span>
                  }
                </td>
                <td>
                  @if (ad.isActive) {
                    <span class="badge bg-success-subtle text-success rounded-pill">
                      <i class="bi bi-circle-fill me-1" style="font-size:.5rem"></i>{{ 'admin.ads.active' | t }}
                    </span>
                  } @else {
                    <span class="badge bg-secondary-subtle text-secondary rounded-pill">Off</span>
                  }
                </td>
                <td class="small text-muted">
                  {{ ad.startsAt | date:'mediumDate' }}
                  @if (ad.endsAt) { â†’ {{ ad.endsAt | date:'mediumDate' }} }
                  @else { <span class="text-success">âˆž</span> }
                </td>
                <td class="text-center">
                  <span class="badge bg-body-secondary rounded-pill">
                    <i class="bi bi-cursor-fill me-1"></i>{{ ad.clickCount }}
                  </span>
                </td>
                <td>
                  <div class="d-flex gap-1 justify-content-end">
                    <button class="btn btn-sm btn-outline-primary" (click)="startEdit(ad)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" (click)="deleteAd(ad)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="text-center text-muted py-4">No advertisements yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .listing-pick-row { background: transparent; transition: background .15s; }
    .listing-pick-row:hover { background: var(--bs-tertiary-bg); }
  `]
})
export class AdminAdsComponent implements OnInit {
  private api = inject(ApiService);
  ads = signal<Advertisement[]>([]);
  showForm = signal(false);
  editing = signal<Advertisement | null>(null);
  saving = signal(false);
  message = signal('');
  listingResults = signal<ListingOption[]>([]);
  selectedListing = signal<ListingOption | null>(null);
  form: AdForm = emptyForm();

  private searchTimeout: any;

  ngOnInit() { this.load(); }
  private load() { this.api.adminAds().subscribe(a => this.ads.set(a)); }

  startNew() {
    this.editing.set(null);
    this.form = emptyForm();
    this.message.set('');
    this.selectedListing.set(null);
    this.listingResults.set([]);
    this.showForm.set(true);
  }

  startEdit(ad: Advertisement) {
    this.editing.set(ad);
    this.form = {
      title: ad.title, description: ad.description ?? '',
      imageUrl: ad.imageUrl, linkUrl: ad.linkUrl ?? '',
      placement: ad.placement, isActive: ad.isActive,
      startsAt: ad.startsAt.slice(0, 16), endsAt: ad.endsAt?.slice(0, 16) ?? '',
      listingId: ad.listingId ?? null,
      listingSearch: ad.listingTitle ?? '',
      targetAudience: ad.targetAudience || 'all',
      targetCountries: ad.targetCountries ?? '',
      targetGenders: ad.targetGenders ? ad.targetGenders.split(',') : [],
      targetMinAge: ad.targetMinAge ?? null,
      targetMaxAge: ad.targetMaxAge ?? null,
      targetLocations: ad.targetLocations ?? ''
    };
    if (ad.listingId) {
      this.selectedListing.set({
        id: ad.listingId, title: ad.listingTitle ?? '', price: ad.listingPrice,
        currency: ad.listingCurrency, imageUrl: ad.listingImageUrl, location: ad.listingLocation
      });
    } else {
      this.selectedListing.set(null);
    }
    this.listingResults.set([]);
    this.message.set('');
    this.showForm.set(true);
  }

  cancelForm() { this.showForm.set(false); this.editing.set(null); }

  searchListings(q: string) {
    clearTimeout(this.searchTimeout);
    if (!q || q.length < 2) { this.listingResults.set([]); return; }
    this.searchTimeout = setTimeout(() => {
      this.api.listings({ q, pageSize: 8, page: 1 }).subscribe(res => {
        const opts: ListingOption[] = (res.items ?? []).map((l: any) => ({
          id: l.id, title: l.title, price: l.price, currency: l.currency,
          imageUrl: l.media?.[0]?.thumbnailUrl ?? l.media?.[0]?.url,
          location: l.location
        }));
        this.listingResults.set(opts);
      });
    }, 300);
  }

  pickListing(r: ListingOption) {
    this.form.listingId = r.id;
    this.form.listingSearch = r.title;
    if (!this.form.title) this.form.title = r.title;
    if (!this.form.imageUrl && r.imageUrl) this.form.imageUrl = r.imageUrl;
    this.selectedListing.set(r);
    this.listingResults.set([]);
  }

  clearListing() {
    this.form.listingId = null;
    this.form.listingSearch = '';
    this.selectedListing.set(null);
    this.listingResults.set([]);
  }

  toggleGender(g: string) {
    const idx = this.form.targetGenders.indexOf(g);
    if (idx >= 0) this.form.targetGenders.splice(idx, 1);
    else this.form.targetGenders.push(g);
  }

  save() {
    this.saving.set(true);
    const body = {
      title: this.form.title, description: this.form.description,
      imageUrl: this.form.imageUrl, linkUrl: this.form.linkUrl,
      placement: this.form.placement, isActive: this.form.isActive,
      startsAt: new Date(this.form.startsAt).toISOString(),
      endsAt: this.form.endsAt ? new Date(this.form.endsAt).toISOString() : null,
      listingId: this.form.listingId,
      targetAudience: this.form.targetAudience,
      targetCountries: this.form.targetCountries || null,
      targetGenders: this.form.targetGenders.length ? this.form.targetGenders.join(',') : null,
      targetMinAge: this.form.targetMinAge,
      targetMaxAge: this.form.targetMaxAge,
      targetLocations: this.form.targetLocations || null
    };

    const req = this.editing()
      ? this.api.adminUpdateAd(this.editing()!.id, body as any)
      : this.api.adminCreateAd(body as any);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set('âœ“ Saved');
        this.load();
        setTimeout(() => this.cancelForm(), 1200);
      },
      error: () => { this.saving.set(false); }
    });
  }

  deleteAd(ad: Advertisement) {
    if (!confirm('Delete this advertisement?')) return;
    this.api.adminDeleteAd(ad.id).subscribe(() => this.load());
  }
}
