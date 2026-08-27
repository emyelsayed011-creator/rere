import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { RealtimeService } from '../../core/realtime.service';
import { Listing, MediaType } from '../../core/models';
import { I18nService, TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, TranslatePipe],
  template: `
    @if (l(); as l) {
      <div class="row g-4 animate-fade-up">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm overflow-hidden">
            @if (l.media.length) {
              <div id="carousel" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-inner">
                  @for (m of l.media; track m.id; let i = $index) {
                    <div class="carousel-item ratio ratio-16x9" [class.active]="i === 0">
                      @if (m.mediaType === MediaType.Image) {
                        <img [src]="m.url" class="object-fit-cover" alt="">
                      } @else {
                        <video [src]="m.url" controls [poster]="m.thumbnailUrl || ''"></video>
                      }
                    </div>
                  }
                </div>
                @if (l.media.length > 1) {
                  <button class="carousel-control-prev" type="button" data-bs-target="#carousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon"></span>
                  </button>
                  <button class="carousel-control-next" type="button" data-bs-target="#carousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon"></span>
                  </button>
                }
              </div>
            } @else {
              <div class="ratio ratio-16x9 d-flex align-items-center justify-content-center bg-light text-muted">
                <i class="bi bi-image fs-1"></i>
              </div>
            }
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h3 class="mb-1">{{ l.title }}</h3>
                  <div class="text-muted small">
                    <i class="bi bi-tag"></i> {{ l.category.name }} ·
                    <i class="bi bi-geo-alt"></i> {{ l.location || '—' }} ·
                    {{ 'detail.posted' | t }} {{ l.createdAt | date:'medium' }}
                  </div>
                </div>
                <span class="badge fs-6 text-white" [class.bg-success]="l.type===1" [class.bg-info]="l.type===2">
                  {{ (l.type === 1 ? 'common.sale' : 'common.rent') | t }}
                </span>
              </div>
              <h4 class="text-primary fw-bold mt-3 mb-3">{{ l.price | number }} {{ l.currency }}</h4>
              <p class="mb-0" style="white-space: pre-line;">{{ l.description }}</p>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="mb-3 fw-bold">{{ 'detail.seller' | t }}</h6>
              <div class="d-flex align-items-center mb-3">
                @if (l.ownerAvatarUrl) {
                  <img [src]="l.ownerAvatarUrl" class="rounded-circle me-2" width="48" height="48" alt="">
                } @else {
                  <i class="bi bi-person-circle fs-1 me-2 text-secondary"></i>
                }
                <div>
                  <div class="fw-semibold">{{ l.ownerDisplayName }}</div>
                </div>
              </div>

              @if (auth.isAuthenticated() && auth.user()?.id !== l.ownerId) {
                <textarea class="form-control mb-2" rows="3" [(ngModel)]="message" [placeholder]="'detail.writeMessage' | t"></textarea>
                <button class="btn btn-samsary w-100" (click)="sendMessage(l.ownerId, l.id)" [disabled]="!message.trim() || sending()">
                  @if (sending()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  <i class="bi bi-chat-dots me-1"></i> {{ 'detail.contactSeller' | t }}
                </button>
              } @else if (!auth.isAuthenticated()) {
                <a routerLink="/login" class="btn btn-outline-primary w-100">{{ 'detail.signInToContact' | t }}</a>
              }

              @if (auth.user()?.id === l.ownerId) {
                <a [routerLink]="['/listings', l.id, 'edit']" class="btn btn-outline-primary w-100 mb-2">
                  <i class="bi bi-pencil"></i> {{ 'common.edit' | t }}
                </a>
                <button class="btn btn-outline-danger w-100" (click)="remove(l.id)">
                  <i class="bi bi-trash"></i> {{ 'common.delete' | t }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    } @else { <div class="text-center text-muted py-5"><div class="spinner-border"></div></div> }
  `
})
export class ListingDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private rt = inject(RealtimeService);
  private i18n = inject(I18nService);
  auth = inject(AuthService);

  l = signal<Listing | null>(null);
  message = '';
  sending = signal(false);
  MediaType = MediaType;

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.api.listing(id).subscribe(x => this.l.set(x));
  }

  async sendMessage(receiverId: string, listingId: number) {
    if (!this.message.trim()) return;
    this.sending.set(true);
    try {
      await this.rt.sendMessage(receiverId, this.message.trim(), listingId);
      this.message = '';
      this.router.navigate(['/chat', receiverId]);
    } finally { this.sending.set(false); }
  }

  remove(id: number) {
    if (!confirm(this.i18n.t('detail.confirmDelete'))) return;
    this.api.deleteListing(id).subscribe(() => this.router.navigateByUrl('/my-listings'));
  }
}
