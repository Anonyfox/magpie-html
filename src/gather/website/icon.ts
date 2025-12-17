/**
 * Icon extraction and aggregation for websites.
 *
 * @packageDocumentation
 */

import { extractIcons } from '../../metadata/icons/index.js';
import type { AppleTouchIcon } from '../../metadata/icons/types.js';
import type { HTMLDocument as Document } from '../../utils/html-parser.js';

/**
 * Extract best icon/favicon from multiple sources with smart fallbacks.
 *
 * @remarks
 * Strategy (priority order):
 * 1. Largest Apple Touch Icon (often high quality, 180x180+)
 * 2. Safari mask icon (SVG, scalable, modern)
 * 3. Standard favicon (most common)
 * 4. Shortcut icon (legacy fallback)
 * 5. Microsoft tile image (Windows)
 * 6. Fluid icon (legacy, rare)
 *
 * This ensures we get the highest quality icon available,
 * prioritizing modern, high-resolution icons over legacy formats.
 *
 * @param doc - Parsed HTML document
 * @returns Best available icon URL or undefined if none found
 *
 * @example
 * ```typescript
 * const doc = parseHTML(html);
 * const icon = extractBestIcon(doc);
 * console.log(icon); // URL of best available icon
 * ```
 */
export function extractBestIcon(doc: Document): string | undefined {
  const icons = extractIcons(doc);

  // Priority 1: Largest Apple Touch Icon (high quality)
  if (icons.appleTouchIcons && icons.appleTouchIcons.length > 0) {
    const largest = findLargestAppleTouchIcon(icons.appleTouchIcons);
    if (largest?.url) {
      return largest.url;
    }
  }

  // Priority 2: Safari mask icon (SVG, scalable)
  if (icons.maskIcon?.url) {
    return icons.maskIcon.url;
  }

  // Priority 3: Standard favicon (most common)
  if (icons.favicon?.trim()) {
    return icons.favicon.trim();
  }

  // Priority 4: Shortcut icon (legacy)
  if (icons.shortcutIcon?.trim()) {
    return icons.shortcutIcon.trim();
  }

  // Priority 5: Microsoft tile image
  if (icons.msTile?.image?.trim()) {
    return icons.msTile.image.trim();
  }

  // Priority 6: Fluid icon (legacy, rare)
  if (icons.fluidIcon?.trim()) {
    return icons.fluidIcon.trim();
  }

  return undefined;
}

/**
 * Find the largest Apple Touch Icon by size.
 *
 * @remarks
 * Parses size strings like "180x180" and compares by area (width * height).
 * Special handling for "any" size (treated as largest, typically SVG).
 *
 * @param icons - Array of Apple Touch Icons
 * @returns Largest icon or first icon if sizes not specified
 */
function findLargestAppleTouchIcon(icons: AppleTouchIcon[]): AppleTouchIcon | undefined {
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
 * Parse size string (e.g., "180x180", "any") to numeric value for comparison.
 *
 * @param sizeStr - Size string from sizes attribute
 * @returns Numeric size value (area = width * height), or 0 if invalid
 */
function parseSizeString(sizeStr?: string): number {
  if (!sizeStr) {
    return 0;
  }

  // Handle "any" as very large (typically SVG, scalable)
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
