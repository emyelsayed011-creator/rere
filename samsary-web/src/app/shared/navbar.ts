import { Component, inject, OnInit, effect, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../core/auth.service';
import { AuthModalService } from '../core/auth-modal.service';
import { RealtimeService } from '../core/realtime.service';
import { ApiService } from '../core/api.service';
import { I18nService, TranslatePipe } from '../core/i18n.service';
import { ThemeService } from '../core/theme.service';
import { NotificationItem } from '../core/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, DatePipe],
  template: `
    <nav class="navbar navbar-expand-lg sticky-top">
      <div class="container">
        <a class="navbar-brand navbar-brand-samsary" routerLink="/">
          <span class="navbar-brand-icon"><i class="bi bi-buildings-fill"></i></span>
          <span class="navbar-brand-text">{{ siteName() }}</span>
        </a>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div id="nav" class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><a class="nav-link" routerLink="/listings" routerLinkActive="active">{{ 'nav.browse' | t }}</a></li>
            @if (auth.isAuthenticated()) {
              <li class="nav-item"><a class="nav-link" routerLink="/my-listings" routerLinkActive="active">{{ 'nav.myListings' | t }}</a></li>
              <li class="nav-item"><a class="nav-link" routerLink="/chat" routerLinkActive="active">
                <i class="bi bi-chat-dots me-1"></i>{{ 'nav.chat' | t }}
              </a></li>
            }
            @if (auth.isAdmin()) {
              <li class="nav-item"><a class="nav-link fw-semibold" routerLink="/admin" routerLinkActive="active">
                <i class="bi bi-speedometer2 me-1"></i>{{ 'nav.admin' | t }}
              </a></li>
            }
          </ul>
          <ul class="navbar-nav align-items-center gap-2">
            <li class="nav-item">
              <div class="lang-switch" role="group" [attr.aria-label]="'nav.language' | t">
                <button type="button" [class.active]="i18n.lang() === 'en'" (click)="i18n.setLang('en')">EN</button>
                <button type="button" [class.active]="i18n.lang() === 'ar'" (click)="i18n.setLang('ar')">ع</button>
              </div>
            </li>
            @if (auth.isAuthenticated()) {
              <li class="nav-item">
                <a routerLink="/listings/new" class="btn btn-samsary btn-sm">
                  <i class="bi bi-plus-lg"></i> {{ 'nav.post' | t }}
                </a>
              </li>
              <li class="nav-item position-relative">
                <button type="button" class="btn nav-link position-relative notif-btn"
                        (click)="toggleNotif()" [attr.aria-label]="'nav.notifications' | t">
                  <i class="bi bi-bell fs-5"></i>
                  @if (unread() > 0) { <span class="notif-dot">{{ unread() > 9 ? '9+' : unread() }}</span> }
                </button>

                <!-- Notifications panel -->
                @if (notifOpen()) {
                  <div class="notif-backdrop" (click)="notifOpen.set(false)"></div>
                  <div class="notif-panel shadow-lg">
                    <div class="notif-panel-head d-flex align-items-center justify-content-between">
                      <span class="fw-bold small">{{ 'notif.title' | t }}</span>
                      <div class="d-flex gap-2 align-items-center">
                        @if (notifItems().some(n => !n.isRead)) {
                          <button class="btn btn-link btn-sm p-0 text-primary" (click)="markAllNotif()">
                            <i class="bi bi-check2-all me-1"></i>{{ 'notif.markAll' | t }}
                          </button>
                        }
                        <button class="btn-close btn-close-sm" (click)="notifOpen.set(false)"></button>
                      </div>
                    </div>
                    <div class="notif-panel-body">
                      @for (n of notifItems(); track n.id) {
                        <div class="notif-row" [class.unread]="!n.isRead" (click)="openNotif(n)">
                          <div class="notif-row-icon">
                            <i class="bi"
                               [class.bi-check2-circle]="n.type===1" [class.text-success]="n.type===1"
                               [class.bi-x-circle]="n.type===2"      [class.text-danger]="n.type===2"
                               [class.bi-chat-dots-fill]="n.type===3" [class.text-primary]="n.type===3"
                               [class.bi-shield-lock-fill]="n.type===4" [class.text-warning]="n.type===4"
                               [class.bi-megaphone-fill]="n.type===5||n.type===6"
                               [class.bi-bell-fill]="n.type===0||n.type===7||n.type===8||n.type===9"
                               [class.text-secondary]="n.type===0"></i>
                          </div>
                          <div class="notif-row-body">
                            <div class="notif-row-title">{{ n.title }}</div>
                            <div class="notif-row-msg">{{ n.message }}</div>
                            <div class="notif-row-time">{{ n.createdAt | date:'shortTime' }}</div>
                          </div>
                          @if (!n.isRead) {
                            <div class="notif-unread-dot"></div>
                          }
                        </div>
                      } @empty {
                        <div class="text-center text-muted py-4 small">
                          <i class="bi bi-bell-slash d-block fs-2 mb-2 opacity-25"></i>
                          {{ 'notif.empty' | t }}
                        </div>
                      }
                    </div>
                    <a routerLink="/notifications" class="notif-panel-footer" (click)="notifOpen.set(false)">
                      {{ i18n.lang() === 'ar' ? 'عرض كل الإشعارات' : 'View all notifications' }}
                      <i class="bi bi-arrow-right ms-1"></i>
                    </a>
                  </div>
                }
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle user-menu-toggle d-flex align-items-center" data-bs-toggle="dropdown">
                  @if (auth.user()?.avatarUrl) {
                    <img [src]="auth.user()!.avatarUrl" class="rounded-circle user-avatar" width="28" height="28" alt="">
                  } @else {
                    <i class="bi bi-person-circle fs-4 user-avatar"></i>
                  }
                  <span class="user-name d-none d-md-inline" dir="ltr" lang="en">{{ auth.user()?.displayName }}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" routerLink="/profile"><i class="bi bi-person me-2"></i>{{ 'nav.profile' | t }}</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><button class="dropdown-item text-danger" (click)="logout()"><i class="bi bi-box-arrow-right me-2"></i>{{ 'nav.signOut' | t }}</button></li>
                </ul>
              </li>
            } @else {
              <li class="nav-item">
                <button type="button" class="btn btn-outline-primary btn-sm" (click)="authModal.open('login')">{{ 'nav.signIn' | t }}</button>
              </li>
              <li class="nav-item">
                <button type="button" class="btn btn-samsary btn-sm" (click)="authModal.open('register')">{{ 'nav.signUp' | t }}</button>
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .notif-btn { background: none; border: none; padding: .375rem .5rem; color: inherit; }
    .notif-btn:hover { opacity: .75; }
    .notif-dot {
      position: absolute; top: 2px; inset-inline-end: 0;
      min-width: 16px; height: 16px; border-radius: 999px; padding: 0 3px;
      background: #dc3545; color: #fff; font-size: .6rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff;
    }
    .notif-backdrop {
      position: fixed; inset: 0; z-index: 1040;
    }
    .notif-panel {
      position: absolute; inset-inline-end: 0; top: calc(100% + 8px); z-index: 1041;
      width: 340px; max-width: 95vw;
      background: var(--bs-body-bg); border-radius: 1rem;
      border: 1px solid var(--bs-border-color); overflow: hidden;
    }
    .notif-panel-head {
      padding: .75rem 1rem; border-bottom: 1px solid var(--bs-border-color);
      background: var(--bs-tertiary-bg);
    }
    .notif-panel-body { max-height: 360px; overflow-y: auto; }
    .notif-row {
      display: flex; align-items: flex-start; gap: .65rem;
      padding: .7rem 1rem; cursor: pointer; border-bottom: 1px solid var(--bs-border-color);
      transition: background .12s;
    }
    .notif-row:hover { background: var(--bs-tertiary-bg); }
    .notif-row.unread { background: rgba(var(--bs-primary-rgb), .05); }
    .notif-row-icon { font-size: 1.1rem; flex-shrink: 0; padding-top: 2px; }
    .notif-row-body { flex: 1; min-width: 0; }
    .notif-row-title { font-size: .82rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-row-msg   { font-size: .75rem; color: var(--bs-secondary-color); margin-top: 1px;
                       white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-row-time  { font-size: .68rem; color: var(--bs-secondary-color); margin-top: 2px; }
    .notif-unread-dot {
      width: 7px; height: 7px; border-radius: 50%; background: var(--bs-primary);
      flex-shrink: 0; margin-top: 6px;
    }
    .notif-panel-footer {
      display: block; text-align: center; padding: .6rem;
      font-size: .8rem; color: var(--bs-primary); text-decoration: none;
      border-top: 1px solid var(--bs-border-color); background: var(--bs-tertiary-bg);
    }
    .notif-panel-footer:hover { text-decoration: underline; }
  `]
})
export class NavbarComponent implements OnInit {
  auth = inject(AuthService);
  authModal = inject(AuthModalService);
  i18n = inject(I18nService);
  private theme = inject(ThemeService);
  private rt = inject(RealtimeService);
  private api = inject(ApiService);
  private router = inject(Router);

  notifOpen = signal(false);
  notifItems = signal<NotificationItem[]>([]);

  siteName() {
    const t = this.theme.adminTheme();
    if (!t) return 'سمسارة';
    return this.i18n.lang() === 'ar'
      ? (t.siteNameAr || t.siteName || 'سمسارة')
      : (t.siteName || 'Samsary');
  }
  unread = (() => {
    const s: { v: number } = { v: 0 };
    return Object.assign(() => s.v, { set: (n: number) => (s.v = n) });
  })();

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.rt.connect();
        this.refreshUnread();
      } else {
        this.rt.disconnect();
        (this.unread as any).set(0);
      }
    });
    effect(() => {
      const _ = this.rt.unreadDelta();
      if (this.auth.isAuthenticated()) this.refreshUnread();
    });
  }

  ngOnInit() { if (this.auth.isAuthenticated()) this.refreshUnread(); }

  private refreshUnread() {
    this.api.notifications(true).subscribe({
      next: r => (this.unread as any).set(r.unread),
      error: () => { }
    });
  }

  toggleNotif() {
    if (this.notifOpen()) { this.notifOpen.set(false); return; }
    this.notifOpen.set(true);
    this.api.notifications().subscribe(r => this.notifItems.set(r.items.slice(0, 10)));
  }

  openNotif(n: NotificationItem) {
    if (!n.isRead) {
      this.api.markNotification(n.id).subscribe(() => {
        this.notifItems.update(list => list.map(x => x.id === n.id ? { ...x, isRead: true } : x));
        (this.unread as any).set(Math.max(0, this.unread() - 1));
      });
    }
    this.notifOpen.set(false);
    if (n.link) this.router.navigateByUrl(n.link);
  }

  markAllNotif() {
    this.api.markAllRead().subscribe(() => {
      this.notifItems.update(list => list.map(n => ({ ...n, isRead: true })));
      (this.unread as any).set(0);
    });
  }

  logout() { this.auth.logout(); }
}
