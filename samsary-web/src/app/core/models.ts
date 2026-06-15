export enum ListingType { Sell = 1, Rent = 2 }
export enum ListingStatus { Pending = 0, Approved = 1, Rejected = 2, Sold = 3, Rented = 4 }
export enum MediaType { Image = 1, Video = 2 }

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  roles: string[];
}

export interface AuthResponse { token: string; expiresAt: string; user: AuthUser; }

export interface Category { id: number; name: string; slug: string; iconClass?: string; }

export interface Media {
  id: number; url: string; publicId: string;
  mediaType: MediaType; durationSeconds?: number; thumbnailUrl?: string;
}

export interface Listing {
  id: number; title: string; description: string;
  price: number; currency: string;
  type: ListingType; status: ListingStatus;
  location?: string; rejectionReason?: string;
  category: Category;
  ownerId: string; ownerDisplayName: string; ownerAvatarUrl?: string;
  createdAt: string; media: Media[];
}

export interface PagedListings { total: number; page: number; pageSize: number; items: Listing[]; }

export interface ChatMessage {
  id: number; senderId: string; senderName: string; receiverId: string;
  body: string; sentAt: string; isRead: boolean; relatedListingId?: number;
}

export interface Conversation {
  otherUserId: string; otherUserDisplayName: string; otherUserAvatarUrl?: string;
  lastMessage: string; lastMessageAt: string; unreadCount: number;
}

export interface NotificationItem {
  id: number; type: number; title: string; message: string;
  link?: string; isRead: boolean; createdAt: string;
}
