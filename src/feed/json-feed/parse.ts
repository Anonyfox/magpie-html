/**
 * JSON Feed parser
 */

import { normalizeUrlHttps } from '../../utils/normalize-url.js';
import type { JSONFeed, JSONFeedAttachment, JSONFeedDocument, JSONFeedItem } from './types.js';
import { validate } from './validate.js';

/**
 * Parse JSON Feed from string
 * @param jsonString - Raw JSON string
 * @param baseUrl - Optional base URL for resolving relative URLs
 * @returns Parsed JSON Feed document
 * @throws Error if JSON is invalid or feed validation fails
 */
export function parseJSONFeed(jsonString: string, baseUrl?: string | URL): JSONFeedDocument {
  // Parse JSON
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Validate feed structure
  const errors = validate(data);
  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    throw new Error(`Invalid JSON Feed: ${errorMessages}`);
  }

  const feed = data as JSONFeed;

  // Extract version
  const version = extractVersion(feed.version);

  // Apply URL normalization if base URL provided
  const normalizedFeed = baseUrl ? normalizeFeedUrls(feed, baseUrl) : feed;

  return {
    version,
    feed: normalizedFeed,
  };
}

/**
 * Normalize all URLs in JSON Feed
 */
function normalizeFeedUrls(feed: JSONFeed, baseUrl: string | URL): JSONFeed {
  return {
    ...feed,
    home_page_url: feed.home_page_url
      ? normalizeUrlHttps(baseUrl, feed.home_page_url)
      : feed.home_page_url,
    feed_url: feed.feed_url ? normalizeUrlHttps(baseUrl, feed.feed_url) : feed.feed_url,
    icon: feed.icon ? normalizeUrlHttps(baseUrl, feed.icon) : feed.icon,
    favicon: feed.favicon ? normalizeUrlHttps(baseUrl, feed.favicon) : feed.favicon,
    items: feed.items ? feed.items.map((item) => normalizeItemUrls(item, baseUrl)) : feed.items,
  };
}

/**
 * Normalize all URLs in item
 */
function normalizeItemUrls(item: JSONFeedItem, baseUrl: string | URL): JSONFeedItem {
  return {
    ...item,
    url: item.url ? normalizeUrlHttps(baseUrl, item.url) : item.url,
    external_url: item.external_url
      ? normalizeUrlHttps(baseUrl, item.external_url)
      : item.external_url,
    image: item.image ? normalizeUrlHttps(baseUrl, item.image) : item.image,
    banner_image: item.banner_image
      ? normalizeUrlHttps(baseUrl, item.banner_image)
      : item.banner_image,
    attachments: item.attachments
      ? item.attachments.map((attachment) => normalizeAttachmentUrls(attachment, baseUrl))
      : item.attachments,
  };
}

/**
 * Normalize URLs in attachment
 */
function normalizeAttachmentUrls(
  attachment: JSONFeedAttachment,
  baseUrl: string | URL,
): JSONFeedAttachment {
  return {
    ...attachment,
    url: normalizeUrlHttps(baseUrl, attachment.url),
  };
}

/**
 * Extract version number from version URL
 */
function extractVersion(versionUrl: string): string {
  // Extract version from URLs like:
  // "https://jsonfeed.org/version/1.1"
  // "https://jsonfeed.org/version/1"
  const match = versionUrl.match(/version\/([\d.]+)/);
  return match ? match[1] : versionUrl;
}
