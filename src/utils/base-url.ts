/**
 * Base URL extraction and resolution utilities.
 *
 * @remarks
 * Utilities for extracting the base URL from HTML documents and using it
 * for URL resolution. The <base> tag, if present, affects all relative URLs.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../utils/html-parser.js';

/**
 * Extract base URL from document.
 *
 * @remarks
 * Checks for a <base href="..."> tag in the document. If found, returns its href.
 * Otherwise, returns the provided document URL (if any).
 *
 * The base URL should be used for all relative URL resolution in the document.
 *
 * @param doc - Parsed HTML document
 * @param documentUrl - The URL of the document itself (optional)
 * @returns Base URL to use for resolution, or undefined if neither base tag nor document URL provided
 *
 * @example
 * ```typescript
 * const baseUrl = getBaseUrl(doc, 'https://example.com/page.html');
 * // If <base href="https://cdn.example.com/"> exists, returns that
 * // Otherwise returns 'https://example.com/page.html'
 * ```
 */
export function getBaseUrl(doc: Document, documentUrl?: string | URL): string | undefined {
  // Check for <base> tag first
  const baseElement = doc.querySelector('base[href]');
  const baseHref = baseElement?.getAttribute('href');

  if (baseHref) {
    // Base tag found - resolve it against document URL if relative
    if (documentUrl) {
      try {
        const resolved = new URL(baseHref, documentUrl.toString());
        return resolved.href;
      } catch {
        // If resolution fails, return as-is
        return baseHref;
      }
    }
    return baseHref;
  }

  // No base tag - use document URL if provided
  if (documentUrl) {
    return documentUrl.toString();
  }

  return undefined;
}
