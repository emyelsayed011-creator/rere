namespace Samsary.Domain.Enums;

public enum ListingType
{
    Sell = 1,
    Rent = 2
}

public enum ListingStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Sold = 3,
    Rented = 4
}

public enum MediaType
{
    Image = 1,
    Video = 2
}

public enum NotificationType
{
    System = 0,
    ListingApproved = 1,
    ListingRejected = 2,
    NewMessage = 3,
    Admin = 4,
    UserBanned = 5,
    UserUnbanned = 6,
    ReviewReceived = 7,
    ReviewDeleted = 8,
    ListingAlert = 9
}

public enum NotificationChannel
{
    InApp = 1,
    Email = 2,
    Sms = 4,
    WebPush = 8
}

[Flags]
public enum ModeratorPermission
{
    None           = 0,
    ManageListings = 1 << 0,
    ManageUsers    = 1 << 1,
    ManageReviews  = 1 << 2,
    ViewLogs       = 1 << 3,
    ManageAds      = 1 << 4
}
