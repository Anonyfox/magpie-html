/**
 * Normalize format-specific feeds to unified interface
 */

import type { AtomDocument } from './atom/types.js';
import type { JSONFeedDocument } from './json-feed/types.js';
import type { RssFeedExtended } from './rss/types.js';
import type { Feed, FeedAuthor, FeedEnclosure, FeedItem } from './types.js';

/**
 * Normalize RSS feed to unified format
 */
export function normalizeRSS(rss: RssFeedExtended): Feed {
  const { channel, items } = rss;

  return {
    format: 'rss',
    title: channel.title,
    description: channel.description,
    url: channel.link,
    feedUrl: undefined, // RSS doesn't have self-link in standard fields
    language: channel.language,
    image: channel.image?.url,
    authors: channel.managingEditor
      ? [{ name: channel.managingEditor, email: channel.managingEditor }]
      : undefined,
    updated: channel.lastBuildDate || channel.pubDate,
    items: items.map((item: any): FeedItem => {
      return {
        id: item.guid?.value || item.link || item.title || '',
        title: item.title,
        url: item.link,
        contentHtml: item.contentEncoded || item.description,
        contentText: item.contentEncoded ? undefined : item.description,
        summary: item.description,
        published: item.pubDate,
        authors:
          item.author || item.dcCreator ? [{ name: item.author || item.dcCreator }] : undefined,
        tags: item.categories,
        image: item.mediaThumbnail?.url,
        enclosures: item.enclosure
          ? [
              {
                url: item.enclosure.url,
                type: item.enclosure.type,
                length: item.enclosure.length,
              },
            ]
          : undefined,
      };
    }),
  };
}

/**
 * Normalize Atom feed to unified format
 */
export function normalizeAtom(atom: AtomDocument): Feed {
  const { feed, entries } = atom;

  // Find self link
  const selfLink = feed.links?.find((l) => l.rel === 'self');
  const alternateLink = feed.links?.find((l) => l.rel === 'alternate' || !l.rel);

  return {
    format: 'atom',
    title: feed.title,
    description: feed.subtitle,
    url: alternateLink?.href,
    feedUrl: selfLink?.href,
    language: undefined, // Atom doesn't have top-level language
    image: feed.logo || feed.icon,
    authors: feed.authors?.map(
      (a): FeedAuthor => ({
        name: a.name,
        email: a.email,
        url: a.uri,
      }),
    ),
    updated: feed.updated,
    items: entries.map((entry): FeedItem => {
      const entryAlternateLink = entry.links?.find((l) => l.rel === 'alternate' || !l.rel);
      const entryRelatedLink = entry.links?.find((l) => l.rel === 'related');

      return {
        id: entry.id,
        title: entry.title,
        url: entryAlternateLink?.href,
        externalUrl: entryRelatedLink?.href,
        contentHtml: entry.content?.type === 'html' ? entry.content.value : undefined,
        contentText: entry.content?.type === 'text' ? entry.content.value : undefined,
        summary: entry.summary,
        published: entry.published,
        modified: entry.updated,
        authors: entry.authors?.map(
          (a): FeedAuthor => ({
            name: a.name,
            email: a.email,
            url: a.uri,
          }),
        ),
        tags: entry.categories?.map((c) => c.term),
        image: undefined, // Atom doesn't have item images in standard
      };
    }),
  };
}

/**
 * Normalize JSON Feed to unified format
 */
export function normalizeJSONFeed(jsonFeed: JSONFeedDocument): Feed {
  const { feed } = jsonFeed;

  return {
    format: 'json-feed',
    title: feed.title,
    description: feed.description,
    url: feed.home_page_url,
    feedUrl: feed.feed_url,
    language: feed.language,
    image: feed.icon || feed.favicon,
    authors: feed.authors?.map(
      (a): FeedAuthor => ({
        name: a.name,
        email: undefined,
        url: a.url,
      }),
    ),
    updated: undefined, // JSON Feed doesn't have feed-level updated
    items: feed.items.map((item): FeedItem => {
      return {
        id: item.id,
        title: item.title,
        url: item.url,
        externalUrl: item.external_url,
        contentHtml: item.content_html,
        contentText: item.content_text,
        summary: item.summary,
        published: item.date_published,
        modified: item.date_modified,
        authors: item.authors?.map(
          (a): FeedAuthor => ({
            name: a.name,
            email: undefined,
            url: a.url,
          }),
        ),
        tags: item.tags,
        image: item.image || item.banner_image,
        enclosures: item.attachments?.map(
          (a): FeedEnclosure => ({
            url: a.url,
            type: a.mime_type,
            length: a.size_in_bytes,
          }),
        ),
      };
    }),
  };
}
