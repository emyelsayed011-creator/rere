import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar';
import { ConfirmDialogComponent } from './shared/confirm-dialog';
import { AuthModalComponent } from './shared/auth-modal';
import { AuthService } from './core/auth.service';
import { I18nService, TranslatePipe } from './core/i18n.service';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ConfirmDialogComponent, AuthModalComponent, TranslatePipe],
  template: `
    <div class="d-flex flex-column min-vh-100">
      <app-navbar />
      <main class="container py-4 flex-grow-1">
        <router-outlet />
      </main>
      <footer class="app-footer text-center py-4 mt-auto border-top">
        <div class="container">
          <div class="navbar-brand-samsary mb-1">{{ siteName() }}</div>
          <div class="text-muted small">© {{ year }} Samsary · {{ 'app.tagline' | t }}</div>
        </div>
      </footer>
    </div>
    <app-confirm-dialog />
    <app-auth-modal />
  `
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private i18n = inject(I18nService);
  readonly theme = inject(ThemeService);
  year = new Date().getFullYear();

  siteName() {
    const t = this.theme.adminTheme();
    if (!t) return 'سمسارة';
    return this.i18n.lang() === 'ar'
      ? (t.siteNameAr || t.siteName || 'سمسارة')
      : (t.siteName || 'Samsary');
  }

  ngOnInit() {
    this.auth.bootstrap();
    this.theme.loadAdminTheme();
    // Reset any stored dark mode — site defaults to light
    if (localStorage.getItem('samsary.theme') === 'dark') {
      localStorage.removeItem('samsary.theme');
      this.theme.setTheme('light');
    }
  }
}
