import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRSS, isRSS } from './parse.js';

describe('parseRSS', () => {
  it('should parse minimal valid RSS 2.0 feed', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Example Feed</title>
          <link>https://example.com</link>
          <description>Example description</description>
        </channel>
      </rss>
    `;
    const feed = parseRSS(xml);

    assert.equal(feed.version, '2.0');
    assert.equal(feed.channel.title, 'Example Feed');
    assert.equal(feed.channel.link, 'https://example.com');
    assert.equal(feed.channel.description, 'Example description');
    assert.equal(feed.items.length, 0);
  });

  it('should parse RSS feed with items', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Feed</title>
          <link>https://example.com</link>
          <description>Description</description>
          <item>
            <title>Article 1</title>
            <link>https://example.com/1</link>
          </item>
          <item>
            <title>Article 2</title>
            <link>https://example.com/2</link>
          </item>
        </channel>
      </rss>
    `;
    const feed = parseRSS(xml);

    assert.equal(feed.items.length, 2);
    assert.equal(feed.items[0].title, 'Article 1');
    assert.equal(feed.items[1].title, 'Article 2');
  });

  it('should parse items with namespaces', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
        <channel>
          <title>Feed</title>
          <link>https://example.com</link>
          <description>Description</description>
          <item>
            <title>Article</title>
            <description>Short description</description>
            <content:encoded><![CDATA[<p>Full HTML content</p>]]></content:encoded>
          </item>
        </channel>
      </rss>
    `;
    const feed = parseRSS(xml);

    assert.equal(feed.items.length, 1);
    assert.equal(feed.items[0].title, 'Article');
    assert.ok(feed.items[0].namespaces);
    assert.ok(feed.items[0].namespaces?.contentEncoded?.includes('Full HTML content'));
  });

  it('should parse items with Dublin Core namespaces', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
        <channel>
          <title>Feed</title>
          <link>https://example.com</link>
          <description>Description</description>
          <item>
            <title>Article</title>
            <dc:creator>John Doe</dc:creator>
            <dc:subject>Technology</dc:subject>
          </item>
        </channel>
      </rss>
    `;
    const feed = parseRSS(xml);

    assert.equal(feed.items[0].namespaces?.dcCreator, 'John Doe');
    assert.ok(feed.items[0].namespaces?.dcSubject);
  });

  it('should parse items with Media RSS namespaces', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
        <channel>
          <title>Feed</title>
          <link>https://example.com</link>
          <description>Description</description>
          <item>
            <title>Video Article</title>
            <media:content url="https://example.com/video.mp4" type="video/mp4"/>
            <media:thumbnail url="https://example.com/thumb.jpg" width="200" height="150"/>
          </item>
        </channel>
      </rss>
    `;
    const feed = parseRSS(xml);

    assert.ok(feed.items[0].namespaces?.mediaContent);
    assert.ok(feed.items[0].namespaces?.mediaThumbnail);
    assert.equal(feed.items[0].namespaces?.mediaContent?.[0].url, 'https://example.com/video.mp4');
  });

  it('should not add namespaces field if no namespaces present', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Feed</title>
          <link>https://example.com</link>
          <description>Description</description>
          <item>
            <title>Simple Article</title>
          </item>
        </channel>
      </rss>
    `;
    const feed = parseRSS(xml);

    assert.equal(feed.items[0].namespaces, undefined);
  });

  it('should parse RSS 0.92 feed', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="0.92">
        <channel>
          <title>Legacy Feed</title>
          <link>https://example.com</link>
          <description>Old RSS format</description>
        </channel>
      </rss>
    `;
    const feed = parseRSS(xml);

    assert.equal(feed.version, '0.92');
    assert.equal(feed.channel.title, 'Legacy Feed');
  });

  it('should default to version 2.0 if not specified', () => {
    const xml = `<?xml version="1.0"?>
      <rss>
        <channel>
          <title>Feed</title>
          <link>https://example.com</link>
          <description>Description</description>
        </channel>
      </rss>
    `;
    const feed = parseRSS(xml);

    assert.equal(feed.version, '2.0');
  });

  it('should throw error for missing rss element', () => {
    const xml = `<?xml version="1.0"?>
      <feed>
        <title>Not RSS</title>
      </feed>
    `;

    assert.throws(() => {
      parseRSS(xml);
    }, /Missing <rss> root element/);
  });

  it('should throw error for missing channel element', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <title>No channel</title>
      </rss>
    `;

    assert.throws(() => {
      parseRSS(xml);
    }, /Missing <channel> element/);
  });

  it('should parse complex real-world-like RSS feed', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0"
           xmlns:content="http://purl.org/rss/1.0/modules/content/"
           xmlns:dc="http://purl.org/dc/elements/1.1/"
           xmlns:media="http://search.yahoo.com/mrss/">
        <channel>
          <title><![CDATA[News Feed]]></title>
          <link>https://news.example.com</link>
          <description>Latest news and updates</description>
          <language>en-us</language>
          <pubDate>Wed, 17 Dec 2025 10:00:00 GMT</pubDate>
          <item>
            <title><![CDATA[Breaking News Story]]></title>
            <link>https://news.example.com/article-1</link>
            <guid isPermaLink="true">https://news.example.com/article-1</guid>
            <description><![CDATA[Brief summary]]></description>
            <content:encoded><![CDATA[<p>Full article content with HTML</p>]]></content:encoded>
            <dc:creator>Jane Reporter</dc:creator>
            <pubDate>Wed, 17 Dec 2025 09:00:00 GMT</pubDate>
            <category>Politics</category>
            <category>International</category>
            <media:thumbnail url="https://news.example.com/thumb.jpg" width="300" height="200"/>
          </item>
          <item>
            <title><![CDATA[Second Story]]></title>
            <link>https://news.example.com/article-2</link>
            <description>Another article</description>
          </item>
        </channel>
      </rss>
    `;

    const feed = parseRSS(xml);

    assert.equal(feed.version, '2.0');
    assert.equal(feed.channel.title, 'News Feed');
    assert.equal(feed.channel.language, 'en-us');
    assert.equal(feed.items.length, 2);
    assert.equal(feed.items[0].title, 'Breaking News Story');
    assert.equal(feed.items[0].category?.length, 2);
    assert.ok(feed.items[0].namespaces?.contentEncoded);
    assert.ok(feed.items[0].namespaces?.dcCreator);
    assert.ok(feed.items[0].namespaces?.mediaThumbnail);
    assert.equal(feed.items[1].namespaces, undefined);
  });

  it('should handle items without title but with description', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Feed</title>
          <link>https://example.com</link>
          <description>Description</description>
          <item>
            <description>Item with description only</description>
          </item>
        </channel>
      </rss>
    `;
    const feed = parseRSS(xml);

    assert.equal(feed.items.length, 1);
    assert.equal(feed.items[0].description, 'Item with description only');
  });
});

describe('isRSS', () => {
  it('should detect RSS 2.0 feed', () => {
    const xml = '<rss version="2.0"><channel></channel></rss>';
    assert.equal(isRSS(xml), true);
  });

  it('should detect RSS 0.92 feed', () => {
    const xml = '<rss version="0.92"><channel></channel></rss>';
    assert.equal(isRSS(xml), true);
  });

  it('should detect RSS 0.91 feed', () => {
    const xml = '<rss version="0.91"><channel></channel></rss>';
    assert.equal(isRSS(xml), true);
  });

  it('should detect RSS with single quotes', () => {
    const xml = "<rss version='2.0'><channel></channel></rss>";
    assert.equal(isRSS(xml), true);
  });

  it('should return false for Atom feed', () => {
    const xml = '<feed xmlns="http://www.w3.org/2005/Atom"></feed>';
    assert.equal(isRSS(xml), false);
  });

  it('should return false for invalid XML', () => {
    const xml = 'not xml at all';
    assert.equal(isRSS(xml), false);
  });

  it('should return false for empty string', () => {
    assert.equal(isRSS(''), false);
  });

  it('should handle XML with declaration', () => {
    const xml = '<?xml version="1.0"?><rss version="2.0"></rss>';
    assert.equal(isRSS(xml), true);
  });
});

