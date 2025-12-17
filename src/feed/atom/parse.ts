/**
 * Main Atom feed parser
 * Orchestrates feed and entry extraction
 */

import { normalizeUrlHttps } from '../../utils/normalize-url.js';
import { extractEntry } from './extract-entry.js';
import { extractFeed } from './extract-feed.js';
import type { AtomDocument, AtomEntry, AtomFeed, AtomLink } from './types.js';
import { parseXML } from './xml-parser.js';

/**
 * Parse complete Atom feed
 * @param xml - Atom XML string
 * @param baseUrl - Optional base URL for resolving relative URLs
 */
export function parseAtom(xml: string, baseUrl?: string | URL): AtomDocument {
  const doc = parseXML(xml);

  // Extract feed metadata
  const feed = extractFeed(xml);

  // Extract all entries
  const entryElements = doc.querySelectorAll('entry');
  const entries = entryElements.map((entryElement) => extractEntry(entryElement));

  // Apply URL normalization if base URL provided
  const normalizedFeed = baseUrl ? normalizeFeedUrls(feed, baseUrl) : feed;
  const normalizedEntries = baseUrl
    ? entries.map((entry) => normalizeEntryUrls(entry, baseUrl))
    : entries;

  return {
    version: '1.0',
    feed: normalizedFeed,
    entries: normalizedEntries,
  };
}

/**
 * Normalize all URLs in feed
 */
function normalizeFeedUrls(feed: AtomFeed, baseUrl: string | URL): AtomFeed {
  return {
    ...feed,
    links: feed.links ? feed.links.map((link) => normalizeLinkUrls(link, baseUrl)) : feed.links,
    icon: feed.icon ? normalizeUrlHttps(baseUrl, feed.icon) : feed.icon,
    logo: feed.logo ? normalizeUrlHttps(baseUrl, feed.logo) : feed.logo,
  };
}

/**
 * Normalize all URLs in entry
 */
function normalizeEntryUrls(entry: AtomEntry, baseUrl: string | URL): AtomEntry {
  return {
    ...entry,
    links: entry.links ? entry.links.map((link) => normalizeLinkUrls(link, baseUrl)) : entry.links,
  };
}

/**
 * Normalize URLs in link
 */
function normalizeLinkUrls(link: AtomLink, baseUrl: string | URL): AtomLink {
  return {
    ...link,
    href: normalizeUrlHttps(baseUrl, link.href),
  };
}
