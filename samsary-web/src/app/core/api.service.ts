import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  Advertisement, AuthUser, BanRecord, Category, ChatMessage, Conversation, Listing, ListingType,
  Moderator, ModeratorPermission, NotificationItem, PagedListings, PagedReviews, Review, ReviewSummary
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  // categories
  categories() { return this.http.get<Category[]>(`${this.base}/categories`); }

  // listings
  listings(opts: { q?: string; categoryId?: number; type?: ListingType; page?: number; pageSize?: number; } = {}) {
    let p = new HttpParams();
    if (opts.q) p = p.set('q', opts.q);
    if (opts.categoryId != null) p = p.set('categoryId', opts.categoryId);
    if (opts.type != null) p = p.set('type', opts.type);
    p = p.set('page', opts.page ?? 1).set('pageSize', opts.pageSize ?? 12);
    return this.http.get<PagedListings>(`${this.base}/listings`, { params: p });
  }
  listing(id: number) { return this.http.get<Listing>(`${this.base}/listings/${id}`); }
  myListings() { return this.http.get<Listing[]>(`${this.base}/listings/mine`); }
  createListing(body: any) { return this.http.post<Listing>(`${this.base}/listings`, body); }
  updateListing(id: number, body: any) { return this.http.put<Listing>(`${this.base}/listings/${id}`, body); }
  deleteListing(id: number) { return this.http.delete<void>(`${this.base}/listings/${id}`); }
  uploadImage(id: number, file: File) {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<any>(`${this.base}/listings/${id}/media/image`, fd);
  }
  uploadVideo(id: number, file: File) {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<any>(`${this.base}/listings/${id}/media/video`, fd, { reportProgress: false });
  }
  deleteMedia(listingId: number, mediaId: number) {
    return this.http.delete<void>(`${this.base}/listings/${listingId}/media/${mediaId}`);
  }

  // profile
  me() { return this.http.get<AuthUser>(`${this.base}/users/me`); }
  updateProfile(body: any) { return this.http.put<AuthUser>(`${this.base}/users/me`, body); }
  changePassword(body: any) { return this.http.post<void>(`${this.base}/users/me/change-password`, body); }
  uploadAvatar(file: File) {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<AuthUser>(`${this.base}/users/me/avatar`, fd);
  }

  // chat
  conversations() { return this.http.get<Conversation[]>(`${this.base}/chat/conversations`); }
  thread(otherId: string, take = 100) {
    return this.http.get<ChatMessage[]>(`${this.base}/chat/with/${otherId}`, { params: new HttpParams().set('take', take) });
  }

  // notifications
  notifications(unreadOnly = false) {
    return this.http.get<{ unread: number; items: NotificationItem[] }>(
      `${this.base}/notifications`, { params: new HttpParams().set('unreadOnly', unreadOnly) });
  }
  markNotification(id: number) { return this.http.post<void>(`${this.base}/notifications/${id}/read`, {}); }
  markAllRead() { return this.http.post<void>(`${this.base}/notifications/read-all`, {}); }
  getNotificationPrefs() { return this.http.get<any>(`${this.base}/notifications/preferences`); }
  updateNotificationPrefs(body: any) { return this.http.put<any>(`${this.base}/notifications/preferences`, body); }

  // reviews
  listingReviews(listingId: number, page = 1, pageSize = 10) {
    return this.http.get<PagedReviews>(`${this.base}/listings/${listingId}/reviews`,
      { params: new HttpParams().set('page', page).set('pageSize', pageSize) });
  }
  reviewSummary(listingId: number) {
    return this.http.get<ReviewSummary>(`${this.base}/listings/${listingId}/reviews/summary`);
  }
  createReview(listingId: number, body: { rating: number; content: string }) {
    return this.http.post<Review>(`${this.base}/listings/${listingId}/reviews`, body);
  }
  adminReviews(page = 1, includeDeleted = false) {
    return this.http.get<PagedReviews>(`${this.base}/admin/reviews`,
      { params: new HttpParams().set('page', page).set('includeDeleted', includeDeleted) });
  }
  adminDeleteReview(id: number, reason: string) {
    return this.http.delete<void>(`${this.base}/admin/reviews/${id}`, { body: { reason } });
  }

  // ban
  adminBanUser(id: string, reason: string, durationHours: number | null) {
    return this.http.post<void>(`${this.base}/admin/users/${id}/ban`, { reason, durationHours });
  }
  adminUnbanUser(id: string) {
    return this.http.post<void>(`${this.base}/admin/users/${id}/unban`, {});
  }

  // admin
  adminDashboard() { return this.http.get<any>(`${this.base}/admin/dashboard`); }
  adminPending() { return this.http.get<any[]>(`${this.base}/admin/listings/pending`); }
  adminApprove(id: number) { return this.http.post<void>(`${this.base}/admin/listings/${id}/approve`, {}); }
  adminReject(id: number, reason: string) {
    return this.http.post<void>(`${this.base}/admin/listings/${id}/reject`, { reason });
  }
  adminUsers(page = 1) { return this.http.get<any>(`${this.base}/admin/users`, { params: new HttpParams().set('page', page) }); }
  adminBlock(id: string, block: boolean) {
    return this.http.post<void>(`${this.base}/admin/users/${id}/block`, {}, { params: new HttpParams().set('block', block) });
  }
  adminMessage(id: string, body: string) {
    return this.http.post<void>(`${this.base}/admin/users/${id}/message`, { receiverId: id, body });
  }
  adminLogs(page = 1, level?: string) {
    let p = new HttpParams().set('page', page);
    if (level) p = p.set('level', level);
    return this.http.get<any>(`${this.base}/admin/logs`, { params: p });
  }

  // advertisements
  activeAds(placement: string) {
    return this.http.get<Advertisement[]>(`${this.base}/advertisements/${placement}`);
  }
  trackAdClick(id: number) {
    return this.http.post<void>(`${this.base}/advertisements/${id}/click`, {});
  }
  adminAds() { return this.http.get<Advertisement[]>(`${this.base}/advertisements`); }
  adminCreateAd(body: Partial<Advertisement>) {
    return this.http.post<Advertisement>(`${this.base}/advertisements`, body);
  }
  adminUpdateAd(id: number, body: Partial<Advertisement> & { isActive: boolean }) {
    return this.http.put<Advertisement>(`${this.base}/advertisements/${id}`, body);
  }
  adminDeleteAd(id: number) {
    return this.http.delete<void>(`${this.base}/advertisements/${id}`);
  }

  // consent
  saveConsent(body: object) {
    return this.http.post<void>(`${this.base}/consent`, body);
  }
  getConsent(sessionId?: string) {
    const p = sessionId ? new HttpParams().set('sessionId', sessionId) : undefined;
    return this.http.get<any>(`${this.base}/consent`, { params: p });
  }

  // moderators (admin only)
  getModerators() { return this.http.get<Moderator[]>(`${this.base}/admin/moderators`); }
  createModerator(userId: string, permissions: ModeratorPermission) {
    return this.http.post<Moderator>(`${this.base}/admin/moderators`, { userId, permissions });
  }
  updateModeratorPermissions(userId: string, permissions: ModeratorPermission) {
    return this.http.put<Moderator>(`${this.base}/admin/moderators/${userId}`, { permissions });
  }
  removeModerator(userId: string) {
    return this.http.delete<void>(`${this.base}/admin/moderators/${userId}`);
  }
}
