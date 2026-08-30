using System.Collections.Generic;

namespace Samsary.Infrastructure.Services;

public static class EmailTemplateRenderer
{
    // Very small placeholder renderer: replaces {{Key}} with value.
    public static string Render(string template, IDictionary<string, string?> values)
    {
        if (string.IsNullOrEmpty(template)) return string.Empty;
        if (values is null) return template;
        foreach (var kv in values)
        {
            var placeholder = "{{" + kv.Key + "}}";
            template = template.Replace(placeholder, kv.Value ?? string.Empty);
        }
        return template;
    }
}
