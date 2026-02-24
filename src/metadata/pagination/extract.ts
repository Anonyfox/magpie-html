/**
 * Pagination metadata extraction.
 *
 * @remarks
 * Extracts pagination navigation links from HTML documents.
 *
 * @packageDocumentation
 */

import { type DocumentInput, ensureDocument } from '../../utils/html-parser.js';
import { getLinkHref } from '../../utils/link-helpers.js';
import type { PaginationMetadata } from './types.js';

/**
 * Extract pagination metadata from HTML.
 *
 * @remarks
 * Extracts pagination navigation links including prev, next, first, last,
 * up (parent), and index links.
 *
 * @param input - Parsed HTML document or raw HTML string
 * @returns Pagination metadata
 *
 * @example
 * ```typescript
 * // With parsed document (recommended for multiple extractions)
 * const doc = parseHTML(htmlString);
 * const pagination = extractPagination(doc);
 *
 * // Or directly with HTML string
 * const pagination = extractPagination(htmlString);
 * ```
 */
export function extractPagination(input: DocumentInput): PaginationMetadata {
  const doc = ensureDocument(input);
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
