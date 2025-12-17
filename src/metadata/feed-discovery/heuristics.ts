/**
 * Feed discovery heuristics.
 *
 * @remarks
 * Common feed URL patterns and heuristics for feed discovery.
 *
 * @packageDocumentation
 */

/**
 * Common feed URL patterns to check.
 *
 * @remarks
 * These are common patterns for feed URLs. They should be checked relative
 * to the site's base URL.
 */
export const COMMON_FEED_PATHS = [
  '/feed',
  '/feed/',
  '/feeds',
  '/feeds/',
  '/rss',
  '/rss/',
  '/rss.xml',
  '/feed.xml',
  '/atom.xml',
  '/index.xml',
  '/feed.json',
  '/feed.rss',
  '/blog/feed',
  '/blog/rss',
  '/news/feed',
  '/news/rss',
];

/**
 * Generate feed URL suggestions based on the document URL.
 *
 * @remarks
 * Returns common feed URLs that might exist, relative to the document URL.
 * These are just suggestions - not verified to actually exist.
 *
 * @param documentUrl - The URL of the current document
 * @returns Array of suggested feed URLs
 */
export function generateFeedSuggestions(documentUrl?: string | URL): string[] {
  if (!documentUrl) {
    return COMMON_FEED_PATHS;
  }

  try {
    const url = typeof documentUrl === 'string' ? new URL(documentUrl) : documentUrl;
    const origin = url.origin;

    // Generate full URLs by combining origin with common paths
    return COMMON_FEED_PATHS.map((path) => `${origin}${path}`);
  } catch {
    // If URL parsing fails, return relative paths
    return COMMON_FEED_PATHS;
  }
}
