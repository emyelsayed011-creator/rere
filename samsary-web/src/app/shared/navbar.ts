import { Component, inject, OnInit, effect } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { RealtimeService } from '../core/realtime.service';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top shadow-sm">
      <div class="container">
        <a class="navbar-brand navbar-brand-samsary text-primary" routerLink="/">
          <i class="bi bi-shop me-1"></i>Samsary
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div id="nav" class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><a class="nav-link" routerLink="/listings" routerLinkActive="active">Browse</a></li>
            @if (auth.isAuthenticated()) {
              <li class="nav-item"><a class="nav-link" routerLink="/my-listings" routerLinkActive="active">My Listings</a></li>
              <li class="nav-item"><a class="nav-link" routerLink="/chat" routerLinkActive="active">
                <i class="bi bi-chat-dots"></i> Chat
              </a></li>
            }
            @if (auth.isAdmin()) {
              <li class="nav-item"><a class="nav-link text-primary fw-semibold" routerLink="/admin" routerLinkActive="active">
                <i class="bi bi-speedometer2"></i> Admin
              </a></li>
            }
          </ul>
          <ul class="navbar-nav align-items-center gap-2">
            @if (auth.isAuthenticated()) {
              <li class="nav-item">
                <a routerLink="/listings/new" class="btn btn-samsary btn-sm">
                  <i class="bi bi-plus-lg"></i> Post
                </a>
              </li>
              <li class="nav-item position-relative">
                <a class="nav-link position-relative" routerLink="/notifications" title="Notifications">
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
                  <li><a class="dropdown-item" routerLink="/profile"><i class="bi bi-person me-2"></i>Profile</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><button class="dropdown-item text-danger" (click)="logout()"><i class="bi bi-box-arrow-right me-2"></i>Sign out</button></li>
                </ul>
              </li>
            } @else {
              <li class="nav-item"><a routerLink="/login" class="btn btn-outline-primary btn-sm">Sign in</a></li>
              <li class="nav-item"><a routerLink="/register" class="btn btn-samsary btn-sm">Sign up</a></li>
            }
          </ul>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  auth = inject(AuthService);
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
