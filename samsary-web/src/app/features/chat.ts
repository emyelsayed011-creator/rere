import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { RealtimeService } from '../core/realtime.service';
import { ChatMessage, Conversation } from '../core/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
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
              <div class="p-3 text-center text-muted small">No conversations yet.</div>
            }
          </div>
        </div>
      </div>

      <div class="col-md-8">
        @if (otherId()) {
          <div class="chat-thread mb-2" #thread>
            @for (m of messages(); track m.id) {
              <div class="d-flex">
                <div class="chat-bubble" [class.me]="m.senderId === me()" [class.them]="m.senderId !== me()">
                  <div>{{ m.body }}</div>
                  <div class="small opacity-75 text-end mt-1">{{ m.sentAt | date:'shortTime' }}</div>
                </div>
              </div>
            } @empty { <div class="text-muted text-center py-5">Say hello!</div> }
          </div>
          <div class="input-group">
            <textarea class="form-control" rows="1" [(ngModel)]="draft"
              (keydown.enter)="$event.preventDefault(); send()" placeholder="Type a message…"></textarea>
            <button class="btn btn-samsary" (click)="send()" [disabled]="!draft.trim()">
              <i class="bi bi-send"></i>
            </button>
          </div>
        } @else {
          <div class="text-muted text-center py-5">
            <i class="bi bi-chat-square-text fs-1"></i>
            <div class="mt-2">Select a conversation</div>
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
      }
      this.loadConversations();
    });
  }

  ngOnInit() {
    this.rt.connect();
    this.loadConversations();
    this.route.paramMap.subscribe(p => {
      const id = p.get('userId');
      this.otherId.set(id);
      if (id) this.api.thread(id).subscribe(t => this.messages.set(t));
      else this.messages.set([]);
    });
  }

  loadConversations() {
    this.api.conversations().subscribe(c => this.conversations.set(c));
  }

  async send() {
    const other = this.otherId();
    if (!other || !this.draft.trim()) return;
    await this.rt.sendMessage(other, this.draft.trim());
    this.draft = '';
  }
}
