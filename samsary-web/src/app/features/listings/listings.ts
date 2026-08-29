import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Category, Listing, ListingStatus, ListingType } from '../../core/models';
import { I18nService, TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe, TranslatePipe],
  styles: [`
    .sold-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,.52); color: #fff;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      border-radius: .75rem .75rem 0 0; text-align: center; letter-spacing: .04em;
    }
    .listing-card:has(.sold-overlay) { opacity: .82; }
    /* Status badge — bottom-start corner of card image */
    .status-badge {
      position: absolute; top: 34px; inset-inline-start: 8px;
      font-size: .58rem; font-weight: 700; padding: 1px 7px;
      border-radius: 999px;
      width: fit-content !important; height: auto !important; z-index: 2;
      display: inline-flex; align-items: center; line-height: 1.6;
    }
    .status-pending { background: rgba(255,193,7,.9);  color: #000; }
    .status-sold    { background: rgba(220,53,69,.9);   color: #fff; }
    .status-rented  { background: rgba(108,117,125,.9); color: #fff; }
  `],
  template: `
    <div class="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
      <h4 class="mb-0 fw-bold">{{ (mineMode() ? 'listings.mine' : 'listings.browse') | t }}</h4>
      @if (mineMode() && auth.isAuthenticated()) {
        <a routerLink="/listings/new" class="btn btn-samsary btn-sm"><i class="bi bi-plus-lg"></i> {{ 'listings.new' | t }}</a>
      }
    </div>

    @if (!mineMode()) {
      <div class="card border-0 shadow-sm mb-4 animate-fade-up">
        <div class="card-body row g-2">
          <div class="col-md-4">
            <input class="form-control" [placeholder]="'listings.searchPlaceholder' | t" [(ngModel)]="q" (keydown.enter)="reload()">
          </div>
          <div class="col-md-2">
            <select class="form-select" [(ngModel)]="categoryId" (change)="reload()">
              <option [ngValue]="null">{{ 'listings.allCategories' | t }}</option>
              @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ categoryName(c) }}</option> }
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" [(ngModel)]="type" (change)="reload()">
              <option [ngValue]="null">{{ 'common.all' | t }}</option>
              <option [ngValue]="1">{{ 'common.sale' | t }}</option>
              <option [ngValue]="2">{{ 'common.rent' | t }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <div class="input-group">
              <span class="input-group-text bg-light px-2"><i class="bi bi-geo-alt text-muted"></i></span>
              <input class="form-control" [value]="locationQ"
                     [placeholder]="i18n.lang() === 'ar' ? 'المدينة / المنطقة' : 'City / Area'"
                     (input)="onLocationInput($any($event.target).value)"
                     (keydown.enter)="reload()">
              @if (locationQ) {
                <button class="btn btn-outline-secondary px-2" type="button" (click)="locationQ=''; page.set(1); reload()">
                  <i class="bi bi-x"></i>
                </button>
              }
            </div>
          </div>
          <div class="col-md-2 d-flex gap-1">
            <button class="btn btn-primary flex-grow-1" (click)="reload()"><i class="bi bi-search"></i></button>
            <button class="btn btn-outline-primary" (click)="nearMe()" [disabled]="geoLoading()"
                    [title]="i18n.lang() === 'ar' ? 'قريب مني' : 'Near me'">
              @if (geoLoading()) {
                <span class="spinner-border spinner-border-sm"></span>
              } @else {
                <i class="bi bi-geo-alt-fill"></i>
              }
            </button>
            <button class="btn btn-outline-secondary" (click)="showAdvanced=!showAdvanced"
                    [class.active]="showAdvanced || priceMin || priceMax || isNegotiable || includeSold"
                    [title]="i18n.lang() === 'ar' ? 'فلاتر متقدمة' : 'More filters'">
              <i class="bi bi-sliders"></i>
            </button>
          </div>

          <!-- ── Advanced filters (collapsible) ── -->
          @if (showAdvanced) {
            <div class="col-12 border-top pt-2 mt-1 row g-2">
              <!-- Price range -->
              <div class="col-sm-3">
                <label class="form-label small fw-medium mb-1">
                  {{ i18n.lang() === 'ar' ? 'السعر من' : 'Min price' }}
                </label>
                <input class="form-control form-control-sm" type="number" min="0"
                       [(ngModel)]="priceMin" (keydown.enter)="reload()"
                       [placeholder]="i18n.lang() === 'ar' ? 'أدنى سعر' : 'Min'">
              </div>
              <div class="col-sm-3">
                <label class="form-label small fw-medium mb-1">
                  {{ i18n.lang() === 'ar' ? 'السعر إلى' : 'Max price' }}
                </label>
                <input class="form-control form-control-sm" type="number" min="0"
                       [(ngModel)]="priceMax" (keydown.enter)="reload()"
                       [placeholder]="i18n.lang() === 'ar' ? 'أعلى سعر' : 'Max'">
              </div>
              <!-- Status -->
              <div class="col-sm-3">
                <label class="form-label small fw-medium mb-1">
                  {{ i18n.lang() === 'ar' ? 'حالة الإعلان' : 'Status' }}
                </label>
                <select class="form-select form-select-sm" [(ngModel)]="includeSold" (change)="reload()">
                  <option [ngValue]="false">{{ i18n.lang() === 'ar' ? 'متاح فقط' : 'Available only' }}</option>
                  <option [ngValue]="true">{{ i18n.lang() === 'ar' ? 'كل الإعلانات (بما فيها المباعة)' : 'All (incl. sold/rented)' }}</option>
                </select>
              </div>
              <!-- Negotiable -->
              <div class="col-sm-3 d-flex align-items-end pb-1">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="filterNegotiable"
                         [(ngModel)]="isNegotiable" (change)="reload()">
                  <label class="form-check-label small fw-medium" for="filterNegotiable">
                    <i class="bi bi-chat-left-dots me-1 text-primary"></i>
                    {{ i18n.lang() === 'ar' ? 'قابل للتفاوض فقط' : 'Negotiable only' }}
                  </label>
                </div>
              </div>
              <!-- Active filters summary -->
              @if (priceMin || priceMax || isNegotiable || includeSold) {
                <div class="col-12 d-flex gap-2 flex-wrap align-items-center">
                  @if (priceMin || priceMax) {
                    <span class="badge bg-primary-subtle text-primary rounded-pill">
                      <i class="bi bi-currency-exchange me-1"></i>
                      {{ priceMin || 0 | number }} — {{ priceMax ? (priceMax | number) : '∞' }}
                    </span>
                  }
                  @if (isNegotiable) {
                    <span class="badge bg-warning-subtle text-warning-emphasis rounded-pill">
                      <i class="bi bi-chat-left-dots me-1"></i>
                      {{ i18n.lang() === 'ar' ? 'قابل للتفاوض' : 'Negotiable' }}
                    </span>
                  }
                  @if (includeSold) {
                    <span class="badge bg-secondary-subtle text-secondary rounded-pill">
                      <i class="bi bi-archive me-1"></i>
                      {{ i18n.lang() === 'ar' ? 'يشمل المباعة' : 'Incl. sold' }}
                    </span>
                  }
                  <button class="btn btn-link btn-sm p-0 text-danger" (click)="clearAdvanced()">
                    {{ i18n.lang() === 'ar' ? 'مسح الفلاتر' : 'Clear' }}
                  </button>
                </div>
              }
            </div>
          }
          @if (locationQ) {
            <div class="col-12">
              <span class="badge bg-primary-subtle text-primary rounded-pill py-1 px-3">
                <i class="bi bi-geo-alt me-1"></i>{{ locationQ }}
                <button class="btn-close btn-close ms-1" style="font-size:.6rem" (click)="locationQ=''; reload()"></button>
              </span>
            </div>
          }
        </div>
      </div>
    }

    <div class="row g-3">
      @for (l of items(); track l.id; let i = $index) {
        <div class="col-12 col-sm-6 col-lg-4 animate-fade-up" [class.animate-delay-1]="i % 3 === 1" [class.animate-delay-2]="i % 3 === 2">
          <a [routerLink]="['/listings', l.id]" class="card listing-card border-0 shadow-sm h-100 text-decoration-none text-body">
            <div class="position-relative ratio ratio-16x9">
              @if (l.media[0]) {
                <img [src]="l.media[0].thumbnailUrl || l.media[0].url" class="object-fit-cover rounded-top" alt="">
              } @else {
                <div class="d-flex align-items-center justify-content-center text-muted">
                  <i class="bi bi-image fs-1"></i>
                </div>
              }
              <span class="badge badge-type text-white" [class.bg-success]="l.type===1" [class.bg-info]="l.type===2">
                {{ (l.type === 1 ? 'common.sell' : 'common.rentShort') | t }}
              </span>
              <!-- Status badge — always visible, not just in my-listings -->
              @if (l.status === 0) {
                <span class="status-badge status-pending">
                  <i class="bi bi-clock-fill me-1"></i>{{ i18n.lang() === 'ar' ? 'قيد المراجعة' : 'Pending' }}
                </span>
              } @else if (l.status === 3) {
                <span class="status-badge status-sold">
                  <i class="bi bi-check-circle-fill me-1"></i>{{ i18n.lang() === 'ar' ? 'تم البيع' : 'Sold' }}
                </span>
              } @else if (l.status === 4) {
                <span class="status-badge status-rented">
                  <i class="bi bi-check-circle-fill me-1"></i>{{ i18n.lang() === 'ar' ? 'تم التأجير' : 'Rented' }}
                </span>
              }
              @if (mineMode() && l.status === 2) {
                <span class="position-absolute top-0 end-0 m-2 badge bg-danger">
                  {{ i18n.lang() === 'ar' ? 'مرفوض' : 'Rejected' }}
                </span>
              }
              @if (l.status === ListingStatus.Sold || l.status === ListingStatus.Rented) {
                <div class="sold-overlay">
                  <i class="bi bi-lock-fill d-block mb-1" style="font-size:1.4rem"></i>
                  <span class="fw-bold small">
                    {{ l.status === ListingStatus.Sold
                       ? (i18n.lang() === 'ar' ? 'تم البيع' : 'SOLD')
                       : (i18n.lang() === 'ar' ? 'تم التأجير' : 'RENTED') }}
                  </span>
                </div>
              }
            </div>
            <div class="card-body">
              <h6 class="card-title mb-1 text-truncate">{{ l.title }}</h6>
              <div class="text-muted small text-truncate"><i class="bi bi-tag me-1"></i>{{ categoryName(l.category) }} · {{ l.location || '—' }}</div>
              <div class="d-flex align-items-center gap-2 mt-2 flex-wrap">
                <span class="fw-bold text-primary fs-5">{{ l.price | number }} {{ l.currency }}</span>
                @if (l.isNegotiable) {
                  <span class="badge bg-warning-subtle text-warning-emphasis rounded-pill" style="font-size:.68rem">
                    <i class="bi bi-chat-left-dots me-1"></i>{{ i18n.lang() === 'ar' ? 'قابل للتفاوض' : 'Negotiable' }}
                  </span>
                }
              </div>
            </div>
          </a>
        </div>
      } @empty {
        <div class="col-12 text-center text-muted py-5"><i class="bi bi-inbox fs-1"></i><div class="mt-2">{{ 'listings.empty' | t }}</div></div>
      }
    </div>

    @if (!mineMode() && total() > pageSize) {
      <nav class="mt-4 d-flex justify-content-center">
        <ul class="pagination">
          <li class="page-item" [class.disabled]="page() === 1">
            <button class="page-link" (click)="setPage(page() - 1)">«</button>
          </li>
          <li class="page-item disabled"><span class="page-link">{{ 'common.page' | t }} {{ page() }} / {{ totalPages() }}</span></li>
          <li class="page-item" [class.disabled]="page() >= totalPages()">
            <button class="page-link" (click)="setPage(page() + 1)">»</button>
          </li>
        </ul>
      </nav>
    }
  `
})
export class ListingsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  readonly i18n = inject(I18nService);
  auth = inject(AuthService);
  readonly ListingStatus = ListingStatus;

  q = '';
  categoryId: number | null = null;
  type: ListingType | null = null;
  locationQ = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  isNegotiable = false;
  includeSold = false;
  showAdvanced = false;
  pageSize = 12;

  items = signal<Listing[]>([]);
  categories = signal<Category[]>([]);
  total = signal(0);
  page = signal(1);
  mineMode = signal(false);
  geoLoading = signal(false);

  private destroy$ = new Subject<void>();
  private locationInput$ = new Subject<string>();

  totalPages = () => Math.max(1, Math.ceil(this.total() / this.pageSize));

  ngOnInit() {
    this.mineMode.set(!!this.route.snapshot.data['mine']);
    if (this.mineMode()) {
      this.api.myListings().subscribe(items => { this.items.set(items); this.total.set(items.length); });
    } else {
      this.api.categories().subscribe(c => this.categories.set(c));
      const qp = this.route.snapshot.queryParamMap;
      const c = qp.get('categoryId'); if (c) this.categoryId = +c;
      const q = qp.get('q'); if (q) this.q = q;
      const loc = qp.get('location'); if (loc) this.locationQ = loc;
      this.reload();

      // Debounce location input — fires 400 ms after user stops typing
      this.locationInput$.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(() => { this.page.set(1); this.reload(); });
    }
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  onLocationInput(value: string) {
    this.locationQ = value;
    this.locationInput$.next(value);
  }

  reload() {
    this.api.listings({
      q: this.q, categoryId: this.categoryId ?? undefined,
      type: this.type ?? undefined, page: this.page(), pageSize: this.pageSize,
      location: this.locationQ || undefined,
      priceMin: this.priceMin ?? undefined,
      priceMax: this.priceMax ?? undefined,
      isNegotiable: this.isNegotiable || undefined,
      includeSold: this.includeSold || undefined
    }).subscribe(r => { this.items.set(r.items); this.total.set(r.total); });
  }

  nearMe() {
    if (!navigator.geolocation) return;
    this.geoLoading.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${this.i18n.lang()}`)
          .then(r => r.json())
          .then(d => {
            const a = d?.address;
            this.locationQ = a?.suburb || a?.city || a?.town || a?.village || a?.state || '';
            this.page.set(1);
            this.reload();
          })
          .catch(() => { this.locationQ = `${latitude.toFixed(3)},${longitude.toFixed(3)}`; this.reload(); })
          .finally(() => this.geoLoading.set(false));
      },
      () => this.geoLoading.set(false)
    );
  }

  setPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.reload();
  }

  clearAdvanced() {
    this.priceMin = null;
    this.priceMax = null;
    this.isNegotiable = false;
    this.includeSold = false;
    this.page.set(1);
    this.reload();
  }

  categoryName(category: Category) {
    return this.i18n.lang() === 'ar' ? (category.nameAr?.trim() || category.name) : category.name;
  }

  statusLabel(s: ListingStatus) {
    return this.i18n.t('status.' + s);
  }
}
