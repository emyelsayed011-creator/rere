import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { RealtimeService } from '../core/realtime.service';
import { NotificationItem } from '../core/models';
import { TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0 fw-bold">{{ 'notif.title' | t }}</h4>
      @if (items().some(n => !n.isRead)) {
        <button class="btn btn-sm btn-outline-primary" (click)="markAll()">
          <i class="bi bi-check2-all me-1"></i>{{ 'notif.markAll' | t }}
        </button>
      }
    </div>

    <div class="card border-0 shadow-sm overflow-hidden animate-fade-up">
      @for (n of items(); track n.id) {
        <div class="notif-row d-flex align-items-start p-3 border-bottom"
             [class.unread]="!n.isRead"
             (click)="openNotif(n)">
          <!-- Icon -->
          <div class="notif-icon me-3 flex-shrink-0">
            <i class="bi fs-4"
              [class.bi-check2-circle]="n.type===1" [class.text-success]="n.type===1"
              [class.bi-x-circle]="n.type===2"     [class.text-danger]="n.type===2"
              [class.bi-chat-dots-fill]="n.type===3" [class.text-primary]="n.type===3"
              [class.bi-shield-lock-fill]="n.type===4" [class.text-warning]="n.type===4"
              [class.bi-bell-fill]="n.type===0||n.type===5||n.type===6||n.type===7||n.type===8||n.type===9"
              [class.text-secondary]="n.type===0||n.type===9"></i>
          </div>
          <!-- Content -->
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <span class="fw-semibold text-truncate">{{ n.title }}</span>
              <small class="text-muted flex-shrink-0">{{ n.createdAt | date:'shortTime' }}</small>
            </div>
            <div class="text-muted small mt-1">{{ n.message }}</div>
            @if (n.link) {
              <span class="text-primary small"><i class="bi bi-arrow-right me-1"></i>{{ 'common.open' | t }}</span>
            }
          </div>
          <!-- Unread dot -->
          @if (!n.isRead) {
            <div class="ms-2 flex-shrink-0" style="width:8px;height:8px;border-radius:50%;background:var(--samsary-primary);margin-top:6px"></div>
          }
        </div>
      } @empty {
        <div class="text-center text-muted py-5">
          <i class="bi bi-bell-slash fs-1 d-block mb-2 opacity-25"></i>
          {{ 'notif.empty' | t }}
        </div>
      }
    </div>
  `,
  styles: [`
    .notif-row { cursor: pointer; transition: background .15s; }
    .notif-row:hover { background: var(--samsary-soft); }
    .notif-row.unread { background: #f0f7ff; }
    .notif-row.unread:hover { background: #e2f0ff; }
    .notif-icon { width: 36px; display: flex; align-items: center; justify-content: center; }
  `]
})
export class NotificationsComponent implements OnInit {
  private api = inject(ApiService);
  private rt = inject(RealtimeService);
  private router = inject(Router);
  items = signal<NotificationItem[]>([]);

  constructor() {
    effect(() => { if (this.rt.latestNotification()) this.load(); });
  }

  ngOnInit() { this.rt.connect(); this.load(); }

  load() { this.api.notifications().subscribe(r => this.items.set(r.items)); }

  openNotif(n: NotificationItem) {
    if (!n.isRead) {
      this.api.markNotification(n.id).subscribe(() =>
        this.items.update(list => list.map(x => x.id === n.id ? { ...x, isRead: true } : x))
      );
    }
    if (n.link) this.router.navigateByUrl(n.link);
  }

  markAll() { this.api.markAllRead().subscribe(() => this.items.update(list => list.map(n => ({ ...n, isRead: true })))); }
}

