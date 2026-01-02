/**
 * Unified feed parser with automatic format detection.
 *
 * @packageDocumentation
 */

import { parseAtom } from './atom/index.js';
import { detectFormat, type FeedFormat } from './detect.js';
import { parseJSONFeed } from './json-feed/index.js';
import { normalizeAtom, normalizeJSONFeed, normalizeRSS } from './normalize.js';
import { parseRSS } from './rss/index.js';
import type { Feed, ParseResult } from './types.js';

/**
 * Parse any feed format with automatic format detection.
 *
 * @remarks
 * This is the main entry point for feed parsing. It automatically detects whether
 * the content is RSS, Atom, or JSON Feed, parses it, and returns a normalized
 * output structure along with the original format-specific data.
 *
 * All relative URLs in the feed are converted to absolute URLs if a base URL is provided.
 * This is essential for feed readers that need to fetch images, enclosures, or follow links.
 *
 * @param content - Feed content as string (XML or JSON)
 * @param baseUrl - Optional base URL for resolving relative URLs (string or URL object)
 * @returns Object containing normalized feed data and original format-specific data
 * @throws Error if format cannot be detected or parsing fails
 *
 * @example
 * ```typescript
 * const feedContent = await fetch('https://example.com/feed.xml').then(r => r.text());
 * const result = parseFeed(feedContent, 'https://example.com/feed.xml');
 *
 * console.log(result.feed.title);
 * console.log(result.feed.items[0].title);
 * console.log(result.feed.items[0].url); // Absolute URL
 * ```
 */
export function parseFeed(content: string, baseUrl?: string | URL): ParseResult {
  const format = detectFormat(content);

  if (format === 'unknown') {
    throw new Error('Unable to detect feed format. Content must be RSS, Atom, or JSON Feed.');
  }

  return parseFeedAs(content, format, baseUrl);
}

/**
 * Parse feed with explicit format specification.
 *
 * @remarks
 * Use this function when you already know the feed format and want to skip
 * automatic detection. This can be slightly faster than {@link parseFeed}
 * and provides more control over the parsing process.
 *
 * @param content - Feed content as string (XML or JSON)
 * @param format - Explicit format to parse as ('rss', 'atom', or 'json-feed')
 * @param baseUrl - Optional base URL for resolving relative URLs
 * @returns Object containing normalized feed data and original format-specific data
 * @throws Error if parsing fails or format is 'unknown'
 *
 * @example
 * ```typescript
 * // Parse known RSS feed
 * const result = parseFeedAs(rssContent, 'rss', 'https://example.com/feed.xml');
 * ```
 */
export function parseFeedAs(
  content: string,
  format: FeedFormat,
  baseUrl?: string | URL,
): ParseResult {
  if (format === 'unknown') {
    throw new Error('Cannot parse feed with format "unknown"');
  }

  switch (format) {
    case 'rss': {
      const rss = parseRSS(content, baseUrl);
      return {
        feed: normalizeRSS(rss),
        original: rss,
      };
    }

    case 'atom': {
      const atom = parseAtom(content, baseUrl);
      return {
        feed: normalizeAtom(atom),
        original: atom,
      };
    }

    case 'json-feed': {
      const jsonFeed = parseJSONFeed(content, baseUrl);
      return {
        feed: normalizeJSONFeed(jsonFeed),
        original: jsonFeed,
      };
    }

    case 'sitemap': {
      throw new Error(
        'Sitemaps cannot be parsed with parseFeed(). Use parseSitemap() from the sitemap module instead.',
      );
    }
  }
}

/**
 * Parse feed and return only normalized data.
 *
 * @remarks
 * Convenience wrapper around {@link parseFeed} that returns only the normalized
 * feed data without the original format-specific data. Use this when you don't
 * need access to format-specific fields.
 *
 * @param content - Feed content as string (XML or JSON)
 * @param baseUrl - Optional base URL for resolving relative URLs
 * @returns Normalized feed data only
 * @throws Error if format cannot be detected or parsing fails
 *
 * @example
 * ```typescript
 * const feed = parseFeedNormalized(content, 'https://example.com/feed.xml');
 * console.log(feed.title);
 * console.log(feed.items.length);
 * ```
 */
export function parseFeedNormalized(content: string, baseUrl?: string | URL): Feed {
  return parseFeed(content, baseUrl).feed;
}
