import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main class="container py-4">
      <router-outlet />
    </main>
    <footer class="text-center text-muted small py-4">
      © {{ year }} Samsary
    </footer>
  `
})
export class App implements OnInit {
  private auth = inject(AuthService);
  year = new Date().getFullYear();
  ngOnInit() { this.auth.bootstrap(); }
}
