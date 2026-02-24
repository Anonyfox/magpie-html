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

/**
 * Input type that accepts either a parsed Document or raw HTML string.
 * This allows extractor functions to be more forgiving.
 */
export type DocumentInput = Document | string;

/**
 * Ensure input is a parsed Document.
 * If given a string, parses it. If given a Document, returns it as-is.
 *
 * @param input - Either a parsed Document or raw HTML string
 * @param baseUrl - Optional base URL (only used if parsing string)
 * @returns Parsed Document
 */
export function ensureDocument(input: DocumentInput, baseUrl?: string): Document {
  if (typeof input === 'string') {
    return parseHTML(input, baseUrl);
  }
  return input;
}
