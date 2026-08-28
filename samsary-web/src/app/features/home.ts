import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { RealtimeService } from '../core/realtime.service';
import { Category, Listing } from '../core/models';
import { TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe, TranslatePipe],
  template: `
    <!-- New listing toast -->
    @if (toastListing()) {
      <div class="position-fixed bottom-0 end-0 p-3" style="z-index:1200">
        <div class="toast show border-0 shadow-lg" role="alert" style="min-width:300px">
          <div class="toast-header border-0 text-white" style="background:var(--samsary-gradient)">
            <i class="bi bi-bell-fill me-2"></i>
            <strong class="me-auto">{{ 'home.newListingAlert' | t }}</strong>
            <button type="button" class="btn-close btn-close-white" (click)="toastListing.set(null)"></button>
          </div>
          <div class="toast-body">
            <div class="fw-semibold text-truncate">{{ toastListing()!.title }}</div>
            <div class="small text-muted">{{ toastListing()!.price | number }} {{ toastListing()!.currency }}
              @if (toastListing()!.category) { Â· {{ toastListing()!.category }} }
            </div>
            <a [routerLink]="['/listings', toastListing()!.id]" class="btn btn-sm btn-samsary mt-2" (click)="toastListing.set(null)">
              {{ 'home.viewListing' | t }}
            </a>
          </div>
        </div>
      </div>
    }

    <!-- Hero -->
    <section class="hero-re mb-5 animate-fade-up">
      <div class="hero-re-content">
        <div class="hero-re-badge mb-3">
          <i class="bi bi-buildings me-1"></i> {{ 'home.realEstatePlatform' | t }}
        </div>
        <h1 class="hero-re-title">{{ 'home.heroTitle' | t }}</h1>
        <p class="hero-re-sub">{{ 'home.heroSubtitle' | t }}</p>

        <!-- Quick search -->
        <div class="hero-search-bar">
          <select class="hero-search-select" [(ngModel)]="heroCategory" #heroSel
                  style="appearance:auto">
            <option value="">{{ 'listings.allCategories' | t }}</option>
            @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
          </select>
          <input class="hero-search-input" [(ngModel)]="heroQ" [placeholder]="'listings.searchPlaceholder' | t"
                 (keydown.enter)="heroSearch()">
          <button class="hero-search-btn" (click)="heroSearch()">
            <i class="bi bi-search"></i>
          </button>
        </div>

        <!-- Stats row -->
        <div class="hero-stats mt-4">
          <div class="hero-stat"><span class="hero-stat-num">{{ totalListings() || '0' }}</span><span class="hero-stat-lbl">{{ 'home.statListings' | t }}</span></div>
          <div class="hero-stat-div"></div>
          <div class="hero-stat"><span class="hero-stat-num">{{ categories().length || '0' }}</span><span class="hero-stat-lbl">{{ 'home.categories' | t }}</span></div>
          <div class="hero-stat-div"></div>
          <div class="hero-stat"><span class="hero-stat-num">{{ 'home.statSecureVal' | t }}</span><span class="hero-stat-lbl">{{ 'home.statSecure' | t }}</span></div>
        </div>
      </div>
      <div class="hero-re-visual d-none d-lg-flex">
        <div class="hero-prop-card">
          <i class="bi bi-building" style="font-size:3rem;opacity:.6"></i>
          <div class="mt-2 fw-bold small opacity-75">{{ 'home.heroTitle' | t }}</div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h5 class="mb-0 fw-bold section-title">{{ 'home.categories' | t }}</h5>
    </div>
    <div class="row g-3 mb-5">
      @for (c of categories(); track c.id; let i = $index) {
        <div class="col-6 col-md-4 col-lg-2">
          <a [routerLink]="['/listings']" [queryParams]="{ categoryId: c.id }"
             class="category-tile-re text-decoration-none d-block">
            <div class="category-tile-re-icon">
              <i class="bi {{ c.iconClass || 'bi-tag' }}"></i>
            </div>
            <div class="category-tile-re-name">{{ c.name }}</div>
          </a>
        </div>
      }
    </div>

    <!-- Latest listings -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h5 class="mb-0 fw-bold section-title">{{ 'home.latest' | t }}</h5>
      <a routerLink="/listings" class="btn btn-sm btn-outline-primary">{{ 'home.browse' | t }} </a>
    </div>
    <div class="row g-3">
      @for (l of latest(); track l.id; let i = $index) {
        <div class="col-12 col-sm-6 col-lg-3">
          <a [routerLink]="['/listings', l.id]" class="prop-card text-decoration-none d-block h-100">
            <div class="prop-card-img">
              @if (l.media[0]) {
                <img [src]="l.media[0].thumbnailUrl || l.media[0].url" alt="">
              } @else {
                <div class="prop-card-no-img"><i class="bi bi-buildings fs-1 opacity-25"></i></div>
              }
              <span class="prop-card-badge" [class.sale]="l.type === 1" [class.rent]="l.type === 2">
                {{ (l.type === 1 ? 'common.sale' : 'common.rent') | t }}
              </span>
            </div>
            <div class="prop-card-body">
              <div class="prop-card-cat">{{ l.category.name }}</div>
              <h6 class="prop-card-title">{{ l.title }}</h6>
              @if (l.location) {
                <div class="prop-card-loc"><i class="bi bi-geo-alt me-1"></i>{{ l.location }}</div>
              }
              <div class="prop-card-price">{{ l.price | number }} <span class="prop-card-currency">{{ l.currency }}</span></div>
            </div>
          </a>
        </div>
      } @empty {
        <div class="col-12 text-center text-muted py-5">
          <i class="bi bi-buildings fs-1 d-block mb-2 opacity-25"></i>
          {{ 'home.empty' | t }}
        </div>
      }
    </div>
  `,
  styles: [`
    /* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    .hero-re {
      background: var(--samsary-gradient);
      border-radius: 1.5rem;
      padding: 3rem 2.5rem;
      display: flex;
      align-items: center;
      gap: 2rem;
      color: #fff;
      overflow: hidden;
      position: relative;
    }
    .hero-re::before {
      content: '';
      position: absolute; inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .hero-re-content { flex: 1; position: relative; z-index: 1; }
    .hero-re-badge {
      display: inline-flex; align-items: center;
      background: rgba(255,255,255,.2); border-radius: 999px;
      padding: .25rem .85rem; font-size: .8rem; font-weight: 600; letter-spacing: .03em;
    }
    .hero-re-title { font-size: clamp(1.6rem,4vw,2.4rem); font-weight: 800; line-height: 1.2; margin-bottom: .75rem; }
    .hero-re-sub { opacity: .85; font-size: 1.05rem; margin-bottom: 1.5rem; max-width: 520px; }
    .hero-re-visual {
      width: 200px; height: 200px; flex-shrink: 0;
      background: rgba(255,255,255,.12); border-radius: 1.25rem;
      align-items: center; justify-content: center; text-align: center; color: #fff;
      position: relative; z-index: 1;
    }
    .hero-prop-card { padding: 1.5rem; }

    /* search bar */
    .hero-search-bar {
      display: flex; background: #fff; border-radius: .75rem;
      overflow: hidden; max-width: 560px;
      box-shadow: 0 8px 24px rgba(0,0,0,.15);
    }
    .hero-search-select {
      border: none; outline: none; padding: .75rem 1rem;
      color: #333; font-size: .9rem; background: #f8f8f8;
      border-right: 1px solid #eee; min-width: 120px;
    }
    .hero-search-input {
      flex: 1; border: none; outline: none; padding: .75rem 1rem;
      color: #333; font-size: .95rem;
    }
    .hero-search-btn {
      background: var(--samsary-gradient); color: #fff;
      border: none; padding: .75rem 1.25rem; cursor: pointer; font-size: 1.1rem;
    }
    .hero-search-btn:hover { opacity: .9; }

    /* stats */
    .hero-stats { display: flex; align-items: center; gap: 1.5rem; }
    .hero-stat { text-align: center; }
    .hero-stat-num { display: block; font-size: 1.4rem; font-weight: 800; }
    .hero-stat-lbl { font-size: .75rem; opacity: .75; }
    .hero-stat-div { width: 1px; height: 36px; background: rgba(255,255,255,.3); }

    /* section title */
    .section-title { position: relative; padding-left: .75rem; }
    .section-title::before {
      content: ''; position: absolute; left: 0; top: .1em; bottom: .1em;
      width: 3px; border-radius: 4px; background: var(--samsary-gradient);
    }

    /* categories */
    .category-tile-re {
      background: #fff; border-radius: 1rem; padding: 1rem .5rem;
      text-align: center; border: 1.5px solid transparent;
      transition: border-color .2s, transform .2s, box-shadow .2s;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .category-tile-re:hover { border-color: var(--samsary-primary); transform: translateY(-3px); box-shadow: 0 8px 20px rgba(var(--samsary-primary-rgb),.15); }
    .category-tile-re-icon {
      width: 52px; height: 52px; border-radius: .75rem; margin: 0 auto .5rem;
      background: var(--samsary-gradient-soft); display: flex;
      align-items: center; justify-content: center;
      font-size: 1.4rem; color: var(--samsary-primary);
    }
    .category-tile-re-name { font-size: .8rem; font-weight: 600; color: var(--samsary-ink); }

    /* property cards */
    .prop-card {
      background: #fff; border-radius: 1rem; overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,.07);
      transition: transform .25s, box-shadow .25s;
      color: var(--samsary-ink);
    }
    .prop-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(var(--samsary-primary-rgb),.14); }
    .prop-card-img { position: relative; padding-top: 62%; background: #f0f4f8; overflow: hidden; }
    .prop-card-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .prop-card-no-img { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    .prop-card-badge {
      position: absolute; top: .6rem; left: .6rem;
      border-radius: 999px; padding: .2rem .65rem; font-size: .7rem; font-weight: 700; color: #fff;
    }
    .prop-card-badge.sale  { background: #198754; }
    .prop-card-badge.rent  { background: #0d6efd; }
    .prop-card-body { padding: .85rem 1rem; }
    .prop-card-cat { font-size: .7rem; color: var(--samsary-primary); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .2rem; }
    .prop-card-title { font-weight: 700; font-size: .9rem; margin-bottom: .2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .prop-card-loc { font-size: .75rem; color: #888; margin-bottom: .4rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .prop-card-price { font-weight: 800; font-size: 1rem; color: var(--samsary-primary); }
    .prop-card-currency { font-size: .75rem; font-weight: 500; color: #888; }
  `]
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  private rt = inject(RealtimeService);
  categories = signal<Category[]>([]);
  latest = signal<Listing[]>([]);
  totalListings = signal(0);
  toastListing = signal<any | null>(null);
  heroQ = '';
  heroCategory = '';

  constructor() {
    effect(() => {
      const nl = this.rt.newListing();
      if (nl) {
        this.toastListing.set(nl);
        // Auto-dismiss after 8 seconds
        setTimeout(() => this.toastListing.set(null), 8000);
        // Reload latest listings
        this.api.listings({ pageSize: 8 }).subscribe(r => this.latest.set(r.items));
      }
    });
  }

  ngOnInit() {
    this.api.categories().subscribe(c => this.categories.set(c));
    this.api.listings({ pageSize: 8 }).subscribe(r => {
      this.latest.set(r.items);
      this.totalListings.set(r.total);
    });
  }

  heroSearch() {
    const params: any = {};
    if (this.heroQ) params.q = this.heroQ;
    if (this.heroCategory) params.categoryId = +this.heroCategory;
    window.location.href = '/listings?' + new URLSearchParams(params).toString();
  }
}
