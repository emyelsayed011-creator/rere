import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  template: `
    <div class="row g-3">
      <aside class="col-md-3">
        <div class="card border-0 shadow-sm sidebar-admin">
          <div class="list-group list-group-flush p-2">
            <a routerLink="dashboard" routerLinkActive="active" class="list-group-item list-group-item-action">
              <i class="bi bi-speedometer2 me-2"></i>{{ 'admin.dashboard' | t }}
            </a>
            <a routerLink="moderate" routerLinkActive="active" class="list-group-item list-group-item-action">
              <i class="bi bi-shield-check me-2"></i>{{ 'admin.moderate' | t }}
            </a>
            <a routerLink="users" routerLinkActive="active" class="list-group-item list-group-item-action">
              <i class="bi bi-people me-2"></i>{{ 'admin.users' | t }}
            </a>
            <a routerLink="logs" routerLinkActive="active" class="list-group-item list-group-item-action">
              <i class="bi bi-journal-text me-2"></i>{{ 'admin.logs' | t }}
            </a>
          </div>
        </div>
      </aside>
      <section class="col-md-9 animate-fade-up">
        <router-outlet />
      </section>
    </div>
  `
})
export class AdminShellComponent {}
