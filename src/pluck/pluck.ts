/**
 * Enhanced fetch for web scraping.
 *
 * @remarks
 * fetch-compatible HTTP client with robust handling of real-world web content.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * @packageDocumentation
 */

import { decodeToUtf8, detectEncoding } from './encoding.js';
import type { PluckInit, PluckResponse } from './types.js';
import {
  PluckContentTypeError,
  PluckHttpError,
  PluckNetworkError,
  PluckRedirectError,
  PluckSizeError,
  PluckTimeoutError,
} from './types.js';

// Default options
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_MAX_REDIRECTS = 10;
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; Magpie-HTML/1.0; +https://github.com/Anonyfox/magpie-html)';
const DEFAULT_ALLOWED_CONTENT_TYPES = [
  'text/html',
  'text/xml',
  'application/xml',
  'application/xhtml+xml',
  'application/rss+xml',
  'application/atom+xml',
  'application/json',
];

/**
 * Enhanced fetch for web scraping.
 *
 * @remarks
 * Drop-in replacement for fetch() with enhanced error handling, encoding detection,
 * redirect tracking, and size limits. Perfect for scraping HTML, feeds, and APIs.
 *
 * Features:
 * - Manual redirect tracking with full chain
 * - Automatic encoding detection and UTF-8 conversion
 * - Configurable timeouts and size limits
 * - Smart default headers for web scraping
 * - Content-Type validation
 * - Comprehensive error types
 *
 * @param input - URL string or Request object
 * @param init - Request options (extends standard RequestInit)
 * @returns Enhanced Response with additional metadata
 * @throws {PluckTimeoutError} Request timeout
 * @throws {PluckNetworkError} Network or DNS error
 * @throws {PluckHttpError} HTTP error status (4xx, 5xx)
 * @throws {PluckRedirectError} Too many redirects or loop
 * @throws {PluckSizeError} Response too large
 * @throws {PluckEncodingError} Invalid encoding
 * @throws {PluckContentTypeError} Invalid content type
 *
 * @example
 * ```typescript
 * // Basic usage (works like fetch)
 * const response = await pluck('https://example.com');
 * const html = await response.text();
 *
 * // With enhancements
 * console.log(response.redirectChain);
 * console.log(response.detectedEncoding);
 * console.log(response.timing);
 * ```
 *
 * @example
 * ```typescript
 * // With options
 * const response = await pluck('https://example.com', {
 *   timeout: 60000,
 *   maxRedirects: 5,
 *   userAgent: 'MyBot/1.0',
 *   throwOnHttpError: true
 * });
 * ```
 */
export async function pluck(
  input: string | URL | Request,
  init?: PluckInit,
): Promise<PluckResponse> {
  const startTime = Date.now();

  // Parse options
  const options = normalizeOptions(init);
  const originalUrl = typeof input === 'string' || input instanceof URL ? String(input) : input.url;

  // Setup timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), options.timeout);

  try {
    // Follow redirects manually to capture chain
    const { response, redirectChain, redirectDuration } = await followRedirects(
      input,
      options,
      abortController.signal,
    );

    const finalUrl = response.url;

    // Check HTTP status
    if (options.throwOnHttpError && !response.ok) {
      throw new PluckHttpError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText,
        response,
      );
    }

    // Validate Content-Type
    if (options.strictContentType) {
      validateContentType(response, options.allowedContentTypes);
    }

    // Read response with size limit
    const buffer = await readResponseWithSizeLimit(response, options.maxSize);

    // Detect encoding
    const contentType = response.headers.get('content-type');
    const detectedEncoding = detectEncoding(buffer, contentType);

    // Decode to UTF-8
    const utf8Content = decodeToUtf8(buffer, detectedEncoding, options.validateEncoding);

    // Create enhanced response
    const endTime = Date.now();
    const enhancedResponse = createPluckResponse(response, {
      originalUrl,
      finalUrl,
      redirectChain,
      detectedEncoding,
      utf8Content,
      timing: {
        start: startTime,
        end: endTime,
        duration: endTime - startTime,
        redirectDuration,
      },
    });

    return enhancedResponse;
  } catch (error) {
    // Convert errors to pluck error types
    if (error instanceof PluckTimeoutError || error instanceof PluckNetworkError) {
      throw error;
    }

    if ((error as Error).name === 'AbortError') {
      throw new PluckTimeoutError(`Request timeout after ${options.timeout}ms`, options.timeout);
    }

    if (error instanceof TypeError) {
      // Network errors from fetch are TypeErrors
      throw new PluckNetworkError(`Network error: ${error.message}`, error);
    }

    // Re-throw pluck errors as-is
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Normalize pluck options with defaults.
 */
function normalizeOptions(
  init?: PluckInit,
): Required<Omit<PluckInit, keyof RequestInit>> & RequestInit {
  return {
    ...init,
    timeout: init?.timeout ?? DEFAULT_TIMEOUT,
    maxRedirects: init?.maxRedirects ?? DEFAULT_MAX_REDIRECTS,
    maxSize: init?.maxSize ?? DEFAULT_MAX_SIZE,
    userAgent: init?.userAgent ?? DEFAULT_USER_AGENT,
    throwOnHttpError: init?.throwOnHttpError ?? true,
    strictContentType: init?.strictContentType ?? false,
    allowedContentTypes: init?.allowedContentTypes ?? DEFAULT_ALLOWED_CONTENT_TYPES,
    followRedirects: init?.followRedirects ?? true,
    validateEncoding: init?.validateEncoding ?? true,
  };
}

/**
 * Follow redirects manually to capture the chain.
 */
async function followRedirects(
  input: string | URL | Request,
  options: ReturnType<typeof normalizeOptions>,
  signal: AbortSignal,
): Promise<{ response: Response; redirectChain: string[]; redirectDuration: number }> {
  let url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  const redirectChain: string[] = [];
  const redirectStart = Date.now();
  const seenUrls = new Set<string>();

  // If not following redirects, just do one request
  if (!options.followRedirects) {
    const response = await fetchWithHeaders(url, options, signal, false);
    return { response, redirectChain: [], redirectDuration: 0 };
  }

  for (let i = 0; i <= options.maxRedirects; i++) {
    // Detect redirect loops
    if (seenUrls.has(url)) {
      throw new PluckRedirectError(
        `Redirect loop detected: ${url}`,
        redirectChain,
        options.maxRedirects,
      );
    }
    seenUrls.add(url);

    // Fetch with manual redirect handling
    const response = await fetchWithHeaders(url, options, signal, true);

    // Check if it's a redirect
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new PluckRedirectError('Redirect response missing Location header', redirectChain);
      }

      // Add current URL to chain
      redirectChain.push(url);

      // Resolve relative/absolute location
      try {
        url = new URL(location, url).href;
      } catch {
        throw new PluckRedirectError(
          `Invalid redirect location: ${location}`,
          redirectChain,
          options.maxRedirects,
        );
      }

      // Validate redirect URL scheme
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new PluckRedirectError(
          `Invalid redirect scheme: ${url}`,
          redirectChain,
          options.maxRedirects,
        );
      }

      continue;
    }

    // Not a redirect, return response
    const redirectDuration = Date.now() - redirectStart;
    return { response, redirectChain, redirectDuration };
  }

  // Too many redirects
  throw new PluckRedirectError(
    `Too many redirects (>${options.maxRedirects})`,
    redirectChain,
    options.maxRedirects,
  );
}

/**
 * Fetch with smart default headers.
 */
async function fetchWithHeaders(
  url: string,
  options: ReturnType<typeof normalizeOptions>,
  signal: AbortSignal,
  manualRedirect: boolean,
): Promise<Response> {
  const headers = new Headers(options.headers);

  // Set User-Agent
  if (!headers.has('user-agent')) {
    headers.set('user-agent', options.userAgent);
  }

  // Set Accept
  if (!headers.has('accept')) {
    headers.set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
  }

  // Set Accept-Language
  if (!headers.has('accept-language')) {
    headers.set('accept-language', 'en-US,en;q=0.9');
  }

  return fetch(url, {
    ...options,
    headers,
    signal,
    redirect: manualRedirect ? 'manual' : 'follow',
  });
}

/**
 * Read response body with size limit.
 */
async function readResponseWithSizeLimit(
  response: Response,
  maxSize: number,
): Promise<ArrayBuffer> {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const size = Number.parseInt(contentLength, 10);
    if (size > maxSize) {
      throw new PluckSizeError(
        `Response size ${size} bytes exceeds maximum ${maxSize} bytes`,
        maxSize,
        size,
      );
    }
  }

  // Read response
  const buffer = await response.arrayBuffer();

  // Check actual size
  if (buffer.byteLength > maxSize) {
    throw new PluckSizeError(
      `Response size ${buffer.byteLength} bytes exceeds maximum ${maxSize} bytes`,
      maxSize,
      buffer.byteLength,
    );
  }

  return buffer;
}

/**
 * Validate Content-Type header.
 */
function validateContentType(response: Response, allowedTypes: string[]): void {
  const contentType = response.headers.get('content-type');
  if (!contentType) {
    throw new PluckContentTypeError('Missing Content-Type header', '(missing)', allowedTypes);
  }

  // Parse Content-Type (ignore charset and other parameters)
  const mimeType = contentType.split(';')[0].trim().toLowerCase();

  // Check if allowed
  const isAllowed = allowedTypes.some((allowed) => {
    const pattern = allowed.toLowerCase().replace('*', '.*');
    return new RegExp(`^${pattern}$`).test(mimeType);
  });

  if (!isAllowed) {
    throw new PluckContentTypeError(
      `Content-Type '${mimeType}' not allowed`,
      mimeType,
      allowedTypes,
    );
  }
}

/**
 * Create enhanced PluckResponse from standard Response.
 */
function createPluckResponse(
  response: Response,
  metadata: {
    originalUrl: string;
    finalUrl: string;
    redirectChain: string[];
    detectedEncoding: string;
    utf8Content: string;
    timing: PluckResponse['timing'];
  },
): PluckResponse {
  // Store UTF-8 content for textUtf8() method
  let utf8ContentCache: string | null = metadata.utf8Content;

  // Create enhanced response object
  const enhancedResponse = response as PluckResponse;

  // Add our enhancements
  enhancedResponse.originalUrl = metadata.originalUrl;
  enhancedResponse.finalUrl = metadata.finalUrl;
  enhancedResponse.redirectChain = metadata.redirectChain;
  enhancedResponse.detectedEncoding = metadata.detectedEncoding;
  enhancedResponse.timing = metadata.timing;

  // Add textUtf8() method
  enhancedResponse.textUtf8 = async () => {
    if (utf8ContentCache === null) {
      throw new Error('Response body already consumed');
    }
    const content = utf8ContentCache;
    utf8ContentCache = null; // Consume once
    return content;
  };

  return enhancedResponse;
}
