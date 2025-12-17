/**
 * News and press extraction.
 *
 * @remarks
 * Extracts news-specific metadata from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../../utils/html-parser.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { NewsMetadata } from './types.js';

/**
 * Extract news metadata from parsed HTML document.
 *
 * @remarks
 * Extracts news-specific metadata including keywords, standout tags,
 * and syndication information.
 *
 * @param doc - Parsed HTML document
 * @returns News metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const news = extractNews(doc);
 * console.log(news.keywords);
 * console.log(news.standout);
 * ```
 */
export function extractNews(doc: Document): NewsMetadata {
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
