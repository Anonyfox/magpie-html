/**
 * URL determination for websites.
 *
 * @packageDocumentation
 */

import { extractCanonical } from '../../metadata/canonical/index.js';
import type { HTMLDocument as Document } from '../../utils/html-parser.js';

/**
 * Extract the best/authoritative URL for a page.
 *
 * @remarks
 * Strategy:
 * 1. Check for canonical URL in <link rel="canonical"> tag (authoritative)
 * 2. Fall back to the final URL after redirects (from fetch)
 *
 * The canonical URL is preferred as it represents the publisher's intended
 * URL for the content, even if accessed via a different URL or redirect chain.
 *
 * @param doc - Parsed HTML document
 * @param finalUrl - Final URL after following redirects (from pluck)
 * @returns Best available URL (canonical or final URL)
 *
 * @example
 * ```typescript
 * const doc = parseHTML(html);
 * const url = extractBestUrl(doc, 'https://example.com/page');
 * console.log(url); // Canonical URL if present, otherwise finalUrl
 * ```
 */
export function extractBestUrl(doc: Document, finalUrl: string): string {
  // 1. Try canonical URL (authoritative)
  const canonical = extractCanonical(doc);
  if (canonical.canonical?.trim()) {
    return canonical.canonical.trim();
  }

  // 2. Fall back to final URL after redirects
  return finalUrl;
}
