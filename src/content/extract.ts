/**
 * Main content extraction module.
 *
 * @remarks
 * Extracts article content from HTML using Mozilla Readability.
 * Never throws exceptions - always returns a ContentResult.
 *
 * @packageDocumentation
 */

import { calculateReadingTime } from './quality.js';
import {
  type HTMLInput,
  extractWithReadability,
  isProbablyReaderable,
} from './readability.js';
import type {
  ContentExtractionOptions,
  ContentResult,
  ExtractedContent,
  ExtractionErrorType,
  ExtractionFailure,
} from './types.js';

/**
 * Count words in text.
 *
 * @param text - Text to count words in
 * @returns Number of words
 */
function countWords(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/**
 * Create an extraction failure result.
 *
 * @param errorType - Type of error
 * @param error - Error message
 * @param readerable - Whether content passed readability check
 * @param extractionTime - Time spent attempting extraction
 * @param details - Additional error details
 * @returns Extraction failure object
 */
function createFailure(
  errorType: ExtractionErrorType,
  error: string,
  readerable: boolean,
  extractionTime: number,
  details?: unknown,
): ExtractionFailure {
  const result: ExtractionFailure = {
    success: false,
    error,
    errorType,
    readerable,
    extractionTime,
  };

  if (details !== undefined) {
    result.details = details;
  }

  return result;
}

/**
 * Extract article content from HTML.
 *
 * @remarks
 * Uses Mozilla Readability with linkedom to extract clean article content.
 * This function never throws exceptions - always returns a ContentResult.
 *
 * Accepts either an HTML string or a pre-parsed Document for performance.
 * Using a pre-parsed Document allows sharing between metadata and content extraction.
 *
 * Error handling:
 * - Returns success: false for any extraction failure
 * - Categorizes errors by type for better handling
 * - Includes extraction time even for failures
 *
 * @param input - HTML string or pre-parsed Document to extract content from
 * @param options - Extraction options
 * @returns Extraction result (success or failure)
 *
 * @example
 * ```typescript
 * // With HTML string
 * const result = extractContent(htmlString, {
 *   baseUrl: 'https://example.com/article',
 *   charThreshold: 300,
 *   checkReadability: true,
 * });
 *
 * // With pre-parsed document (recommended for performance)
 * import { parseHTML } from './utils/html-parser.js';
 * const doc = parseHTML(htmlString);
 * const metadata = extractSEO(doc);
 * const content = extractContent(doc, { baseUrl: 'https://example.com' });
 *
 * if (result.success) {
 *   console.log(result.title);
 *   console.log(result.wordCount);
 *   console.log(`${result.readingTime} min read`);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function extractContent(
  input: HTMLInput,
  options: ContentExtractionOptions = {},
): ContentResult {
  const startTime = Date.now();

  // Validate input
  if (!input) {
    return createFailure(
      'INVALID_HTML',
      'Input must be a non-empty string or Document',
      false,
      Date.now() - startTime,
    );
  }

  // Validate string input
  if (typeof input === 'string') {
    if (input.trim().length === 0) {
      return createFailure('INVALID_HTML', 'HTML string is empty', false, Date.now() - startTime);
    }
  } else if (typeof input !== 'object' || !input.documentElement) {
    return createFailure(
      'INVALID_HTML',
      'Input must be a string or Document object',
      false,
      Date.now() - startTime,
    );
  }

  // Check readability if requested
  let readerable = false;
  if (options.checkReadability) {
    try {
      readerable = isProbablyReaderable(input);
      if (!readerable) {
        return createFailure(
          'NOT_READERABLE',
          'Content does not appear to be a readable article',
          false,
          Date.now() - startTime,
        );
      }
    } catch (error) {
      // Readability check failed, but continue anyway
      if (options.debug) {
        console.warn('Readability check failed:', error);
      }
    }
  }

  // Extract content with Readability
  let article: ReturnType<typeof extractWithReadability> | null;
  try {
    article = extractWithReadability(input, options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createFailure(
      'PARSE_ERROR',
      `Failed to parse HTML: ${errorMessage}`,
      readerable,
      Date.now() - startTime,
      error,
    );
  }

  // Check if extraction succeeded
  if (!article) {
    return createFailure(
      'EXTRACTION_FAILED',
      'Readability could not extract content from this page',
      readerable,
      Date.now() - startTime,
    );
  }

  // Check if content meets minimum requirements
  if (!article.title && !article.textContent) {
    return createFailure(
      'EXTRACTION_FAILED',
      'Extracted content has no title or text',
      readerable,
      Date.now() - startTime,
    );
  }

  // Calculate metrics
  const wordCount = countWords(article.textContent);
  const readingTime = calculateReadingTime(wordCount);

  // Build success result
  const result: ExtractedContent = {
    success: true,
    title: article.title,
    content: article.content,
    textContent: article.textContent,
    excerpt: article.excerpt,
    length: article.length,
    wordCount,
    readingTime,
    readerable: readerable || true, // If we got here, it was readable enough
    extractionTime: Date.now() - startTime,
  };

  // Add optional fields if present
  if (article.byline) {
    result.byline = article.byline;
  }
  if (article.siteName) {
    result.siteName = article.siteName;
  }
  if (article.lang) {
    result.lang = article.lang;
  }
  if (article.dir) {
    result.dir = article.dir as 'ltr' | 'rtl';
  }
  if (article.publishedTime) {
    result.publishedTime = article.publishedTime;
  }

  return result;
}
