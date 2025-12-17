/**
 * Extract RSS item (article/entry) data
 */

import type { RSSElement } from './xml-parser.js';
import { querySelector, querySelectorAll, getText, getAttribute } from './xml-parser.js';
import type { RssItem, RssEnclosure, RssGuid, RssSource } from './types.js';
import { cleanText } from './clean-text.js';
import { parseRSSDate } from './parse-date.js';

/**
 * Extract item data from RSS feed
 */
export function extractItem(itemElement: RSSElement): RssItem {
  const getTextClean = (selector: string): string | undefined => {
    const element = querySelector(itemElement, selector);
    const text = cleanText(getText(element));
    return text || undefined;
  };

  const getDate = (selector: string): string | undefined => {
    const text = getTextClean(selector);
    return text ? parseRSSDate(text) || undefined : undefined;
  };

  const getArray = (selector: string): string[] | undefined => {
    const elements = querySelectorAll(itemElement, selector);
    if (elements.length === 0) return undefined;
    const cleaned = elements.map((el) => cleanText(getText(el))).filter((text) => text.length > 0);
    return cleaned.length > 0 ? cleaned : undefined;
  };

  // RSS 2.0 spec: An item must have either title or description (or both)
  const title = getTextClean('title');
  const link = getTextClean('link');
  const description = getTextClean('description');
  const author = getTextClean('author');
  const category = getArray('category');
  const comments = getTextClean('comments');
  const pubDate = getDate('pubDate');

  // Enclosure
  const enclosureEl = querySelector(itemElement, 'enclosure');
  const enclosure: RssEnclosure | undefined = enclosureEl
    ? {
        url: getAttribute(enclosureEl, 'url') || '',
        length: Number.parseInt(getAttribute(enclosureEl, 'length') || '0', 10),
        type: getAttribute(enclosureEl, 'type') || '',
      }
    : undefined;

  // GUID
  const guidEl = querySelector(itemElement, 'guid');
  const guid: RssGuid | undefined = guidEl
    ? {
        value: cleanText(getText(guidEl)),
        isPermaLink: getAttribute(guidEl, 'isPermaLink')?.toLowerCase() !== 'false',
      }
    : undefined;

  // Source
  const sourceEl = querySelector(itemElement, 'source');
  const source: RssSource | undefined = sourceEl
    ? {
        value: cleanText(getText(sourceEl)),
        url: getAttribute(sourceEl, 'url') || '',
      }
    : undefined;

  const item: RssItem = {};

  // Add fields only if they exist (RSS spec allows items with minimal data)
  if (title) item.title = title;
  if (link) item.link = link;
  if (description) item.description = description;
  if (author) item.author = author;
  if (category) item.category = category;
  if (comments) item.comments = comments;
  if (enclosure) item.enclosure = enclosure;
  if (guid) item.guid = guid;
  if (pubDate) item.pubDate = pubDate;
  if (source) item.source = source;

  return item;
}

/**
 * Extract all items from channel
 */
export function extractItems(channelElement: RSSElement): RssItem[] {
  const itemElements = querySelectorAll(channelElement, 'item');
  return itemElements.map((itemEl) => extractItem(itemEl));
}

