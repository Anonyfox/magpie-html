/**
 * HTML parsing utilities using node-html-parser.
 *
 * @remarks
 * This module provides a simple wrapper around node-html-parser for consistent
 * HTML parsing across all metadata extraction modules. Parsing should happen
 * once at the top level and the parsed document passed to all extractors.
 *
 * @packageDocumentation
 */

import { type HTMLElement, parse } from 'node-html-parser';

/**
 * Parse HTML string into a document tree.
 *
 * @remarks
 * Parses HTML using node-html-parser. This should be called once per document,
 * with the result passed to all metadata extractors for performance.
 *
 * Never throws - returns a document even for malformed HTML.
 *
 * @param html - HTML string to parse
 * @returns Parsed HTML document tree
 *
 * @example
 * ```typescript
 * const doc = parseHTML('<html><head><title>Test</title></head></html>');
 * const title = doc.querySelector('title')?.text;
 * ```
 */
export function parseHTML(html: string): HTMLElement {
  return parse(html, {
    comment: false, // Ignore comments for performance
    blockTextElements: {
      script: true, // Preserve script content (needed for JSON-LD extraction)
      style: false, // Don't preserve style content
      noscript: false, // Don't preserve noscript content
    },
  });
}

// Re-export HTMLElement type for convenience
export type { HTMLElement };
