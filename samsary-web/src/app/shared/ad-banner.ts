import { Component, Input, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Advertisement } from '../core/models';
import { ApiService } from '../core/api.service';
import { TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [TranslatePipe, CurrencyPipe],
  template: `
    @if (ads().length > 0) {
      <div class="ad-banner-wrap">
        <div class="ad-label">{{ 'ad.sponsored' | t }}</div>

        @let ad = current();
        <!-- ── Listing-promo card ───────────────────────────────────────── -->
        @if (ad.listingId) {
          <a class="ad-listing-card"
             [href]="ad.linkUrl || ('/listings/' + ad.listingId)"
             target="_blank" rel="noopener sponsored"
             (click)="onClick(ad)">
            <div class="ad-listing-img-wrap">
              <img [src]="ad.listingImageUrl || ad.imageUrl" [alt]="ad.listingTitle || ad.title"
                   class="ad-listing-img" loading="lazy" />
              <span class="ad-listing-badge">{{ 'ad.featuredListing' | t }}</span>
            </div>
            <div class="ad-listing-info">
              <div class="ad-listing-title">{{ ad.listingTitle || ad.title }}</div>
              @if (ad.listingPrice != null) {
                <div class="ad-listing-price">
                  {{ ad.listingPrice | currency:(ad.listingCurrency || 'USD'):'symbol':'1.0-0' }}
                </div>
              }
              @if (ad.listingLocation) {
                <div class="ad-listing-loc"><i class="bi bi-geo-alt-fill me-1"></i>{{ ad.listingLocation }}</div>
              }
              @if (ad.description) {
                <div class="ad-listing-desc">{{ ad.description }}</div>
              }
              <span class="ad-cta">{{ 'ad.viewListing' | t }} →</span>
            </div>
          </a>

        <!-- ── Generic image banner ───────────────────────────────────── -->
        } @else {
          <a class="ad-banner-link"
             [href]="ad.linkUrl || '#'"
             [target]="ad.linkUrl ? '_blank' : '_self'"
             rel="noopener sponsored"
             (click)="onClick(ad)">
            <div class="ad-banner-inner">
              <img [src]="ad.imageUrl" [alt]="ad.title"
                   class="ad-banner-img" loading="lazy" />
              <div class="ad-banner-overlay">
                <span class="ad-banner-title">{{ ad.title }}</span>
                @if (ad.description) {
                  <span class="ad-banner-desc">{{ ad.description }}</span>
                }
                <span class="ad-cta">{{ 'ad.learnMore' | t }} →</span>
              </div>
            </div>
          </a>
        }

        @if (ads().length > 1) {
          <div class="ad-dots">
            @for (a of ads(); track a.id; let i = $index) {
              <button class="ad-dot" [class.active]="i === activeIndex()"
                      (click)="goTo(i)" [attr.aria-label]="'Ad ' + (i+1)"></button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .ad-banner-wrap {
      position: relative;
      margin-bottom: 1.5rem;
      border-radius: 1.25rem;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(236,72,153,.18);
    }
    .ad-label {
      position: absolute; top: 10px; inset-inline-end: 12px; z-index: 3;
      background: rgba(0,0,0,.45); color: #fff; font-size: .65rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em;
      padding: 2px 8px; border-radius: 999px;
    }
    /* Generic banner */
    .ad-banner-link { display: block; text-decoration: none; }
    .ad-banner-inner { position: relative; aspect-ratio: 728/90; }
    @media (max-width: 600px) { .ad-banner-inner { aspect-ratio: 320/100; } }
    .ad-banner-img {
      width: 100%; height: 100%; object-fit: cover; display: block;
      transition: transform .6s ease;
    }
    .ad-banner-link:hover .ad-banner-img { transform: scale(1.03); }
    .ad-banner-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to inline-end, rgba(0,0,0,.65) 0%, transparent 60%);
      display: flex; flex-direction: column; justify-content: center;
      padding: 1.25rem 1.5rem; gap: .25rem;
    }
    .ad-banner-title { color: #fff; font-weight: 700; font-size: 1rem; text-shadow: 0 1px 4px rgba(0,0,0,.5); }
    .ad-banner-desc  { color: rgba(255,255,255,.85); font-size: .8rem; }
    /* Listing promo card */
    .ad-listing-card {
      display: flex; text-decoration: none; color: inherit;
      min-height: 120px;
      background: var(--bs-body-bg);
    }
    .ad-listing-card:hover .ad-listing-img { transform: scale(1.04); }
    .ad-listing-img-wrap { position: relative; flex: 0 0 200px; overflow: hidden; }
    @media (max-width: 600px) { .ad-listing-img-wrap { flex: 0 0 110px; } }
    .ad-listing-img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
    .ad-listing-badge {
      position: absolute; bottom: 8px; inset-inline-start: 8px;
      background: linear-gradient(135deg,#ec4899,#a855f7);
      color: #fff; font-size: .65rem; font-weight: 700;
      padding: 2px 8px; border-radius: 999px; text-transform: uppercase;
    }
    .ad-listing-info {
      flex: 1; padding: 1rem 1.25rem;
      display: flex; flex-direction: column; gap: .3rem;
    }
    .ad-listing-title { font-weight: 700; font-size: 1rem; color: var(--bs-emphasis-color); }
    .ad-listing-price { font-weight: 700; font-size: 1.15rem; color: #ec4899; }
    .ad-listing-loc   { font-size: .8rem; color: var(--bs-secondary-color); }
    .ad-listing-desc  { font-size: .8rem; color: var(--bs-secondary-color); margin-top: .15rem; }
    /* Shared CTA */
    .ad-cta {
      display: inline-block; margin-top: .4rem;
      background: linear-gradient(135deg,#ec4899,#a855f7);
      color: #fff; font-size: .75rem; font-weight: 700;
      padding: .25rem .75rem; border-radius: 999px; width: fit-content;
    }
    /* Dots */
    .ad-dots {
      display: flex; justify-content: center; gap: .4rem; padding: .5rem;
      background: rgba(0,0,0,.04);
    }
    .ad-dot {
      width: 8px; height: 8px; border-radius: 50%; border: none;
      background: rgba(236,72,153,.3); cursor: pointer; padding: 0;
      transition: background .25s ease, transform .25s ease;
    }
    .ad-dot.active { background: #ec4899; transform: scale(1.3); }
  `]
})
export class AdBannerComponent implements OnInit, OnDestroy {
  @Input() placement = 'banner';

  private api = inject(ApiService);
  ads = signal<Advertisement[]>([]);
  activeIndex = signal(0);
  private timer: any;

  current = () => this.ads()[this.activeIndex()] ?? {} as Advertisement;

  ngOnInit() {
    this.api.activeAds(this.placement).subscribe(list => {
      this.ads.set(list);
      if (list.length > 1) {
        this.timer = setInterval(() => {
          this.activeIndex.update(i => (i + 1) % this.ads().length);
        }, 5000);
      }
    });
  }

  ngOnDestroy() { clearInterval(this.timer); }
  goTo(i: number) { this.activeIndex.set(i); }
  onClick(ad: Advertisement) { this.api.trackAdClick(ad.id).subscribe(); }
}

