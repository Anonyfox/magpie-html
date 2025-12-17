/**
 * Image/keyvisual extraction and aggregation for websites.
 *
 * @packageDocumentation
 */

import { extractIcons } from '../../metadata/icons/index.js';
import { extractOpenGraph } from '../../metadata/opengraph/index.js';
import { extractSchemaOrg } from '../../metadata/schema-org/index.js';
import { extractTwitterCard } from '../../metadata/twitter-card/index.js';
import type { HTMLDocument as Document } from '../../utils/html-parser.js';

/**
 * Extract best keyvisual/image from multiple sources with smart fallbacks.
 *
 * @remarks
 * Strategy (priority order):
 * 1. Schema.org NewsArticle/Article image (largest if array with size metadata)
 * 2. OpenGraph image (optimized for social sharing, often high quality)
 * 3. Twitter Card image (fallback social image)
 * 4. Largest Apple Touch Icon (often high quality app/site icons)
 * 5. Standard favicon (last resort)
 *
 * This ensures we get the best visual representation of the site,
 * prioritizing social media images over generic icons.
 *
 * @param doc - Parsed HTML document
 * @returns Best available image URL or undefined if none found
 *
 * @example
 * ```typescript
 * const doc = parseHTML(html);
 * const image = extractBestImage(doc);
 * console.log(image); // URL of best available image
 * ```
 */
export function extractBestImage(doc: Document): string | undefined {
  // 1. Try Schema.org Article/NewsArticle image (largest if array)
  const schema = extractSchemaOrg(doc);
  if (schema.articles && schema.articles.length > 0) {
    for (const article of schema.articles) {
      const imageUrl = extractSchemaImage(article);
      if (imageUrl?.trim()) {
        return imageUrl.trim();
      }
    }
  }

  // 2. Try OpenGraph image (social media optimized)
  const og = extractOpenGraph(doc);
  if (og.image?.trim()) {
    return og.image.trim();
  }

  // 3. Try Twitter Card image
  const twitter = extractTwitterCard(doc);
  if (twitter.image?.trim()) {
    return twitter.image.trim();
  }

  // 4. Fall back to largest Apple Touch Icon
  const icons = extractIcons(doc);
  if (icons.appleTouchIcons && icons.appleTouchIcons.length > 0) {
    // Find the largest icon by parsing sizes
    const largest = findLargestIcon(icons.appleTouchIcons);
    if (largest?.url) {
      return largest.url;
    }
  }

  // 5. Fall back to standard favicon
  if (icons.favicon?.trim()) {
    return icons.favicon.trim();
  }

  // No image found
  return undefined;
}

/**
 * Extract image URL from Schema.org article object.
 *
 * @remarks
 * Handles multiple formats:
 * - String URL
 * - Single ImageObject with url property
 * - Array of ImageObjects (picks largest by width * height)
 *
 * @param article - Schema.org article object
 * @returns Image URL or undefined
 */
function extractSchemaImage(article: unknown): string | undefined {
  if (!article || typeof article !== 'object') return undefined;

  const image = (article as Record<string, unknown>).image;
  if (!image) return undefined;

  // Case 1: Direct string URL
  if (typeof image === 'string') {
    return image;
  }

  // Case 2: Single ImageObject
  if (typeof image === 'object' && !Array.isArray(image)) {
    const url = getImageUrl(image);
    if (url) return url;
  }

  // Case 3: Array of ImageObjects (pick largest)
  if (Array.isArray(image)) {
    let largest: { url: string; size: number } | undefined;

    for (const img of image) {
      if (typeof img === 'string') {
        // Direct URL in array - return first one
        return img;
      }

      const url = getImageUrl(img);
      if (!url) continue;

      const width = getNumberProperty(img, 'width') || 0;
      const height = getNumberProperty(img, 'height') || 0;
      const size = width * height;

      if (!largest || size > largest.size) {
        largest = { url, size };
      }
    }

    return largest?.url;
  }

  return undefined;
}

/**
 * Extract URL from ImageObject.
 */
function getImageUrl(img: unknown): string | undefined {
  if (!img || typeof img !== 'object') return undefined;
  const obj = img as Record<string, unknown>;

  // Try multiple properties
  return (
    getStringProperty(obj, 'url') ||
    getStringProperty(obj, 'contentUrl') ||
    getStringProperty(obj, '@id')
  );
}

/**
 * Safely extract a string property from an object.
 */
function getStringProperty(obj: Record<string, unknown>, prop: string): string | undefined {
  const value = obj[prop];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Safely extract a number property from an object.
 */
function getNumberProperty(obj: unknown, prop: string): number | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const value = (obj as Record<string, unknown>)[prop];

  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Find the largest Apple Touch Icon by size.
 *
 * @param icons - Array of Apple Touch Icons
 * @returns Largest icon or first icon if sizes not specified
 */
function findLargestIcon(
  icons: Array<{ url: string; sizes?: string; precomposed?: boolean }>,
): { url: string; sizes?: string; precomposed?: boolean } | undefined {
  if (icons.length === 0) {
    return undefined;
  }

  let largest = icons[0];
  let largestSize = parseSizeString(icons[0].sizes);

  for (const icon of icons) {
    const size = parseSizeString(icon.sizes);
    if (size > largestSize) {
      largest = icon;
      largestSize = size;
    }
  }

  return largest;
}

/**
 * Parse size string (e.g., "180x180", "any") to numeric value.
 *
 * @param sizeStr - Size string from sizes attribute
 * @returns Numeric size value for comparison (0 if invalid)
 */
function parseSizeString(sizeStr?: string): number {
  if (!sizeStr) {
    return 0;
  }

  // Handle "any" as very large
  if (sizeStr.toLowerCase() === 'any') {
    return Number.POSITIVE_INFINITY;
  }

  // Parse "WxH" format (e.g., "180x180")
  const match = /^(\d+)x(\d+)$/i.exec(sizeStr);
  if (match) {
    const width = Number.parseInt(match[1], 10);
    const height = Number.parseInt(match[2], 10);
    // Use area (width * height) for comparison
    return width * height;
  }

  return 0;
}
