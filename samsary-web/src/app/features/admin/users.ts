import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { TranslatePipe, I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe, FormsModule, TranslatePipe],
  template: `
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h4 class="mb-0 fw-bold">{{ 'admin.users' | t }}</h4>
      <button class="btn btn-samsary btn-sm" (click)="broadcastOpen.set(true)">
        <i class="bi bi-megaphone me-1"></i>
        {{ i18n.lang() === 'ar' ? 'إشعار للجميع' : 'Broadcast' }}
      </button>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>{{ 'admin.colEmail' | t }}</th>
              <th>{{ 'admin.colDisplay' | t }}</th>
              <th>{{ 'admin.colJoined' | t }}</th>
              <th>{{ 'admin.colStatus' | t }}</th>
              <th class="text-end">{{ 'admin.colActions' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (u of items(); track u.id) {
              <tr>
                <td>{{ u.email }}</td>
                <td>{{ u.displayName }}</td>
                <td>{{ u.createdAt | date:'short' }}</td>
                <td>
                  @if (u.isBlocked) {
                    <span class="badge bg-danger">{{ 'admin.blocked' | t }}</span>
                  } @else {
                    <span class="badge bg-success">{{ 'admin.active' | t }}</span>
                  }
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-secondary me-1" (click)="openMessage(u)"
                          [title]="'admin.messageUser' | t">
                    <i class="bi bi-envelope"></i>
                  </button>
                  @if (!u.isBlocked) {
                    <button class="btn btn-sm btn-outline-danger" (click)="openBan(u)">
                      <i class="bi bi-ban me-1"></i>{{ 'admin.block' | t }}
                    </button>
                  } @else {
                    <button class="btn btn-sm btn-outline-success" (click)="confirmUnban(u)">
                      <i class="bi bi-check-circle me-1"></i>{{ 'admin.unblock' | t }}
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <nav class="mt-3 d-flex justify-content-center">
      <ul class="pagination">
        <li class="page-item" [class.disabled]="page() === 1">
          <button class="page-link" (click)="go(page() - 1)">«</button>
        </li>
        <li class="page-item disabled"><span class="page-link">{{ 'common.page' | t }} {{ page() }}</span></li>
        <li class="page-item" [class.disabled]="items().length < pageSize">
          <button class="page-link" (click)="go(page() + 1)">»</button>
        </li>
      </ul>
    </nav>

    <!-- ── Ban confirmation modal ── -->
    @if (banTarget(); as u) {
      <div class="modal-backdrop fade show" style="z-index:1040"></div>
      <div class="modal d-block" tabindex="-1" style="z-index:1050">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg rounded-3">
            <div class="modal-header border-0 pb-0">
              <div>
                <h5 class="modal-title fw-bold">
                  <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>{{ 'admin.block' | t }}: {{ u.displayName }}
                </h5>
                <p class="text-muted small mb-0">{{ u.email }}</p>
              </div>
              <button class="btn-close ms-auto" (click)="banTarget.set(null)"></button>
            </div>
            <div class="modal-body py-3">
              <div class="mb-3">
                <label class="form-label fw-medium small">{{ 'admin.banReason' | t }} <span class="text-danger">*</span></label>
                <textarea class="form-control" rows="3" [(ngModel)]="banReason"
                          [placeholder]="'admin.banReasonPlaceholder' | t"></textarea>
                <div class="form-text">{{ 'admin.banReasonHint' | t }}</div>
              </div>
              <div class="mb-2">
                <label class="form-label fw-medium small">{{ 'admin.banDuration' | t }}</label>
                <select class="form-select" [(ngModel)]="banDuration">
                  <option [ngValue]="null">{{ 'admin.banPermanent' | t }}</option>
                  <option [ngValue]="1">1 {{ 'admin.hour' | t }}</option>
                  <option [ngValue]="24">24 {{ 'admin.hours' | t }}</option>
                  <option [ngValue]="72">3 {{ 'admin.days' | t }}</option>
                  <option [ngValue]="168">7 {{ 'admin.days' | t }}</option>
                  <option [ngValue]="720">30 {{ 'admin.days' | t }}</option>
                </select>
              </div>
            </div>
            <div class="modal-footer border-0 pt-0">
              <button class="btn btn-light" (click)="banTarget.set(null)">{{ 'common.cancel' | t }}</button>
              <button class="btn btn-danger" [disabled]="!banReason.trim() || actionLoading()"
                      (click)="executeBan(u)">
                @if (actionLoading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                <i class="bi bi-ban me-1"></i>{{ 'admin.block' | t }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ── Unban confirmation modal ── -->
    @if (unbanTarget(); as u) {
      <div class="modal-backdrop fade show" style="z-index:1040"></div>
      <div class="modal d-block" tabindex="-1" style="z-index:1050">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg rounded-3">
            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold">
                <i class="bi bi-check-circle-fill text-success me-2"></i>{{ 'admin.unblock' | t }}: {{ u.displayName }}
              </h5>
              <button class="btn-close" (click)="unbanTarget.set(null)"></button>
            </div>
            <div class="modal-body">
              <p>{{ 'admin.unbanConfirm' | t }} <strong>{{ u.displayName }}</strong>?</p>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-light" (click)="unbanTarget.set(null)">{{ 'common.cancel' | t }}</button>
              <button class="btn btn-success" [disabled]="actionLoading()" (click)="executeUnban(u)">
                @if (actionLoading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                {{ 'admin.unblock' | t }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ── Message modal ── -->
    @if (msgUser(); as u) {
      <div class="modal-backdrop fade show" style="z-index:1040"></div>
      <div class="modal d-block" tabindex="-1" style="z-index:1050">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg rounded-3">
            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold">{{ 'admin.messageUser' | t }}: {{ u.displayName }}</h5>
              <button class="btn-close" (click)="msgUser.set(null)"></button>
            </div>
            <div class="modal-body">
              <textarea class="form-control" rows="4" [(ngModel)]="messageBody"
                        [placeholder]="'admin.writeMessage' | t"></textarea>
              @if (msgFeedback()) {
                <div class="small mt-2" [class.text-success]="msgOk()" [class.text-danger]="!msgOk()">
                  {{ msgFeedback() }}
                </div>
              }
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-light" (click)="msgUser.set(null)">{{ 'common.cancel' | t }}</button>
              <button class="btn btn-samsary" (click)="sendMessage(u.id)" [disabled]="!messageBody.trim()">
                <i class="bi bi-send me-1"></i>{{ 'common.send' | t }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
    <!-- ── Broadcast modal ── -->
    @if (broadcastOpen()) {
      <div class="modal-backdrop fade show" style="z-index:1040"></div>
      <div class="modal d-block" tabindex="-1" style="z-index:1050">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg rounded-3">
            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold">
                <i class="bi bi-megaphone-fill me-2 text-primary"></i>
                {{ i18n.lang() === 'ar' ? 'إشعار للجميع' : 'Broadcast Notification' }}
              </h5>
              <button class="btn-close" (click)="broadcastOpen.set(false)"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label fw-medium small">{{ i18n.lang() === 'ar' ? 'العنوان' : 'Title' }}</label>
                <input class="form-control" [(ngModel)]="broadcastTitle" maxlength="120">
              </div>
              <div class="mb-3">
                <label class="form-label fw-medium small">{{ i18n.lang() === 'ar' ? 'الرسالة' : 'Message' }}</label>
                <textarea class="form-control" rows="4" [(ngModel)]="broadcastMsg"></textarea>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="bcastEmail" [(ngModel)]="broadcastEmail">
                <label class="form-check-label small" for="bcastEmail">
                  <i class="bi bi-envelope me-1"></i>
                  {{ i18n.lang() === 'ar' ? 'أرسل بريد إلكتروني أيضاً' : 'Also send email' }}
                </label>
              </div>
              @if (broadcastFeedback()) {
                <div class="small mt-2" [class.text-success]="broadcastOk()" [class.text-danger]="!broadcastOk()">
                  {{ broadcastFeedback() }}
                </div>
              }
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-light" (click)="broadcastOpen.set(false)">{{ 'common.cancel' | t }}</button>
              <button class="btn btn-samsary" (click)="sendBroadcast()"
                      [disabled]="!broadcastTitle.trim() || !broadcastMsg.trim() || actionLoading()">
                @if (actionLoading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                <i class="bi bi-send me-1"></i>{{ i18n.lang() === 'ar' ? 'إرسال للجميع' : 'Send to all' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminUsersComponent implements OnInit {
  private api = inject(ApiService);
  readonly i18n = inject(I18nService);

  items = signal<any[]>([]);
  page = signal(1);
  pageSize = 25;
  actionLoading = signal(false);

  // Ban modal
  banTarget = signal<any | null>(null);
  banReason = '';
  banDuration: number | null = null;

  // Unban modal
  unbanTarget = signal<any | null>(null);

  // Message modal
  msgUser = signal<any | null>(null);
  messageBody = '';
  msgFeedback = signal<string | null>(null);
  msgOk = signal(true);

  ngOnInit() { this.load(); }

  load() { this.api.adminUsers(this.page()).subscribe(r => this.items.set(r.items ?? r)); }
  go(p: number) { if (p < 1) return; this.page.set(p); this.load(); }

  openBan(u: any) {
    this.banTarget.set(u);
    this.banReason = '';
    this.banDuration = null;
  }

  executeBan(u: any) {
    if (!this.banReason.trim()) return;
    this.actionLoading.set(true);
    this.api.adminBanUser(u.id, this.banReason.trim(), this.banDuration).subscribe({
      next: () => { this.actionLoading.set(false); this.banTarget.set(null); this.load(); },
      error: () => this.actionLoading.set(false)
    });
  }

  confirmUnban(u: any) { this.unbanTarget.set(u); }

  executeUnban(u: any) {
    this.actionLoading.set(true);
    this.api.adminUnbanUser(u.id).subscribe({
      next: () => { this.actionLoading.set(false); this.unbanTarget.set(null); this.load(); },
      error: () => this.actionLoading.set(false)
    });
  }

  openMessage(u: any) { this.msgUser.set(u); this.messageBody = ''; this.msgFeedback.set(null); }

  sendMessage(id: string) {
    this.api.adminMessage(id, this.messageBody.trim()).subscribe({
      next: () => {
        this.msgOk.set(true);
        this.msgFeedback.set(this.i18n.t('admin.sent'));
        setTimeout(() => this.msgUser.set(null), 800);
      },
      error: () => { this.msgOk.set(false); this.msgFeedback.set(this.i18n.t('common.failed')); }
    });
  }

  // Broadcast
  broadcastOpen = signal(false);
  broadcastTitle = '';
  broadcastMsg = '';
  broadcastEmail = false;
  broadcastFeedback = signal<string | null>(null);
  broadcastOk = signal(true);

  sendBroadcast() {
    if (!this.broadcastTitle.trim() || !this.broadcastMsg.trim()) return;
    this.actionLoading.set(true);
    this.api.adminBroadcast(this.broadcastTitle.trim(), this.broadcastMsg.trim(), this.broadcastEmail).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.broadcastOk.set(true);
        this.broadcastFeedback.set(this.i18n.lang() === 'ar' ? 'تم الإرسال بنجاح' : 'Sent successfully!');
        setTimeout(() => { this.broadcastOpen.set(false); this.broadcastFeedback.set(null); }, 1500);
      },
      error: () => { this.actionLoading.set(false); this.broadcastOk.set(false); this.broadcastFeedback.set(this.i18n.t('common.failed')); }
    });
  }
}
