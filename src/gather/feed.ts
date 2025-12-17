/**
 * High-level feed gathering functionality.
 *
 * @packageDocumentation
 */

import { parseFeed } from '../feed/parse.js';
import type { Feed } from '../feed/types.js';
import { pluck } from '../pluck/index.js';

/**
 * Gather and parse a feed from a URL in one convenient call.
 *
 * @remarks
 * This is a high-level convenience method that combines fetching and parsing.
 * It handles encoding detection, redirects, and feed format detection automatically.
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

  // Parse the feed using the final URL (after redirects)
  const result = parseFeed(content, response.finalUrl);

  return result.feed;
}
