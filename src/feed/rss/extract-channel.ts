/**
 * Extract RSS channel (feed-level) metadata
 */

import { cleanText } from './clean-text.js';
import { parseRSSDate } from './parse-date.js';
import type { RssChannel } from './types.js';
import type { RSSElement } from './xml-parser.js';
import { getAttribute, getText, querySelector, querySelectorAll } from './xml-parser.js';

/**
 * Extract channel metadata from RSS feed
 */
export function extractChannel(channelElement: RSSElement): RssChannel {
  const getTextClean = (selector: string): string => {
    const element = querySelector(channelElement, selector);
    return cleanText(getText(element));
  };

  const getNumber = (selector: string): number | undefined => {
    const text = getTextClean(selector);
    if (!text) return undefined;
    const num = Number.parseInt(text, 10);
    return Number.isNaN(num) ? undefined : num;
  };

  const getDate = (selector: string): string | undefined => {
    const text = getTextClean(selector);
    return parseRSSDate(text) || undefined;
  };

  const getArray = (selector: string): string[] | undefined => {
    const elements = querySelectorAll(channelElement, selector);
    if (elements.length === 0) return undefined;
    const cleaned = elements.map((el) => cleanText(getText(el))).filter((text) => text.length > 0);
    return cleaned.length > 0 ? cleaned : undefined;
  };

  // Required fields
  const title = getTextClean('title');
  const link = getTextClean('link');
  const description = getTextClean('description');

  // Optional fields
  const language = getTextClean('language') || undefined;
  const copyright = getTextClean('copyright') || undefined;
  const managingEditor = getTextClean('managingEditor') || undefined;
  const webMaster = getTextClean('webMaster') || undefined;
  const pubDate = getDate('pubDate');
  const lastBuildDate = getDate('lastBuildDate');
  const category = getArray('category');
  const generator = getTextClean('generator') || undefined;
  const docs = getTextClean('docs') || undefined;
  const ttl = getNumber('ttl');

  // Image
  const imageEl = querySelector(channelElement, 'image');
  const image = imageEl
    ? {
        url: cleanText(getText(querySelector(imageEl, 'url'))),
        title: cleanText(getText(querySelector(imageEl, 'title'))),
        link: cleanText(getText(querySelector(imageEl, 'link'))),
        width: (() => {
          const w = cleanText(getText(querySelector(imageEl, 'width')));
          return w ? Number.parseInt(w, 10) : undefined;
        })(),
        height: (() => {
          const h = cleanText(getText(querySelector(imageEl, 'height')));
          return h ? Number.parseInt(h, 10) : undefined;
        })(),
        description: cleanText(getText(querySelector(imageEl, 'description'))) || undefined,
      }
    : undefined;

  // Cloud
  const cloudEl = querySelector(channelElement, 'cloud');
  const cloud = cloudEl
    ? {
        domain: getAttribute(cloudEl, 'domain') || '',
        port: Number.parseInt(getAttribute(cloudEl, 'port') || '0', 10),
        path: getAttribute(cloudEl, 'path') || '',
        registerProcedure: getAttribute(cloudEl, 'registerProcedure') || '',
        protocol: getAttribute(cloudEl, 'protocol') || '',
      }
    : undefined;

  // Skip hours and days
  const skipHoursEl = querySelector(channelElement, 'skipHours');
  const skipHours = skipHoursEl
    ? querySelectorAll(skipHoursEl, 'hour')
        .map((el) => Number.parseInt(getText(el), 10))
        .filter((n) => !Number.isNaN(n))
    : undefined;

  const skipDaysEl = querySelector(channelElement, 'skipDays');
  const skipDays = skipDaysEl
    ? querySelectorAll(skipDaysEl, 'day')
        .map((el) => cleanText(getText(el)))
        .filter((t) => t.length > 0)
    : undefined;

  const channel: RssChannel = {
    title,
    link,
    description,
  };

  // Add optional fields only if they exist
  if (language) channel.language = language;
  if (copyright) channel.copyright = copyright;
  if (managingEditor) channel.managingEditor = managingEditor;
  if (webMaster) channel.webMaster = webMaster;
  if (pubDate) channel.pubDate = pubDate;
  if (lastBuildDate) channel.lastBuildDate = lastBuildDate;
  if (category) channel.category = category;
  if (generator) channel.generator = generator;
  if (docs) channel.docs = docs;
  if (cloud) channel.cloud = cloud;
  if (ttl) channel.ttl = ttl;
  if (image) channel.image = image;
  if (skipHours && skipHours.length > 0) channel.skipHours = skipHours;
  if (skipDays && skipDays.length > 0) channel.skipDays = skipDays;

  return channel;
}
