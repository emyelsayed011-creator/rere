import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="d-flex align-items-center justify-content-center min-vh-100">
      <div class="card border-0 shadow-lg text-center p-5" style="max-width:420px">
        @if (loading()) {
          <span class="spinner-border text-primary mb-3"></span>
          <p class="text-muted">{{ 'auth.confirmingEmail' | t }}</p>
        } @else if (success()) {
          <i class="bi bi-envelope-check-fill text-success mb-3" style="font-size:3rem"></i>
          <h4 class="fw-bold mb-2">{{ 'auth.emailConfirmed' | t }}</h4>
          <p class="text-muted mb-4">{{ 'auth.emailConfirmedMsg' | t }}</p>
          <a routerLink="/login" class="btn btn-samsary">{{ 'auth.signIn' | t }}</a>
        } @else {
          <i class="bi bi-exclamation-circle-fill text-danger mb-3" style="font-size:3rem"></i>
          <h4 class="fw-bold mb-2">{{ 'auth.confirmFailed' | t }}</h4>
          <p class="text-muted mb-4">{{ error() }}</p>
          <a routerLink="/" class="btn btn-outline-primary">{{ 'home.browse' | t }}</a>
        }
      </div>
    </div>
  `
})
export class ConfirmEmailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  loading = signal(true);
  success = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    const userId = this.route.snapshot.queryParamMap.get('userId') ?? '';
    const token  = this.route.snapshot.queryParamMap.get('token')  ?? '';
    if (!userId || !token) { this.loading.set(false); this.error.set('Invalid confirmation link.'); return; }
    this.api.confirmEmail(userId, token).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); },
      error: e => { this.error.set(e?.error?.detail || 'Confirmation failed.'); this.loading.set(false); }
    });
  }
}
