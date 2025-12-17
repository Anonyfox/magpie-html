/**
 * RSS Feed Parser
 * Public API exports
 */

// Main parser
export { parseRSS, isRSS } from './parse.js';

// Types
export type {
  RssFeed,
  RssFeedExtended,
  RssChannel,
  RssItem,
  RssItemExtended,
  RssImage,
  RssEnclosure,
  RssGuid,
  RssSource,
  RssCloud,
  RssNamespaces,
  RssMediaContent,
  RssMediaThumbnail,
} from './types.js';

// Advanced/internal exports for custom use cases
export { extractChannel } from './extract-channel.js';
export { extractItem, extractItems } from './extract-item.js';
export { extractNamespaces } from './extract-namespaces.js';
export { cleanText, stripCDATA, decodeEntities, normalizeWhitespace } from './clean-text.js';
export { parseRSSDate, parseRFC822Date, isValidDate } from './parse-date.js';
export { parseRSSXML, querySelector, querySelectorAll, getText, getAttribute } from './xml-parser.js';
export type { RSSElement } from './xml-parser.js';

