/**
 * Feed discovery module.
 *
 * @remarks
 * Discovers RSS, Atom, and JSON feeds in HTML documents.
 *
 * @packageDocumentation
 */

export { extractFeedDiscovery } from './extract.js';
export { COMMON_FEED_PATHS, generateFeedSuggestions } from './heuristics.js';
export type { DiscoveredFeed, FeedDiscoveryMetadata } from './types.js';
