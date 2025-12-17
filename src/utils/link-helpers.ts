/**
 * Link tag extraction helpers.
 *
 * @remarks
 * Generic utilities for extracting data from <link> tags in parsed HTML documents.
 * These helpers work with parsed HTMLElement from linkedom.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../utils/html-parser.js';

/**
 * Link element data extracted from a <link> tag.
 */
export interface LinkData {
  /** The href attribute value */
  href: string;
  /** The rel attribute value (optional) */
  rel?: string;
  /** The type attribute value (optional) */
  type?: string;
  /** The hreflang attribute value (optional) */
  hreflang?: string;
  /** The title attribute value (optional) */
  title?: string;
  /** The sizes attribute value (optional) */
  sizes?: string;
  /** The media attribute value (optional) */
  media?: string;
  /** The color attribute value (optional, used for mask-icon) */
  color?: string;
}

/**
 * Get href from a link tag by rel attribute.
 *
 * @remarks
 * Finds the first link tag matching the specified rel attribute and returns its href.
 * Returns undefined if not found.
 *
 * @param doc - Parsed HTML document
 * @param rel - Value of the rel attribute to search for
 * @returns Href attribute value, or undefined if not found
 *
 * @example
 * ```typescript
 * const canonical = getLinkHref(doc, 'canonical');
 * const icon = getLinkHref(doc, 'icon');
 * ```
 */
export function getLinkHref(doc: Document, rel: string): string | undefined {
  const element = doc.querySelector(`link[rel="${rel}"]`);
  return element?.getAttribute('href') || undefined;
}

/**
 * Get all link tags matching a rel attribute.
 *
 * @remarks
 * Finds all link tags with the specified rel attribute and extracts
 * their data (href, type, hreflang, etc.).
 *
 * Useful when multiple links can have the same rel (e.g., alternate, icon).
 *
 * @param doc - Parsed HTML document
 * @param rel - Value of the rel attribute to search for
 * @returns Array of link data objects (empty if none found)
 *
 * @example
 * ```typescript
 * const alternates = getAllLinks(doc, 'alternate');
 * // [
 * //   { href: '/fr', hreflang: 'fr', rel: 'alternate' },
 * //   { href: '/de', hreflang: 'de', rel: 'alternate' }
 * // ]
 * ```
 */
export function getAllLinks(doc: Document, rel: string): LinkData[] {
  const elements = doc.querySelectorAll(`link[rel="${rel}"]`);
  const links: LinkData[] = [];

  for (const element of Array.from(elements)) {
    const href = element.getAttribute('href');
    if (!href) continue;

    links.push({
      href,
      rel: element.getAttribute('rel') || undefined,
      type: element.getAttribute('type') || undefined,
      hreflang: element.getAttribute('hreflang') || undefined,
      title: element.getAttribute('title') || undefined,
      sizes: element.getAttribute('sizes') || undefined,
      media: element.getAttribute('media') || undefined,
      color: element.getAttribute('color') || undefined,
    });
  }

  return links;
}

/**
 * Get all link tags matching multiple rel values.
 *
 * @remarks
 * Finds all link tags where the rel attribute matches any of the provided values.
 * Useful for finding related link types (e.g., "icon" or "shortcut icon").
 *
 * @param doc - Parsed HTML document
 * @param rels - Array of rel values to search for
 * @returns Array of link data objects (empty if none found)
 *
 * @example
 * ```typescript
 * const icons = getAllLinksByRels(doc, ['icon', 'shortcut icon']);
 * ```
 */
export function getAllLinksByRels(doc: Document, rels: string[]): LinkData[] {
  const links: LinkData[] = [];

  for (const rel of rels) {
    links.push(...getAllLinks(doc, rel));
  }

  return links;
}

/**
 * Get all link tags matching a rel pattern (prefix).
 *
 * @remarks
 * Finds all link tags where the rel attribute starts with the given prefix.
 * Less common but useful for custom rel types.
 *
 * @param doc - Parsed HTML document
 * @param relPrefix - Prefix to match against rel attributes
 * @returns Array of link data objects (empty if none found)
 *
 * @example
 * ```typescript
 * const appLinks = getAllLinksByPrefix(doc, 'apple-');
 * ```
 */
export function getAllLinksByPrefix(doc: Document, relPrefix: string): LinkData[] {
  const elements = doc.querySelectorAll(`link[rel^="${relPrefix}"]`);
  const links: LinkData[] = [];

  for (const element of Array.from(elements)) {
    const href = element.getAttribute('href');
    if (!href) continue;

    links.push({
      href,
      rel: element.getAttribute('rel') || undefined,
      type: element.getAttribute('type') || undefined,
      hreflang: element.getAttribute('hreflang') || undefined,
      title: element.getAttribute('title') || undefined,
      sizes: element.getAttribute('sizes') || undefined,
      media: element.getAttribute('media') || undefined,
      color: element.getAttribute('color') || undefined,
    });
  }

  return links;
}
