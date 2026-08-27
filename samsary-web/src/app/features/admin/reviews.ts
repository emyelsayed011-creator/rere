import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { TranslatePipe, I18nService } from '../../core/i18n.service';
import { Review, PagedReviews } from '../../core/models';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h4 class="fw-bold mb-0">
        <i class="bi bi-star-half text-warning me-2"></i>{{ 'admin.reviews' | t }}
      </h4>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="showDeleted"
               [(ngModel)]="showDeleted" (change)="load(1)">
        <label class="form-check-label small" for="showDeleted">{{ 'admin.showDeleted' | t }}</label>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table mb-0 align-middle table-hover">
          <thead class="table-light">
            <tr>
              <th style="width:35%">{{ 'review.content' | t }}</th>
              <th>{{ 'review.author' | t }}</th>
              <th>{{ 'review.listing' | t }}</th>
              <th>{{ 'review.rating' | t }}</th>
              <th>{{ 'admin.colJoined' | t }}</th>
              <th>{{ 'admin.colStatus' | t }}</th>
              <th class="text-end">{{ 'admin.colActions' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (rv of reviews(); track rv.id) {
              <tr [class.table-danger]="rv.isDeleted">
                <td class="small" style="max-width:250px">
                  <div class="text-truncate" [title]="rv.content">{{ rv.content }}</div>
                  @if (rv.isDeleted && rv.deletionReason) {
                    <div class="text-danger small mt-1">
                      <i class="bi bi-info-circle me-1"></i>{{ rv.deletionReason }}
                    </div>
                  }
                </td>
                <td class="small">{{ rv.authorName }}</td>
                <td class="small">
                  <a [routerLink]="['/listings', rv.listingId]" class="text-decoration-none">
                    #{{ rv.listingId }}
                  </a>
                </td>
                <td>
                  <div class="d-flex gap-1">
                    @for (star of [1,2,3,4,5]; track star) {
                      <i class="bi text-warning" style="font-size:.8rem"
                         [class.bi-star-fill]="star <= rv.rating"
                         [class.bi-star]="star > rv.rating"></i>
                    }
                  </div>
                </td>
                <td class="small text-muted">{{ rv.createdAt | date:'mediumDate' }}</td>
                <td>
                  @if (rv.isDeleted) {
                    <span class="badge bg-danger-subtle text-danger rounded-pill">
                      <i class="bi bi-x-circle me-1"></i>{{ 'admin.removed' | t }}
                    </span>
                  } @else {
                    <span class="badge bg-success-subtle text-success rounded-pill">
                      <i class="bi bi-check-circle me-1"></i>{{ 'admin.active' | t }}
                    </span>
                  }
                </td>
                <td class="text-end">
                  @if (!rv.isDeleted) {
                    <button class="btn btn-sm btn-outline-danger" (click)="openDelete(rv)">
                      <i class="bi bi-trash me-1"></i>{{ 'common.delete' | t }}
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="text-center text-muted py-4">{{ 'admin.noReviews' | t }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    @if (totalPages() > 1) {
      <nav class="mt-3 d-flex justify-content-center">
        <ul class="pagination">
          <li class="page-item" [class.disabled]="page() <= 1">
            <button class="page-link" (click)="load(page() - 1)">«</button>
          </li>
          <li class="page-item disabled">
            <span class="page-link">{{ page() }} / {{ totalPages() }}</span>
          </li>
          <li class="page-item" [class.disabled]="page() >= totalPages()">
            <button class="page-link" (click)="load(page() + 1)">»</button>
          </li>
        </ul>
      </nav>
    }

    <!-- Delete confirm modal -->
    @if (delReview(); as rv) {
      <div class="modal-backdrop fade show"></div>
      <div class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-danger-subtle">
              <h5 class="modal-title">
                <i class="bi bi-trash me-2"></i>{{ 'admin.deleteReview' | t }}
              </h5>
              <button class="btn-close" (click)="delReview.set(null)"></button>
            </div>
            <div class="modal-body">
              <blockquote class="blockquote-footer mb-3">{{ rv.content }}</blockquote>
              <label class="form-label fw-semibold">{{ 'admin.deleteReason' | t }}</label>
              <textarea class="form-control" rows="3"
                        [(ngModel)]="deleteReason"
                        [placeholder]="'admin.deleteReasonPlaceholder' | t"
                        maxlength="500"></textarea>
              <div class="alert alert-info small py-2 mt-2 mb-0">
                <i class="bi bi-bell me-1"></i>{{ 'admin.deleteReviewNotify' | t }}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-light" (click)="delReview.set(null)">{{ 'common.cancel' | t }}</button>
              <button class="btn btn-danger" (click)="confirmDelete(rv.id)" [disabled]="!deleteReason.trim()">
                <i class="bi bi-trash me-1"></i>{{ 'admin.confirmDelete' | t }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminReviewsComponent implements OnInit {
  private api = inject(ApiService);
  reviews = signal<Review[]>([]);
  page = signal(1);
  totalPages = signal(1);
  showDeleted = false;
  delReview = signal<Review | null>(null);
  deleteReason = '';

  ngOnInit() { this.load(1); }

  load(p: number) {
    this.page.set(p);
    this.api.adminReviews(p, this.showDeleted).subscribe((r: PagedReviews) => {
      this.reviews.set(r.items);
      this.totalPages.set(r.totalPages);
    });
  }

  openDelete(rv: Review) { this.delReview.set(rv); this.deleteReason = ''; }

  confirmDelete(id: number) {
    if (!this.deleteReason.trim()) return;
    this.api.adminDeleteReview(id, this.deleteReason.trim()).subscribe({
      next: () => { this.delReview.set(null); this.load(this.page()); },
      error: () => {}
    });
  }
}
