import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAtom } from '../feed/atom/parse.js';
import { parseJSONFeed } from '../feed/json-feed/parse.js';
import { parseFeed } from '../feed/parse.js';
import { parseRSS } from '../feed/rss/parse.js';

describe('URL normalization integration', () => {
  describe('RSS with relative URLs', () => {
    const rssWithRelativeUrls = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>/blog</link>
    <description>Test</description>
    <image>
      <url>/logo.png</url>
      <title>Logo</title>
      <link>/</link>
    </image>
    <item>
      <title>Article 1</title>
      <link>/article/1</link>
      <description>Test article</description>
      <enclosure url="//cdn.example.com/file.mp3" type="audio/mpeg" length="1234"/>
    </item>
    <item>
      <title>Article 2</title>
      <link>article/2</link>
      <comments>./comments</comments>
    </item>
  </channel>
</rss>`;

    it('should normalize all URLs when base URL provided', () => {
      const baseUrl = 'https://example.com/feed.xml';
      const result = parseRSS(rssWithRelativeUrls, baseUrl);

      assert.equal(result.channel.link, 'https://example.com/blog');
      assert.equal(result.channel.image?.url, 'https://example.com/logo.png');
      assert.equal(result.channel.image?.link, 'https://example.com/');

      assert.equal(result.items[0].link, 'https://example.com/article/1');
      assert.equal(result.items[0].enclosure?.url, 'https://cdn.example.com/file.mp3');

      assert.equal(result.items[1].link, 'https://example.com/article/2');
      assert.equal(result.items[1].comments, 'https://example.com/comments');
    });

    it('should not normalize when base URL not provided', () => {
      const result = parseRSS(rssWithRelativeUrls);

      assert.equal(result.channel.link, '/blog');
      assert.equal(result.items[0].link, '/article/1');
    });

    it('should work with URL object as base', () => {
      const baseUrl = new URL('https://example.com/feed.xml');
      const result = parseRSS(rssWithRelativeUrls, baseUrl);

      assert.equal(result.channel.link, 'https://example.com/blog');
    });
  });

  describe('Atom with relative URLs', () => {
    const atomWithRelativeUrls = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Feed</title>
  <link href="/blog" rel="alternate"/>
  <link href="feed.xml" rel="self"/>
  <icon>/favicon.ico</icon>
  <logo>//cdn.example.com/logo.png</logo>
  <updated>2024-01-01T00:00:00Z</updated>
  <id>tag:example.com,2024:feed</id>
  <entry>
    <title>Article 1</title>
    <link href="./article/1"/>
    <id>tag:example.com,2024:1</id>
    <updated>2024-01-01T00:00:00Z</updated>
  </entry>
</feed>`;

    it('should normalize all URLs when base URL provided', () => {
      const baseUrl = 'https://example.com/feed.xml';
      const result = parseAtom(atomWithRelativeUrls, baseUrl);

      const alternateLink = result.feed.links?.find((l) => l.rel === 'alternate');
      const selfLink = result.feed.links?.find((l) => l.rel === 'self');

      assert.equal(alternateLink?.href, 'https://example.com/blog');
      assert.equal(selfLink?.href, 'https://example.com/feed.xml');
      assert.equal(result.feed.icon, 'https://example.com/favicon.ico');
      assert.equal(result.feed.logo, 'https://cdn.example.com/logo.png');

      assert.equal(result.entries[0].links?.[0].href, 'https://example.com/article/1');
    });

    it('should not normalize when base URL not provided', () => {
      const result = parseAtom(atomWithRelativeUrls);

      const alternateLink = result.feed.links?.find((l) => l.rel === 'alternate');
      assert.equal(alternateLink?.href, '/blog');
    });
  });

  describe('JSON Feed with relative URLs', () => {
    const jsonFeedWithRelativeUrls = `{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "Test Feed",
  "home_page_url": "/",
  "feed_url": "feed.json",
  "icon": "/icon.png",
  "favicon": "//cdn.example.com/favicon.ico",
  "items": [
    {
      "id": "1",
      "url": "/article/1",
      "title": "Article 1",
      "image": "./images/photo.jpg",
      "attachments": [
        {
          "url": "/files/document.pdf",
          "mime_type": "application/pdf"
        }
      ]
    },
    {
      "id": "2",
      "url": "article/2",
      "external_url": "//external.com/page",
      "title": "Article 2"
    }
  ]
}`;

    it('should normalize all URLs when base URL provided', () => {
      const baseUrl = 'https://example.com/feed.json';
      const result = parseJSONFeed(jsonFeedWithRelativeUrls, baseUrl);

      assert.equal(result.feed.home_page_url, 'https://example.com/');
      assert.equal(result.feed.feed_url, 'https://example.com/feed.json');
      assert.equal(result.feed.icon, 'https://example.com/icon.png');
      assert.equal(result.feed.favicon, 'https://cdn.example.com/favicon.ico');

      assert.equal(result.feed.items?.[0].url, 'https://example.com/article/1');
      assert.equal(result.feed.items?.[0].image, 'https://example.com/images/photo.jpg');
      assert.equal(
        result.feed.items?.[0].attachments?.[0].url,
        'https://example.com/files/document.pdf',
      );

      assert.equal(result.feed.items?.[1].url, 'https://example.com/article/2');
      assert.equal(result.feed.items?.[1].external_url, 'https://external.com/page');
    });

    it('should not normalize when base URL not provided', () => {
      const result = parseJSONFeed(jsonFeedWithRelativeUrls);

      assert.equal(result.feed.home_page_url, '/');
      assert.equal(result.feed.items?.[0].url, '/article/1');
    });
  });

  describe('Unified parser with URL normalization', () => {
    it('should normalize RSS through unified parser', () => {
      const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test</title>
    <link>/blog</link>
    <description>Test</description>
    <item>
      <title>Article</title>
      <link>/article</link>
    </item>
  </channel>
</rss>`;

      const baseUrl = 'https://example.com/feed.xml';
      const result = parseFeed(rss, baseUrl);

      // Check normalized output (uses 'url' not 'link')
      assert.equal(result.feed.url, 'https://example.com/blog');
      assert.equal(result.feed.items[0].url, 'https://example.com/article');
    });

    it('should normalize Atom through unified parser', () => {
      const atom = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test</title>
  <link href="/blog"/>
  <updated>2024-01-01T00:00:00Z</updated>
  <id>tag:example.com,2024:feed</id>
  <entry>
    <title>Article</title>
    <link href="/article"/>
    <id>tag:example.com,2024:1</id>
    <updated>2024-01-01T00:00:00Z</updated>
  </entry>
</feed>`;

      const baseUrl = 'https://example.com/feed.xml';
      const result = parseFeed(atom, baseUrl);

      assert.equal(result.feed.url, 'https://example.com/blog');
      assert.equal(result.feed.items[0].url, 'https://example.com/article');
    });

    it('should normalize JSON Feed through unified parser', () => {
      const json = `{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "Test",
  "home_page_url": "/",
  "items": [
    {
      "id": "1",
      "url": "/article",
      "title": "Article"
    }
  ]
}`;

      const baseUrl = 'https://example.com/feed.json';
      const result = parseFeed(json, baseUrl);

      assert.equal(result.feed.url, 'https://example.com/');
      assert.equal(result.feed.items[0].url, 'https://example.com/article');
    });
  });

  describe('HTTP to HTTPS upgrade', () => {
    it('should upgrade HTTP to HTTPS by default', () => {
      const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test</title>
    <link>http://other.com/blog</link>
    <description>Test</description>
  </channel>
</rss>`;

      const baseUrl = 'https://example.com/feed.xml';
      const result = parseRSS(rss, baseUrl);

      assert.equal(result.channel.link, 'https://other.com/blog');
    });

    it('should keep HTTP if base is HTTP', () => {
      const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test</title>
    <link>/blog</link>
    <description>Test</description>
  </channel>
</rss>`;

      const baseUrl = 'http://example.com/feed.xml';
      const result = parseRSS(rss, baseUrl);

      assert.equal(result.channel.link, 'http://example.com/blog');
    });
  });

  describe('Edge cases', () => {
    it('should handle already absolute URLs', () => {
      const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test</title>
    <link>https://absolute.com/blog</link>
    <description>Test</description>
  </channel>
</rss>`;

      const baseUrl = 'https://example.com/feed.xml';
      const result = parseRSS(rss, baseUrl);

      assert.equal(result.channel.link, 'https://absolute.com/blog');
    });

    it('should handle invalid/garbage URLs gracefully', () => {
      const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test</title>
    <link>:::invalid:::</link>
    <description>Test</description>
  </channel>
</rss>`;

      const baseUrl = 'https://example.com/feed.xml';
      const result = parseRSS(rss, baseUrl);

      // Should resolve as relative path
      assert.equal(result.channel.link, 'https://example.com/:::invalid:::');
    });

    it('should handle empty URLs', () => {
      const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test</title>
    <link></link>
    <description>Test</description>
  </channel>
</rss>`;

      const baseUrl = 'https://example.com/feed.xml';
      const result = parseRSS(rss, baseUrl);

      assert.equal(result.channel.link, '');
    });
  });
});
