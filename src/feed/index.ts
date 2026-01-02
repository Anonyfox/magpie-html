/**
 * Feed Parser Module
 *
 * @remarks
 * Universal feed parser supporting RSS 2.0, Atom 1.0, and JSON Feed 1.0/1.1.
 * Provides automatic format detection, URL normalization, and a unified output format.
 *
 * Main API:
 * - {@link parseFeed} - Auto-detect and parse any feed format
 * - {@link detectFormat} - Detect feed format without parsing
 * - {@link normalizeUrl} - Resolve relative URLs to absolute
 *
 * Format-specific parsers available for advanced use cases.
 *
 * @packageDocumentation
 */

export { parseAtom } from './atom/index.js';
export type { AtomDocument, AtomEntry, AtomFeed } from './atom/types.js';
// Format detection
export {
  detectFormat,
  type FeedFormat,
  isAtom,
  isFeed,
  isJSONFeed,
  isRSS,
  isSitemapFormat,
} from './detect.js';
// Sitemap parser
export { isSitemap, parseSitemap } from './sitemap/index.js';
export type {
  Sitemap,
  SitemapImage,
  SitemapIndexEntry,
  SitemapNews,
  SitemapParseResult,
  SitemapUrl,
  SitemapVideo,
} from './sitemap/types.js';
export { parseJSONFeed } from './json-feed/index.js';
export type {
  JSONFeed as JSONFeedType,
  JSONFeedDocument,
  JSONFeedItem,
} from './json-feed/types.js';
// Normalization utilities (advanced use)
export { normalizeAtom, normalizeJSONFeed, normalizeRSS } from './normalize.js';
// Main unified API
export { parseFeed, parseFeedAs, parseFeedNormalized } from './parse.js';
// Format-specific parsers (advanced use)
export { parseRSS } from './rss/index.js';
// Format-specific types (advanced use)
export type { RssChannel, RssFeedExtended, RssItem } from './rss/types.js';
// Normalized types (recommended for most use cases)
export type { Feed, FeedAuthor, FeedEnclosure, FeedItem, ParseResult } from './types.js';
