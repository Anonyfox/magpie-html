/**
 * Sitemap discovery heuristics.
 *
 * @remarks
 * Common sitemap URL patterns and heuristics.
 *
 * @packageDocumentation
 */

/**
 * Common sitemap URL patterns to check.
 *
 * @remarks
 * These are standard locations where sitemaps are typically found.
 * Should be checked relative to the site's base URL.
 */
export const COMMON_SITEMAP_PATHS = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemap-index.xml',
  '/sitemapindex.xml',
  '/sitemap1.xml',
  '/sitemap.xml.gz',
  '/sitemap_index.xml.gz',
  '/sitemap.php',
  '/sitemap/',
  '/sitemaps.xml',
  '/sitemaps/sitemap.xml',
  '/sitemap/sitemap.xml',
  '/wp-sitemap.xml', // WordPress
  '/page-sitemap.xml', // WordPress
  '/post-sitemap.xml', // WordPress
];

/**
 * Generate sitemap URL suggestions based on the document URL.
 *
 * @remarks
 * Returns common sitemap URLs that might exist, relative to the document URL.
 * These are just suggestions - not verified to actually exist.
 *
 * Also includes robots.txt location which typically references sitemaps.
 *
 * @param documentUrl - The URL of the current document
 * @returns Array of suggested sitemap URLs
 */
export function generateSitemapSuggestions(documentUrl?: string | URL): string[] {
  if (!documentUrl) {
    // Return paths with robots.txt included
    return ['/robots.txt', ...COMMON_SITEMAP_PATHS];
  }

  try {
    const url = typeof documentUrl === 'string' ? new URL(documentUrl) : documentUrl;
    const origin = url.origin;

    // Generate full URLs by combining origin with common paths
    const suggestions = [
      `${origin}/robots.txt`, // robots.txt often references sitemaps
      ...COMMON_SITEMAP_PATHS.map((path) => `${origin}${path}`),
    ];

    return suggestions;
  } catch {
    // If URL parsing fails, return relative paths
    return ['/robots.txt', ...COMMON_SITEMAP_PATHS];
  }
}
