import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly visible = signal(false);
  readonly options = signal<ConfirmOptions>({ title: '', message: '' });

  private resolve!: (v: boolean) => void;

  confirm(opts: ConfirmOptions): Promise<boolean> {
    this.options.set(opts);
    this.visible.set(true);
    return new Promise(res => (this.resolve = res));
  }

  accept()  { this.visible.set(false); this.resolve(true);  }
  dismiss() { this.visible.set(false); this.resolve(false); }
}
