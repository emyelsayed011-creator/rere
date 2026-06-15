namespace Samsary.Api.Models;

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
    Admin = 4
}

public enum NotificationChannel
{
    InApp = 1,
    Email = 2,
    Sms = 4,
    WebPush = 8
}
