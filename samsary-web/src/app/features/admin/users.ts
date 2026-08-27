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
    <h4 class="mb-3 fw-bold">{{ 'admin.users' | t }}</h4>
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>{{ 'admin.colEmail' | t }}</th><th>{{ 'admin.colDisplay' | t }}</th><th>{{ 'admin.colJoined' | t }}</th><th>{{ 'admin.colStatus' | t }}</th><th class="text-end">{{ 'admin.colActions' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (u of items(); track u.id) {
              <tr>
                <td>{{ u.email }}</td>
                <td>{{ u.displayName }}</td>
                <td>{{ u.createdAt | date:'short' }}</td>
                <td>
                  @if (u.isBlocked) { <span class="badge bg-danger">{{ 'admin.blocked' | t }}</span> }
                  @else { <span class="badge bg-success">{{ 'admin.active' | t }}</span> }
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-secondary me-1" (click)="openMessage(u)">
                    <i class="bi bi-envelope"></i>
                  </button>
                  <button class="btn btn-sm" [class.btn-outline-danger]="!u.isBlocked" [class.btn-success]="u.isBlocked" (click)="toggleBlock(u)">
                    {{ (u.isBlocked ? 'admin.unblock' : 'admin.block') | t }}
                  </button>
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

    @if (msgUser(); as u) {
      <div class="modal-backdrop fade show"></div>
      <div class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ 'admin.messageUser' | t }} {{ u.displayName }}</h5>
              <button class="btn-close" (click)="msgUser.set(null)"></button>
            </div>
            <div class="modal-body">
              <textarea class="form-control" rows="4" [(ngModel)]="messageBody" [placeholder]="'admin.writeMessage' | t"></textarea>
              @if (msgFeedback()) { <div class="small mt-2" [class.text-success]="msgOk()" [class.text-danger]="!msgOk()">{{ msgFeedback() }}</div> }
            </div>
            <div class="modal-footer">
              <button class="btn btn-light" (click)="msgUser.set(null)">{{ 'common.cancel' | t }}</button>
              <button class="btn btn-samsary" (click)="sendMessage(u.id)" [disabled]="!messageBody.trim()">{{ 'common.send' | t }}</button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminUsersComponent implements OnInit {
  private api = inject(ApiService);
  private i18n = inject(I18nService);
  items = signal<any[]>([]);
  page = signal(1);
  pageSize = 25;
  msgUser = signal<any | null>(null);
  messageBody = '';
  msgFeedback = signal<string | null>(null);
  msgOk = signal(true);

  ngOnInit() { this.load(); }
  load() { this.api.adminUsers(this.page()).subscribe(r => this.items.set(r.items)); }
  go(p: number) { if (p < 1) return; this.page.set(p); this.load(); }
  toggleBlock(u: any) { this.api.adminBlock(u.id, !u.isBlocked).subscribe(() => this.load()); }
  openMessage(u: any) { this.msgUser.set(u); this.messageBody = ''; this.msgFeedback.set(null); }
  sendMessage(id: string) {
    this.api.adminMessage(id, this.messageBody.trim()).subscribe({
      next: () => { this.msgOk.set(true); this.msgFeedback.set(this.i18n.t('admin.sent')); setTimeout(() => this.msgUser.set(null), 800); },
      error: () => { this.msgOk.set(false); this.msgFeedback.set(this.i18n.t('common.failed')); }
    });
  }
}
