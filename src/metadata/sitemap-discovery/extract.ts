/**
 * Sitemap discovery extraction.
 *
 * @remarks
 * Discovers XML sitemaps in HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../../utils/html-parser.js';
import { getAllLinks } from '../../utils/link-helpers.js';
import { generateSitemapSuggestions } from './heuristics.js';
import type { SitemapDiscoveryMetadata } from './types.js';

/**
 * Extract sitemap discovery metadata from parsed HTML document.
 *
 * @remarks
 * Finds all sitemaps declared in <link rel="sitemap"> tags and generates
 * suggestions for common sitemap URL patterns.
 *
 * @param doc - Parsed HTML document
 * @param documentUrl - Optional document URL for generating absolute sitemap suggestions
 * @returns Sitemap discovery metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const sitemaps = extractSitemapDiscovery(doc, 'https://example.com');
 * console.log(sitemaps.sitemaps); // Discovered sitemaps
 * console.log(sitemaps.suggestions); // Suggested sitemap URLs
 * ```
 */
export function extractSitemapDiscovery(
  doc: Document,
  documentUrl?: string | URL,
): SitemapDiscoveryMetadata {
  const metadata: SitemapDiscoveryMetadata = {
    sitemaps: [],
  };

  // Find all sitemap links
  const sitemapLinks = getAllLinks(doc, 'sitemap');

  // Extract URLs
  metadata.sitemaps = sitemapLinks.map((link) => link.href);

  // Generate suggestions if document URL provided
  if (documentUrl) {
    metadata.suggestions = generateSitemapSuggestions(documentUrl);
  }

  return metadata;
}
