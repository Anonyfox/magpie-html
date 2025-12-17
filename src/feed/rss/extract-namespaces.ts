/**
 * Extract RSS namespace extensions
 * Common namespaces: content:encoded, dc:creator, media:*, atom:link
 */

import type { RSSElement } from './xml-parser.js';
import { querySelector, querySelectorAll, getText, getAttribute } from './xml-parser.js';
import type { RssNamespaces, RssMediaContent, RssMediaThumbnail } from './types.js';
import { cleanText } from './clean-text.js';
import { parseRSSDate } from './parse-date.js';

/**
 * Extract namespace extensions from item
 */
export function extractNamespaces(itemElement: RSSElement): RssNamespaces {
  const namespaces: RssNamespaces = {};

  // content:encoded - Full content (often HTML)
  const contentEncoded = querySelector(itemElement, 'content:encoded');
  if (contentEncoded) {
    namespaces.contentEncoded = cleanText(getText(contentEncoded), {
      preserveLineBreaks: true,
    });
  }

  // dc:creator - Dublin Core creator (author)
  const dcCreator = querySelector(itemElement, 'dc:creator');
  if (dcCreator) {
    namespaces.dcCreator = cleanText(getText(dcCreator));
  }

  // dc:date - Dublin Core date (alternative to pubDate)
  const dcDate = querySelector(itemElement, 'dc:date');
  if (dcDate) {
    const dateText = cleanText(getText(dcDate));
    // dc:date uses ISO 8601, not RFC 822
    const parsed = parseRSSDate(dateText);
    if (parsed) {
      namespaces.dcDate = parsed;
    }
  }

  // dc:subject - Dublin Core subject (categories)
  const dcSubjects = querySelectorAll(itemElement, 'dc:subject');
  if (dcSubjects.length > 0) {
    const subjects = dcSubjects
      .map((el) => cleanText(getText(el)))
      .filter((text) => text.length > 0);
    if (subjects.length > 0) {
      namespaces.dcSubject = subjects;
    }
  }

  // media:content - Media RSS content
  const mediaContents = querySelectorAll(itemElement, 'media:content');
  if (mediaContents.length > 0) {
    namespaces.mediaContent = mediaContents.map((el) => ({
      url: getAttribute(el, 'url') || '',
      type: getAttribute(el, 'type') || undefined,
      medium: getAttribute(el, 'medium') || undefined,
      width: (() => {
        const w = getAttribute(el, 'width');
        return w ? Number.parseInt(w, 10) : undefined;
      })(),
      height: (() => {
        const h = getAttribute(el, 'height');
        return h ? Number.parseInt(h, 10) : undefined;
      })(),
    }));
  }

  // media:thumbnail - Media RSS thumbnail
  const mediaThumbnails = querySelectorAll(itemElement, 'media:thumbnail');
  if (mediaThumbnails.length > 0) {
    namespaces.mediaThumbnail = mediaThumbnails.map((el) => ({
      url: getAttribute(el, 'url') || '',
      width: (() => {
        const w = getAttribute(el, 'width');
        return w ? Number.parseInt(w, 10) : undefined;
      })(),
      height: (() => {
        const h = getAttribute(el, 'height');
        return h ? Number.parseInt(h, 10) : undefined;
      })(),
    }));
  }

  return namespaces;
}

