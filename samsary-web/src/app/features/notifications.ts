import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { RealtimeService } from '../core/realtime.service';
import { NotificationItem } from '../core/models';
import { TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0 fw-bold">{{ 'notif.title' | t }}</h4>
      <button class="btn btn-outline-secondary btn-sm" (click)="markAll()">
        <i class="bi bi-check2-all"></i> {{ 'notif.markAll' | t }}
      </button>
    </div>
    <div class="list-group shadow-sm animate-fade-up">
      @for (n of items(); track n.id) {
        <div class="list-group-item d-flex align-items-start" [class.bg-light]="!n.isRead">
          <div class="me-3">
            <i class="bi fs-3"
              [class.bi-check2-circle]="n.type===1" [class.text-success]="n.type===1"
              [class.bi-x-circle]="n.type===2"     [class.text-danger]="n.type===2"
              [class.bi-chat-dots]="n.type===3"    [class.text-primary]="n.type===3"
              [class.bi-shield-lock]="n.type===4"  [class.text-warning]="n.type===4"
              [class.bi-bell]="n.type===0"></i>
          </div>
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between">
              <strong>{{ n.title }}</strong>
              <small class="text-muted">{{ n.createdAt | date:'short' }}</small>
            </div>
            <div class="text-body">{{ n.message }}</div>
            @if (n.link) {
              <a [routerLink]="n.link" class="small">{{ 'common.open' | t }}</a>
            }
          </div>
          @if (!n.isRead) {
            <button class="btn btn-sm btn-link" (click)="markOne(n.id)" title="Mark read">
              <i class="bi bi-check"></i>
            </button>
          }
        </div>
      } @empty {
        <div class="text-center text-muted py-5">{{ 'notif.empty' | t }}</div>
      }
    </div>
  `
})
export class NotificationsComponent implements OnInit {
  private api = inject(ApiService);
  private rt = inject(RealtimeService);
  items = signal<NotificationItem[]>([]);

  constructor() {
    effect(() => {
      const n = this.rt.latestNotification();
      if (n) this.load();
    });
  }

  ngOnInit() { this.rt.connect(); this.load(); }

  load() { this.api.notifications().subscribe(r => this.items.set(r.items)); }
  markOne(id: number) { this.api.markNotification(id).subscribe(() => this.load()); }
  markAll() { this.api.markAllRead().subscribe(() => this.load()); }
}
