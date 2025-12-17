/**
 * Main RSS feed parser
 * Orchestrates parsing of RSS 2.0, 0.9x feeds
 */

import { normalizeUrlHttps } from '../../utils/normalize-url.js';
import { extractChannel } from './extract-channel.js';
import { extractItem } from './extract-item.js';
import { extractNamespaces } from './extract-namespaces.js';
import type { RssChannel, RssFeedExtended, RssItem, RssItemExtended } from './types.js';
import { parseRSSXML, querySelector, querySelectorAll } from './xml-parser.js';

/**
 * Parse RSS feed from XML string
 * Supports RSS 2.0, 0.92, 0.91, 0.9
 * @param xml - RSS XML string
 * @param baseUrl - Optional base URL for resolving relative URLs
 */
export function parseRSS(xml: string, baseUrl?: string | URL): RssFeedExtended {
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

  // Apply URL normalization if base URL provided
  const normalizedChannel = baseUrl ? normalizeChannelUrls(channel, baseUrl) : channel;
  const normalizedItems = baseUrl ? items.map((item) => normalizeItemUrls(item, baseUrl)) : items;

  return {
    version,
    channel: normalizedChannel,
    items: normalizedItems,
  };
}

/**
 * Normalize all URLs in channel
 */
function normalizeChannelUrls(channel: RssChannel, baseUrl: string | URL): RssChannel {
  return {
    ...channel,
    link: channel.link ? normalizeUrlHttps(baseUrl, channel.link) : channel.link,
    image: channel.image
      ? {
          ...channel.image,
          url: normalizeUrlHttps(baseUrl, channel.image.url),
          link: channel.image.link
            ? normalizeUrlHttps(baseUrl, channel.image.link)
            : channel.image.link,
        }
      : channel.image,
    docs: channel.docs ? normalizeUrlHttps(baseUrl, channel.docs) : channel.docs,
  };
}

/**
 * Normalize all URLs in item
 */
function normalizeItemUrls(item: RssItem, baseUrl: string | URL): RssItem {
  return {
    ...item,
    link: item.link ? normalizeUrlHttps(baseUrl, item.link) : item.link,
    comments: item.comments ? normalizeUrlHttps(baseUrl, item.comments) : item.comments,
    enclosure: item.enclosure
      ? {
          ...item.enclosure,
          url: normalizeUrlHttps(baseUrl, item.enclosure.url),
        }
      : item.enclosure,
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
