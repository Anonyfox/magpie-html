/**
 * Main RSS feed parser
 * Orchestrates parsing of RSS 2.0, 0.9x feeds
 */

import { parseRSSXML, querySelector } from './xml-parser.js';
import { extractChannel } from './extract-channel.js';
import { extractItem } from './extract-item.js';
import { extractNamespaces } from './extract-namespaces.js';
import type { RssFeedExtended, RssItemExtended } from './types.js';
import { querySelectorAll } from './xml-parser.js';

/**
 * Parse RSS feed from XML string
 * Supports RSS 2.0, 0.92, 0.91, 0.9
 */
export function parseRSS(xml: string): RssFeedExtended {
  // Parse XML
  const doc = parseRSSXML(xml);

  // Find RSS root element
  const rssEl = querySelector(doc, 'rss');
  if (!rssEl) {
    throw new Error('Invalid RSS: Missing <rss> root element');
  }

  // Get RSS version
  const version = rssEl.attributes.version || '2.0';

  // Find channel element
  const channelEl = querySelector(rssEl, 'channel');
  if (!channelEl) {
    throw new Error('Invalid RSS: Missing <channel> element');
  }

  // Extract channel metadata
  const channel = extractChannel(channelEl);

  // Extract items with namespaces
  const itemElements = querySelectorAll(channelEl, 'item');
  const items: RssItemExtended[] = itemElements.map((itemEl) => {
    const item = extractItem(itemEl);
    const namespaces = extractNamespaces(itemEl);

    // Only add namespaces if any exist
    if (Object.keys(namespaces).length > 0) {
      return { ...item, namespaces };
    }

    return item;
  });

  return {
    version,
    channel,
    items,
  };
}

/**
 * Detect if content is RSS format
 */
export function isRSS(xml: string): boolean {
  try {
    const trimmed = xml.trim();
    // Quick check for RSS markers
    return (
      trimmed.includes('<rss') &&
      (trimmed.includes('version="2.0"') ||
        trimmed.includes("version='2.0'") ||
        trimmed.includes('version="0.9') ||
        trimmed.includes("version='0.9"))
    );
  } catch {
    return false;
  }
}

