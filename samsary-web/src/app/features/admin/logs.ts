import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { TranslatePipe } from '../../core/i18n.service';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [DatePipe, FormsModule, TranslatePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0 fw-bold">{{ 'admin.logs' | t }}</h4>
      <div class="d-flex gap-2">
        <select class="form-select form-select-sm" [(ngModel)]="level" (change)="reload()">
          <option value="">{{ 'admin.allLevels' | t }}</option>
          <option value="Info">{{ 'admin.info' | t }}</option>
          <option value="Warning">{{ 'admin.warning' | t }}</option>
          <option value="Error">{{ 'admin.error' | t }}</option>
        </select>
        <button class="btn btn-outline-secondary btn-sm" (click)="reload()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table mb-0 small">
          <thead class="table-light">
            <tr><th>{{ 'admin.colTime' | t }}</th><th>{{ 'admin.colLevel' | t }}</th><th>{{ 'admin.colMethod' | t }}</th><th>{{ 'admin.colPath' | t }}</th><th>{{ 'admin.colStatusCode' | t }}</th><th>{{ 'admin.colUser' | t }}</th><th>{{ 'admin.colIp' | t }}</th><th>{{ 'admin.colMessage' | t }}</th></tr>
          </thead>
          <tbody>
            @for (l of items(); track l.id) {
              <tr [class.table-danger]="l.level==='Error'" [class.table-warning]="l.level==='Warning'">
                <td>{{ l.createdAt | date:'short' }}</td>
                <td>{{ l.level }}</td>
                <td>{{ l.method }}</td>
                <td class="text-truncate" style="max-width: 200px">{{ l.path }}</td>
                <td>{{ l.statusCode }}</td>
                <td class="text-truncate" style="max-width: 140px">{{ l.userId }}</td>
                <td>{{ l.ipAddress }}</td>
                <td class="text-truncate" style="max-width: 280px" [title]="l.message">{{ l.message }}</td>
              </tr>
            } @empty { <tr><td colspan="8" class="text-center text-muted py-4">{{ 'admin.noLogs' | t }}</td></tr> }
          </tbody>
        </table>
      </div>
    </div>

    <nav class="mt-3 d-flex justify-content-center">
      <ul class="pagination">
        <li class="page-item" [class.disabled]="page() === 1"><button class="page-link" (click)="go(page() - 1)">«</button></li>
        <li class="page-item disabled"><span class="page-link">{{ 'common.page' | t }} {{ page() }}</span></li>
        <li class="page-item" [class.disabled]="items().length < 50"><button class="page-link" (click)="go(page() + 1)">»</button></li>
      </ul>
    </nav>
  `
})
export class AdminLogsComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<any[]>([]);
  page = signal(1);
  level = '';
  ngOnInit() { this.reload(); }
  reload() { this.api.adminLogs(this.page(), this.level || undefined).subscribe(r => this.items.set(r.items)); }
  go(p: number) { if (p < 1) return; this.page.set(p); this.reload(); }
}
