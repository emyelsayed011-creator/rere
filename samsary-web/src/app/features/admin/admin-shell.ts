import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="row g-3">
      <aside class="col-md-3">
        <div class="card border-0 shadow-sm sidebar-admin">
          <div class="list-group list-group-flush">
            <a routerLink="dashboard" routerLinkActive="active" class="list-group-item list-group-item-action">
              <i class="bi bi-speedometer2 me-2"></i>Dashboard
            </a>
            <a routerLink="moderate" routerLinkActive="active" class="list-group-item list-group-item-action">
              <i class="bi bi-shield-check me-2"></i>Moderate listings
            </a>
            <a routerLink="users" routerLinkActive="active" class="list-group-item list-group-item-action">
              <i class="bi bi-people me-2"></i>Users
            </a>
            <a routerLink="logs" routerLinkActive="active" class="list-group-item list-group-item-action">
              <i class="bi bi-journal-text me-2"></i>System logs
            </a>
          </div>
        </div>
      </aside>
      <section class="col-md-9">
        <router-outlet />
      </section>
    </div>
  `
})
export class AdminShellComponent {}
