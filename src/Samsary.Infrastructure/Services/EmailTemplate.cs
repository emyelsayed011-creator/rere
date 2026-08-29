namespace Samsary.Infrastructure.Services;

/// <summary>Generates branded transactional email HTML. All methods return self-contained HTML strings.</summary>
internal static class EmailTemplate
{
    public static string Notification(
        string appName, string appBaseUrl, string appColor,
        string title, string body, string? ctaLabel = null, string? ctaPath = null)
    {
        // ctaPath can be a relative path (/notifications) or a full URL
        var ctaUrl = ctaPath is not null
            ? (ctaPath.StartsWith("http") ? ctaPath : $"{appBaseUrl.TrimEnd('/')}{ctaPath}")
            : appBaseUrl;
        var ctaBlock = ctaLabel is not null ? $@"
            <div style='text-align:center;margin:28px 0 8px'>
              <a href='{ctaUrl}' style='background:{appColor};color:#fff;padding:12px 32px;
                 border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block'>
                {ctaLabel}
              </a>
            </div>" : "";

        return $@"<!DOCTYPE html><html lang='ar' dir='rtl'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<title>{title}</title></head>
<body style='margin:0;padding:0;background:#f4f6f9;font-family:Cairo,Helvetica,Arial,sans-serif;direction:rtl'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6f9;padding:32px 0'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%'>

        <!-- Header -->
        <tr><td style='background:{appColor};border-radius:12px 12px 0 0;padding:24px 32px;text-align:center'>
          <h1 style='margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px'>{appName}</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style='background:#fff;padding:32px 40px;border-radius:0 0 12px 12px;
            box-shadow:0 4px 16px rgba(0,0,0,.08)'>
          <h2 style='margin:0 0 12px;font-size:20px;color:#1a2b3c;font-weight:700'>{title}</h2>
          <p style='margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7'>{body}</p>
          {ctaBlock}
          <hr style='border:none;border-top:1px solid #edf2f7;margin:28px 0'>
          <p style='margin:0;color:#a0aec0;font-size:12px;text-align:center'>
            هذا الإيميل أُرسل إليك من منصة <strong>{appName}</strong> · 
            <a href='{appBaseUrl}' style='color:{appColor};text-decoration:none'>{appBaseUrl.Replace("https://","")}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style='padding:16px 32px;text-align:center'>
          <p style='margin:0;color:#a0aec0;font-size:11px'>
            إذا لم تكن تتوقع هذا الإيميل يمكنك تجاهله بأمان.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>";
    }
}
