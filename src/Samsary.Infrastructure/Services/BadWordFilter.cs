using System.Text.RegularExpressions;
using Samsary.Application.Common.Interfaces;

namespace Samsary.Infrastructure.Services;

/// <summary>
/// In-process bad-word filter using a curated word list.
/// Words are matched as whole words (word-boundary aware) and are case-insensitive.
/// Extend the <see cref="BannedWords"/> list or replace with a database-driven source.
/// </summary>
public sealed class BadWordFilter : IBadWordFilter
{
    // ── Word list ──────────────────────────────────────────────────────────────
    // Common English & Arabic profanity/hate keywords. Keep alphabetical.
    private static readonly string[] BannedWords =
    [
        // English
        "ass", "asshole", "bastard", "bitch", "bullshit", "crap", "cunt",
        "damn", "dick", "douche", "dumbass", "faggot", "fuck", "fucker",
        "fucking", "goddamn", "hell", "idiot", "jackass", "jerk", "moron",
        "motherfucker", "nigga", "nigger", "penis", "piss", "porn", "prick",
        "pussy", "rape", "retard", "shit", "slut", "stupid", "suck",
        "twat", "vagina", "whore",
        // Arabic transliterated common equivalents (Latin characters)
        "kuss", "kos", "khara", "ibn el sharmouta", "sharmouta", "zamel",
        "manayak", "ars", "kalb",
    ];

    private static readonly Regex _regex = BuildRegex();

    private static Regex BuildRegex()
    {
        // Escape each word and join with | — match whole-word only
        var pattern = string.Join("|", BannedWords.Select(Regex.Escape));
        return new Regex($@"\b({pattern})\b",
            RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.CultureInvariant);
    }

    public bool ContainsBadWord(string text) =>
        !string.IsNullOrWhiteSpace(text) && _regex.IsMatch(text);

    public string Sanitize(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;
        return _regex.Replace(text, m => new string('*', m.Length));
    }
}
