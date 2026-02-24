/**
 * News and press extraction.
 *
 * @remarks
 * Extracts news-specific metadata from HTML documents.
 *
 * @packageDocumentation
 */

import { type DocumentInput, ensureDocument } from '../../utils/html-parser.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { NewsMetadata } from './types.js';

/**
 * Extract news metadata from HTML.
 *
 * @remarks
 * Extracts news-specific metadata including keywords, standout tags,
 * and syndication information.
 *
 * @param input - Parsed HTML document or raw HTML string
 * @returns News metadata
 *
 * @example
 * ```typescript
 * // With parsed document (recommended for multiple extractions)
 * const doc = parseHTML(htmlString);
 * const news = extractNews(doc);
 *
 * // Or directly with HTML string
 * const news = extractNews(htmlString);
 * ```
 */
export function extractNews(input: DocumentInput): NewsMetadata {
  const doc = ensureDocument(input);
  const metadata: NewsMetadata = {};

  // News keywords (distinct from regular keywords)
  const newsKeywords = getMetaContent(doc, 'news_keywords');
  if (newsKeywords) {
    const keywords = newsKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (keywords.length > 0) {
      metadata.keywords = keywords;
    }
  }

  // Google News standout tag
  metadata.standout = getMetaContent(doc, 'standout');

  // Syndication source
  metadata.syndicationSource = getMetaContent(doc, 'syndication-source');

  // Original source
  metadata.originalSource = getMetaContent(doc, 'original-source');

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as NewsMetadata;
}
