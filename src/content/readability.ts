/**
 * Mozilla Readability wrapper with linkedom.
 *
 * @remarks
 * Provides a clean interface to Mozilla Readability using linkedom as the DOM implementation.
 *
 * @packageDocumentation
 */

import { Readability } from '@mozilla/readability';
import type { ContentExtractionOptions } from './types.js';

/**
 * Readability result from Mozilla's library.
 */
export interface ReadabilityResult {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline: string | null;
  siteName: string | null;
  lang: string | null;
  dir: string | null;
  publishedTime: string | null;
  length: number;
}

/**
 * Check if HTML content is probably readerable.
 *
 * @remarks
 * Quick check to determine if content extraction is likely to succeed.
 * This is a heuristic check and may produce false positives/negatives.
 *
 * @param doc - Pre-parsed Document to check
 * @param options - Readability check options
 * @returns True if content appears to be an article
 *
 * @example
 * ```typescript
 * import { parseHTML } from '../utils/html-parser.js';
 *
 * const doc = parseHTML(html);
 * if (isProbablyReaderable(doc)) {
 *   const result = extractContent(doc);
 * }
 * ```
 */
export function isProbablyReaderable(
  doc: Document,
  options?: {
    minContentLength?: number;
    minScore?: number;
  },
): boolean {
  try {
    // Simple heuristic: check for common article indicators
    const hasArticleTag = !!doc.querySelector('article');
    const hasMainTag = !!doc.querySelector('main');
    const hasContentDivs = doc.querySelectorAll('div.content, div.article, div.post').length > 0;
    const hasParagraphs = doc.querySelectorAll('p').length >= 3;

    // Calculate rough content length
    const textContent = doc.textContent || '';
    const contentLength = textContent.trim().length;
    const minLength = options?.minContentLength || 140;

    return (
      contentLength >= minLength && (hasArticleTag || hasMainTag || hasContentDivs || hasParagraphs)
    );
  } catch {
    return false;
  }
}

/**
 * Extract article content using Mozilla Readability.
 *
 * @remarks
 * Runs Readability extraction on a pre-parsed Document.
 * The original document is not modified (uses cloned document).
 *
 * @param doc - Pre-parsed Document to extract from
 * @param options - Extraction options
 * @returns Readability result or null if extraction failed
 *
 * @example
 * ```typescript
 * import { parseHTML } from '../utils/html-parser.js';
 * import { extractSEO } from '../metadata/index.js';
 *
 * const doc = parseHTML(html);
 * const metadata = extractSEO(doc);
 * const content = extractWithReadability(doc, { baseUrl: 'https://example.com' });
 *
 * if (content) {
 *   console.log(content.title);
 *   console.log(content.textContent);
 * }
 * ```
 */
export function extractWithReadability(
  doc: Document,
  options: ContentExtractionOptions = {},
): ReadabilityResult | null {
  // Clone document to avoid mutations
  const documentClone = doc.cloneNode(true) as Document;

  // Create Readability instance with options
  const reader = new Readability(documentClone, {
    debug: options.debug || false,
    charThreshold: options.charThreshold || 500,
    maxElemsToParse: options.maxElemsToParse || 0,
    keepClasses: options.keepClasses || false,
    classesToPreserve: options.classesToPreserve || [],
    disableJSONLD: options.disableJSONLD || false,
  });

  // Parse and return result
  const article = reader.parse();

  if (!article) {
    return null;
  }

  return {
    title: article.title || '',
    content: article.content || '',
    textContent: article.textContent || '',
    excerpt: article.excerpt || '',
    byline: article.byline || null,
    siteName: article.siteName || null,
    lang: article.lang || null,
    dir: article.dir || null,
    publishedTime: article.publishedTime || null,
    length: article.length || 0,
  };
}
