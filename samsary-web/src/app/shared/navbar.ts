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
    <nav class="navbar sticky-top">
      <div class="container">
        <a class="navbar-brand navbar-brand-samsary" routerLink="/">
          <span class="navbar-brand-icon">
            <!-- House + key: broker/marketplace concept -->
            <svg viewBox="0 0 36 36" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 4 L3 17 h4 v13 h7 v-7 h8 v7 h7 V17 h4 Z" opacity=".95"/>
              <circle cx="18" cy="22" r="2.2"/>
              <rect x="16.8" y="24" width="2.4" height="4" rx="1"/>
            </svg>
          </span>
          <span class="navbar-brand-text">{{ siteName() }}</span>
        </a>

        <!-- Desktop nav links (hidden on mobile) -->
        <div class="d-none d-lg-flex align-items-center flex-grow-1 ms-3">
          <ul class="navbar-nav me-auto flex-row gap-1">
            <li class="nav-item"><a class="nav-link" routerLink="/listings" routerLinkActive="active">{{ 'nav.browse' | t }}</a></li>
            @if (auth.isAuthenticated()) {
              <li class="nav-item"><a class="nav-link" routerLink="/my-listings" routerLinkActive="active">{{ 'nav.myListings' | t }}</a></li>
            }
            @if (auth.isAdmin()) {
              <li class="nav-item"><a class="nav-link fw-semibold" routerLink="/admin" routerLinkActive="active">
                <i class="bi bi-speedometer2 me-1"></i>{{ 'nav.admin' | t }}
              </a></li>
            }
          </ul>
          <ul class="navbar-nav align-items-center gap-1 flex-row">
            <li class="nav-item">
              <div class="lang-switch" role="group">
                <button type="button" [class.active]="i18n.lang() === 'en'" (click)="i18n.setLang('en')">EN</button>
                <button type="button" [class.active]="i18n.lang() === 'ar'" (click)="i18n.setLang('ar')">ع</button>
              </div>
            </li>
            @if (auth.isAuthenticated()) {
              <li class="nav-item">
                <a routerLink="/listings/new" class="btn btn-samsary btn-sm px-3">
                  <i class="bi bi-plus-lg me-1"></i>{{ 'nav.post' | t }}
                </a>
              </li>
              <!-- Chat icon button (same row as bell) -->
              <li class="nav-item">
                <a class="icon-btn position-relative" routerLink="/chat" [title]="'nav.chat' | t">
                  <i class="bi bi-chat-dots fs-5"></i>
                  @if (unreadChats() > 0) {
                    <span class="notif-dot">{{ unreadChats() > 9 ? '9+' : unreadChats() }}</span>
                  }
                </a>
              </li>
              <!-- Bell -->
              <li class="nav-item position-relative">
                <button type="button" class="icon-btn position-relative" (click)="toggleNotif()">
                  <i class="bi bi-bell fs-5"></i>
                  @if (unread() > 0) { <span class="notif-dot">{{ unread() > 9 ? '9+' : unread() }}</span> }
                </button>
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
                        <div class="notif-row" [class.unread]="!n.isRead" [class.has-link]="!!n.link" (click)="openNotif(n)">
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
                          <div class="d-flex align-items-center gap-1 flex-shrink-0">
                            @if (!n.isRead) { <div class="notif-unread-dot"></div> }
                            @if (n.link) { <i class="bi bi-chevron-right text-muted" style="font-size:.65rem;opacity:.5"></i> }
                          </div>
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
              <!-- Avatar -->
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle avatar-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                  @if (auth.user()?.avatarUrl) {
                    <img [src]="auth.user()!.avatarUrl" class="rounded-circle user-avatar" width="30" height="30" alt="">
                  } @else {
                    <div class="avatar-placeholder"><i class="bi bi-person-fill"></i></div>
                  }
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-1">
                  <li class="px-3 py-2 border-bottom">
                    <div class="fw-semibold small">{{ auth.user()?.displayName }}</div>
                    <div class="text-muted" style="font-size:.72rem">{{ auth.user()?.email }}</div>
                  </li>
                  <li><a class="dropdown-item py-2" routerLink="/profile"><i class="bi bi-person me-2 text-primary"></i>{{ 'nav.profile' | t }}</a></li>
                  <li><a class="dropdown-item py-2" routerLink="/my-listings"><i class="bi bi-collection me-2 text-primary"></i>{{ 'nav.myListings' | t }}</a></li>
                  <li><hr class="dropdown-divider my-1"></li>
                  <li><button class="dropdown-item py-2 text-danger" (click)="logout()"><i class="bi bi-box-arrow-right me-2"></i>{{ 'nav.signOut' | t }}</button></li>
                </ul>
              </li>
            } @else {
              <li class="nav-item"><button class="btn btn-outline-primary btn-sm px-3" (click)="authModal.open('login')">{{ 'nav.signIn' | t }}</button></li>
              <li class="nav-item"><button class="btn btn-samsary btn-sm px-3" (click)="authModal.open('register')">{{ 'nav.signUp' | t }}</button></li>
            }
          </ul>
        </div>

        <!-- Mobile right actions + hamburger -->
        <div class="d-flex d-lg-none align-items-center gap-2 ms-auto">
          @if (auth.isAuthenticated()) {
            <a routerLink="/listings/new" class="btn btn-samsary btn-sm px-2">
              <i class="bi bi-plus-lg"></i>
            </a>
            <a class="nav-link position-relative p-1" routerLink="/chat">
              <i class="bi bi-chat-dots fs-5"></i>
              @if (unreadChats() > 0) { <span class="notif-dot" style="top:0;inset-inline-end:0">{{ unreadChats() > 9 ? '9+' : unreadChats() }}</span> }
            </a>
            <button type="button" class="btn nav-link position-relative notif-btn p-1" (click)="toggleNotif()">
              <i class="bi bi-bell fs-5"></i>
              @if (unread() > 0) { <span class="notif-dot">{{ unread() > 9 ? '9+' : unread() }}</span> }
            </button>
            @if (notifOpen()) {
              <div class="notif-backdrop" (click)="notifOpen.set(false)"></div>
              <div class="notif-panel shadow-lg" style="inset-inline-end:0;top:calc(100% + 8px)">
                <div class="notif-panel-head d-flex align-items-center justify-content-between">
                  <span class="fw-bold small">{{ 'notif.title' | t }}</span>
                  <button class="btn-close btn-close-sm" (click)="notifOpen.set(false)"></button>
                </div>
                <div class="notif-panel-body">
                  @for (n of notifItems(); track n.id) {
                    <div class="notif-row" [class.unread]="!n.isRead" (click)="openNotif(n)">
                      <div class="notif-row-body">
                        <div class="notif-row-title">{{ n.title }}</div>
                        <div class="notif-row-msg">{{ n.message }}</div>
                      </div>
                      @if (!n.isRead) { <div class="notif-unread-dot"></div> }
                    </div>
                  } @empty {
                    <div class="text-center text-muted py-3 small">{{ 'notif.empty' | t }}</div>
                  }
                </div>
                <a routerLink="/notifications" class="notif-panel-footer" (click)="notifOpen.set(false)">{{ i18n.lang() === 'ar' ? 'عرض الكل' : 'View all' }}</a>
              </div>
            }
          }
          <button class="hamburger-btn" (click)="mobileOpen.set(true)" [attr.aria-label]="'nav.menu' | t">
            <i class="bi bi-list fs-4"></i>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile side drawer -->
    @if (mobileOpen()) {
      <div class="drawer-backdrop" (click)="mobileOpen.set(false)"></div>
      <div class="drawer" [class.open]="mobileOpen()">
        <div class="drawer-header">
          <span class="navbar-brand-samsary">
            <span class="navbar-brand-icon"><i class="bi bi-buildings-fill"></i></span>
            <span class="navbar-brand-text">{{ siteName() }}</span>
          </span>
          <button class="btn-close" (click)="mobileOpen.set(false)"></button>
        </div>
        <div class="drawer-body">
          <a class="drawer-link" routerLink="/listings" routerLinkActive="drawer-active" (click)="mobileOpen.set(false)">
            <i class="bi bi-search me-2"></i>{{ 'nav.browse' | t }}
          </a>
          @if (auth.isAuthenticated()) {
            <a class="drawer-link" routerLink="/my-listings" routerLinkActive="drawer-active" (click)="mobileOpen.set(false)">
              <i class="bi bi-collection me-2"></i>{{ 'nav.myListings' | t }}
            </a>
            <a class="drawer-link position-relative" routerLink="/chat" routerLinkActive="drawer-active" (click)="mobileOpen.set(false)">
              <i class="bi bi-chat-dots me-2"></i>{{ 'nav.chat' | t }}
              @if (unreadChats() > 0) {
                <span class="badge bg-danger ms-2 rounded-pill">{{ unreadChats() }}</span>
              }
            </a>
            <a class="drawer-link" routerLink="/notifications" routerLinkActive="drawer-active" (click)="mobileOpen.set(false)">
              <i class="bi bi-bell me-2"></i>{{ 'nav.notifications' | t }}
              @if (unread() > 0) { <span class="badge bg-danger ms-2 rounded-pill">{{ unread() }}</span> }
            </a>
            <a class="drawer-link" routerLink="/profile" routerLinkActive="drawer-active" (click)="mobileOpen.set(false)">
              <i class="bi bi-person me-2"></i>{{ 'nav.profile' | t }}
            </a>
          }
          @if (auth.isAdmin()) {
            <hr class="my-2">
            <a class="drawer-link fw-semibold" routerLink="/admin" routerLinkActive="drawer-active" (click)="mobileOpen.set(false)">
              <i class="bi bi-speedometer2 me-2"></i>{{ 'nav.admin' | t }}
            </a>
          }
          <hr class="my-3">
          <div class="d-flex gap-2 mb-3">
            <button class="btn btn-sm flex-grow-1" [class.btn-primary]="i18n.lang()==='en'" [class.btn-outline-secondary]="i18n.lang()!=='en'" (click)="i18n.setLang('en')">English</button>
            <button class="btn btn-sm flex-grow-1" [class.btn-primary]="i18n.lang()==='ar'" [class.btn-outline-secondary]="i18n.lang()!=='ar'" (click)="i18n.setLang('ar')">العربية</button>
          </div>
          @if (auth.isAuthenticated()) {
            <button class="btn btn-outline-danger w-100" (click)="logout(); mobileOpen.set(false)">
              <i class="bi bi-box-arrow-right me-2"></i>{{ 'nav.signOut' | t }}
            </button>
          } @else {
            <button class="btn btn-outline-primary w-100 mb-2" (click)="authModal.open('login'); mobileOpen.set(false)">{{ 'nav.signIn' | t }}</button>
            <button class="btn btn-samsary w-100" (click)="authModal.open('register'); mobileOpen.set(false)">{{ 'nav.signUp' | t }}</button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .notif-btn { background: none; border: none; padding: .375rem .5rem; color: inherit; }
    .notif-btn:hover { opacity: .75; }
    /* Unified icon button: chat + bell */
    .icon-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 999px;
      background: none; border: none; color: var(--bs-body-color);
      cursor: pointer; text-decoration: none; transition: background .15s;
    }
    .icon-btn:hover { background: rgba(var(--samsary-primary-rgb), .08); color: var(--samsary-primary); }
    /* Avatar */
    .avatar-toggle { text-decoration: none !important; }
    .avatar-placeholder {
      width: 30px; height: 30px; border-radius: 50%;
      background: var(--samsary-gradient); color: #fff;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: .95rem; flex-shrink: 0;
    }
    .notif-dot {
      position: absolute; top: 2px; inset-inline-end: 0;
      min-width: 16px; height: 16px; border-radius: 999px; padding: 0 3px;
      background: #dc3545; color: #fff; font-size: .6rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff;
    }
    .notif-backdrop { position: fixed; inset: 0; z-index: 1040; }
    .notif-panel {
      position: absolute; inset-inline-end: 0; top: calc(100% + 8px); z-index: 1041;
      width: 340px; max-width: 95vw;
      background: var(--bs-body-bg); border-radius: 1rem;
      border: 1px solid var(--bs-border-color); overflow: hidden;
    }
    .notif-panel-head { padding: .75rem 1rem; border-bottom: 1px solid var(--bs-border-color); background: var(--bs-tertiary-bg); }
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
    .notif-row-msg   { font-size: .75rem; color: var(--bs-secondary-color); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-row-time  { font-size: .68rem; color: var(--bs-secondary-color); margin-top: 2px; }
    .notif-unread-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--bs-primary); flex-shrink: 0; margin-top: 6px; }
    .notif-panel-footer { display: block; text-align: center; padding: .6rem; font-size: .8rem; color: var(--bs-primary); text-decoration: none; border-top: 1px solid var(--bs-border-color); background: var(--bs-tertiary-bg); }
    .notif-panel-footer:hover { text-decoration: underline; }
    /* Mobile hamburger */
    .hamburger-btn { background: none; border: 1px solid rgba(var(--samsary-primary-rgb),.2); border-radius: .5rem; padding: .25rem .55rem; color: var(--samsary-primary); cursor: pointer; }
    /* Ensure hamburger sits on the physical left side on small screens (regardless of RTL/LTR) */
    .navbar { position: relative; }
    @media (max-width: 991px) {
      .hamburger-btn { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); z-index: 1050; }
      .d-flex.d-lg-none { margin-inline-start: 0 !important; }
      /* Make room for the absolute-positioned hamburger so other icons don't overlap */
      .navbar .container { padding-left: 72px; }
      /* Add space between the mobile + button and the brand */
      .d-flex.d-lg-none > .btn.btn-samsary { margin-inline-start: 0.6rem; }
    }
    /* Side drawer */
    .drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1045; }
    .drawer {
      position: fixed; top: 0; inset-inline-start: 0; bottom: 0;
      width: 280px; max-width: 85vw; z-index: 1046;
      background: var(--bs-body-bg);
      display: flex; flex-direction: column;
      box-shadow: 4px 0 24px rgba(0,0,0,.18);
      transform: translateX(-100%);
      transition: transform .25s ease;
    }
    html[dir='rtl'] .drawer { inset-inline-start: auto; inset-inline-end: 0; transform: translateX(100%); }
    .drawer.open { transform: translateX(0); }
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid var(--bs-border-color);
      background: var(--bs-tertiary-bg);
    }
    .drawer-body { flex: 1; overflow-y: auto; padding: 1rem 1.25rem; }
    .drawer-link {
      display: flex; align-items: center; padding: .7rem .75rem;
      border-radius: .65rem; color: var(--bs-body-color); text-decoration: none;
      font-weight: 500; transition: background .12s; margin-bottom: .2rem;
    }
    .drawer-link:hover, .drawer-link.drawer-active {
      background: var(--samsary-soft); color: var(--samsary-primary);
    }
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
  unreadChats = signal(0);
  mobileOpen = signal(false);

  siteName() {
    const t = this.theme.adminTheme();
    if (!t) return 'سمسارة';
    return this.i18n.lang() === 'ar'
      ? (t.siteNameAr || t.siteName || 'سمسارلي')
      : (t.siteName || 'Samsarly');
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
        this.refreshChatUnread();
      } else {
        this.rt.disconnect();
        (this.unread as any).set(0);
        this.unreadChats.set(0);
      }
    });
    effect(() => {
      const _ = this.rt.unreadDelta();
      if (this.auth.isAuthenticated()) this.refreshUnread();
    });
    // Refresh chat badge whenever a new message arrives
    effect(() => {
      const _ = this.rt.latestMessage();
      if (this.auth.isAuthenticated()) this.refreshChatUnread();
    });
    // Refresh chat badge immediately when user reads a thread
    effect(() => {
      const _ = this.rt.chatThreadOpened();
      if (this.auth.isAuthenticated()) this.refreshChatUnread();
    });
  }

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.refreshUnread();
      this.refreshChatUnread();
    }
  }

  private refreshChatUnread() {
    this.api.conversations().subscribe({
      next: convs => this.unreadChats.set(convs.reduce((s, c) => s + (c.unreadCount ?? 0), 0)),
      error: () => {}
    });
  }

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
    this.router.navigateByUrl(n.link || '/notifications');
  }

  markAllNotif() {
    this.api.markAllRead().subscribe(() => {
      this.notifItems.update(list => list.map(n => ({ ...n, isRead: true })));
      (this.unread as any).set(0);
    });
  }

  logout() { this.auth.logout(); }
}
