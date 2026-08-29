import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { I18nService, TranslatePipe } from '../core/i18n.service';
import { Listing, PublicUser } from '../core/models';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, TranslatePipe],
  styles: [`
    .user-info-icon {
      width: 26px; height: 26px; border-radius: .4rem; flex-shrink: 0;
      background: var(--samsary-gradient-soft);
      color: var(--samsary-primary);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: .78rem;
    }
  `],
  template: `
    @if (loading()) {
      <div class="text-center py-5"><span class="spinner-border"></span></div>
    } @else if (user(); as u) {
      <div class="row g-4 animate-fade-up">
        <!-- Profile card -->
        <div class="col-md-4 col-lg-3">
          <div class="card border-0 shadow-sm text-center">
            <div class="card-body p-4">
              @if (u.avatarUrl) {
                <img [src]="u.avatarUrl" class="rounded-circle border border-3 mb-3"
                     style="border-color:var(--samsary-primary)!important;width:100px;height:100px;object-fit:cover" alt="">
              } @else {
                <div class="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                     style="width:100px;height:100px;background:var(--samsary-gradient-soft)">
                  <i class="bi bi-person-fill fs-1" style="color:var(--samsary-primary)"></i>
                </div>
              }
              <h5 class="fw-bold mb-1">{{ u.displayName }}</h5>
              @if (u.bio) {
                <p class="text-muted small mb-2">{{ u.bio }}</p>
              }

              <!-- Contact info -->
              <div class="text-start mt-2 mb-3 d-flex flex-column gap-2">
                @if (u.phone) {
                  <a [href]="'tel:' + u.phone"
                     class="d-flex align-items-center gap-2 text-decoration-none text-body small">
                    <span class="user-info-icon"><i class="bi bi-telephone-fill"></i></span>
                    <span>{{ u.phone }}</span>
                  </a>
                  <a [href]="'https://wa.me/' + u.phone.replace('+','').replace(/\s/g,'') + '?text=' + waMsg(u.displayName)"
                     target="_blank" rel="noopener"
                     class="d-flex align-items-center gap-2 text-decoration-none small"
                     style="color:#25d366">
                    <span class="user-info-icon" style="color:#25d366;background:rgba(37,211,102,.12)">
                      <i class="bi bi-whatsapp"></i>
                    </span>
                    <span>WhatsApp</span>
                  </a>
                }
                @if (u.email) {
                  <a [href]="'mailto:' + u.email"
                     class="d-flex align-items-center gap-2 text-decoration-none text-body small">
                    <span class="user-info-icon"><i class="bi bi-envelope-fill"></i></span>
                    <span class="text-truncate">{{ u.email }}</span>
                  </a>
                }
                @if (u.country) {
                  <div class="d-flex align-items-center gap-2 small text-muted">
                    <span class="user-info-icon"><i class="bi bi-geo-alt-fill"></i></span>
                    <span>{{ u.country }}</span>
                  </div>
                }
                @if (!u.phone && !u.email && !u.country) {
                  <div class="small text-muted fst-italic">
                    {{ i18n.lang() === 'ar' ? 'لم يضف هذا المستخدم بيانات تواصل بعد' : 'No contact info added yet' }}
                  </div>
                }
              </div>
              <div class="d-flex justify-content-center gap-3 mt-2 mb-3">
                <div class="text-center">
                  <div class="fw-bold fs-5" style="color:var(--samsary-primary)">{{ u.approvedListingsCount }}</div>
                  <div class="small text-muted">
                    {{ i18n.lang() === 'ar' ? 'إعلانات' : 'Listings' }}
                  </div>
                </div>
                @if (u.memberSince) {
                  <div class="vr"></div>
                  <div class="text-center">
                    <div class="fw-bold small">{{ u.memberSince | date:'MMM y' }}</div>
                    <div class="small text-muted">{{ i18n.lang() === 'ar' ? 'منذ' : 'Member' }}</div>
                  </div>
                }
              </div>
              @if (auth.isAuthenticated() && auth.user()?.id !== u.id) {
                <a [routerLink]="['/chat', u.id]" class="btn btn-samsary btn-sm w-100">
                  <i class="bi bi-chat-dots me-1"></i>
                  {{ i18n.lang() === 'ar' ? 'إرسال رسالة' : 'Send Message' }}
                </a>
              }
              @if (auth.user()?.id === u.id) {
                <a routerLink="/profile" class="btn btn-outline-primary btn-sm w-100">
                  <i class="bi bi-pencil me-1"></i>
                  {{ i18n.lang() === 'ar' ? 'تعديل ملفي' : 'Edit my profile' }}
                </a>
              }
            </div>
          </div>
        </div>

        <!-- Listings -->
        <div class="col-md-8 col-lg-9">
          <h5 class="fw-bold mb-3">
            {{ i18n.lang() === 'ar' ? 'إعلانات' : 'Listings' }} {{ u.displayName }}
          </h5>
          @if (listings().length === 0) {
            <div class="text-center text-muted py-5">
              <i class="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>
              {{ i18n.lang() === 'ar' ? 'لا توجد إعلانات بعد' : 'No listings yet' }}
            </div>
          } @else {
            <div class="row g-3">
              @for (l of listings(); track l.id) {
                <div class="col-12 col-sm-6 col-xl-4">
                  <a [routerLink]="['/listings', l.id]" class="card border-0 shadow-sm text-decoration-none text-body h-100">
                    <div class="position-relative ratio ratio-16x9">
                      @if (l.media[0]) {
                        <img [src]="l.media[0].thumbnailUrl || l.media[0].url" class="object-fit-cover rounded-top" alt="">
                      } @else {
                        <div class="d-flex align-items-center justify-content-center text-muted bg-light rounded-top">
                          <i class="bi bi-image fs-2"></i>
                        </div>
                      }
                      <span class="badge badge-type text-white"
                            [class.bg-success]="l.type===1" [class.bg-info]="l.type===2">
                        {{ (l.type === 1 ? 'common.sale' : 'common.rent') | t }}
                      </span>
                    </div>
                    <div class="card-body py-2 px-3">
                      <div class="fw-semibold text-truncate">{{ l.title }}</div>
                      <div class="small text-muted text-truncate">{{ l.location }}</div>
                      <div class="fw-bold mt-1" style="color:var(--samsary-primary)">
                        {{ l.price | number }} {{ l.currency }}
                      </div>
                    </div>
                  </a>
                </div>
              }
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="text-center text-muted py-5">
        <i class="bi bi-person-x fs-1 d-block mb-2"></i>
        {{ i18n.lang() === 'ar' ? 'المستخدم غير موجود' : 'User not found' }}
      </div>
    }
  `
})
export class UserProfileComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);

  loading = signal(true);
  user = signal<PublicUser | null>(null);
  listings = signal<Listing[]>([]);

  waMsg(name: string) {
    return encodeURIComponent(
      this.i18n.lang() === 'ar'
        ? `السلام عليكم ${name}، رأيت إعلانك على سمسارلي وأرغب في التواصل`
        : `Hi ${name}, I found your listing on Samsarly and would like to get in touch`
    );
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.publicUser(id).subscribe({
      next: u => {
        this.user.set(u);
        this.loading.set(false);
        this.api.listings({ ownerId: id, pageSize: 50 }).subscribe(r => this.listings.set(r.items));
      },
      error: () => { this.user.set(null); this.loading.set(false); }
    });
  }
}
