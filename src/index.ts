/**
 * Magpie HTML - Universal web content scraper for Node.js and browsers
 *
 * @remarks
 * A modern TypeScript library for parsing web feeds (RSS, Atom, JSON Feed) and
 * extracting content from HTML. Designed to be isomorphic, type-safe, and resilient
 * to malformed data.
 *
 * Key features:
 * - Universal feed parser with automatic format detection
 * - Smart URL resolution (relative to absolute)
 * - HTML text extraction
 * - Zero dependencies
 * - Full TypeScript support
 *
 * @packageDocumentation
 */

// Feed Parser - Types
export type {
  Feed,
  FeedAuthor,
  FeedEnclosure,
  FeedFormat,
  FeedItem,
  ParseResult,
} from './feed/index.js';
// Feed Parser - Main API
export {
  detectFormat,
  isAtom,
  isFeed,
  isJSONFeed,
  isRSS,
  parseAtom,
  parseFeed,
  parseFeedAs,
  parseFeedNormalized,
  parseJSONFeed,
  parseRSS,
} from './feed/index.js';
// URL Utilities
export {
  normalizeUrl,
  normalizeUrlHttps,
  normalizeUrls,
  preferHttps,
} from './utils/normalize-url.js';

/**
 * Simple greeting function for testing package integration.
 *
 * @param name - Name to greet (defaults to 'World')
 * @returns Greeting message
 *
 * @example
 * ```typescript
 * helloWorld('Developer'); // "Hello, Developer! Welcome to Magpie HTML 🦅"
 * ```
 */
export function helloWorld(name = 'World'): string {
  return `Hello, ${name}! Welcome to Magpie HTML 🦅`;
}

/**
 * Extract plain text content from HTML string.
 *
 * @remarks
 * Removes script/style tags and their content, strips all HTML tags,
 * and normalizes whitespace. Works in both Node.js and browser environments
 * using only string manipulation (no DOM parsing).
 *
 * This is a simple implementation suitable for basic text extraction.
 * For complex HTML parsing, consider using a dedicated HTML parser.
 *
 * @param html - HTML string to process
 * @returns Extracted plain text with normalized whitespace
 *
 * @example
 * ```typescript
 * const html = '<div><h1>Title</h1><p>Content</p></div>';
 * extractText(html); // "Title Content"
 * ```
 */
export function extractText(html: string): string {
  // Remove script and style tags with their content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Check if code is running in a browser environment.
 *
 * @returns `true` if running in browser, `false` if in Node.js
 *
 * @example
 * ```typescript
 * if (isBrowser()) {
 *   // Use browser APIs
 *   document.querySelector('...');
 * } else {
 *   // Use Node.js APIs
 *   fs.readFileSync('...');
 * }
 * ```
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Get the current runtime environment name.
 *
 * @returns Either `'browser'` or `'node'`
 *
 * @example
 * ```typescript
 * const env = getEnvironment();
 * console.log(`Running in ${env}`);
 * ```
 */
export function getEnvironment(): 'browser' | 'node' {
  return isBrowser() ? 'browser' : 'node';
}
