import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { I18nService, TranslatePipe } from '../../core/i18n.service';
import { Category } from '../../core/models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h4 class="fw-bold mb-0">{{ i18n.lang() === 'ar' ? 'إدارة الفئات' : 'Manage Categories' }}</h4>
      <button class="btn btn-samsary btn-sm" (click)="startAdd()">
        <i class="bi bi-plus-lg me-1"></i>{{ i18n.lang() === 'ar' ? 'فئة جديدة' : 'New Category' }}
      </button>
    </div>

    <!-- Add/Edit form -->
    @if (editing()) {
      <div class="card border-0 shadow-sm mb-4 animate-fade-up">
        <div class="card-body p-4">
          <h6 class="fw-bold mb-3">
            {{ editing()!.id ? (i18n.lang() === 'ar' ? 'تعديل الفئة' : 'Edit Category') : (i18n.lang() === 'ar' ? 'فئة جديدة' : 'New Category') }}
          </h6>
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label small fw-medium">{{ i18n.lang() === 'ar' ? 'الاسم (إنجليزي)' : 'Name (EN)' }} *</label>
              <input class="form-control" [(ngModel)]="form.name" placeholder="Electronics">
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-medium">{{ i18n.lang() === 'ar' ? 'الاسم (عربي)' : 'Name (AR)' }}</label>
              <input class="form-control" [(ngModel)]="form.nameAr" placeholder="إلكترونيات" dir="rtl">
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-medium">Slug *</label>
              <input class="form-control" [(ngModel)]="form.slug" placeholder="electronics">
              <div class="form-text">lowercase, no spaces</div>
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-medium">{{ i18n.lang() === 'ar' ? 'أيقونة Bootstrap' : 'Bootstrap Icon' }}</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi" [class]="'bi-' + (form.iconClass || 'tag')"></i></span>
                <input class="form-control" [(ngModel)]="form.iconClass" placeholder="house-fill">
              </div>
            </div>
          </div>
          @if (saveError()) { <div class="alert alert-danger mt-3 mb-0 py-2 small">{{ saveError() }}</div> }
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-samsary btn-sm" (click)="saveForm()" [disabled]="!form.name || !form.slug || saving()">
              @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
              {{ 'common.save' | t }}
            </button>
            <button class="btn btn-outline-secondary btn-sm" (click)="editing.set(null)">{{ 'common.cancel' | t }}</button>
          </div>
        </div>
      </div>
    }

    <!-- Categories table -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        @if (loading()) {
          <div class="text-center py-5"><span class="spinner-border text-primary"></span></div>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">{{ i18n.lang() === 'ar' ? 'الأيقونة' : 'Icon' }}</th>
                  <th>{{ i18n.lang() === 'ar' ? 'الاسم' : 'Name' }}</th>
                  <th>{{ i18n.lang() === 'ar' ? 'الاسم بالعربي' : 'Arabic Name' }}</th>
                  <th>Slug</th>
                  <th class="pe-4 text-end">{{ 'common.actions' | t }}</th>
                </tr>
              </thead>
              <tbody>
                @for (c of cats(); track c.id) {
                  <tr>
                    <td class="ps-4">
                      <div class="rounded-2 d-inline-flex align-items-center justify-content-center"
                           style="width:36px;height:36px;background:var(--samsary-gradient-soft)">
                        <i class="bi text-primary" [class]="'bi-' + (c.iconClass || 'tag')"></i>
                      </div>
                    </td>
                    <td class="fw-semibold">{{ c.name }}</td>
                    <td class="text-muted" dir="rtl">{{ c.nameAr || '—' }}</td>
                    <td><code class="text-primary small">{{ c.slug }}</code></td>
                    <td class="pe-4 text-end">
                      <div class="d-flex gap-1 justify-content-end">
                        <button class="btn btn-sm btn-outline-primary" (click)="startEdit(c)">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" (click)="remove(c)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="text-center text-muted py-5">{{ i18n.lang() === 'ar' ? 'لا توجد فئات' : 'No categories yet' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminCategoriesComponent implements OnInit {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  readonly i18n = inject(I18nService);

  loading = signal(true);
  saving = signal(false);
  cats = signal<Category[]>([]);
  editing = signal<Partial<Category> | null>(null);
  saveError = signal<string | null>(null);
  form = { name: '', nameAr: '', slug: '', iconClass: '' };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.categories().subscribe({ next: c => { this.cats.set(c); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  startAdd() {
    this.form = { name: '', nameAr: '', slug: '', iconClass: '' };
    this.editing.set({});
    this.saveError.set(null);
  }

  startEdit(c: Category) {
    this.form = { name: c.name, nameAr: c.nameAr || '', slug: c.slug, iconClass: c.iconClass || '' };
    this.editing.set(c);
    this.saveError.set(null);
  }

  saveForm() {
    if (!this.form.name || !this.form.slug) return;
    this.saving.set(true); this.saveError.set(null);
    const body = { name: this.form.name, nameAr: this.form.nameAr || undefined, slug: this.form.slug.toLowerCase().replace(/\s+/g, '-'), iconClass: this.form.iconClass || undefined };
    const id = (this.editing() as Category)?.id;
    const req = id ? this.api.adminUpdateCategory(id, body) : this.api.adminCreateCategory(body);
    req.subscribe({
      next: () => { this.saving.set(false); this.editing.set(null); this.load(); },
      error: e => { this.saveError.set(e?.error?.detail || this.i18n.t('common.failed')); this.saving.set(false); }
    });
  }

  async remove(c: Category) {
    const ok = await this.confirm.confirm({
      title: this.i18n.lang() === 'ar' ? 'حذف الفئة' : 'Delete Category',
      message: this.i18n.lang() === 'ar' ? `هل تريد حذف "${c.name}"؟` : `Delete "${c.name}"?`,
      danger: true
    });
    if (!ok) return;
    this.api.adminDeleteCategory(c.id).subscribe({ next: () => this.load() });
  }
}
