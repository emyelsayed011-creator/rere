import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { I18nService, TranslatePipe } from '../core/i18n.service';

const SESSION_KEY = 'samsary.sid';
const CONSENT_KEY = 'samsary.consent';

function getSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    @if (visible()) {
      <div class="consent-backdrop">
        <div class="consent-card animate-fade-up" role="dialog" aria-modal="true"
             [attr.aria-label]="'cookie.title' | t">

          <div class="consent-header">
            <span class="consent-emoji">🍪</span>
            <h5 class="mb-0">{{ 'cookie.title' | t }}</h5>
          </div>

          <p class="consent-body">
            {{ 'cookie.body' | t }}
            <a href="/privacy" class="consent-link">{{ 'cookie.learnMore' | t }}</a>
          </p>

          @if (!showCustomize()) {
            <div class="consent-actions">
              <button class="btn btn-samsary" (click)="acceptAll()">{{ 'cookie.acceptAll' | t }}</button>
              <button class="btn btn-outline-secondary" (click)="acceptNecessary()">{{ 'cookie.necessaryOnly' | t }}</button>
              <button class="btn btn-link text-muted p-0 small" (click)="showCustomize.set(true)">{{ 'cookie.customize' | t }}</button>
            </div>
          } @else {
            <div class="consent-toggles">
              <label class="consent-toggle">
                <span>{{ 'cookie.necessary' | t }}</span>
                <input type="checkbox" checked disabled>
                <span class="toggle-pill disabled"></span>
              </label>
              <label class="consent-toggle">
                <span>{{ 'cookie.analytics' | t }}</span>
                <input type="checkbox" [(ngModel)]="analytics">
                <span class="toggle-pill" [class.on]="analytics"></span>
              </label>
              <label class="consent-toggle">
                <span>{{ 'cookie.marketing' | t }}</span>
                <input type="checkbox" [(ngModel)]="marketing">
                <span class="toggle-pill" [class.on]="marketing"></span>
              </label>
            </div>
            <button class="btn btn-samsary w-100 mt-2" (click)="savePrefs()">{{ 'cookie.savePrefs' | t }}</button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .consent-backdrop {
      position: fixed; inset-inline: 0; bottom: 0; z-index: 1060;
      display: flex; justify-content: center; padding: 1rem;
      pointer-events: none;
    }
    .consent-card {
      pointer-events: all;
      background: var(--bs-body-bg, #fff);
      border: 1px solid rgba(236,72,153,.15);
      border-radius: 1.25rem;
      box-shadow: 0 -4px 40px rgba(236,72,153,.18), 0 8px 40px rgba(0,0,0,.12);
      padding: 1.5rem 1.75rem;
      max-width: 560px; width: 100%;
    }
    .consent-header { display: flex; align-items: center; gap: .6rem; margin-bottom: .75rem; }
    .consent-emoji { font-size: 1.5rem; }
    .consent-body { font-size: .9rem; color: var(--bs-secondary-color, #6c757d); margin-bottom: 1rem; }
    .consent-link { color: var(--samsary-primary); font-weight: 600; }
    .consent-actions { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; }
    .consent-actions .btn { font-size: .875rem; }
    .consent-toggles { display: flex; flex-direction: column; gap: .6rem; margin-bottom: .5rem; }
    .consent-toggle {
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; font-weight: 500; font-size: .9rem;
    }
    .consent-toggle input { display: none; }
    .toggle-pill {
      width: 44px; height: 24px; border-radius: 999px;
      background: #e5e7eb; transition: background .25s ease; position: relative; flex-shrink: 0;
    }
    .toggle-pill::after {
      content: ''; position: absolute; top: 3px; inset-inline-start: 3px;
      width: 18px; height: 18px; border-radius: 50%; background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,.2); transition: inset-inline-start .25s ease;
    }
    .toggle-pill.on { background: linear-gradient(135deg,#ec4899,#a855f7); }
    .toggle-pill.on::after { inset-inline-start: calc(100% - 21px); }
    .toggle-pill.disabled { opacity: .5; cursor: not-allowed; }
  `]
})
export class CookieConsentComponent implements OnInit {
  private api = inject(ApiService);
  private i18n = inject(I18nService);

  visible = signal(false);
  showCustomize = signal(false);
  analytics = true;
  marketing = false;

  ngOnInit() {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) this.visible.set(true);
  }

  acceptAll() { this.save(true, true); }
  acceptNecessary() { this.save(false, false); }
  savePrefs() { this.save(this.analytics, this.marketing); }

  private save(analytics: boolean, marketing: boolean) {
    const consent = {
      analyticsConsent: analytics,
      marketingConsent: marketing,
      termsAccepted: false,
      termsVersion: '',
      privacyPolicyAccepted: false,
      sessionId: getSessionId()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics, marketing, at: Date.now() }));
    this.api.saveConsent(consent).subscribe();
    this.visible.set(false);
  }
}
