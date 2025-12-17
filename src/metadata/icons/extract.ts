/**
 * Icons and visual assets extraction.
 *
 * @remarks
 * Extracts icon metadata from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../../utils/html-parser.js';
import { getAllLinksByPrefix, getAllLinksByRels, getLinkHref } from '../../utils/link-helpers.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { AppleTouchIcon, IconsMetadata, MaskIcon, MSTile } from './types.js';

/**
 * Extract icons metadata from parsed HTML document.
 *
 * @remarks
 * Extracts all icon-related metadata including favicons, Apple touch icons,
 * Safari mask icons, and Microsoft tile configuration.
 *
 * @param doc - Parsed HTML document
 * @returns Icons metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const icons = extractIcons(doc);
 * console.log(icons.favicon);
 * console.log(icons.appleTouchIcons);
 * ```
 */
export function extractIcons(doc: Document): IconsMetadata {
  const metadata: IconsMetadata = {};

  // Extract standard favicons
  const iconLinks = getAllLinksByRels(doc, ['icon', 'shortcut icon']);
  for (const link of iconLinks) {
    if (link.rel === 'icon' && !metadata.favicon) {
      metadata.favicon = link.href;
    }
    if (link.rel === 'shortcut icon' && !metadata.shortcutIcon) {
      metadata.shortcutIcon = link.href;
    }
  }

  // Extract Apple touch icons
  const appleTouchIcons = extractAppleTouchIcons(doc);
  if (appleTouchIcons.length > 0) {
    metadata.appleTouchIcons = appleTouchIcons;
  }

  // Extract Safari mask icon
  const maskIcon = extractMaskIcon(doc);
  if (maskIcon) {
    metadata.maskIcon = maskIcon;
  }

  // Extract Microsoft tile
  const msTile = extractMSTile(doc);
  if (Object.keys(msTile).length > 0) {
    metadata.msTile = msTile;
  }

  // Extract fluid icon (legacy)
  metadata.fluidIcon = getLinkHref(doc, 'fluid-icon');

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as IconsMetadata;
}

/**
 * Extract Apple touch icons.
 */
function extractAppleTouchIcons(doc: Document): AppleTouchIcon[] {
  const icons: AppleTouchIcon[] = [];

  // Get all apple-touch-icon related links
  const links = getAllLinksByPrefix(doc, 'apple-touch-icon');

  for (const link of links) {
    const icon: AppleTouchIcon = {
      url: link.href,
      sizes: link.sizes,
    };

    // Add precomposed flag only if true
    if (link.rel === 'apple-touch-icon-precomposed') {
      icon.precomposed = true;
    }

    // Clean up undefined values
    icons.push(
      Object.fromEntries(
        Object.entries(icon).filter(([_, value]) => value !== undefined),
      ) as AppleTouchIcon,
    );
  }

  return icons;
}

/**
 * Extract Safari mask icon.
 */
function extractMaskIcon(doc: Document): MaskIcon | undefined {
  const url = getLinkHref(doc, 'mask-icon');
  if (!url) {
    return undefined;
  }

  // Get color attribute
  const linkElement = doc.querySelector('link[rel="mask-icon"]');
  const color = linkElement?.getAttribute('color') || undefined;

  const maskIcon: MaskIcon = { url, color };

  return Object.fromEntries(
    Object.entries(maskIcon).filter(([_, value]) => value !== undefined),
  ) as MaskIcon;
}

/**
 * Extract Microsoft tile metadata.
 */
function extractMSTile(doc: Document): MSTile {
  const tile: MSTile = {};

  tile.image = getMetaContent(doc, 'msapplication-TileImage');
  tile.color = getMetaContent(doc, 'msapplication-TileColor');
  tile.config = getMetaContent(doc, 'msapplication-config');

  return Object.fromEntries(
    Object.entries(tile).filter(([_, value]) => value !== undefined),
  ) as MSTile;
}
