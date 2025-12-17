/**
 * Content extraction types.
 *
 * @remarks
 * Types for article content extraction using Mozilla Readability.
 *
 * @packageDocumentation
 */

/**
 * Options for content extraction.
 */
export interface ContentExtractionOptions {
  /**
   * Base URL for resolving relative links and images.
   * Highly recommended for proper link resolution.
   */
  baseUrl?: string;

  /**
   * Minimum character count for article content.
   * Articles shorter than this are considered too short.
   * @default 500
   */
  charThreshold?: number;

  /**
   * Maximum number of elements to parse.
   * Set to 0 for no limit.
   * @default 0
   */
  maxElemsToParse?: number;

  /**
   * Whether to preserve CSS classes in extracted HTML.
   * @default false
   */
  keepClasses?: boolean;

  /**
   * CSS classes to preserve when keepClasses is false.
   */
  classesToPreserve?: string[];

  /**
   * Whether to skip JSON-LD parsing for metadata.
   * @default false
   */
  disableJSONLD?: boolean;

  /**
   * Check if content is probably readerable before extraction.
   * If true and content is not readerable, returns early with failure.
   * @default false
   */
  checkReadability?: boolean;

  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean;
}

/**
 * Successfully extracted content.
 */
export interface ExtractedContent {
  /** Extraction succeeded */
  success: true;

  /** Article title */
  title: string;

  /** Cleaned HTML content */
  content: string;

  /** Plain text content (HTML stripped) */
  textContent: string;

  /** Article excerpt/summary */
  excerpt: string;

  /** Author byline */
  byline?: string;

  /** Site name */
  siteName?: string;

  /** Content language code (e.g., 'en', 'de') */
  lang?: string;

  /** Text direction */
  dir?: 'ltr' | 'rtl';

  /** Published time (ISO 8601 string if available) */
  publishedTime?: string;

  /** Character count of text content */
  length: number;

  /** Word count */
  wordCount: number;

  /** Estimated reading time in minutes */
  readingTime: number;

  /** Whether content passed readability check */
  readerable: boolean;

  /** Extraction time in milliseconds */
  extractionTime: number;
}

/**
 * Error types for extraction failures.
 */
export type ExtractionErrorType =
  | 'NOT_READERABLE' // Content doesn't meet readability threshold
  | 'PARSE_ERROR' // HTML parsing failed
  | 'EXTRACTION_FAILED' // Readability returned null
  | 'INVALID_HTML' // Malformed or empty HTML
  | 'UNKNOWN'; // Unexpected error

/**
 * Failed content extraction.
 */
export interface ExtractionFailure {
  /** Extraction failed */
  success: false;

  /** Error message */
  error: string;

  /** Categorized error type */
  errorType: ExtractionErrorType;

  /** Whether content passed readability check (if checked) */
  readerable: boolean;

  /** Extraction time in milliseconds */
  extractionTime: number;

  /** Original error details (if available) */
  details?: unknown;
}

/**
 * Result of content extraction.
 *
 * @remarks
 * Always returns a result, never throws exceptions.
 */
export type ContentResult = ExtractedContent | ExtractionFailure;

/**
 * Quality assessment metrics.
 */
export interface ContentQuality {
  /** Word count */
  wordCount: number;

  /** Character count */
  charCount: number;

  /** Estimated reading time in minutes */
  readingTime: number;

  /** Average words per sentence */
  avgWordsPerSentence: number;

  /** Paragraph count */
  paragraphCount: number;

  /** Image count in content */
  imageCount: number;

  /** Link count in content */
  linkCount: number;

  /** Link density (ratio of link text to total text) */
  linkDensity: number;

  /** Overall quality score (0-100) */
  qualityScore: number;
}
