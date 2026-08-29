import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { I18nService, TranslatePipe } from '../../core/i18n.service';

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
              <div class="d-flex gap-3">
                <!-- Clickable thumbnail → opens listing detail -->
                <a [routerLink]="['/listings', l.id]" target="_blank" class="flex-shrink-0">
                  @if (l.media?.[0]) {
                    <img [src]="l.media[0].thumbnailUrl || l.media[0].url"
                         class="rounded-2 object-fit-cover"
                         style="width:100px;height:80px" alt="">
                  } @else {
                    <div class="rounded-2 bg-light d-flex align-items-center justify-content-center"
                         style="width:100px;height:80px">
                      <i class="bi bi-image text-muted fs-3"></i>
                    </div>
                  }
                </a>
                <div class="flex-grow-1 min-w-0">
                  <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                      <!-- Clickable title -->
                      <a [routerLink]="['/listings', l.id]" target="_blank"
                         class="fw-bold text-decoration-none text-body">
                        {{ l.title }}
                        <i class="bi bi-box-arrow-up-right ms-1 small opacity-50"></i>
                      </a>
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
                    <div class="d-flex gap-2 flex-wrap">
                      <button class="btn btn-success btn-sm" (click)="approveTarget.set(l)">
                        <i class="bi bi-check2 me-1"></i>{{ 'admin.approve' | t }}
                      </button>
                      <button class="btn btn-outline-danger btn-sm" (click)="openReject(l)">
                        <i class="bi bi-x me-1"></i>{{ 'admin.reject' | t }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      } @empty {
        <div class="col-12 text-center text-muted py-5">{{ 'admin.nothingPending' | t }}</div>
      }
    </div>

    <!-- ── Approve confirm popup ── -->
    @if (approveTarget(); as l) {
      <div class="modal-backdrop fade show" style="position:fixed;inset:0;z-index:1040" (click)="approveTarget.set(null)"></div>
      <div class="modal d-block" tabindex="-1" style="position:fixed;inset:0;z-index:1050">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-0 shadow-lg rounded-3">
            <div class="modal-body p-4 text-center">
              <i class="bi bi-check-circle-fill text-success mb-3 d-block" style="font-size:2.5rem"></i>
              <h5 class="fw-bold mb-2">
                {{ i18n.lang() === 'ar' ? 'تأكيد القبول' : 'Confirm Approval' }}
              </h5>
              <p class="text-muted small mb-0">
                {{ i18n.lang() === 'ar' ? 'هل تريد قبول الإعلان التالي؟' : 'Approve this listing?' }}
              </p>
              <p class="fw-semibold mt-2 mb-0">{{ l.title }}</p>
            </div>
            <div class="modal-footer border-0 pt-0 d-flex gap-2 justify-content-center pb-4">
              <button class="btn btn-light px-4" (click)="approveTarget.set(null)" [disabled]="saving()">
                {{ 'common.cancel' | t }}
              </button>
              <button class="btn btn-success px-4" (click)="confirmApprove(l.id)" [disabled]="saving()">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                @else { <i class="bi bi-check2 me-1"></i> }
                {{ 'admin.approve' | t }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ── Reject popup with reason ── -->
    @if (rejectTarget(); as l) {
      <div class="modal-backdrop fade show" style="position:fixed;inset:0;z-index:1040" (click)="rejectTarget.set(null)"></div>
      <div class="modal d-block" tabindex="-1" style="position:fixed;inset:0;z-index:1050">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg rounded-3">
            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold">
                <i class="bi bi-x-circle-fill text-danger me-2"></i>
                {{ i18n.lang() === 'ar' ? 'رفض الإعلان' : 'Reject Listing' }}
              </h5>
              <button class="btn-close" (click)="rejectTarget.set(null)"></button>
            </div>
            <div class="modal-body pt-0">
              <p class="text-muted small mb-3">
                <strong>{{ l.title }}</strong> —
                {{ i18n.lang() === 'ar' ? 'اكتب سبب الرفض ليظهر للمستخدم' : 'Write a reason shown to the user' }}
              </p>
              <textarea class="form-control" rows="3" [(ngModel)]="rejectNote"
                        [placeholder]="i18n.lang() === 'ar' ? 'سبب الرفض...' : 'Rejection reason...'"></textarea>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-light" (click)="rejectTarget.set(null)" [disabled]="saving()">{{ 'common.cancel' | t }}</button>
              <button class="btn btn-danger px-4" (click)="confirmReject(l.id)" [disabled]="!rejectNote.trim() || saving()">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                @else { <i class="bi bi-x me-1"></i> }
                {{ 'admin.confirmReject' | t }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminModerateComponent implements OnInit {
  private api = inject(ApiService);
  readonly i18n = inject(I18nService);

  items = signal<any[]>([]);
  approveTarget = signal<any | null>(null);
  rejectTarget = signal<any | null>(null);
  rejectNote = '';
  saving = signal(false);

  ngOnInit() { this.load(); }
  load() { this.api.adminPending().subscribe(x => this.items.set(x)); }

  openReject(l: any) { this.rejectTarget.set(l); this.rejectNote = ''; }

  confirmApprove(id: number) {
    if (this.saving()) return;
    this.saving.set(true);
    this.api.adminApprove(id).subscribe({
      next: () => { this.saving.set(false); this.approveTarget.set(null); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  confirmReject(id: number) {
    if (!this.rejectNote.trim() || this.saving()) return;
    this.saving.set(true);
    this.api.adminReject(id, this.rejectNote.trim()).subscribe({
      next: () => { this.saving.set(false); this.rejectTarget.set(null); this.load(); },
      error: () => this.saving.set(false)
    });
  }
}
