import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AtomDocument } from './atom/types.js';
import type { JSONFeedDocument } from './json-feed/types.js';
import { normalizeAtom, normalizeJSONFeed, normalizeRSS } from './normalize.js';
import type { RssFeedExtended } from './rss/types.js';

describe('normalizeRSS', () => {
  it('should normalize minimal RSS feed', () => {
    const rss: RssFeedExtended = {
      version: '2.0',
      channel: {
        title: 'Test RSS',
        link: 'http://example.com',
        description: 'Test description',
      },
      items: [],
    };

    const result = normalizeRSS(rss);

    assert.equal(result.format, 'rss');
    assert.equal(result.title, 'Test RSS');
    assert.equal(result.url, 'http://example.com');
    assert.equal(result.description, 'Test description');
    assert.equal(result.items.length, 0);
  });

  it('should normalize RSS feed with items', () => {
    const rss: RssFeedExtended = {
      version: '2.0',
      channel: {
        title: 'Test RSS',
        link: 'http://example.com',
        description: 'Test',
      },
      items: [
        {
          title: 'Item 1',
          link: 'http://example.com/1',
          description: 'Description 1',
          guid: { value: 'guid-1' },
          pubDate: '2025-12-17T10:00:00.000Z',
        },
      ],
    };

    const result = normalizeRSS(rss);

    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].id, 'guid-1');
    assert.equal(result.items[0].title, 'Item 1');
    assert.equal(result.items[0].url, 'http://example.com/1');
    assert.equal(result.items[0].summary, 'Description 1');
  });

  it('should use link as id fallback', () => {
    const rss: RssFeedExtended = {
      version: '2.0',
      channel: { title: 'Test', link: 'http://example.com', description: 'Test' },
      items: [{ title: 'Item', link: 'http://example.com/1' }],
    };

    const result = normalizeRSS(rss);
    assert.equal(result.items[0].id, 'http://example.com/1');
  });

  it('should handle content:encoded', () => {
    const rss: RssFeedExtended = {
      version: '2.0',
      channel: { title: 'Test', link: 'http://example.com', description: 'Test' },
      items: [
        {
          title: 'Item',
          description: 'Summary',
          namespaces: {
            contentEncoded: '<p>Full content</p>',
          },
        },
      ],
    };

    const result = normalizeRSS(rss);
    assert.equal(result.items[0].contentHtml, '<p>Full content</p>');
    assert.equal(result.items[0].summary, 'Summary');
  });
});

describe('normalizeAtom', () => {
  it('should normalize minimal Atom feed', () => {
    const atom: AtomDocument = {
      version: '1.0',
      feed: {
        id: 'http://example.com',
        title: 'Test Atom',
        updated: '2025-12-17T10:00:00.000Z',
      },
      entries: [],
    };

    const result = normalizeAtom(atom);

    assert.equal(result.format, 'atom');
    assert.equal(result.title, 'Test Atom');
    assert.equal(result.updated, '2025-12-17T10:00:00.000Z');
    assert.equal(result.items.length, 0);
  });

  it('should extract self and alternate links', () => {
    const atom: AtomDocument = {
      version: '1.0',
      feed: {
        id: 'http://example.com',
        title: 'Test',
        updated: '2025-12-17T10:00:00.000Z',
        links: [
          { href: 'http://example.com/feed', rel: 'self' },
          { href: 'http://example.com', rel: 'alternate' },
        ],
      },
      entries: [],
    };

    const result = normalizeAtom(atom);
    assert.equal(result.feedUrl, 'http://example.com/feed');
    assert.equal(result.url, 'http://example.com');
  });

  it('should normalize Atom entries', () => {
    const atom: AtomDocument = {
      version: '1.0',
      feed: {
        id: 'http://example.com',
        title: 'Test',
        updated: '2025-12-17T10:00:00.000Z',
      },
      entries: [
        {
          id: 'entry-1',
          title: 'Entry 1',
          updated: '2025-12-17T10:00:00.000Z',
          content: { value: '<p>Content</p>', type: 'html' },
          summary: 'Summary',
          published: '2025-12-16T10:00:00.000Z',
        },
      ],
    };

    const result = normalizeAtom(atom);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].id, 'entry-1');
    assert.equal(result.items[0].title, 'Entry 1');
    assert.equal(result.items[0].contentHtml, '<p>Content</p>');
    assert.equal(result.items[0].published, '2025-12-16T10:00:00.000Z');
  });

  it('should handle text content', () => {
    const atom: AtomDocument = {
      version: '1.0',
      feed: { id: 'http://example.com', title: 'Test', updated: '2025-12-17T10:00:00.000Z' },
      entries: [
        {
          id: 'entry-1',
          title: 'Entry',
          updated: '2025-12-17T10:00:00.000Z',
          content: { value: 'Plain text', type: 'text' },
        },
      ],
    };

    const result = normalizeAtom(atom);
    assert.equal(result.items[0].contentText, 'Plain text');
    assert.equal(result.items[0].contentHtml, undefined);
  });
});

describe('normalizeJSONFeed', () => {
  it('should normalize minimal JSON Feed', () => {
    const jsonFeed: JSONFeedDocument = {
      version: '1.1',
      feed: {
        version: 'https://jsonfeed.org/version/1.1',
        title: 'Test JSON Feed',
        items: [],
      },
    };

    const result = normalizeJSONFeed(jsonFeed);

    assert.equal(result.format, 'json-feed');
    assert.equal(result.title, 'Test JSON Feed');
    assert.equal(result.items.length, 0);
  });

  it('should normalize JSON Feed with all fields', () => {
    const jsonFeed: JSONFeedDocument = {
      version: '1.1',
      feed: {
        version: 'https://jsonfeed.org/version/1.1',
        title: 'Test',
        description: 'Test description',
        home_page_url: 'http://example.com',
        feed_url: 'http://example.com/feed.json',
        icon: 'http://example.com/icon.png',
        language: 'en',
        authors: [{ name: 'John Doe', url: 'http://example.com/john' }],
        items: [],
      },
    };

    const result = normalizeJSONFeed(jsonFeed);
    assert.equal(result.url, 'http://example.com');
    assert.equal(result.feedUrl, 'http://example.com/feed.json');
    assert.equal(result.image, 'http://example.com/icon.png');
    assert.ok(result.authors);
    assert.equal(result.authors[0].name, 'John Doe');
  });

  it('should normalize JSON Feed items', () => {
    const jsonFeed: JSONFeedDocument = {
      version: '1.1',
      feed: {
        version: 'https://jsonfeed.org/version/1.1',
        title: 'Test',
        items: [
          {
            id: 'item-1',
            title: 'Item 1',
            url: 'http://example.com/1',
            content_html: '<p>HTML</p>',
            content_text: 'Text',
            summary: 'Summary',
            date_published: '2025-12-17T10:00:00Z',
            tags: ['tag1', 'tag2'],
          },
        ],
      },
    };

    const result = normalizeJSONFeed(jsonFeed);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].id, 'item-1');
    assert.equal(result.items[0].contentHtml, '<p>HTML</p>');
    assert.equal(result.items[0].contentText, 'Text');
    assert.ok(result.items[0].tags);
    assert.equal(result.items[0].tags.length, 2);
  });

  it('should handle external_url', () => {
    const jsonFeed: JSONFeedDocument = {
      version: '1.1',
      feed: {
        version: 'https://jsonfeed.org/version/1.1',
        title: 'Test',
        items: [
          {
            id: 'item-1',
            url: 'http://example.com/1',
            external_url: 'http://other.com/article',
          },
        ],
      },
    };

    const result = normalizeJSONFeed(jsonFeed);
    assert.equal(result.items[0].url, 'http://example.com/1');
    assert.equal(result.items[0].externalUrl, 'http://other.com/article');
  });
});
