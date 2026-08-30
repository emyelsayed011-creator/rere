import { Component, ElementRef, inject, OnInit, signal, effect, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { RealtimeService } from '../core/realtime.service';
import { ChatMessage, Conversation } from '../core/models';
import { TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, TranslatePipe],
  template: `
    <div class="row g-3">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm">
          <div class="list-group list-group-flush" style="max-height: 70vh; overflow-y:auto;">
            @for (c of conversations(); track c.otherUserId) {
              <a [routerLink]="['/chat', c.otherUserId]" class="list-group-item list-group-item-action d-flex align-items-center"
                 [class.active]="c.otherUserId === otherId()">
                @if (c.otherUserAvatarUrl) {
                  <img [src]="c.otherUserAvatarUrl" class="rounded-circle me-2" width="36" height="36">
                } @else { <i class="bi bi-person-circle fs-3 me-2"></i> }
                <div class="flex-grow-1 min-w-0">
                  <div class="d-flex justify-content-between">
                    <div class="fw-semibold text-truncate">{{ c.otherUserDisplayName }}</div>
                    @if (c.unreadCount > 0) { <span class="badge bg-danger">{{ c.unreadCount }}</span> }
                  </div>
                  <div class="small text-muted text-truncate">{{ c.lastMessage }}</div>
                </div>
              </a>
            } @empty {
              <div class="p-3 text-center text-muted small">{{ 'chat.noConversations' | t }}</div>
            }
          </div>
        </div>
      </div>

      <div class="col-md-8">
        @if (otherId()) {
          <div class="chat-thread mb-2" #thread style="overflow-y:auto;max-height:60vh">
            @for (m of messages(); track m.id) {
              <div class="d-flex" [class.justify-content-end]="m.senderId === me()">
                <div class="chat-bubble" [class.me]="m.senderId === me()" [class.them]="m.senderId !== me()">
                  <div>{{ m.body }}</div>
                  <div class="d-flex align-items-center justify-content-end gap-1 mt-1">
                    <span class="small opacity-75">{{ m.sentAt | date:'shortTime' }}</span>
                    @if (m.senderId === me()) {
                      @if (m.isRead) {
                        <i class="bi bi-check2-all" style="font-size:.75rem;color:#4fc3f7"></i>
                      } @else {
                        <i class="bi bi-check2" style="font-size:.75rem;opacity:.5"></i>
                      }
                    }
                  </div>
                </div>
              </div>
            } @empty { <div class="text-muted text-center py-5">{{ 'chat.sayHello' | t }}</div> }
          </div>
          <div class="input-group">
            <textarea class="form-control" rows="1" [(ngModel)]="draft"
              (keydown.enter)="$event.preventDefault(); send()" [placeholder]="'chat.typeMessage' | t"></textarea>
            <button class="btn btn-samsary" (click)="send()" [disabled]="!draft.trim()">
              <i class="bi bi-send"></i>
            </button>
          </div>
        } @else {
          <div class="text-muted text-center py-5">
            <i class="bi bi-chat-square-text fs-1"></i>
            <div class="mt-2">{{ 'chat.selectConversation' | t }}</div>
          </div>
        }
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private rt = inject(RealtimeService);
  auth = inject(AuthService);

  @ViewChild('thread') threadEl?: ElementRef<HTMLDivElement>;

  conversations = signal<Conversation[]>([]);
  messages = signal<ChatMessage[]>([]);
  otherId = signal<string | null>(null);
  draft = '';
  me = () => this.auth.user()?.id ?? '';

  constructor() {
    effect(() => {
      const m = this.rt.latestMessage();
      if (!m) return;
      const other = this.otherId();
      if (other && (m.senderId === other || m.receiverId === other)) {
        this.messages.update(arr => [...arr, m]);
        if (m.senderId === other) this.rt.markRead(m.id);
        // Live message while the thread is open — scroll down, animated.
        this.scrollAfterRender(true);
      }
      this.loadConversations();
    });

    // Update isRead status when sender gets notified
    effect(() => {
      const readId = this.rt.messageRead();
      if (readId == null) return;
      this.messages.update(arr => arr.map(m => m.id === readId ? { ...m, isRead: true } : m));
    });
  }

  ngOnInit() {
    this.rt.connect();
    this.loadConversations();
    this.route.paramMap.subscribe(p => {
      const id = p.get('userId');
      this.otherId.set(id);
      if (id) {
        this.api.thread(id).subscribe(t => {
          this.messages.set(t);
          // Initial load / conversation switch — jump straight to the
          // bottom, no animation. Called directly here (instead of via a
          // flag + ngAfterViewChecked, which wasn't firing reliably) so it
          // runs exactly once, right after the DOM has a chance to render
          // these messages — same proven pattern used for initMap()
          // elsewhere in this app.
          this.scrollAfterRender(false);
          // Mark all unread incoming messages via SignalR so sender sees ✓✓
          const unreadIds = t.filter(m => m.senderId === id && !m.isRead).map(m => m.id);
          unreadIds.forEach(mid => this.rt.markRead(mid));
          // Always refresh conversations to clear unread badge in left panel
          this.loadConversations();
          // Notify navbar to refresh chat badge (even if 0 unread, clears stale count)
          this.rt.notifyThreadRead();
        });
      } else {
        this.messages.set([]);
      }
    });
  }

  loadConversations() {
    this.api.conversations().subscribe(c => this.conversations.set(c));
  }

  /** Waits a tick for Angular to finish painting the newly-set messages,
   *  then scrolls the thread to the bottom. */
  private scrollAfterRender(smooth: boolean) {
    setTimeout(() => this.scrollToBottom(smooth), 50);
  }

  private scrollToBottom(smooth = false) {
    const el = this.threadEl?.nativeElement;
    if (!el) return;
    // Wait a full frame so the browser has finished layout for the
    // just-rendered @for messages before we measure scrollHeight.
    requestAnimationFrame(() => {
      if (smooth) {
        try {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        } catch {
          el.scrollTop = el.scrollHeight;
        }
      } else {
        el.scrollTop = el.scrollHeight; // instant, guaranteed
      }
    });
  }

  async send() {
    const other = this.otherId();
    if (!other || !this.draft.trim()) return;
    await this.rt.sendMessage(other, this.draft.trim());
    this.draft = '';
    this.scrollAfterRender(true); // your own outgoing message — animate down
  }
}