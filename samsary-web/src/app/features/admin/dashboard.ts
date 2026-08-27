import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <h4 class="mb-3 fw-bold">{{ 'admin.dashboard' | t }}</h4>
    @if (stats(); as s) {
      <div class="row g-3">
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm hover-lift"><div class="card-body">
          <div class="text-muted small">{{ 'admin.users.count' | t }}</div><div class="fs-3 fw-bold">{{ s.users }}</div>
        </div></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm hover-lift"><div class="card-body">
          <div class="text-muted small">{{ 'admin.blocked' | t }}</div><div class="fs-3 fw-bold text-danger">{{ s.blockedUsers }}</div>
        </div></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm hover-lift"><div class="card-body">
          <div class="text-muted small">{{ 'admin.listings' | t }}</div><div class="fs-3 fw-bold">{{ s.listings }}</div>
        </div></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm hover-lift"><div class="card-body">
          <div class="text-muted small">{{ 'admin.pending' | t }}</div><div class="fs-3 fw-bold text-warning">{{ s.pendingListings }}</div>
        </div></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm hover-lift"><div class="card-body">
          <div class="text-muted small">{{ 'admin.approved' | t }}</div><div class="fs-3 fw-bold text-success">{{ s.approvedListings }}</div>
        </div></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm hover-lift"><div class="card-body">
          <div class="text-muted small">{{ 'admin.rejected' | t }}</div><div class="fs-3 fw-bold text-secondary">{{ s.rejectedListings }}</div>
        </div></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm hover-lift"><div class="card-body">
          <div class="text-muted small">{{ 'admin.messages' | t }}</div><div class="fs-3 fw-bold">{{ s.chatMessages }}</div>
        </div></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm hover-lift"><div class="card-body">
          <div class="text-muted small">{{ 'admin.notifications' | t }}</div><div class="fs-3 fw-bold">{{ s.notifications }}</div>
        </div></div></div>
      </div>
    }
  `
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);
  stats = signal<any | null>(null);
  ngOnInit() { this.api.adminDashboard().subscribe(s => this.stats.set(s)); }
}
