/**
 * High-level feed gathering functionality.
 *
 * @packageDocumentation
 */

import { detectFormat } from '../feed/detect.js';
import { parseFeed } from '../feed/parse.js';
import { parseSitemap } from '../feed/sitemap/index.js';
import type { Feed, FeedItem } from '../feed/types.js';
import { pluck } from '../pluck/index.js';

/**
 * Gather and parse a feed from a URL in one convenient call.
 *
 * @remarks
 * This is a high-level convenience method that combines fetching and parsing.
 * It handles encoding detection, redirects, and feed format detection automatically.
 * Falls back to sitemap parsing when standard feed formats aren't detected.
 *
 * @param url - Feed URL as string or URL object
 * @returns Normalized feed data
 * @throws Error if URL is invalid, fetch fails, or feed cannot be parsed
 *
 * @example
 * ```typescript
 * // Fetch and parse a feed
 * const feed = await gatherFeed('https://example.com/feed.xml');
 *
 * console.log(feed.title);
 * console.log(feed.items[0].title);
 * console.log(feed.items[0].url);
 * ```
 */
export async function gatherFeed(url: string | URL): Promise<Feed> {
  // Convert string to URL and validate
  let feedUrl: URL;
  try {
    feedUrl = typeof url === 'string' ? new URL(url) : url;
  } catch (error) {
    throw new Error(`Invalid feed URL: ${typeof url === 'string' ? url : url.toString()}`, {
      cause: error,
    });
  }

  // Ensure URL is valid (has protocol and host)
  if (!feedUrl.protocol || !feedUrl.host) {
    throw new Error(`Invalid feed URL: must have protocol and host (${feedUrl.toString()})`);
  }

  // Fetch the feed content
  const response = await pluck(feedUrl);
  const content = await response.textUtf8();

  // Detect format and handle accordingly
  const format = detectFormat(content);

  // Handle sitemaps as fallback
  if (format === 'sitemap') {
    return normalizeSitemapToFeed(content, response.finalUrl);
  }

  // Parse the feed using the final URL (after redirects)
  const result = parseFeed(content, response.finalUrl);

  return result.feed;
}

/**
 * Convert a sitemap to the normalized Feed format.
 * This allows sitemaps to be used as a fallback when standard feeds aren't available.
 */
function normalizeSitemapToFeed(content: string, baseUrl: string): Feed {
  const result = parseSitemap(content, baseUrl);

  // If it's a sitemap index, we can't really normalize it to feed items
  if (result.isIndex) {
    const items: FeedItem[] = result.sitemap.sitemaps.map((sitemap, index) => ({
      id: sitemap.loc || `sitemap-${index}`,
      url: sitemap.loc,
      title: `Sitemap: ${sitemap.loc}`,
      modified: sitemap.lastmod,
    }));

    return {
      format: 'sitemap',
      title: 'Sitemap Index',
      url: baseUrl,
      items,
    };
  }

  // Convert URLs to feed items
  const items: FeedItem[] = result.sitemap.urls.map((url, index) => {
    const item: FeedItem = {
      id: url.loc || `url-${index}`,
      url: url.loc,
      modified: url.lastmod,
    };

    // Use Google News data if available
    if (url.news) {
      item.title = url.news.title;
      item.published = url.news.publicationDate;

      if (url.news.publication?.name) {
        item.authors = [{ name: url.news.publication.name }];
      }

      if (url.news.keywords) {
        item.tags = url.news.keywords;
      }
    }

    // Use first image if available
    if (url.images && url.images.length > 0) {
      item.image = url.images[0].loc;
    }

    return item;
  });

  // Try to extract a title from the base URL
  let title = 'Sitemap';
  try {
    const urlObj = new URL(baseUrl);
    title = `${urlObj.hostname} Sitemap`;
  } catch {
    // Keep default title
  }

  return {
    format: 'sitemap',
    title,
    url: baseUrl,
    items,
  };
}
