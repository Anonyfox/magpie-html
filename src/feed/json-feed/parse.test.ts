import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseJSONFeed } from './parse.js';

describe('parseJSONFeed', () => {
  it('should parse minimal valid feed', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: [],
    });

    const result = parseJSONFeed(json);

    assert.equal(result.version, '1.1');
    assert.equal(result.feed.title, 'Test Feed');
    assert.equal(result.feed.items.length, 0);
  });

  it('should parse feed with version 1.0', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1',
      title: 'Test Feed',
      items: [],
    });

    const result = parseJSONFeed(json);

    assert.equal(result.version, '1');
    assert.equal(result.feed.title, 'Test Feed');
  });

  it('should parse feed with all optional fields', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Complete Feed',
      home_page_url: 'https://example.com',
      feed_url: 'https://example.com/feed.json',
      description: 'A test feed',
      user_comment: 'Test comment',
      next_url: 'https://example.com/feed-page-2.json',
      icon: 'https://example.com/icon.png',
      favicon: 'https://example.com/favicon.ico',
      authors: [{ name: 'John Doe', url: 'https://example.com/john' }],
      language: 'en',
      expired: false,
      hubs: [{ type: 'rssCloud', url: 'https://example.com/hub' }],
      items: [],
    });

    const result = parseJSONFeed(json);

    assert.equal(result.feed.home_page_url, 'https://example.com');
    assert.equal(result.feed.description, 'A test feed');
    assert.ok(result.feed.authors);
    assert.equal(result.feed.authors[0].name, 'John Doe');
  });

  it('should parse feed with items', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: [
        {
          id: '1',
          title: 'First Item',
          content_html: '<p>Content</p>',
          url: 'https://example.com/1',
        },
        {
          id: '2',
          title: 'Second Item',
          content_text: 'Plain text',
          date_published: '2025-12-17T10:00:00Z',
        },
      ],
    });

    const result = parseJSONFeed(json);

    assert.equal(result.feed.items.length, 2);
    assert.equal(result.feed.items[0].id, '1');
    assert.equal(result.feed.items[0].title, 'First Item');
    assert.equal(result.feed.items[0].content_html, '<p>Content</p>');
    assert.equal(result.feed.items[1].id, '2');
    assert.equal(result.feed.items[1].content_text, 'Plain text');
    assert.equal(result.feed.items[1].date_published, '2025-12-17T10:00:00Z');
  });

  it('should parse items with all optional fields', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: [
        {
          id: '1',
          url: 'https://example.com/1',
          external_url: 'https://other.com/article',
          title: 'Complete Item',
          content_html: '<p>HTML content</p>',
          content_text: 'Text content',
          summary: 'A summary',
          image: 'https://example.com/image.jpg',
          banner_image: 'https://example.com/banner.jpg',
          date_published: '2025-12-17T10:00:00Z',
          date_modified: '2025-12-17T11:00:00Z',
          authors: [{ name: 'Jane Smith' }],
          tags: ['tag1', 'tag2'],
          language: 'en-US',
          attachments: [
            {
              url: 'https://example.com/audio.mp3',
              mime_type: 'audio/mpeg',
              size_in_bytes: 1024000,
            },
          ],
        },
      ],
    });

    const result = parseJSONFeed(json);

    const item = result.feed.items[0];
    assert.equal(item.url, 'https://example.com/1');
    assert.equal(item.external_url, 'https://other.com/article');
    assert.equal(item.summary, 'A summary');
    assert.equal(item.image, 'https://example.com/image.jpg');
    assert.ok(item.authors);
    assert.equal(item.authors[0].name, 'Jane Smith');
    assert.ok(item.tags);
    assert.equal(item.tags.length, 2);
    assert.ok(item.attachments);
    assert.equal(item.attachments[0].mime_type, 'audio/mpeg');
  });

  it('should throw error for invalid JSON', () => {
    const invalidJson = '{ invalid json }';

    assert.throws(() => parseJSONFeed(invalidJson), /Invalid JSON/);
  });

  it('should throw error for missing version', () => {
    const json = JSON.stringify({
      title: 'Test Feed',
      items: [],
    });

    assert.throws(() => parseJSONFeed(json), /Invalid JSON Feed.*version/);
  });

  it('should throw error for missing title', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      items: [],
    });

    assert.throws(() => parseJSONFeed(json), /Invalid JSON Feed.*title/);
  });

  it('should throw error for missing items', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
    });

    assert.throws(() => parseJSONFeed(json), /Invalid JSON Feed.*items/);
  });

  it('should throw error for item without id', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: [{ title: 'No ID' }],
    });

    assert.throws(() => parseJSONFeed(json), /Invalid JSON Feed.*items\[0\]\.id/);
  });

  it('should handle empty string gracefully', () => {
    assert.throws(() => parseJSONFeed(''), /Invalid JSON/);
  });

  it('should handle whitespace-only string', () => {
    assert.throws(() => parseJSONFeed('   '), /Invalid JSON/);
  });

  it('should preserve custom extensions', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: [],
      _custom_field: 'custom value',
      _another: { nested: 'data' },
    });

    const result = parseJSONFeed(json);

    assert.equal((result.feed as Record<string, unknown>)._custom_field, 'custom value');
    assert.deepEqual((result.feed as Record<string, unknown>)._another, { nested: 'data' });
  });

  it('should preserve item custom extensions', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: [
        {
          id: '1',
          title: 'Item',
          _custom: 'custom item data',
        },
      ],
    });

    const result = parseJSONFeed(json);

    const item = result.feed.items[0] as Record<string, unknown>;
    assert.equal(item._custom, 'custom item data');
  });
});
