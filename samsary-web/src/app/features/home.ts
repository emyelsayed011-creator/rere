import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { Category, Listing } from '../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <section class="rounded-4 p-5 mb-4 text-white"
      style="background: linear-gradient(135deg,#4f46e5,#06b6d4);">
      <div class="row align-items-center">
        <div class="col-lg-8">
          <h1 class="display-5 fw-bold mb-2">Buy, sell &amp; rent — beautifully.</h1>
          <p class="lead mb-4 opacity-75">
            Post your items with photos and videos. Reach real people. Talk in real time.
          </p>
          <a routerLink="/listings" class="btn btn-light btn-lg me-2">
            <i class="bi bi-search"></i> Browse
          </a>
          <a routerLink="/listings/new" class="btn btn-outline-light btn-lg">
            <i class="bi bi-plus-lg"></i> Post a listing
          </a>
        </div>
      </div>
    </section>

    <h5 class="mb-3">Categories</h5>
    <div class="row g-3 mb-5">
      @for (c of categories(); track c.id) {
        <div class="col-6 col-md-4 col-lg-2">
          <a [routerLink]="['/listings']" [queryParams]="{ category: c.id }"
             class="card text-decoration-none text-body h-100 border-0 shadow-sm">
            <div class="card-body text-center">
              <i class="bi {{ c.iconClass || 'bi-tag' }} fs-2 text-primary"></i>
              <div class="mt-2 fw-semibold">{{ c.name }}</div>
            </div>
          </a>
        </div>
      }
    </div>

    <h5 class="mb-3">Latest listings</h5>
    <div class="row g-3">
      @for (l of latest(); track l.id) {
        <div class="col-12 col-sm-6 col-lg-3">
          <a [routerLink]="['/listings', l.id]" class="card listing-card border-0 shadow-sm h-100 text-decoration-none text-body">
            <div class="position-relative ratio ratio-16x9">
              @if (l.media[0]) {
                <img [src]="l.media[0].thumbnailUrl || l.media[0].url" class="card-img-top object-fit-cover rounded-top" alt="">
              } @else {
                <div class="d-flex align-items-center justify-content-center text-muted">
                  <i class="bi bi-image fs-1"></i>
                </div>
              }
              <span class="badge badge-type"
                [class.bg-success]="l.type === 1" [class.bg-info]="l.type === 2">
                {{ l.type === 1 ? 'For sale' : 'For rent' }}
              </span>
            </div>
            <div class="card-body">
              <h6 class="card-title mb-1 text-truncate">{{ l.title }}</h6>
              <div class="text-muted small text-truncate">{{ l.location || 'Anywhere' }}</div>
              <div class="fw-bold text-primary mt-2">{{ l.price | number }} {{ l.currency }}</div>
            </div>
          </a>
        </div>
      } @empty {
        <div class="col-12 text-center text-muted py-5">No listings yet. Be the first to post!</div>
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
