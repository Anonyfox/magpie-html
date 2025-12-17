/**
 * Pagination metadata extraction.
 *
 * @remarks
 * Extracts pagination navigation links from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../../utils/html-parser.js';
import { getLinkHref } from '../../utils/link-helpers.js';
import type { PaginationMetadata } from './types.js';

/**
 * Extract pagination metadata from parsed HTML document.
 *
 * @remarks
 * Extracts pagination navigation links including prev, next, first, last,
 * up (parent), and index links.
 *
 * @param doc - Parsed HTML document
 * @returns Pagination metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const pagination = extractPagination(doc);
 * console.log(pagination.prev); // Previous page URL
 * console.log(pagination.next); // Next page URL
 * ```
 */
export function extractPagination(doc: Document): PaginationMetadata {
  const metadata: PaginationMetadata = {};

  // Extract prev/previous (both rel values are valid)
  metadata.prev = getLinkHref(doc, 'prev') || getLinkHref(doc, 'previous');

  // Extract next
  metadata.next = getLinkHref(doc, 'next');

  // Extract first
  metadata.first = getLinkHref(doc, 'first');

  // Extract last
  metadata.last = getLinkHref(doc, 'last');

  // Extract up (parent level)
  metadata.up = getLinkHref(doc, 'up');

  // Extract index
  metadata.index = getLinkHref(doc, 'index');

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as PaginationMetadata;
}
