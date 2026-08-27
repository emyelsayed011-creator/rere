import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar';
import { AuthService } from './core/auth.service';
import { I18nService, TranslatePipe } from './core/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, TranslatePipe],
  template: `
    <app-navbar />
    <main class="container py-4">
      <router-outlet />
    </main>
    <footer class="app-footer text-center py-4 mt-5">
      <div class="navbar-brand-samsary mb-1">Samsary</div>
      <div class="text-muted small">© {{ year }} Samsary · {{ 'app.tagline' | t }}</div>
    </footer>
  `
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private i18n = inject(I18nService);
  year = new Date().getFullYear();
  ngOnInit() { this.auth.bootstrap(); }
}
