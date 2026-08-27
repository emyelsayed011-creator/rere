namespace Samsary.Application.Common.Interfaces;

/// <summary>Filters review / comment text for profanity and banned words.</summary>
public interface IBadWordFilter
{
    /// <summary>Returns true when the text contains a banned word.</summary>
    bool ContainsBadWord(string text);

    /// <summary>Replaces banned words with asterisks and returns the cleaned text.</summary>
    string Sanitize(string text);
}
