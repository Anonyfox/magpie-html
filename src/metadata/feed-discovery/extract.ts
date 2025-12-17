/**
 * Feed discovery extraction.
 *
 * @remarks
 * Discovers RSS, Atom, and JSON feeds in HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../../utils/html-parser.js';
import { getAllLinks } from '../../utils/link-helpers.js';
import { generateFeedSuggestions } from './heuristics.js';
import type { DiscoveredFeed, FeedDiscoveryMetadata } from './types.js';

/**
 * Extract feed discovery metadata from parsed HTML document.
 *
 * @remarks
 * Finds all feeds declared in <link rel="alternate"> tags and generates
 * suggestions for common feed URL patterns.
 *
 * @param doc - Parsed HTML document
 * @param documentUrl - Optional document URL for generating absolute feed suggestions
 * @returns Feed discovery metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const feeds = extractFeedDiscovery(doc, 'https://example.com');
 * console.log(feeds.feeds); // Discovered feeds
 * console.log(feeds.suggestions); // Suggested feed URLs
 * ```
 */
export function extractFeedDiscovery(
  doc: Document,
  documentUrl?: string | URL,
): FeedDiscoveryMetadata {
  const metadata: FeedDiscoveryMetadata = {
    feeds: [],
  };

  // Find all alternate links
  const alternateLinks = getAllLinks(doc, 'alternate');

  // Filter for feed types and map to DiscoveredFeed format
  for (const link of alternateLinks) {
    const feedType = determineFeedType(link.type);
    if (feedType) {
      metadata.feeds.push({
        url: link.href,
        type: feedType,
        title: link.title,
      });
    }
  }

  // Clean up undefined titles
  metadata.feeds = metadata.feeds.map((feed) =>
    Object.fromEntries(Object.entries(feed).filter(([_, value]) => value !== undefined)),
  ) as DiscoveredFeed[];

  // Generate suggestions if document URL provided
  if (documentUrl) {
    metadata.suggestions = generateFeedSuggestions(documentUrl);
  }

  return metadata;
}

/**
 * Determine feed type from MIME type.
 */
function determineFeedType(mimeType?: string): 'rss' | 'atom' | 'json' | 'unknown' | null {
  if (!mimeType) {
    return null;
  }

  const type = mimeType.toLowerCase();

  if (type.includes('rss') || type === 'application/rss+xml') {
    return 'rss';
  }

  if (type.includes('atom') || type === 'application/atom+xml') {
    return 'atom';
  }

  if (type.includes('json') || type === 'application/feed+json' || type === 'application/json') {
    return 'json';
  }

  // If it has xml or json in the type but doesn't match above, it might still be a feed
  if (type.includes('xml') || type.includes('json')) {
    return 'unknown';
  }

  return null;
}
