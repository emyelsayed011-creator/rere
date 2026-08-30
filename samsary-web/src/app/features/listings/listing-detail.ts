// NOTE: this file requires the hls.js package.
//   npm install hls.js
//   npm install --save-dev @types/hls.js   (if not bundled with types already)

import { Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import Hls from 'hls.js';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { RealtimeService } from '../../core/realtime.service';
import { Listing, ListingStatus, MediaType } from '../../core/models';
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

            <!-- ── Media carousel ── -->
            @if (l.media.length) {
              <div class="media-carousel-wrap position-relative">
                <!-- Sold / Rented overlay banner -->
                @if (l.status === ListingStatus.Sold || l.status === ListingStatus.Rented) {
                  <div class="sold-ribbon">
                    <i class="bi bi-lock-fill me-1"></i>
                    {{ l.status === ListingStatus.Sold
                       ? (i18n.lang() === 'ar' ? 'تم البيع' : 'SOLD')
                       : (i18n.lang() === 'ar' ? 'تم التأجير' : 'RENTED') }}
                  </div>
                }

                <div id="listingCarousel" class="carousel slide" data-bs-ride="false">
                  <div class="carousel-inner">
                    @for (m of l.media; track m.id; let i = $index) {
                      <div class="carousel-item" [class.active]="i === 0">
                        <div class="carousel-media-frame">
                          @if (m.mediaType === MediaType.Image) {
                            <img [src]="m.url" class="carousel-media-img" [alt]="'Photo ' + (i+1)">
                          } @else {
                            <!--
                              No [src] bound directly. The real source (HLS .m3u8
                              or plain mp4) is attached lazily in the component via
                              hls.js the first time this slide becomes active — see
                              initVideoAt(). data-src just carries the intended URL.
                            -->
                            <video #vid
                                   [attr.data-media-id]="m.id"
                                   [attr.data-src]="videoUrl(m.url)"
                                   controls
                                   [poster]="m.thumbnailUrl || ''"
                                   class="carousel-media-img"
                                   preload="metadata"
                                   playsinline
                                   (play)="pauseOtherVideos($event)"></video>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  @if (l.media.length > 1) {
                    <button class="carousel-control-prev" type="button"
                            data-bs-target="#listingCarousel" data-bs-slide="prev">
                      <span class="carousel-control-prev-icon"></span>
                    </button>
                    <button class="carousel-control-next" type="button"
                            data-bs-target="#listingCarousel" data-bs-slide="next">
                      <span class="carousel-control-next-icon"></span>
                    </button>
                  }
                </div>

                <!-- Thumbnail strip -->
                @if (l.media.length > 1) {
                  <div class="thumb-strip">
                    @for (m of l.media; track m.id; let i = $index) {
                      <button class="thumb-item" type="button"
                              data-bs-target="#listingCarousel" [attr.data-bs-slide-to]="i"
                              [class.active]="i === 0">
                        @if (m.mediaType === MediaType.Image) {
                          <img [src]="m.thumbnailUrl || m.url" class="w-100 h-100 object-fit-cover" alt="">
                        } @else {
                          <div class="thumb-vid-placeholder">
                            <i class="bi bi-play-circle-fill"></i>
                          </div>
                        }
                        @if (m.mediaType === MediaType.Video) {
                          <span class="thumb-vid-badge"><i class="bi bi-play-fill"></i></span>
                        }
                      </button>
                    }
                  </div>
                }
              </div>

            } @else {
              <div class="d-flex align-items-center justify-content-center bg-light text-muted"
                   style="height:280px">
                <div class="text-center">
                  <i class="bi bi-image fs-1 d-block mb-2 opacity-25"></i>
                  <span class="small">{{ i18n.lang() === 'ar' ? 'لا توجد صور' : 'No images' }}</span>
                </div>
              </div>
            }

            <div class="card-body p-4">
              <!-- Rejection reason — only visible to owner -->
              @if (l.status === ListingStatus.Rejected && auth.user()?.id === l.ownerId) {
                <div class="alert alert-danger py-2 mb-3 d-flex align-items-start gap-2">
                  <i class="bi bi-x-circle-fill flex-shrink-0 mt-1"></i>
                  <div>
                    <div class="fw-semibold small">
                      {{ i18n.lang() === 'ar' ? 'تم رفض هذا الإعلان' : 'This listing was rejected' }}
                    </div>
                    @if (l.rejectionReason) {
                      <div class="small mt-1 opacity-85">
                        <strong>{{ i18n.lang() === 'ar' ? 'السبب:' : 'Reason:' }}</strong>
                        {{ l.rejectionReason }}
                      </div>
                    }
                    <a [routerLink]="['/listings', l.id, 'edit']" class="btn btn-sm btn-outline-danger mt-2">
                      <i class="bi bi-pencil me-1"></i>
                      {{ i18n.lang() === 'ar' ? 'تعديل وإعادة الإرسال' : 'Edit & resubmit' }}
                    </a>
                  </div>
                </div>
              }
              <!-- Title + type badge -->
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="flex-grow-1">
                  <h3 class="mb-1 fw-bold">{{ l.title }}</h3>
                  <div class="text-muted small d-flex flex-wrap gap-2 align-items-center">
                    <span><i class="bi bi-tag me-1"></i>{{ categoryName(l.category) }}</span>
                    @if (l.location) {
                      <span><i class="bi bi-geo-alt me-1"></i>{{ l.location }}</span>
                    }
                    <span><i class="bi bi-clock me-1"></i>{{ l.createdAt | date:'mediumDate' }}</span>
                  </div>
                </div>
                <span class="badge fs-6 ms-2 text-white" [class.bg-success]="l.type===1" [class.bg-info]="l.type===2">
                  {{ (l.type === 1 ? 'common.sale' : 'common.rent') | t }}
                </span>
              </div>

              <!-- Price row -->
              <div class="d-flex align-items-center gap-3 mt-3 mb-3">
                <h4 class="text-primary fw-bold mb-0">{{ l.price | number }} {{ l.currency }}</h4>
                @if (l.isNegotiable) {
                  <span class="badge bg-warning text-dark rounded-pill">
                    <i class="bi bi-chat-left-dots me-1"></i>
                    {{ i18n.lang() === 'ar' ? 'قابل للتفاوض' : 'Negotiable' }}
                  </span>
                }
                @if (l.status === ListingStatus.Sold) {
                  <span class="badge bg-danger rounded-pill">{{ i18n.lang() === 'ar' ? 'تم البيع' : 'Sold' }}</span>
                }
                @if (l.status === ListingStatus.Rented) {
                  <span class="badge bg-secondary rounded-pill">{{ i18n.lang() === 'ar' ? 'تم التأجير' : 'Rented' }}</span>
                }
              </div>

              <!-- Description -->
              <h6 class="fw-semibold mt-3 mb-2">{{ i18n.lang() === 'ar' ? 'الوصف' : 'Description' }}</h6>
              <p class="text-body-secondary" style="white-space: pre-line; line-height:1.7">{{ l.description }}</p>

              <!-- Location map -->
              @if (l.location) {
                <div class="mt-4">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <h6 class="fw-semibold mb-0">
                      <i class="bi bi-map me-1 text-primary"></i>
                      {{ i18n.lang() === 'ar' ? 'الموقع' : 'Location' }}
                    </h6>
                    <div class="d-flex gap-2 align-items-center">
                      @if (distance() != null) {
                        <span class="badge bg-primary-subtle text-primary rounded-pill">
                          <i class="bi bi-signpost-split me-1"></i>{{ distance() }}
                        </span>
                      }
                      @if (mapCoords()) {
                        <a [href]="googleMapsUrl()" target="_blank" rel="noopener"
                           class="btn btn-sm btn-outline-success rounded-pill">
                          <i class="bi bi-map-fill me-1"></i>
                          {{ i18n.lang() === 'ar' ? 'فتح في جوجل ماب' : 'Open in Google Maps' }}
                        </a>
                      }
                    </div>
                  </div>
                  <div #mapEl class="rounded-3 overflow-hidden border" style="height:220px"></div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body p-4">
              <!-- Owner -->
              <h6 class="fw-bold mb-3">{{ 'detail.seller' | t }}</h6>
              <a [routerLink]="['/users', l.ownerId]" class="d-flex align-items-center gap-2 mb-3 text-decoration-none text-body">
                @if (l.ownerAvatarUrl) {
                  <img [src]="l.ownerAvatarUrl" class="rounded-circle border" width="48" height="48"
                       style="object-fit:cover" alt="">
                } @else {
                  <div class="rounded-circle bg-light d-flex align-items-center justify-content-center border"
                       style="width:48px;height:48px">
                    <i class="bi bi-person-fill text-secondary fs-4"></i>
                  </div>
                }
                <div>
                  <div class="fw-semibold">{{ l.ownerDisplayName }}</div>
                  <div class="small text-muted">
                    {{ i18n.lang() === 'ar' ? 'عرض الملف الشخصي' : 'View profile' }}
                    <i class="bi bi-arrow-right ms-1" style="font-size:.7rem"></i>
                  </div>
                </div>
              </a>

              <!-- Phone -->
              @if (l.ownerPhone && auth.user()?.id !== l.ownerId
                   && l.status !== ListingStatus.Sold && l.status !== ListingStatus.Rented) {
                <a [href]="'tel:' + l.ownerPhone" class="btn btn-outline-success w-100 mb-2">
                  <i class="bi bi-telephone-fill me-2"></i>{{ l.ownerPhone }}
                </a>
                <a [href]="'https://wa.me/' + l.ownerPhone.replace(/[^0-9]/g,'') + '?text=' + whatsappMsg(l.title)"
                   target="_blank" rel="noopener" class="btn btn-outline-success w-100 mb-2"
                   style="border-color:#25d366;color:#25d366">
                  <i class="bi bi-whatsapp me-2"></i>
                  {{ i18n.lang() === 'ar' ? 'واتساب' : 'WhatsApp' }}
                </a>
              }

              <!-- Sold/Rented notice -->
              @if (l.status === ListingStatus.Sold || l.status === ListingStatus.Rented) {
                <div class="closed-notice">
                  <i class="bi bi-lock-fill me-2"></i>
                  {{ l.status === ListingStatus.Sold
                     ? (i18n.lang() === 'ar' ? 'هذا الإعلان مغلق — تم البيع' : 'This listing is closed — already sold')
                     : (i18n.lang() === 'ar' ? 'هذا الإعلان مغلق — تم التأجير' : 'This listing is closed — already rented') }}
                </div>
              }

              <!-- Message (hidden if sold/rented) -->
              @if (auth.isAuthenticated() && auth.user()?.id !== l.ownerId
                   && l.status !== ListingStatus.Sold && l.status !== ListingStatus.Rented) {
                <textarea class="form-control mb-2" rows="3" [(ngModel)]="message"
                          [placeholder]="'detail.writeMessage' | t"></textarea>
                <button class="btn btn-samsary w-100" (click)="sendMessage(l.ownerId, l.id)"
                        [disabled]="!message.trim() || sending()">
                  @if (sending()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  <i class="bi bi-chat-dots me-1"></i> {{ 'detail.contactSeller' | t }}
                </button>
              } @else if (!auth.isAuthenticated()
                          && l.status !== ListingStatus.Sold && l.status !== ListingStatus.Rented) {
                <a routerLink="/login" class="btn btn-outline-primary w-100">
                  {{ 'detail.signInToContact' | t }}
                </a>
              }
            </div>
          </div>

          <!-- Owner actions -->
          @if (auth.user()?.id === l.ownerId) {
            <div class="card border-0 shadow-sm">
              <div class="card-body p-3">
                <a [routerLink]="['/listings', l.id, 'edit']" class="btn btn-outline-primary w-100 mb-2">
                  <i class="bi bi-pencil me-1"></i> {{ 'common.edit' | t }}
                </a>
                <button class="btn btn-outline-danger w-100" (click)="remove(l.id)">
                  <i class="bi bi-trash me-1"></i> {{ 'common.delete' | t }}
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="text-center text-muted py-5"><div class="spinner-border"></div></div>
    }
  `,
  styles: [`
    /* ── Carousel ── */
    .media-carousel-wrap { background: #0d1117; }
    .carousel-media-frame {
      display: flex; align-items: center; justify-content: center;
      height: 400px; background: #0d1117;
    }
    @media (max-width: 576px) { .carousel-media-frame { height: 240px; } }
    .carousel-media-img {
      max-width: 100%; max-height: 100%; width: 100%;
      height: 100%; object-fit: contain; display: block;
    }
    /* Thumbnail strip */
    .thumb-strip {
      display: flex; gap: 4px; padding: 6px 8px;
      background: rgba(0,0,0,.55); overflow-x: auto; scrollbar-width: thin;
    }
    .thumb-item {
      flex: 0 0 64px; height: 46px; border-radius: 4px; overflow: hidden;
      border: 2px solid transparent; background: none; padding: 0; cursor: pointer;
      transition: border-color .15s;
    }
    .thumb-item.active, .thumb-item:hover { border-color: #fff; }
    .thumb-vid-placeholder {
      width: 100%; height: 100%; background: #222;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.2rem;
    }
    .thumb-vid-badge {
      position: absolute; bottom: 2px; end: 2px;
      background: rgba(0,0,0,.6); color: #fff; font-size: .55rem;
      border-radius: 2px; padding: 1px 3px;
    }
    /* Sold ribbon */
    .sold-ribbon {
      position: absolute; top: 16px; inset-inline-start: 0; z-index: 10;
      background: #dc3545; color: #fff; font-size: .85rem; font-weight: 700;
      padding: .35rem 1.1rem .35rem .9rem;
      border-radius: 0 999px 999px 0;
      box-shadow: 2px 2px 8px rgba(0,0,0,.3);
      letter-spacing: .04em; text-transform: uppercase;
    }
    /* Closed notice */
    .closed-notice {
      display: flex; align-items: center; gap: .5rem;
      padding: .65rem 1rem; border-radius: .65rem;
      background: rgba(220,53,69,.08); border: 1px solid rgba(220,53,69,.25);
      color: #dc3545; font-size: .85rem; font-weight: 600; margin-bottom: .75rem;
    }
  `]
})
export class ListingDetailComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private rt = inject(RealtimeService);
  readonly i18n = inject(I18nService);
  private confirm = inject(ConfirmService);
  auth = inject(AuthService);

  @ViewChild('mapEl') mapEl?: ElementRef<HTMLDivElement>;
  @ViewChildren('vid') videoRefs!: QueryList<ElementRef<HTMLVideoElement>>;

  l = signal<Listing | null>(null);
  message = '';
  sending = signal(false);
  mapCoords = signal<[number, number] | null>(null);
  distance = signal<string | null>(null);
  MediaType = MediaType;
  ListingStatus = ListingStatus;

  private map?: L.Map;

  // Track hls.js instances so we can destroy them (they keep polling/buffering
  // in the background otherwise — a real memory/network leak on route change).
  private hlsInstances = new Map<HTMLVideoElement, Hls>();
  private carouselEl: HTMLElement | null = null;
  private onSlide = (e: Event) => {
    const to = (e as any).to;
    if (typeof to === 'number') this.initVideoAt(to);
  };

  categoryName(c: Listing['category']) {
    return this.i18n.lang() === 'ar' ? (c.nameAr?.trim() || c.name) : c.name;
  }

  googleMapsUrl() {
    const c = this.mapCoords();
    if (!c) return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${c[0]},${c[1]}`;
  }

  whatsappMsg(title: string) {
    return encodeURIComponent(`Hi, I'm interested in your listing: ${title}`);
  }

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.api.listing(id).subscribe(x => {
      this.l.set(x);
      if (x.location) setTimeout(() => this.initMap(x.location!), 100);

      // IMPORTANT: the carousel/video elements only exist in the DOM once
      // `l()` is set and Angular renders the `@if` block — which happens
      // right here, asynchronously, after the HTTP call resolves. Doing
      // this setup in ngAfterViewInit() is too early: that hook fires once,
      // on the very first render, while `l()` is still null and the
      // carousel hasn't been created yet — so it silently found nothing.
      // Same 100ms-tick pattern as initMap() above: let Angular finish
      // painting the new DOM, then wire up the first video + slide listener.
      if (x.media.some(m => m.mediaType === MediaType.Video)) {
        setTimeout(() => {
          this.initVideoAt(0);
          this.carouselEl = document.getElementById('listingCarousel');
          this.carouselEl?.addEventListener('slide.bs.carousel', this.onSlide);
        }, 100);
      }
    });
  }

  /** Attaches the real video source (HLS via hls.js, or a direct mp4 URL) the
   *  first time the media item at `index` becomes the active carousel slide. */
  private initVideoAt(index: number) {
    const media = this.l()?.media;
    const item = media?.[index];
    if (!item || item.mediaType !== MediaType.Video) return;

    const videoEl = document.querySelector<HTMLVideoElement>(
      `#listingCarousel video[data-media-id="${item.id}"]`
    );
    if (!videoEl || videoEl.dataset['initialized'] === 'true') return;
    videoEl.dataset['initialized'] = 'true';

    const url = videoEl.dataset['src'] || '';
    this.attachVideoSource(videoEl, url);
  }

  private attachVideoSource(videoEl: HTMLVideoElement, url: string) {
    if (!url) return;

    const isHls = url.includes('.m3u8');
    if (!isHls) {
      // Plain mp4/webm — just set it directly.
      videoEl.src = url;
      return;
    }

    // Safari (and iOS) can play HLS natively — no library needed there.
    const canPlayNatively = videoEl.canPlayType('application/vnd.apple.mpegurl');
    if (canPlayNatively) {
      videoEl.src = url;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,       // seconds of forward buffer — smooth without over-fetching
        enableWorker: true,
      });
      hls.loadSource(url);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          // eslint-disable-next-line no-console
          console.error('hls.js fatal error, falling back to raw URL', data);
          hls.destroy();
          this.hlsInstances.delete(videoEl);
          videoEl.src = url; // last-resort fallback
        }
      });
      this.hlsInstances.set(videoEl, hls);
    } else {
      // No HLS support at all in this browser — fall back to the raw URL
      // (Cloudinary can still serve it as progressive mp4 in most cases).
      videoEl.src = url;
    }
  }

  private parseCoords(loc: string): [number, number] | null {
    const parts = loc.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])
      && Math.abs(parts[0]) <= 90 && Math.abs(parts[1]) <= 180)
      return [parts[0], parts[1]];
    return null;
  }

  private async initMap(location: string) {
    let coords = this.parseCoords(location);
    if (!coords) {
      try {
        const lang = this.i18n.lang();
        const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&accept-language=${lang}`);
        const data = await r.json();
        if (data?.[0]) coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      } catch { /* ignore */ }
    }
    if (!coords || !this.mapEl?.nativeElement) return;
    this.mapCoords.set(coords);

    this.map = L.map(this.mapEl.nativeElement, { zoomControl: true, scrollWheelZoom: false })
      .setView(coords, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    L.marker(coords, {
      icon: L.divIcon({ className: 'custom-map-pin', iconSize: [18, 18], iconAnchor: [9, 18], html: '<span></span>' })
    }).addTo(this.map);

    // Try to calculate distance to user
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const d = this.haversine(pos.coords.latitude, pos.coords.longitude, coords![0], coords![1]);
        this.distance.set(d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);
      }, () => { /* permission denied */ });
    }
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  ngOnDestroy() {
    this.map?.remove();
    this.carouselEl?.removeEventListener('slide.bs.carousel', this.onSlide);
    // Destroy every hls.js instance we created — otherwise they keep
    // buffering/polling network requests in the background after navigating away.
    this.hlsInstances.forEach(hls => hls.destroy());
    this.hlsInstances.clear();
  }

  pauseOtherVideos(event: Event) {
    // Pause all other video elements when one starts playing
    const playing = event.target as HTMLVideoElement;
    document.querySelectorAll('video').forEach(v => {
      if (v !== playing && !v.paused) v.pause();
    });
  }

  /** For plain (non-HLS) Cloudinary URLs, inject a quality/codec optimization.
   *  HLS manifest URLs (.m3u8) are already fully optimized via the streaming
   *  profile set server-side — don't touch those. */
  videoUrl(url: string): string {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('.m3u8')) return url;
    return url.replace('/upload/', '/upload/q_auto:eco,vc_auto/');
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

  async remove(id: number) {
    const ok = await this.confirm.confirm({
      title: this.i18n.lang() === 'ar' ? 'حذف الإعلان' : 'Delete Listing',
      message: this.i18n.lang() === 'ar' ? 'هل أنت متأكد من حذف هذا الإعلان؟ لن تتمكن من استعادته.' : 'Are you sure you want to delete this listing? This cannot be undone.',
      danger: true,
      confirmLabel: this.i18n.lang() === 'ar' ? 'حذف' : 'Delete'
    });
    if (!ok) return;
    this.api.deleteListing(id).subscribe(() => this.router.navigateByUrl('/my-listings'));
  }
}