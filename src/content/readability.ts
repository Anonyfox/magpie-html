/**
 * Mozilla Readability wrapper with linkedom.
 *
 * @remarks
 * Provides a clean interface to Mozilla Readability using linkedom as the DOM implementation.
 *
 * @packageDocumentation
 */

import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
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
 * @param html - HTML string to check
 * @param options - Readability check options
 * @returns True if content appears to be an article
 *
 * @example
 * ```typescript
 * if (isProbablyReaderable(html)) {
 *   const result = extractContent(html);
 * }
 * ```
 */
export function isProbablyReaderable(
  html: string,
  options?: {
    minContentLength?: number;
    minScore?: number;
  },
): boolean {
  try {
    const { document } = parseHTML(html);

    // Simple heuristic: check for common article indicators
    const hasArticleTag = !!document.querySelector('article');
    const hasMainTag = !!document.querySelector('main');
    const hasContentDivs =
      document.querySelectorAll('div.content, div.article, div.post').length > 0;
    const hasParagraphs = document.querySelectorAll('p').length >= 3;

    // Calculate rough content length
    const textContent = document.textContent || '';
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
 * Creates a DOM document with linkedom and runs Readability extraction.
 * The original HTML is not modified (uses cloned document).
 *
 * @param html - HTML string to extract from
 * @param options - Extraction options
 * @returns Readability result or null if extraction failed
 *
 * @throws Error if HTML parsing fails
 *
 * @example
 * ```typescript
 * const result = extractWithReadability(html, {
 *   baseUrl: 'https://example.com/article',
 *   charThreshold: 500,
 * });
 *
 * if (result) {
 *   console.log(result.title);
 *   console.log(result.textContent);
 * }
 * ```
 */
export function extractWithReadability(
  html: string,
  options: ContentExtractionOptions = {},
): ReadabilityResult | null {
  // Parse HTML with linkedom
  const { document } = parseHTML(html, {
    url: options.baseUrl || 'https://example.com',
  });

  // Clone document to avoid mutations
  const documentClone = document.cloneNode(true) as Document;

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
