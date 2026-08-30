import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { TranslatePipe, I18nService } from '../../core/i18n.service';
import { Moderator, ModeratorPermission } from '../../core/models';

interface PermissionMeta {
  flag: ModeratorPermission;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-moderators',
  standalone: true,
  imports: [FormsModule, DatePipe, TranslatePipe],
  template: `
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h4 class="fw-bold mb-0">{{ 'admin.moderators' | t }}</h4>
        <p class="text-muted small mb-0">{{ 'admin.moderatorsDesc' | t }}</p>
      </div>
      <button class="btn btn-samsary" (click)="showAdd.set(true)">
        <i class="bi bi-person-plus-fill me-2"></i>{{ 'admin.addModerator' | t }}
      </button>
    </div>

    <!-- ── Add moderator panel ── -->
    @if (showAdd()) {
      <div class="card border-0 shadow-sm mb-4 animate-fade-up">
        <div class="card-body p-4">
          <!-- Mode toggle -->
          <div class="d-flex gap-2 mb-4">
            <button type="button" class="btn btn-sm"
                    [class.btn-samsary]="addMode() === 'existing'"
                    [class.btn-outline-secondary]="addMode() !== 'existing'"
                    (click)="addMode.set('existing')">
              <i class="bi bi-search me-1"></i>{{ 'admin.modPickExisting' | t }}
            </button>
            <button type="button" class="btn btn-sm"
                    [class.btn-samsary]="addMode() === 'new'"
                    [class.btn-outline-secondary]="addMode() !== 'new'"
                    (click)="addMode.set('new')">
              <i class="bi bi-person-plus me-1"></i>{{ 'admin.modCreateNew' | t }}
            </button>
          </div>

          @if (addMode() === 'existing') {
            <!-- Pick existing user -->
            <div class="row g-3 align-items-start">
              <div class="col-md-5 position-relative">
                <label class="form-label small fw-semibold">{{ 'admin.modUserSearch' | t }}</label>
                <input class="form-control" [(ngModel)]="addSearch"
                       [placeholder]="'admin.modSearchPlaceholder' | t"
                       (input)="searchUsers()" autocomplete="off">
                @if (userResults().length) {
                  <div class="list-group mt-1 shadow-sm position-absolute z-3" style="width:calc(100% - 1.5rem)">
                    @for (u of userResults(); track u.id) {
                      <button class="list-group-item list-group-item-action py-2" (click)="selectUser(u)">
                        <div class="fw-semibold small">{{ u.displayName }}</div>
                        <div class="text-muted" style="font-size:.8rem">{{ u.email }}</div>
                      </button>
                    }
                  </div>
                }
                @if (selectedUser()) {
                  <div class="d-flex align-items-center gap-2 mt-2 p-2 rounded bg-success-subtle">
                    <i class="bi bi-check-circle-fill text-success"></i>
                    <span class="small fw-semibold">{{ selectedUser()!.displayName }}</span>
                    <span class="text-muted small">&lt;{{ selectedUser()!.email }}&gt;</span>
                    <button class="btn btn-link btn-sm p-0 ms-auto text-danger" (click)="selectedUser.set(null)">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                }
              </div>
              <div class="col-md-7">
                <label class="form-label small fw-semibold">{{ 'admin.modPermissions' | t }}</label>
                <div class="d-flex flex-wrap gap-3">
                  @for (p of permMeta; track p.flag) {
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" [id]="'perm-' + p.flag"
                             [checked]="hasAddPerm(p.flag)" (change)="toggleAddPerm(p.flag)">
                      <label class="form-check-label small" [for]="'perm-' + p.flag">
                        <i [class]="'bi ' + p.icon + ' me-1 text-primary'"></i>{{ p.label | t }}
                      </label>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div class="d-flex gap-2 mt-3">
              <button class="btn btn-samsary btn-sm" [disabled]="!selectedUser() || addPerms === 0 || saving()"
                      (click)="createModerator()">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                {{ 'common.save' | t }}
              </button>
              <button class="btn btn-outline-secondary btn-sm" (click)="cancelAdd()">{{ 'common.cancel' | t }}</button>
            </div>
          } @else {
            <!-- Create new account -->
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label small fw-semibold">{{ 'auth.displayName' | t }}</label>
                <input class="form-control" [(ngModel)]="newUser.displayName" placeholder="Display Name">
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">{{ 'auth.email' | t }}</label>
                <input class="form-control" type="email" [(ngModel)]="newUser.email" placeholder="email@example.com">
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">{{ 'auth.phone' | t }}</label>
                <input class="form-control" type="tel" [(ngModel)]="newUser.phone" placeholder="+20 1xx xxx xxxx">
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">{{ 'auth.password' | t }}</label>
                <input class="form-control" type="password" [(ngModel)]="newUser.password"
                       placeholder="Min 8 chars, uppercase, digit, symbol">
              </div>
              <div class="col-12">
                <label class="form-label small fw-semibold">{{ 'admin.modPermissions' | t }}</label>
                <div class="d-flex flex-wrap gap-3">
                  @for (p of permMeta; track p.flag) {
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" [id]="'new-perm-' + p.flag"
                             [checked]="hasAddPerm(p.flag)" (change)="toggleAddPerm(p.flag)">
                      <label class="form-check-label small" [for]="'new-perm-' + p.flag">
                        <i [class]="'bi ' + p.icon + ' me-1 text-primary'"></i>{{ p.label | t }}
                      </label>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div class="d-flex gap-2 mt-3">
              <button class="btn btn-samsary btn-sm"
                      [disabled]="!newUser.email || !newUser.password || !newUser.displayName || addPerms === 0 || saving()"
                      (click)="createNewUserModerator()">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                <i class="bi bi-person-plus me-1"></i>{{ 'admin.modCreateNew' | t }}
              </button>
              <button class="btn btn-outline-secondary btn-sm" (click)="cancelAdd()">{{ 'common.cancel' | t }}</button>
            </div>
          }

          @if (addError()) {
            <div class="alert alert-danger mt-3 mb-0 py-2 small">{{ addError() }}</div>
          }
        </div>
      </div>
    }

    <!-- ── Moderators table ── -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        @if (loading()) {
          <div class="text-center py-5"><span class="spinner-border text-primary"></span></div>
        } @else if (!moderators().length) {
          <div class="text-center py-5 text-muted">
            <i class="bi bi-shield-check fs-1 d-block mb-2 opacity-50"></i>
            {{ 'admin.noModerators' | t }}
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">{{ 'admin.modUser' | t }}</th>
                  <th>{{ 'admin.modPermissions' | t }}</th>
                  <th>{{ 'admin.modCreatedAt' | t }}</th>
                  <th class="pe-4 text-end">{{ 'common.actions' | t }}</th>
                </tr>
              </thead>
              <tbody>
                @for (m of moderators(); track m.userId) {
                  <tr>
                    <td class="ps-4">
                      <div class="d-flex align-items-center gap-2">
                        @if (m.avatarUrl) {
                          <img [src]="m.avatarUrl" class="rounded-circle" width="32" height="32" style="object-fit:cover" alt="">
                        } @else {
                          <div class="rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center"
                               style="width:32px;height:32px">
                            <i class="bi bi-person-fill text-primary small"></i>
                          </div>
                        }
                        <div>
                          <div class="fw-semibold small">{{ m.displayName }}</div>
                          <div class="text-muted" style="font-size:.75rem">{{ m.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-1">
                        @for (p of getGrantedPerms(m.permissions); track p.flag) {
                          <span class="badge bg-primary-subtle text-primary rounded-pill">
                            <i [class]="'bi ' + p.icon + ' me-1'"></i>{{ p.label | t }}
                          </span>
                        }
                      </div>
                    </td>
                    <td class="text-muted small">{{ m.createdAt | date:'mediumDate' }}</td>
                    <td class="pe-4 text-end">
                      <div class="d-flex gap-1 justify-content-end">
                        <button class="btn btn-sm btn-outline-primary"
                                (click)="openEdit(m)">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger"
                                (click)="removeTarget.set(m)">
                          <i class="bi bi-person-dash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- ── Remove confirm ── -->
    @if (removeTarget(); as m) {
      <div class="modal-backdrop" style="position:fixed;inset:0;z-index:1040;background:rgba(0,0,0,.45)" (click)="removeTarget.set(null)"></div>
      <div class="modal d-block" style="position:fixed;inset:0;z-index:1050" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-0 shadow-lg rounded-3">
            <div class="modal-body p-4 text-center">
              <i class="bi bi-person-dash-fill text-danger mb-3 d-block" style="font-size:2.5rem"></i>
              <h5 class="fw-bold mb-2">
                {{ i18n.lang() === 'ar' ? 'إزالة صلاحيات المشرف' : 'Remove Moderator' }}
              </h5>
              <p class="text-muted small mb-0">{{ m.displayName }}</p>
            </div>
            <div class="modal-footer border-0 d-flex gap-2 justify-content-center pb-4">
              <button class="btn btn-light px-4" (click)="removeTarget.set(null)">{{ 'common.cancel' | t }}</button>
              <button class="btn btn-danger px-4" [disabled]="saving()" (click)="doRemove(m)">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                {{ i18n.lang() === 'ar' ? 'إزالة' : 'Remove' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ── Edit permissions modal ── -->
    @if (editing()) {
      <div class="modal-backdrop-overlay" (click)="editing.set(null)"></div>
      <div class="position-fixed top-50 start-50 translate-middle z-5"
           style="width:min(95vw,520px)">
        <div class="card shadow-lg border-0">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-1">{{ 'admin.editPermissions' | t }}</h5>
            <p class="text-muted small mb-4">{{ editing()!.displayName }} &lt;{{ editing()!.email }}&gt;</p>
            <div class="d-flex flex-column gap-3">
              @for (p of permMeta; track p.flag) {
                <div class="d-flex justify-content-between align-items-center p-3 rounded bg-body-secondary">
                  <div>
                    <div class="fw-semibold small">
                      <i [class]="'bi ' + p.icon + ' me-2 text-primary'"></i>{{ p.label | t }}
                    </div>
                    <div class="text-muted" style="font-size:.8rem">{{ p.label + 'Desc' | t }}</div>
                  </div>
                  <div class="form-check form-switch m-0">
                    <input class="form-check-input" type="checkbox" role="switch"
                           [checked]="hasEditPerm(p.flag)"
                           (change)="toggleEditPerm(p.flag)">
                  </div>
                </div>
              }
            </div>
            <div class="d-flex gap-2 mt-4">
              <button class="btn btn-samsary flex-fill" [disabled]="saving()" (click)="saveEdit()">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                {{ 'common.save' | t }}
              </button>
              <button class="btn btn-outline-secondary flex-fill" (click)="editing.set(null)">{{ 'common.cancel' | t }}</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1040;
    }
  `]
})
export class AdminModeratorsComponent implements OnInit {
  private api = inject(ApiService);
  readonly i18n = inject(I18nService);

  loading = signal(true);
  saving = signal(false);
  moderators = signal<Moderator[]>([]);
  showAdd = signal(false);
  addMode = signal<'existing' | 'new'>('existing');
  editing = signal<Moderator | null>(null);
  removeTarget = signal<Moderator | null>(null);
  addError = signal<string | null>(null);

  // Add form state (existing user)
  addSearch = '';
  userResults = signal<any[]>([]);
  selectedUser = signal<any | null>(null);
  addPerms: number = 0;

  // Add form state (new user)
  newUser = { displayName: '', email: '', phone: '', password: '' };

  // Edit form state
  editPerms: number = 0;

  readonly permMeta: PermissionMeta[] = [
    { flag: ModeratorPermission.ManageListings, label: 'admin.permManageListings', icon: 'bi-house-check' },
    { flag: ModeratorPermission.ManageUsers,    label: 'admin.permManageUsers',    icon: 'bi-people-fill' },
    { flag: ModeratorPermission.ViewLogs,       label: 'admin.permViewLogs',       icon: 'bi-journal-text' },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getModerators().subscribe({
      next: list => { this.moderators.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  // ── User search for add form ───────────────────────────────────────────────
  private searchTimer: any;
  searchUsers() {
    clearTimeout(this.searchTimer);
    this.selectedUser.set(null);
    this.searchTimer = setTimeout(() => {
      if (this.addSearch.length < 2) { this.userResults.set([]); return; }
      this.api.adminSearchUsers(this.addSearch).subscribe(r => {
        this.userResults.set((r.items ?? r).slice(0, 5));
      });
    }, 300);
  }

  selectUser(u: any) {
    this.selectedUser.set(u);
    this.addSearch = u.displayName;
    this.userResults.set([]);
  }

  cancelAdd() {
    this.showAdd.set(false);
    this.selectedUser.set(null);
    this.addSearch = '';
    this.addPerms = 0;
    this.addError.set(null);
    this.newUser = { displayName: '', email: '', phone: '', password: '' };
  }

  // ── Permission helpers ─────────────────────────────────────────────────────
  hasAddPerm(flag: ModeratorPermission) { return (this.addPerms & flag) === flag; }
  toggleAddPerm(flag: ModeratorPermission) { this.addPerms = this.addPerms ^ flag; }

  hasEditPerm(flag: ModeratorPermission) { return (this.editPerms & flag) === flag; }
  toggleEditPerm(flag: ModeratorPermission) { this.editPerms = this.editPerms ^ flag; }

  getGrantedPerms(permissions: number) {
    return this.permMeta.filter(p => (permissions & p.flag) === p.flag);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  createNewUserModerator() {
    if (!this.newUser.email || !this.newUser.password || !this.newUser.displayName || !this.addPerms) return;
    this.saving.set(true); this.addError.set(null);
    this.api.adminCreateUser(this.newUser).subscribe({
      next: created => {
        this.api.createModerator(created.id, this.addPerms as any).subscribe({
          next: () => { this.saving.set(false); this.cancelAdd(); this.load(); },
          error: e => { this.addError.set(e?.error?.detail ?? this.i18n.t('common.failed')); this.saving.set(false); }
        });
      },
      error: e => { this.addError.set(e?.error?.detail ?? this.i18n.t('common.failed')); this.saving.set(false); }
    });
  }

  createModerator() {
    const user = this.selectedUser();
    if (!user || !this.addPerms) return;
    this.saving.set(true); this.addError.set(null);
    this.api.createModerator(user.id, this.addPerms).subscribe({
      next: () => { this.saving.set(false); this.cancelAdd(); this.load(); },
      error: e => { this.addError.set(e?.error?.detail ?? this.i18n.t('common.failed')); this.saving.set(false); }
    });
  }

  openEdit(m: Moderator) {
    this.editing.set(m);
    this.editPerms = m.permissions as number;
  }

  saveEdit() {
    const m = this.editing();
    if (!m) return;
    this.saving.set(true);
    this.api.updateModeratorPermissions(m.userId, this.editPerms as ModeratorPermission).subscribe({
      next: updated => {
        this.moderators.update(list => list.map(x => x.userId === updated.userId ? updated : x));
        this.editing.set(null);
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  doRemove(m: Moderator) {
    this.saving.set(true);
    this.api.removeModerator(m.userId).subscribe({
      next: () => {
        this.moderators.update(list => list.filter(x => x.userId !== m.userId));
        this.removeTarget.set(null);
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }
}
