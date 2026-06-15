import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Category, Listing, ListingStatus, ListingType } from '../../core/models';

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  template: `
    <div class="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
      <h4 class="mb-0">{{ mineMode() ? 'My listings' : 'Browse listings' }}</h4>
      @if (mineMode() && auth.isAuthenticated()) {
        <a routerLink="/listings/new" class="btn btn-samsary btn-sm"><i class="bi bi-plus-lg"></i> New listing</a>
      }
    </div>

    @if (!mineMode()) {
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body row g-2">
          <div class="col-md-5">
            <input class="form-control" placeholder="Search…" [(ngModel)]="q" (keydown.enter)="reload()">
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="categoryId" (change)="reload()">
              <option [ngValue]="null">All categories</option>
              @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="type" (change)="reload()">
              <option [ngValue]="null">All</option>
              <option [ngValue]="1">For sale</option>
              <option [ngValue]="2">For rent</option>
            </select>
          </div>
          <div class="col-md-1 d-grid">
            <button class="btn btn-primary" (click)="reload()"><i class="bi bi-search"></i></button>
          </div>
        </div>
      </div>
    }

    <div class="row g-3">
      @for (l of items(); track l.id) {
        <div class="col-12 col-sm-6 col-lg-4">
          <a [routerLink]="['/listings', l.id]" class="card listing-card border-0 shadow-sm h-100 text-decoration-none text-body">
            <div class="position-relative ratio ratio-16x9">
              @if (l.media[0]) {
                <img [src]="l.media[0].thumbnailUrl || l.media[0].url" class="object-fit-cover rounded-top" alt="">
              } @else {
                <div class="d-flex align-items-center justify-content-center text-muted">
                  <i class="bi bi-image fs-1"></i>
                </div>
              }
              <span class="badge badge-type" [class.bg-success]="l.type===1" [class.bg-info]="l.type===2">
                {{ l.type === 1 ? 'Sell' : 'Rent' }}
              </span>
              @if (mineMode()) {
                <span class="badge position-absolute top-0 end-0 m-2"
                  [class.bg-warning]="l.status===0" [class.bg-success]="l.status===1"
                  [class.bg-danger]="l.status===2" [class.bg-secondary]="l.status>2">
                  {{ statusLabel(l.status) }}
                </span>
              }
            </div>
            <div class="card-body">
              <h6 class="card-title mb-1 text-truncate">{{ l.title }}</h6>
              <div class="text-muted small text-truncate">{{ l.category.name }} · {{ l.location || '—' }}</div>
              <div class="fw-bold text-primary mt-2">{{ l.price | number }} {{ l.currency }}</div>
            </div>
          </a>
        </div>
      } @empty {
        <div class="col-12 text-center text-muted py-5"><i class="bi bi-inbox fs-1"></i><div class="mt-2">No listings</div></div>
      }
    </div>

    @if (!mineMode() && total() > pageSize) {
      <nav class="mt-4 d-flex justify-content-center">
        <ul class="pagination">
          <li class="page-item" [class.disabled]="page() === 1">
            <button class="page-link" (click)="setPage(page() - 1)">«</button>
          </li>
          <li class="page-item disabled"><span class="page-link">Page {{ page() }} / {{ totalPages() }}</span></li>
          <li class="page-item" [class.disabled]="page() >= totalPages()">
            <button class="page-link" (click)="setPage(page() + 1)">»</button>
          </li>
        </ul>
      </nav>
    }
  `
})
export class ListingsComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  q = '';
  categoryId: number | null = null;
  type: ListingType | null = null;
  pageSize = 12;

  items = signal<Listing[]>([]);
  categories = signal<Category[]>([]);
  total = signal(0);
  page = signal(1);
  mineMode = signal(false);

  totalPages = () => Math.max(1, Math.ceil(this.total() / this.pageSize));

  ngOnInit() {
    this.mineMode.set(!!this.route.snapshot.data['mine']);
    if (this.mineMode()) {
      this.api.myListings().subscribe(items => { this.items.set(items); this.total.set(items.length); });
    } else {
      this.api.categories().subscribe(c => this.categories.set(c));
      const qp = this.route.snapshot.queryParamMap;
      const c = qp.get('category'); if (c) this.categoryId = +c;
      this.reload();
    }
  }

  reload() {
    this.api.listings({ q: this.q, categoryId: this.categoryId ?? undefined, type: this.type ?? undefined, page: this.page(), pageSize: this.pageSize })
      .subscribe(r => { this.items.set(r.items); this.total.set(r.total); });
  }

  setPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.reload();
  }

  statusLabel(s: ListingStatus) {
    return ['Pending', 'Approved', 'Rejected', 'Sold', 'Rented'][s] ?? 'Unknown';
  }
}
