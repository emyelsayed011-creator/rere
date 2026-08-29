import { Injectable, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ChatMessage, NotificationItem } from './models';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private auth = inject(AuthService);
  private chat?: HubConnection;
  private notif?: HubConnection;

  readonly latestMessage = signal<ChatMessage | null>(null);
  readonly latestNotification = signal<NotificationItem | null>(null);
  readonly unreadDelta = signal(0);
  readonly messageRead = signal<number | null>(null);
  readonly chatThreadOpened = signal(0);   // increments when user opens a thread and marks messages read
  readonly newListing = signal<{ id: number; title: string; category?: string; price: number; currency: string; type: number; location?: string } | null>(null);

  async connect() {
    const token = this.auth.token();
    if (!token) return;
    if (!this.chat) {
      this.chat = new HubConnectionBuilder()
        .withUrl(`${environment.hubBase}/chat`, { accessTokenFactory: () => token })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();
      this.chat.on('receiveMessage', (m: ChatMessage) => this.latestMessage.set(m));
      this.chat.on('messageSent',    (m: ChatMessage) => this.latestMessage.set(m));
      this.chat.on('messageRead', (id: number) => this.messageRead.set(id));
      await this.chat.start();
    }
    if (!this.notif) {
      this.notif = new HubConnectionBuilder()
        .withUrl(`${environment.hubBase}/notifications`, { accessTokenFactory: () => token })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();
      this.notif.on('notify', (n: NotificationItem) => {
        this.latestNotification.set(n);
        this.unreadDelta.update(v => v + 1);
      });
      this.notif.on('newListing', (l: any) => this.newListing.set(l));
      await this.notif.start();
    }
  }

  async sendMessage(receiverId: string, body: string, relatedListingId?: number) {
    if (!this.chat) await this.connect();
    await this.chat?.invoke('SendMessage', receiverId, body, relatedListingId ?? null);
  }

  async markRead(messageId: number) {
    await this.chat?.invoke('MarkRead', messageId);
  }

  notifyThreadRead() { this.chatThreadOpened.update(v => v + 1); }

  async disconnect() {
    await this.chat?.stop(); this.chat = undefined;
    await this.notif?.stop(); this.notif = undefined;
  }
}
