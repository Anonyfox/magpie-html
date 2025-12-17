/**
 * Article content extraction module.
 *
 * @remarks
 * Extracts clean article content from HTML using Mozilla Readability.
 * Provides quality assessment and comprehensive error handling.
 *
 * @packageDocumentation
 */

export { extractContent } from './extract.js';
export { assessContentQuality, calculateReadingTime } from './quality.js';
export { type HTMLInput, isProbablyReaderable } from './readability.js';

export type {
  ContentExtractionOptions,
  ContentQuality,
  ContentResult,
  ExtractedContent,
  ExtractionErrorType,
  ExtractionFailure,
} from './types.js';
