/**
 * Enhanced fetch types for web scraping.
 *
 * @remarks
 * Types for pluck() - fetch-compatible enhanced HTTP client.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * @packageDocumentation
 */

/**
 * Extended RequestInit with pluck-specific options.
 *
 * @remarks
 * Extends standard fetch RequestInit with additional options for
 * robust web scraping. All standard fetch options are supported.
 */
export interface PluckInit extends RequestInit {
  /**
   * Request timeout in milliseconds.
   *
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Maximum number of redirects to follow.
   *
   * @default 10
   */
  maxRedirects?: number;

  /**
   * Maximum response size in bytes.
   *
   * @default 10485760 (10MB)
   */
  maxSize?: number;

  /**
   * User-Agent header shortcut.
   *
   * @remarks
   * Convenience property that sets the User-Agent header.
   * Overrides any User-Agent in the headers object.
   */
  userAgent?: string;

  /**
   * Throw error on HTTP error status (4xx, 5xx).
   *
   * @default true
   */
  throwOnHttpError?: boolean;

  /**
   * Validate Content-Type header.
   *
   * @remarks
   * If true, throws error if Content-Type is not in allowedContentTypes.
   *
   * @default false
   */
  strictContentType?: boolean;

  /**
   * Allowed Content-Type values for strictContentType.
   *
   * @default ['text/html', 'text/xml', 'application/xml', 'application/xhtml+xml', 'application/rss+xml', 'application/atom+xml', 'application/json']
   */
  allowedContentTypes?: string[];

  /**
   * Follow redirects automatically.
   *
   * @remarks
   * If false, returns the 3xx response directly without following.
   *
   * @default true
   */
  followRedirects?: boolean;

  /**
   * Validate detected encoding.
   *
   * @remarks
   * If true, throws error if detected encoding is invalid or unsupported.
   *
   * @default true
   */
  validateEncoding?: boolean;
}

/**
 * Enhanced Response with pluck-specific properties.
 *
 * @remarks
 * Extends standard Response with additional metadata about the request.
 * All standard Response properties and methods are available.
 */
export interface PluckResponse extends Response {
  /**
   * Final URL after following redirects.
   */
  finalUrl: string;

  /**
   * Original request URL.
   */
  originalUrl: string;

  /**
   * Array of redirect URLs (excluding original and final).
   */
  redirectChain: string[];

  /**
   * Detected character encoding.
   *
   * @example 'utf-8', 'windows-1252', 'iso-8859-1'
   */
  detectedEncoding: string;

  /**
   * Request timing information.
   */
  timing: {
    /** Request start timestamp (milliseconds since epoch) */
    start: number;
    /** Request end timestamp (milliseconds since epoch) */
    end: number;
    /** Total duration in milliseconds */
    duration: number;
    /** Time spent in redirects (milliseconds) */
    redirectDuration?: number;
  };

  /**
   * Get response body as UTF-8 text.
   *
   * @remarks
   * Unlike standard text(), this guarantees UTF-8 output regardless
   * of the source encoding. Uses detected encoding to decode properly.
   *
   * @returns UTF-8 decoded text
   */
  textUtf8(): Promise<string>;
}

/**
 * Base error class for pluck errors.
 */
export class PluckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PluckError';
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Network error (connection failed, DNS, etc.).
 */
export class PluckNetworkError extends PluckError {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'PluckNetworkError';
  }
}

/**
 * Request timeout error.
 */
export class PluckTimeoutError extends PluckError {
  constructor(
    message: string,
    public readonly timeoutMs: number,
  ) {
    super(message);
    this.name = 'PluckTimeoutError';
  }
}

/**
 * HTTP error (4xx, 5xx status codes).
 */
export class PluckHttpError extends PluckError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly statusText: string,
    public readonly response: Response,
  ) {
    super(message);
    this.name = 'PluckHttpError';
  }
}

/**
 * Response size exceeded maximum.
 */
export class PluckSizeError extends PluckError {
  constructor(
    message: string,
    public readonly maxSize: number,
    public readonly actualSize?: number,
  ) {
    super(message);
    this.name = 'PluckSizeError';
  }
}

/**
 * Encoding detection or conversion error.
 */
export class PluckEncodingError extends PluckError {
  constructor(
    message: string,
    public readonly encoding?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'PluckEncodingError';
  }
}

/**
 * Too many redirects or redirect loop detected.
 */
export class PluckRedirectError extends PluckError {
  constructor(
    message: string,
    public readonly redirectChain: string[],
    public readonly maxRedirects?: number,
  ) {
    super(message);
    this.name = 'PluckRedirectError';
  }
}

/**
 * Invalid or disallowed Content-Type.
 */
export class PluckContentTypeError extends PluckError {
  constructor(
    message: string,
    public readonly contentType: string,
    public readonly allowedTypes?: string[],
  ) {
    super(message);
    this.name = 'PluckContentTypeError';
  }
}
