import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  template: `
    <div class="row g-3">
      <aside class="col-md-3 col-lg-2">
        <div class="card border-0 shadow-sm">
          <div class="card-header border-0 py-3" style="background:var(--samsary-gradient)">
            <div class="text-white fw-bold d-flex align-items-center gap-2">
              <i class="bi bi-grid-3x3-gap-fill"></i> {{ 'nav.admin' | t }}
            </div>
          </div>
          <div class="list-group list-group-flush">
            <a routerLink="dashboard" routerLinkActive="active" class="list-group-item list-group-item-action border-0 py-3">
              <i class="bi bi-speedometer2 me-2"></i>{{ 'admin.dashboard' | t }}
            </a>
            <a routerLink="moderate" routerLinkActive="active" class="list-group-item list-group-item-action border-0 py-3">
              <i class="bi bi-shield-check me-2"></i>{{ 'admin.moderate' | t }}
            </a>
            <a routerLink="users" routerLinkActive="active" class="list-group-item list-group-item-action border-0 py-3">
              <i class="bi bi-people me-2"></i>{{ 'admin.users' | t }}
            </a>
            <a routerLink="moderators" routerLinkActive="active" class="list-group-item list-group-item-action border-0 py-3">
              <i class="bi bi-person-gear me-2"></i>{{ 'admin.moderators' | t }}
            </a>
            <a routerLink="ads" routerLinkActive="active" class="list-group-item list-group-item-action border-0 py-3">
              <i class="bi bi-megaphone me-2"></i>{{ 'admin.ads' | t }}
            </a>
            <a routerLink="reviews" routerLinkActive="active" class="list-group-item list-group-item-action border-0 py-3">
              <i class="bi bi-star-half me-2"></i>{{ 'admin.reviews' | t }}
            </a>
            <a routerLink="logs" routerLinkActive="active" class="list-group-item list-group-item-action border-0 py-3">
              <i class="bi bi-journal-text me-2"></i>{{ 'admin.logs' | t }}
            </a>
            <a routerLink="theme" routerLinkActive="active" class="list-group-item list-group-item-action border-0 py-3">
              <i class="bi bi-palette me-2"></i>{{ 'admin.theme' | t }}
            </a>
          </div>
        </div>
      </aside>
      <section class="col-md-9 col-lg-10 animate-fade-up">
        <router-outlet />
      </section>
    </div>
  `
})
export class AdminShellComponent {}
