import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-admin-moderate',
  standalone: true,
  imports: [DatePipe, FormsModule, TranslatePipe],
  template: `
    <h4 class="mb-3 fw-bold">{{ 'admin.pendingListings' | t }}</h4>
    <div class="row g-3">
      @for (l of items(); track l.id) {
        <div class="col-md-6">
          <div class="card border-0 shadow-sm h-100">
            @if (l.media?.[0]) {
              <img [src]="l.media[0].thumbnailUrl || l.media[0].url" class="card-img-top" style="height:200px; object-fit: cover" alt="">
            }
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <h6 class="mb-1">{{ l.title }}</h6>
                <span class="badge text-white" [class.bg-success]="l.type===1" [class.bg-info]="l.type===2">
                  {{ (l.type === 1 ? 'common.sell' : 'common.rentShort') | t }}
                </span>
              </div>
              <div class="text-muted small mb-2">
                {{ l.category?.name }} · {{ l.owner?.displayName }} ({{ l.owner?.email }})
                · {{ l.createdAt | date:'short' }}
              </div>
              <p class="small mb-3" style="display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
                {{ l.description }}
              </p>
              <div class="d-flex gap-2">
                <button class="btn btn-success btn-sm" (click)="approve(l.id)">
                  <i class="bi bi-check2"></i> {{ 'admin.approve' | t }}
                </button>
                <button class="btn btn-outline-danger btn-sm" (click)="openReject(l)">
                  <i class="bi bi-x"></i> {{ 'admin.reject' | t }}
                </button>
              </div>
              @if (rejectingId() === l.id) {
                <div class="mt-2">
                  <textarea class="form-control mb-2" rows="2" [(ngModel)]="reason" [placeholder]="'admin.reason' | t"></textarea>
                  <button class="btn btn-danger btn-sm" (click)="reject(l.id)" [disabled]="!reason.trim()">{{ 'admin.confirmReject' | t }}</button>
                </div>
              }
            </div>
          </div>
        </div>
      } @empty { <div class="col-12 text-center text-muted py-5">{{ 'admin.nothingPending' | t }}</div> }
    </div>
  `
})
export class AdminModerateComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<any[]>([]);
  rejectingId = signal<number | null>(null);
  reason = '';
  ngOnInit() { this.load(); }
  load() { this.api.adminPending().subscribe(x => this.items.set(x)); }
  approve(id: number) { this.api.adminApprove(id).subscribe(() => this.load()); }
  openReject(l: any) { this.rejectingId.set(l.id); this.reason = ''; }
  reject(id: number) {
    if (!this.reason.trim()) return;
    this.api.adminReject(id, this.reason.trim()).subscribe(() => {
      this.rejectingId.set(null);
      this.load();
    });
  }
}
