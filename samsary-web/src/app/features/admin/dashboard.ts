import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <h4 class="mb-4 fw-bold">{{ 'admin.dashboard' | t }}</h4>

    @if (loading()) {
      <div class="text-center py-5"><span class="spinner-border text-primary"></span></div>
    } @else if (error()) {
      <div class="alert alert-danger">{{ error() }}</div>
    } @else if (stats(); as s) {
      <div class="row g-3">
        @for (card of statCards(s); track card.key) {
          <div class="col-6 col-md-3">
            <div class="card border-0 shadow-sm h-100 hover-lift">
              <div class="card-body d-flex align-items-center gap-3">
                <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                     [style]="'width:44px;height:44px;background:' + card.bg">
                  <i [class]="'bi ' + card.icon" [style]="'color:' + card.color + ';font-size:1.2rem'"></i>
                </div>
                <div>
                  <div class="text-muted small">{{ card.label | t }}</div>
                  <div class="fs-4 fw-bold" [style]="'color:' + card.color">{{ card.value }}</div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);
  stats = signal<any | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.api.adminDashboard().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: e => { this.error.set(e?.error?.detail || 'Failed to load dashboard.'); this.loading.set(false); }
    });
  }

  statCards(s: any) {
    return [
      { key: 'users',     label: 'admin.users.count',  value: s.users,           icon: 'bi-people-fill',     color: '#1a4f7a', bg: '#eaf3fb' },
      { key: 'blocked',   label: 'admin.blocked',       value: s.blockedUsers,    icon: 'bi-slash-circle',    color: '#dc3545', bg: '#fde8ea' },
      { key: 'listings',  label: 'admin.listings',      value: s.listings,        icon: 'bi-house-fill',      color: '#198754', bg: '#e6f4ec' },
      { key: 'pending',   label: 'admin.pending',       value: s.pendingListings, icon: 'bi-hourglass-split', color: '#fd7e14', bg: '#fff3e0' },
      { key: 'approved',  label: 'admin.approved',      value: s.approvedListings,icon: 'bi-check-circle',    color: '#198754', bg: '#e6f4ec' },
      { key: 'rejected',  label: 'admin.rejected',      value: s.rejectedListings,icon: 'bi-x-circle',        color: '#6c757d', bg: '#f0f0f0' },
      { key: 'messages',  label: 'admin.messages',      value: s.chatMessages,    icon: 'bi-chat-dots-fill',  color: '#0d6efd', bg: '#e7f1ff' },
      { key: 'notifs',    label: 'admin.notifications', value: s.notifications,   icon: 'bi-bell-fill',       color: '#c9991f', bg: '#fef9e7' },
    ];
  }
}
