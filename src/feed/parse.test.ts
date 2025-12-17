import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseFeed, parseFeedAs, parseFeedNormalized } from './parse.js';

describe('parseFeed', () => {
  it('should auto-detect and parse RSS', () => {
    const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test RSS</title>
    <link>http://example.com</link>
    <description>Test</description>
    <item>
      <title>Item 1</title>
      <link>http://example.com/1</link>
      <guid>item-1</guid>
    </item>
  </channel>
</rss>`;

    const result = parseFeed(rss);

    assert.equal(result.feed.format, 'rss');
    assert.equal(result.feed.title, 'Test RSS');
    assert.equal(result.feed.items.length, 1);
    assert.equal(result.feed.items[0].title, 'Item 1');
    assert.ok(result.original);
  });

  it('should auto-detect and parse Atom', () => {
    const atom = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Test Atom</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <entry>
    <id>entry-1</id>
    <title>Entry 1</title>
    <updated>2025-12-17T10:00:00Z</updated>
  </entry>
</feed>`;

    const result = parseFeed(atom);

    assert.equal(result.feed.format, 'atom');
    assert.equal(result.feed.title, 'Test Atom');
    assert.equal(result.feed.items.length, 1);
    assert.equal(result.feed.items[0].title, 'Entry 1');
    assert.ok(result.original);
  });

  it('should auto-detect and parse JSON Feed', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test JSON Feed',
      items: [
        {
          id: 'item-1',
          title: 'Item 1',
        },
      ],
    });

    const result = parseFeed(json);

    assert.equal(result.feed.format, 'json-feed');
    assert.equal(result.feed.title, 'Test JSON Feed');
    assert.equal(result.feed.items.length, 1);
    assert.equal(result.feed.items[0].title, 'Item 1');
    assert.ok(result.original);
  });

  it('should throw error for unknown format', () => {
    const invalid = 'This is not a feed';

    assert.throws(() => parseFeed(invalid), /Unable to detect feed format/);
  });

  it('should throw error for empty string', () => {
    assert.throws(() => parseFeed(''), /Unable to detect feed format/);
  });

  it('should preserve original data for RSS', () => {
    const rss = `<rss version="2.0">
  <channel>
    <title>Test</title>
    <link>http://example.com</link>
    <description>Test</description>
  </channel>
</rss>`;

    const result = parseFeed(rss);

    assert.ok(result.original);
    assert.equal((result.original as { version: string }).version, '2.0');
  });

  it('should preserve original data for Atom', () => {
    const atom = `<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Test</title>
  <updated>2025-12-17T10:00:00Z</updated>
</feed>`;

    const result = parseFeed(atom);

    assert.ok(result.original);
    assert.equal((result.original as { version: string }).version, '1.0');
  });

  it('should preserve original data for JSON Feed', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test',
      items: [],
    });

    const result = parseFeed(json);

    assert.ok(result.original);
    assert.equal((result.original as { version: string }).version, '1.1');
  });
});

describe('parseFeedAs', () => {
  it('should parse as RSS when specified', () => {
    const rss = `<rss version="2.0">
  <channel>
    <title>Test</title>
    <link>http://example.com</link>
    <description>Test</description>
  </channel>
</rss>`;

    const result = parseFeedAs(rss, 'rss');

    assert.equal(result.feed.format, 'rss');
    assert.equal(result.feed.title, 'Test');
  });

  it('should parse as Atom when specified', () => {
    const atom = `<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Test</title>
  <updated>2025-12-17T10:00:00Z</updated>
</feed>`;

    const result = parseFeedAs(atom, 'atom');

    assert.equal(result.feed.format, 'atom');
    assert.equal(result.feed.title, 'Test');
  });

  it('should parse as JSON Feed when specified', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test',
      items: [],
    });

    const result = parseFeedAs(json, 'json-feed');

    assert.equal(result.feed.format, 'json-feed');
    assert.equal(result.feed.title, 'Test');
  });

  it('should throw error for unknown format', () => {
    const content = 'test';

    assert.throws(() => parseFeedAs(content, 'unknown'), /Cannot parse feed with format "unknown"/);
  });

  it('should throw error if content does not match specified format', () => {
    const rss = `<rss><channel><title>Test</title></channel></rss>`;

    // Trying to parse RSS as JSON Feed should fail
    assert.throws(() => parseFeedAs(rss, 'json-feed'));
  });
});

describe('parseFeedNormalized', () => {
  it('should return only normalized feed without original', () => {
    const rss = `<rss version="2.0">
  <channel>
    <title>Test</title>
    <link>http://example.com</link>
    <description>Test</description>
  </channel>
</rss>`;

    const result = parseFeedNormalized(rss);

    // Should be just Feed, not ParseResult
    assert.equal(result.format, 'rss');
    assert.equal(result.title, 'Test');
    assert.ok(result.items);
    // Should not have 'original' property
    assert.equal((result as { original?: unknown }).original, undefined);
  });

  it('should work with all formats', () => {
    const feeds = [
      {
        content:
          '<rss><channel><title>RSS</title><link>http://example.com</link><description>Test</description></channel></rss>',
        format: 'rss',
      },
      {
        content:
          '<feed xmlns="http://www.w3.org/2005/Atom"><id>test</id><title>Atom</title><updated>2025-12-17T10:00:00Z</updated></feed>',
        format: 'atom',
      },
      {
        content: JSON.stringify({
          version: 'https://jsonfeed.org/version/1.1',
          title: 'JSON',
          items: [],
        }),
        format: 'json-feed',
      },
    ];

    for (const { content, format } of feeds) {
      const result = parseFeedNormalized(content);
      assert.equal(result.format, format);
      assert.ok(result.title);
      assert.ok(Array.isArray(result.items));
    }
  });
});
