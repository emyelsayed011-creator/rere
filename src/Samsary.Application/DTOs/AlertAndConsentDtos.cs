namespace Samsary.Application.DTOs;

public record ListingAlertDto(long Id, int? CategoryId, string? CategoryName, string? Location, bool IsActive, DateTime CreatedAt);

public record NotificationPreferencesDto(
    bool EmailEnabled,
    bool SmsEnabled,
    bool WebPushEnabled,
    bool NotifyOnNewMessage,
    bool NotifyOnListingAlert,
    bool NotifyOnListingStatus,
    int MessageEmailDelayMinutes,
    bool ListingAlertDigest,
    int MaxListingAlertsPerDay,
    bool QuietHoursEnabled,
    int QuietHoursStartUtc,
    int QuietHoursEndUtc);

public record UserConsentDto(
    bool NecessaryConsent,
    bool AnalyticsConsent,
    bool MarketingConsent,
    bool TermsAccepted,
    string TermsVersion,
    bool PrivacyPolicyAccepted,
    DateTime AcceptedAt);
