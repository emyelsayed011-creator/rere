export enum ListingType { Sell = 1, Rent = 2 }
export enum ListingStatus { Pending = 0, Approved = 1, Rejected = 2, Sold = 3, Rented = 4 }
export enum MediaType { Image = 1, Video = 2 }

export interface Advertisement {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  placement: string;
  isActive: boolean;
  startsAt: string;
  endsAt?: string;
  impressionCount: number;
  clickCount: number;
  // Targeting
  targetAudience: string;
  targetCountries?: string;
  targetGenders?: string;
  targetMinAge?: number;
  targetMaxAge?: number;
  targetLocations?: string;
  // Linked listing
  listingId?: number;
  listingTitle?: string;
  listingPrice?: number;
  listingCurrency?: string;
  listingLocation?: string;
  listingImageUrl?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  roles: string[];
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  emailConfirmed: boolean;
  /** Bitmask of ModeratorPermission — present only for Moderator role users. */
  modPermissions?: number;
}

export interface AuthResponse { token: string; expiresAt: string; user: AuthUser; }

export interface Category { id: number; name: string; nameAr?: string; slug: string; iconClass?: string; }

export interface Media {
  id: number; url: string; publicId: string;
  mediaType: MediaType; durationSeconds?: number; thumbnailUrl?: string;
}

export interface Listing {
  id: number; title: string; description: string;
  price: number; currency: string;
  type: ListingType; status: ListingStatus;
  location?: string; rejectionReason?: string;
  isNegotiable: boolean;
  ownerPhone?: string;
  category: Category;
  ownerId: string; ownerDisplayName: string; ownerAvatarUrl?: string;
  createdAt: string; media: Media[];
}

export interface PagedListings { total: number; page: number; pageSize: number; items: Listing[]; }

export interface PublicUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  approvedListingsCount: number;
  memberSince?: string;
  phone?: string;
  email?: string;
  country?: string;
}

export interface Review {
  id: number; listingId: number;
  authorId: string; authorName: string; authorAvatarUrl?: string;
  rating: number; content: string; createdAt: string;
  isDeleted: boolean; deletionReason?: string;
}

export interface ReviewSummary {
  averageRating: number; totalCount: number;
  starCounts: number[]; // index 0 = 1-star … 4 = 5-star
}

export interface PagedReviews { items: Review[]; total: number; page: number; pageSize: number; totalPages: number; }

export interface BanRecord {
  id: number; reason: string; bannedAt: string; bannedUntil?: string; isActive: boolean; liftedAt?: string;
}

// ── Moderator permission flags (mirrors backend enum) ──────────────────────
export enum ModeratorPermission {
  None           = 0,
  ManageListings = 1 << 0,
  ManageUsers    = 1 << 1,
  ManageReviews  = 1 << 2,
  ViewLogs       = 1 << 3,
  ManageAds      = 1 << 4,
  All            = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4)
}

export interface Moderator {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  permissions: ModeratorPermission;
  createdAt: string;
  isActive: boolean;
}

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
