import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { Category, Listing } from '../core/models';
import { TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  template: `
    <section class="hero p-4 p-md-5 mb-5 animate-fade-up">
      <div class="row align-items-center">
        <div class="col-lg-8">
          <h1 class="display-5 fw-bold mb-3">{{ 'home.heroTitle' | t }}</h1>
          <p class="lead mb-4 opacity-90">{{ 'home.heroSubtitle' | t }}</p>
          <div class="d-flex flex-wrap gap-2 mb-4">
            <a routerLink="/listings" class="btn btn-light btn-lg fw-semibold">
              <i class="bi bi-search me-1"></i> {{ 'home.browse' | t }}
            </a>
            <a routerLink="/listings/new" class="btn btn-outline-light btn-lg">
              <i class="bi bi-plus-lg me-1"></i> {{ 'home.postListing' | t }}
            </a>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <span class="stat-chip"><i class="bi bi-lightning-charge-fill"></i> {{ 'home.statLive' | t }}</span>
            <span class="stat-chip"><i class="bi bi-shield-check"></i> {{ 'home.statSecure' | t }}</span>
          </div>
        </div>
      </div>
    </section>

    <h5 class="mb-3 fw-bold"><i class="bi bi-grid-3x3-gap-fill text-primary me-2"></i>{{ 'home.categories' | t }}</h5>
    <div class="row g-3 mb-5">
      @for (c of categories(); track c.id; let i = $index) {
        <div class="col-6 col-md-4 col-lg-2 animate-fade-up" [class.animate-delay-1]="i % 4 === 1" [class.animate-delay-2]="i % 4 === 2" [class.animate-delay-3]="i % 4 === 3">
          <a [routerLink]="['/listings']" [queryParams]="{ category: c.id }"
             class="card category-tile text-decoration-none text-body h-100 border-0 shadow-sm">
            <div class="card-body text-center">
              <div class="cat-icon"><i class="bi {{ c.iconClass || 'bi-tag' }} fs-3"></i></div>
              <div class="mt-3 fw-semibold">{{ c.name }}</div>
            </div>
          </a>
        </div>
      }
    </div>

    <h5 class="mb-3 fw-bold"><i class="bi bi-stars text-primary me-2"></i>{{ 'home.latest' | t }}</h5>
    <div class="row g-3">
      @for (l of latest(); track l.id; let i = $index) {
        <div class="col-12 col-sm-6 col-lg-3 animate-fade-up" [class.animate-delay-1]="i % 4 === 1" [class.animate-delay-2]="i % 4 === 2" [class.animate-delay-3]="i % 4 === 3">
          <a [routerLink]="['/listings', l.id]" class="card listing-card border-0 shadow-sm h-100 text-decoration-none text-body">
            <div class="position-relative ratio ratio-16x9">
              @if (l.media[0]) {
                <img [src]="l.media[0].thumbnailUrl || l.media[0].url" class="card-img-top object-fit-cover rounded-top" alt="">
              } @else {
                <div class="d-flex align-items-center justify-content-center text-muted">
                  <i class="bi bi-image fs-1"></i>
                </div>
              }
              <span class="badge badge-type text-white"
                [class.bg-success]="l.type === 1" [class.bg-info]="l.type === 2">
                {{ (l.type === 1 ? 'common.sale' : 'common.rent') | t }}
              </span>
            </div>
            <div class="card-body">
              <h6 class="card-title mb-1 text-truncate">{{ l.title }}</h6>
              <div class="text-muted small text-truncate"><i class="bi bi-geo-alt me-1"></i>{{ l.location || ('common.anywhere' | t) }}</div>
              <div class="fw-bold text-primary mt-2 fs-5">{{ l.price | number }} {{ l.currency }}</div>
            </div>
          </a>
        </div>
      } @empty {
        <div class="col-12 text-center text-muted py-5">{{ 'home.empty' | t }}</div>
      }
    </div>
  `
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  categories = signal<Category[]>([]);
  latest = signal<Listing[]>([]);

  ngOnInit() {
    this.api.categories().subscribe(c => this.categories.set(c));
    this.api.listings({ pageSize: 8 }).subscribe(r => this.latest.set(r.items));
  }
}
