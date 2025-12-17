/**
 * RSS date parsing utilities
 * RSS 2.0 uses RFC 822 date format
 * Examples: "Wed, 02 Oct 2002 13:00:00 GMT", "Wed, 02 Oct 2002 15:00:00 +0200"
 */

/**
 * Parse RFC 822 date to ISO 8601 string
 * Returns null if date is invalid or cannot be parsed
 */
export function parseRFC822Date(dateString: string | null | undefined): string | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const trimmed = dateString.trim();
  if (!trimmed) {
    return null;
  }

  try {
    // JavaScript's Date constructor handles RFC 822 format
    const date = new Date(trimmed);

    // Check if date is valid
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    // Return as ISO 8601 string
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Parse RSS pubDate or lastBuildDate
 * Alias for parseRFC822Date for clarity
 */
export function parseRSSDate(dateString: string | null | undefined): string | null {
  return parseRFC822Date(dateString);
}

/**
 * Check if a date string is valid
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  return parseRFC822Date(dateString) !== null;
}

