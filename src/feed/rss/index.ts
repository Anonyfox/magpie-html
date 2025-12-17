/**
 * RSS Feed Parser
 * Public API exports
 */

export { cleanText, decodeEntities, normalizeWhitespace, stripCDATA } from './clean-text.js';
// Advanced/internal exports for custom use cases
export { extractChannel } from './extract-channel.js';
export { extractItem, extractItems } from './extract-item.js';
export { extractNamespaces } from './extract-namespaces.js';
// Main parser
export { isRSS, parseRSS } from './parse.js';
export { isValidDate, parseRFC822Date, parseRSSDate } from './parse-date.js';
// Types
export type {
  RssChannel,
  RssCloud,
  RssEnclosure,
  RssFeed,
  RssFeedExtended,
  RssGuid,
  RssImage,
  RssItem,
  RssItemExtended,
  RssMediaContent,
  RssMediaThumbnail,
  RssNamespaces,
  RssSource,
} from './types.js';
export type { RSSElement } from './xml-parser.js';
export {
  getAttribute,
  getText,
  parseRSSXML,
  querySelector,
  querySelectorAll,
} from './xml-parser.js';
