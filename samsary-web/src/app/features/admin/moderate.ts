import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-admin-moderate',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, TranslatePipe],
  template: `
    <h4 class="mb-3 fw-bold">{{ 'admin.pendingListings' | t }}</h4>
    <div class="row g-3">
      @for (l of items(); track l.id) {
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-3">
              <!-- Header row -->
              <div class="d-flex gap-3">
                @if (l.media?.[0]) {
                  <img [src]="l.media[0].thumbnailUrl || l.media[0].url"
                       class="rounded-2 flex-shrink-0 object-fit-cover"
                       style="width:100px;height:80px" alt="">
                }
                <div class="flex-grow-1 min-w-0">
                  <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                      <h6 class="mb-0 fw-bold">{{ l.title }}</h6>
                      <div class="text-muted small mt-1">
                        <span class="badge text-white me-1" [class.bg-success]="l.type===1" [class.bg-info]="l.type===2">
                          {{ l.type === 1 ? 'Sell' : 'Rent' }}
                        </span>
                        {{ l.category?.name }} · {{ l.owner?.displayName }} ({{ l.owner?.email }})
                        · {{ l.createdAt | date:'short' }}
                        @if (l.location) { · <i class="bi bi-geo-alt"></i> {{ l.location }} }
                      </div>
                      <div class="fw-bold text-primary mt-1">{{ l.price | number }} {{ l.currency }}</div>
                    </div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-secondary" (click)="toggleExpand(l.id)">
                        <i class="bi" [class.bi-chevron-down]="expandedId() !== l.id"
                           [class.bi-chevron-up]="expandedId() === l.id"></i>
                        {{ expandedId() === l.id ? 'Hide' : 'View all' }}
                      </button>
                      <button class="btn btn-success btn-sm" (click)="approve(l.id)">
                        <i class="bi bi-check2"></i> {{ 'admin.approve' | t }}
                      </button>
                      <button class="btn btn-outline-danger btn-sm" (click)="openReject(l)">
                        <i class="bi bi-x"></i> {{ 'admin.reject' | t }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Expanded full detail -->
              @if (expandedId() === l.id) {
                <div class="border-top mt-3 pt-3">
                  <!-- All media -->
                  @if (l.media?.length) {
                    <div class="d-flex gap-2 flex-wrap mb-3">
                      @for (m of l.media; track m.id) {
                        <div style="width:100px;height:80px;position:relative">
                          @if (m.mediaType === 1) {
                            <img [src]="m.thumbnailUrl || m.url" class="rounded-2 object-fit-cover w-100 h-100" alt="">
                          } @else {
                            <video [src]="m.url" class="rounded-2 object-fit-cover w-100 h-100" preload="metadata"></video>
                            <span class="position-absolute top-0 start-0 m-1 badge bg-warning text-dark" style="font-size:.6rem"><i class="bi bi-play-fill"></i></span>
                          }
                        </div>
                      }
                    </div>
                  }
                  <p class="text-body-secondary small mb-2" style="white-space:pre-line;line-height:1.6">{{ l.description }}</p>
                  <a [routerLink]="['/listings', l.id]" target="_blank" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-box-arrow-up-right me-1"></i>View public page
                  </a>
                </div>
              }

              <!-- Reject form -->
              @if (rejectingId() === l.id) {
                <div class="mt-2">
                  <textarea class="form-control mb-2" rows="2" [(ngModel)]="reason"
                            [placeholder]="'admin.reason' | t"></textarea>
                  <button class="btn btn-danger btn-sm" (click)="reject(l.id)"
                          [disabled]="!reason.trim()">{{ 'admin.confirmReject' | t }}</button>
                </div>
              }
            </div>
          </div>
        </div>
      } @empty {
        <div class="col-12 text-center text-muted py-5">{{ 'admin.nothingPending' | t }}</div>
      }
    </div>
  `
})
export class AdminModerateComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<any[]>([]);
  rejectingId = signal<number | null>(null);
  expandedId = signal<number | null>(null);
  reason = '';

  ngOnInit() { this.load(); }
  load() { this.api.adminPending().subscribe(x => this.items.set(x)); }
  approve(id: number) { this.api.adminApprove(id).subscribe(() => this.load()); }
  openReject(l: any) { this.rejectingId.set(l.id); this.reason = ''; }
  toggleExpand(id: number) { this.expandedId.update(v => v === id ? null : id); }
  reject(id: number) {
    if (!this.reason.trim()) return;
    this.api.adminReject(id, this.reason.trim()).subscribe(() => {
      this.rejectingId.set(null);
      this.load();
    });
  }
}
