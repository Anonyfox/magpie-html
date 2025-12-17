/**
 * Article content extraction module.
 *
 * @remarks
 * Extracts clean article content from HTML using Mozilla Readability.
 * Provides quality assessment and comprehensive error handling.
 * Also provides HTML to text conversion via the `htmlToText` function.
 *
 * @packageDocumentation
 */

export { extractContent } from './extract.js';
export type { HtmlToTextOptions } from './html-to-text/index.js';
export { htmlToText } from './html-to-text/index.js';
export { assessContentQuality, calculateReadingTime } from './quality.js';
export { isProbablyReaderable } from './readability.js';
export type {
  ContentExtractionOptions,
  ContentQuality,
  ContentResult,
  ExtractedContent,
  ExtractionErrorType,
  ExtractionFailure,
} from './types.js';
