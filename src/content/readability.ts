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
 * Input type for content extraction - either HTML string or pre-parsed Document.
 *
 * @remarks
 * Accepting a pre-parsed Document allows sharing a single parsed document
 * between metadata and content extraction for better performance.
 */
export type HTMLInput = string | Document;

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
 * Accepts either an HTML string or a pre-parsed Document for performance.
 *
 * @param input - HTML string or pre-parsed Document to check
 * @param options - Readability check options
 * @returns True if content appears to be an article
 *
 * @example
 * ```typescript
 * // With HTML string
 * if (isProbablyReaderable(html)) {
 *   const result = extractContent(html);
 * }
 *
 * // With pre-parsed document
 * const doc = parseHTML(html);
 * if (isProbablyReaderable(doc)) {
 *   const result = extractContent(doc);
 * }
 * ```
 */
export function isProbablyReaderable(
  input: HTMLInput,
  options?: {
    minContentLength?: number;
    minScore?: number;
  },
): boolean {
  try {
    // Use provided document or parse HTML string
    const document = typeof input === 'string' ? parseHTML(input).document : input;

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
 * Accepts either an HTML string or a pre-parsed Document for performance.
 * Using a pre-parsed Document allows sharing between metadata and content extraction.
 *
 * @param input - HTML string or pre-parsed Document to extract from
 * @param options - Extraction options
 * @returns Readability result or null if extraction failed
 *
 * @throws Error if HTML parsing fails (only when input is a string)
 *
 * @example
 * ```typescript
 * // With HTML string
 * const result = extractWithReadability(html, {
 *   baseUrl: 'https://example.com/article',
 *   charThreshold: 500,
 * });
 *
 * // With pre-parsed document (recommended for performance)
 * import { parseHTML } from './utils/html-parser.js';
 * const doc = parseHTML(html);
 * const metadata = extractSEO(doc);
 * const content = extractWithReadability(doc, { baseUrl: 'https://example.com' });
 *
 * if (result) {
 *   console.log(result.title);
 *   console.log(result.textContent);
 * }
 * ```
 */
export function extractWithReadability(
  input: HTMLInput,
  options: ContentExtractionOptions = {},
): ReadabilityResult | null {
  // Use provided document or parse HTML string
  const document =
    typeof input === 'string'
      ? parseHTML(input, { url: options.baseUrl || 'https://example.com' }).document
      : input;

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
