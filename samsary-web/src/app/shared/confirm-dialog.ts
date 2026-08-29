import { Component, inject } from '@angular/core';
import { ConfirmService } from '../core/confirm.service';
import { TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (svc.visible()) {
      <!-- Backdrop -->
      <div class="modal-backdrop fade show" style="z-index:1050" (click)="svc.dismiss()"></div>
      <!-- Dialog -->
      <div class="modal d-block" style="z-index:1055" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-0 shadow-lg rounded-3">
            <div class="modal-body p-4 text-center">
              <div class="mb-3">
                @if (svc.options().danger) {
                  <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size:2.5rem"></i>
                } @else {
                  <i class="bi bi-question-circle-fill text-primary" style="font-size:2.5rem"></i>
                }
              </div>
              <h5 class="fw-bold mb-2">{{ svc.options().title }}</h5>
              <p class="text-muted small mb-0">{{ svc.options().message }}</p>
            </div>
            <div class="modal-footer border-0 pt-0 d-flex gap-2 justify-content-center pb-4">
              <button class="btn btn-light px-4" (click)="svc.dismiss()">
                {{ svc.options().cancelLabel || ('common.cancel' | t) }}
              </button>
              <button class="btn px-4" [class.btn-danger]="svc.options().danger"
                      [class.btn-samsary]="!svc.options().danger"
                      (click)="svc.accept()">
                {{ svc.options().confirmLabel || ('common.delete' | t) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDialogComponent {
  svc = inject(ConfirmService);
}
