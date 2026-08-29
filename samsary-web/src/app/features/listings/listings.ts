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
          </div>
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
              @if (mineMode()) {
                <span class="badge position-absolute top-0 end-0 m-2"
                  [class.bg-warning]="l.status===0" [class.bg-success]="l.status===1"
                  [class.bg-danger]="l.status===2" [class.bg-secondary]="l.status>2">
                  {{ statusLabel(l.status) }}
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
              <div class="fw-bold text-primary mt-2 fs-5">{{ l.price | number }} {{ l.currency }}</div>
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
      location: this.locationQ || undefined
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

  categoryName(category: Category) {
    return this.i18n.lang() === 'ar' ? (category.nameAr?.trim() || category.name) : category.name;
  }

  statusLabel(s: ListingStatus) {
    return this.i18n.t('status.' + s);
  }
}
