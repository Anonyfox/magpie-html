/**
 * High-level website gathering functionality.
 *
 * @packageDocumentation
 */

import { htmlToText } from '../../content/html-to-text/index.js';
import { extractFeedDiscovery } from '../../metadata/feed-discovery/index.js';
import { pluck } from '../../pluck/index.js';
import { parseHTML } from '../../utils/html-parser.js';
import type { Website } from '../types.js';
import { extractBestDescription } from './description.js';
import { extractBestIcon } from './icon.js';
import { extractBestImage } from './image.js';
import { extractBestLanguage } from './language.js';
import { extractPageLinks } from './links.js';
import { extractBestTitle } from './title.js';
import { extractBestUrl } from './url.js';

/**
 * Gather website data from a URL in one convenient call.
 *
 * @remarks
 * This is a high-level convenience method that fetches a website and extracts
 * all relevant data. It handles encoding detection, redirects, and provides
 * a unified interface for all website data.
 *
 * This method will be extended incrementally to include metadata extraction,
 * content extraction, and more.
 *
 * @param url - Website URL as string or URL object
 * @returns Gathered website data including final URL, title, description, image, icon, language, html, text, feeds, and links
 * @throws Error if URL is invalid or fetch fails
 *
 * @example
 * ```typescript
 * // Fetch a website and get its data
 * const site = await gatherWebsite('https://example.com');
 * console.log(site.url);            // Final URL after redirects
 * console.log(site.title);          // Page title (cleaned, from best source)
 * console.log(site.description);    // Page description (from best source)
 * console.log(site.image);          // Page image/keyvisual (from best source)
 * console.log(site.icon);           // Best available icon/favicon
 * console.log(site.language);       // Primary language code (ISO 639-1)
 * console.log(site.region);         // Region code (ISO 3166-1 alpha-2)
 * console.log(site.html);           // Raw HTML content (UTF-8)
 * console.log(site.text);           // Plain text content (extracted from HTML)
 * console.log(site.feeds);          // Array of feed URL objects
 * console.log(site.internalLinks);  // Array of internal link URL objects
 * console.log(site.externalLinks);  // Array of external link URL objects
 * ```
 */
export async function gatherWebsite(url: string | URL): Promise<Website> {
  // Convert string to URL and validate
  let siteUrl: URL;
  try {
    siteUrl = typeof url === 'string' ? new URL(url) : url;
  } catch (error) {
    throw new Error(`Invalid website URL: ${typeof url === 'string' ? url : url.toString()}`, {
      cause: error,
    });
  }

  // Ensure URL is valid (has protocol and host)
  if (!siteUrl.protocol || !siteUrl.host) {
    throw new Error(`Invalid website URL: must have protocol and host (${siteUrl.toString()})`);
  }

  // Fetch the website
  const response = await pluck(siteUrl);
  const html = await response.textUtf8();

  // Parse HTML document
  const doc = parseHTML(html);

  // Extract plain text from HTML
  const text = htmlToText(html);

  // Extract best URL (canonical or final redirect URL)
  const pageUrl = extractBestUrl(doc, response.finalUrl);

  // Extract feed discovery metadata
  const feedDiscovery = extractFeedDiscovery(doc, pageUrl);

  // Convert feed URLs to URL objects (filter out invalid URLs)
  const feeds: URL[] = [];
  for (const feed of feedDiscovery.feeds) {
    try {
      feeds.push(new URL(feed.url));
    } catch {
      // Skip invalid feed URLs
    }
  }

  // Extract best title, description, image, icon, and language from multiple sources
  const title = extractBestTitle(doc);
  const description = extractBestDescription(doc);
  const imageUrl = extractBestImage(doc);
  const iconUrl = extractBestIcon(doc);
  const { language, region } = extractBestLanguage(doc);

  // Convert image URL string to URL object
  let image: URL | undefined;
  if (imageUrl) {
    try {
      image = new URL(imageUrl);
    } catch {
      // Skip invalid image URL
    }
  }

  // Convert icon URL string to URL object
  let icon: URL | undefined;
  if (iconUrl) {
    try {
      icon = new URL(iconUrl);
    } catch {
      // Skip invalid icon URL
    }
  }

  // Extract internal and external links
  const { internal, external } = extractPageLinks(doc, pageUrl);

  // Convert link strings to URL objects
  const internalLinks: URL[] = [];
  for (const link of internal) {
    try {
      internalLinks.push(new URL(link));
    } catch {
      // Skip invalid URLs
    }
  }

  const externalLinks: URL[] = [];
  for (const link of external) {
    try {
      externalLinks.push(new URL(link));
    } catch {
      // Skip invalid URLs
    }
  }

  // Return the gathered website data
  return {
    url: new URL(pageUrl),
    feeds,
    title,
    description,
    image,
    icon,
    language,
    region,
    html,
    text,
    internalLinks,
    externalLinks,
  };
}
