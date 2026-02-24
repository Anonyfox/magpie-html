/**
 * Canonical and alternate URL extraction.
 *
 * @remarks
 * Extracts canonical URLs, alternates, and special versions from HTML documents.
 *
 * @packageDocumentation
 */

import {
  type HTMLDocument as Document,
  type DocumentInput,
  ensureDocument,
} from '../../utils/html-parser.js';
import { getAllLinks, getLinkHref } from '../../utils/link-helpers.js';
import { getMetaProperty } from '../../utils/meta-helpers.js';
import type { AlternateLink, AppLinks, CanonicalMetadata } from './types.js';

/**
 * Extract canonical and alternate URL metadata from HTML.
 *
 * @remarks
 * Extracts canonical URLs, language alternates, AMP versions, manifests,
 * and app linking metadata.
 *
 * @param input - Parsed HTML document or raw HTML string
 * @returns Canonical metadata object
 *
 * @example
 * ```typescript
 * // With parsed document (recommended for multiple extractions)
 * const doc = parseHTML(htmlString);
 * const canonical = extractCanonical(doc);
 *
 * // Or directly with HTML string
 * const canonical = extractCanonical(htmlString);
 * ```
 */
export function extractCanonical(input: DocumentInput): CanonicalMetadata {
  const doc = ensureDocument(input);
  const metadata: CanonicalMetadata = {};

  // Extract canonical URL
  metadata.canonical = getLinkHref(doc, 'canonical');

  // Extract alternate links (language versions, feeds, etc.)
  const alternateLinks = getAllLinks(doc, 'alternate');
  if (alternateLinks.length > 0) {
    metadata.alternates = alternateLinks.map((link): AlternateLink => {
      const alt: AlternateLink = {
        href: link.href,
      };

      if (link.hreflang) alt.hreflang = link.hreflang;
      if (link.type) alt.type = link.type;
      if (link.title) alt.title = link.title;

      return alt;
    });
  }

  // Extract AMP version
  metadata.amphtml = getLinkHref(doc, 'amphtml');

  // Extract manifest
  metadata.manifest = getLinkHref(doc, 'manifest');

  // Extract app links
  const appLinks = extractAppLinks(doc);
  if (Object.keys(appLinks).length > 0) {
    metadata.appLinks = appLinks;
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as CanonicalMetadata;
}

/**
 * Extract app linking metadata.
 */
function extractAppLinks(doc: Document): AppLinks {
  const appLinks: AppLinks = {};

  // App Links (Facebook standard)
  appLinks.ios = getMetaProperty(doc, 'al:ios:url');
  appLinks.android = getMetaProperty(doc, 'al:android:url');
  appLinks.web = getMetaProperty(doc, 'al:web:url');

  return Object.fromEntries(
    Object.entries(appLinks).filter(([_, value]) => value !== undefined),
  ) as AppLinks;
}
