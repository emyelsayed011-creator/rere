import { Component, inject, OnInit, effect } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { RealtimeService } from '../core/realtime.service';
import { ApiService } from '../core/api.service';
import { I18nService, TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <nav class="navbar navbar-expand-lg sticky-top shadow-sm">
      <div class="container">
        <a class="navbar-brand navbar-brand-samsary" routerLink="/">
          <i class="bi bi-buildings-fill me-1"></i>سمسارة
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
                <a class="nav-link position-relative" routerLink="/notifications" [title]="'nav.notifications' | t">
                  <i class="bi bi-bell fs-5"></i>
                  @if (unread() > 0) { <span class="notif-dot"></span> }
                </a>
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle d-flex align-items-center" data-bs-toggle="dropdown">
                  @if (auth.user()?.avatarUrl) {
                    <img [src]="auth.user()!.avatarUrl" class="rounded-circle me-2" width="28" height="28" alt="">
                  } @else {
                    <i class="bi bi-person-circle fs-4 me-2"></i>
                  }
                  <span class="d-none d-md-inline">{{ auth.user()?.displayName }}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" routerLink="/profile"><i class="bi bi-person me-2"></i>{{ 'nav.profile' | t }}</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><button class="dropdown-item text-danger" (click)="logout()"><i class="bi bi-box-arrow-right me-2"></i>{{ 'nav.signOut' | t }}</button></li>
                </ul>
              </li>
            } @else {
              <li class="nav-item"><a routerLink="/login" class="btn btn-outline-primary btn-sm">{{ 'nav.signIn' | t }}</a></li>
              <li class="nav-item"><a routerLink="/register" class="btn btn-samsary btn-sm">{{ 'nav.signUp' | t }}</a></li>
            }
          </ul>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private rt = inject(RealtimeService);
  private api = inject(ApiService);
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
      error: () => {}
    });
  }

  logout() { this.auth.logout(); }
}
