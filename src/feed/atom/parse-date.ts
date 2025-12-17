/**
 * Atom date parsing utilities
 * Atom uses RFC 3339 / ISO 8601 date format
 * Examples: "2025-12-17T10:00:00Z", "2025-12-17T10:00:00+01:00"
 */

/**
 * Parse RFC 3339 / ISO 8601 date to ISO 8601 string
 * Atom dates are already in ISO 8601 format, just validate and normalize
 */
export function parseRFC3339Date(dateString: string | null | undefined): string | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const trimmed = dateString.trim();
  if (!trimmed) {
    return null;
  }

  try {
    // JavaScript's Date constructor handles ISO 8601 / RFC 3339 well
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
 * Parse Atom date (alias for clarity)
 */
export function parseAtomDate(dateString: string | null | undefined): string | null {
  return parseRFC3339Date(dateString);
}

/**
 * Check if a date string is valid
 */
export function isValidAtomDate(dateString: string | null | undefined): boolean {
  return parseRFC3339Date(dateString) !== null;
}
