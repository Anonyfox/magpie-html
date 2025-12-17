/**
 * Links extraction and aggregation for websites.
 *
 * @packageDocumentation
 */

import { extractLinks } from '../../metadata/links/index.js';
import type { HTMLDocument as Document } from '../../utils/html-parser.js';

/**
 * Result of link extraction with internal and external links separated.
 */
export interface ExtractedLinksResult {
  /** Internal links (same domain, excluding current page URL) */
  internal: string[];
  /** External links (different domains) */
  external: string[];
}

/**
 * Extract and categorize links from a page.
 *
 * @remarks
 * Strategy:
 * 1. Extract all links using the links metadata extractor
 * 2. Separate into internal (same domain) and external (different domains)
 * 3. Exclude the current page URL from internal links (self-reference)
 * 4. Return arrays of unique URL strings
 *
 * @param doc - Parsed HTML document
 * @param pageUrl - Current page URL (for categorization and self-exclusion)
 * @returns Object with internal and external link arrays
 *
 * @example
 * ```typescript
 * const doc = parseHTML(html);
 * const { internal, external } = extractPageLinks(doc, 'https://example.com/page');
 * console.log(internal); // ['https://example.com/about', 'https://example.com/contact']
 * console.log(external); // ['https://other.com', 'https://twitter.com/...']
 * ```
 */
export function extractPageLinks(doc: Document, pageUrl: string): ExtractedLinksResult {
  // Extract all links with categorization
  const linksMetadata = extractLinks(doc, pageUrl, {
    deduplicate: true,
    includeHashLinks: false, // Exclude #anchor links
  });

  // Normalize current page URL for comparison (remove hash/query if present)
  const currentUrl = normalizePageUrl(pageUrl);

  // Extract internal links (exclude self-reference)
  const internal: string[] = [];
  if (linksMetadata.internal) {
    for (const link of linksMetadata.internal) {
      const normalizedLink = normalizePageUrl(link.url);
      // Exclude the current page itself
      if (normalizedLink !== currentUrl) {
        internal.push(link.url);
      }
    }
  }

  // Extract external links
  const external: string[] = [];
  if (linksMetadata.external) {
    for (const link of linksMetadata.external) {
      external.push(link.url);
    }
  }

  return {
    internal,
    external,
  };
}

/**
 * Normalize a page URL for comparison (remove hash and query params).
 *
 * @remarks
 * This ensures we can properly detect self-references even if the link
 * includes query parameters or hash fragments.
 *
 * @param url - URL to normalize
 * @returns Normalized URL (origin + pathname)
 */
function normalizePageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Return origin + pathname (no query, no hash)
    return parsed.origin + parsed.pathname;
  } catch {
    return url;
  }
}
