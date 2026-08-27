import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="row justify-content-center py-4">
      <div class="col-lg-8">
        <nav aria-label="breadcrumb" class="mb-3">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a routerLink="/">Home</a></li>
            <li class="breadcrumb-item active">{{ title() }}</li>
          </ol>
        </nav>
        <div class="card border-0 shadow-sm animate-fade-up">
          <div class="card-body p-4 p-md-5">
            <h1 class="h3 fw-bold mb-4">{{ title() }}</h1>
            <p class="text-muted small mb-5">Last updated: June 2026</p>

            @if (page() === 'terms') {
              <section class="legal-section">
                <h5>1. Acceptance of Terms</h5>
                <p>By accessing and using Samsary, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our platform.</p>

                <h5>2. Use of the Platform</h5>
                <p>Samsary is a marketplace for buying, selling, and renting items. You must be at least 18 years old to create an account. You are responsible for all activity under your account.</p>

                <h5>3. Listings and Content</h5>
                <p>All listings are subject to review and approval. We reserve the right to remove any listing that violates our guidelines, including but not limited to illegal items, counterfeit goods, or misleading content.</p>

                <h5>4. Payments and Transactions</h5>
                <p>Samsary facilitates connections between buyers and sellers. We are not responsible for the quality, safety, or legality of items listed, or the truth of descriptions.</p>

                <h5>5. Intellectual Property</h5>
                <p>The Samsary platform, logo, and all content are the property of Samsary. You retain ownership of content you post but grant us a license to display it on the platform.</p>

                <h5>6. Limitation of Liability</h5>
                <p>Samsary is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages.</p>

                <h5>7. Changes to Terms</h5>
                <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>

                <h5>8. Contact</h5>
                <p>For questions about these terms, contact us at <a href="mailto:legal@samsary.com">legal&#64;samsary.com</a>.</p>
              </section>
            }

            @if (page() === 'privacy') {
              <section class="legal-section">
                <h5>1. Information We Collect</h5>
                <p>We collect information you provide directly (name, email, listings), information collected automatically (usage data, device info), and information from third parties (payment processors, social logins).</p>

                <h5>2. How We Use Your Information</h5>
                <p>We use your information to provide and improve the platform, send notifications you have requested, verify your identity, and comply with legal obligations.</p>

                <h5>3. Data Sharing</h5>
                <p>We do not sell your personal data. We share data only with service providers who help us operate the platform (hosting, email, analytics) under strict confidentiality agreements.</p>

                <h5>4. Cookies</h5>
                <p>We use necessary cookies to operate the platform and optional cookies for analytics and marketing. You can manage your cookie preferences at any time.</p>

                <h5>5. Your Rights</h5>
                <p>You have the right to access, correct, or delete your personal data. You can also request data portability or object to processing. Contact us at <a href="mailto:privacy@samsary.com">privacy&#64;samsary.com</a>.</p>

                <h5>6. Data Retention</h5>
                <p>We retain your data for as long as your account is active or as needed to provide services. You can request deletion of your account and associated data at any time.</p>

                <h5>7. Security</h5>
                <p>We use industry-standard security measures including encryption in transit and at rest, regular security audits, and strict access controls.</p>
              </section>
            }

            @if (page() === 'cookies') {
              <section class="legal-section">
                <h5>What Are Cookies?</h5>
                <p>Cookies are small text files stored on your device when you visit a website. They help us recognise you and remember your preferences.</p>

                <h5>Types of Cookies We Use</h5>
                <div class="table-responsive">
                  <table class="table table-bordered">
                    <thead class="table-light"><tr><th>Type</th><th>Purpose</th><th>Required?</th></tr></thead>
                    <tbody>
                      <tr><td><strong>Necessary</strong></td><td>Authentication, security, session management</td><td><span class="badge bg-danger rounded-pill">Required</span></td></tr>
                      <tr><td><strong>Analytics</strong></td><td>Understand how visitors use the site (anonymised)</td><td><span class="badge bg-secondary rounded-pill">Optional</span></td></tr>
                      <tr><td><strong>Marketing</strong></td><td>Personalised advertisements based on your interests</td><td><span class="badge bg-secondary rounded-pill">Optional</span></td></tr>
                    </tbody>
                  </table>
                </div>

                <h5>Managing Cookies</h5>
                <p>You can change your cookie preferences at any time using the cookie banner. You can also control cookies through your browser settings.</p>
              </section>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .legal-section h5 { margin-top: 1.75rem; font-weight: 700; color: var(--samsary-primary-dark); }
    .legal-section p { color: var(--bs-body-color); line-height: 1.75; }
  `]
})
export class LegalComponent {
  private route = inject(ActivatedRoute);
  page = toSignal(this.route.data.pipe(map(d => d['page'] as string)), { initialValue: 'terms' });

  title() {
    const map: Record<string, string> = { terms: 'Terms of Service', privacy: 'Privacy Policy', cookies: 'Cookie Policy' };
    return map[this.page()] ?? 'Legal';
  }
}
