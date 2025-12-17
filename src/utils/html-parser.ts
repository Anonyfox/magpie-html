/**
 * HTML parsing utilities using linkedom.
 *
 * @remarks
 * This module provides a simple wrapper around linkedom for consistent
 * HTML parsing across all metadata extraction modules. Parsing should happen
 * once at the top level and the parsed document passed to all extractors.
 *
 * @packageDocumentation
 */

import { parseHTML as linkedomParseHTML } from 'linkedom';

/**
 * Parse HTML string into a DOM document.
 *
 * @remarks
 * Parses HTML using linkedom, providing a standards-compliant DOM implementation.
 * This should be called once per document, with the result passed to all metadata
 * extractors for performance.
 *
 * Never throws - returns a document even for malformed HTML.
 *
 * @param html - HTML string to parse
 * @param baseUrl - Optional base URL for resolving relative URLs
 * @returns Parsed DOM document
 *
 * @example
 * ```typescript
 * const doc = parseHTML('<html><head><title>Test</title></head></html>');
 * const title = doc.querySelector('title')?.textContent;
 * ```
 */
export function parseHTML(html: string, baseUrl?: string): Document {
  const { document } = linkedomParseHTML(html, {
    url: baseUrl || 'https://example.com',
  });
  return document;
}

// Export Document type alias for convenience
// Note: This is the standard DOM Document type from linkedom
export type HTMLDocument = Document;
