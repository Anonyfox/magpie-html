/**
 * Sitemap discovery extraction.
 *
 * @remarks
 * Discovers XML sitemaps in HTML documents.
 *
 * @packageDocumentation
 */

import { type DocumentInput, ensureDocument } from '../../utils/html-parser.js';
import { getAllLinks } from '../../utils/link-helpers.js';
import { generateSitemapSuggestions } from './heuristics.js';
import type { SitemapDiscoveryMetadata } from './types.js';

/**
 * Extract sitemap discovery metadata from HTML.
 *
 * @remarks
 * Finds all sitemaps declared in <link rel="sitemap"> tags and generates
 * suggestions for common sitemap URL patterns.
 *
 * @param input - Parsed HTML document or raw HTML string
 * @param documentUrl - Optional document URL for generating absolute sitemap suggestions
 * @returns Sitemap discovery metadata
 *
 * @example
 * ```typescript
 * // With parsed document (recommended for multiple extractions)
 * const doc = parseHTML(htmlString);
 * const sitemaps = extractSitemapDiscovery(doc, 'https://example.com');
 *
 * // Or directly with HTML string
 * const sitemaps = extractSitemapDiscovery(htmlString, 'https://example.com');
 * ```
 */
export function extractSitemapDiscovery(
  input: DocumentInput,
  documentUrl?: string | URL,
): SitemapDiscoveryMetadata {
  const doc = ensureDocument(input);
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
