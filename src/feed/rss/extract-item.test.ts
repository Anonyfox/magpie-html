import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractItem, extractItems } from './extract-item.js';
import { parseRSSXML } from './xml-parser.js';

describe('extractItem', () => {
  it('should extract item with title only', () => {
    const xml = `
      <item>
        <title>Article Title</title>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.equal(item.title, 'Article Title');
    assert.equal(item.description, undefined);
    assert.equal(item.link, undefined);
  });

  it('should extract item with description only', () => {
    const xml = `
      <item>
        <description>Article description</description>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.equal(item.description, 'Article description');
    assert.equal(item.title, undefined);
  });

  it('should extract item with all basic fields', () => {
    const xml = `
      <item>
        <title>Article Title</title>
        <link>https://example.com/article</link>
        <description>Article description</description>
        <author>author@example.com</author>
        <comments>https://example.com/article#comments</comments>
        <pubDate>Wed, 17 Dec 2025 10:00:00 GMT</pubDate>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.equal(item.title, 'Article Title');
    assert.equal(item.link, 'https://example.com/article');
    assert.equal(item.description, 'Article description');
    assert.equal(item.author, 'author@example.com');
    assert.equal(item.comments, 'https://example.com/article#comments');
    assert.equal(item.pubDate, '2025-12-17T10:00:00.000Z');
  });

  it('should handle CDATA in title and description', () => {
    const xml = `
      <item>
        <title><![CDATA[Article with <special> chars]]></title>
        <description><![CDATA[Description & content]]></description>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.equal(item.title, 'Article with <special> chars');
    assert.equal(item.description, 'Description & content');
  });

  it('should extract multiple categories', () => {
    const xml = `
      <item>
        <title>Article</title>
        <category>Technology</category>
        <category>News</category>
        <category>Science</category>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.ok(Array.isArray(item.category));
    assert.equal(item.category?.length, 3);
    assert.deepEqual(item.category, ['Technology', 'News', 'Science']);
  });

  it('should extract enclosure with all attributes', () => {
    const xml = `
      <item>
        <title>Article</title>
        <enclosure url="https://example.com/audio.mp3" length="12345678" type="audio/mpeg"/>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.ok(item.enclosure);
    assert.equal(item.enclosure?.url, 'https://example.com/audio.mp3');
    assert.equal(item.enclosure?.length, 12345678);
    assert.equal(item.enclosure?.type, 'audio/mpeg');
  });

  it('should extract guid with isPermaLink true', () => {
    const xml = `
      <item>
        <title>Article</title>
        <guid isPermaLink="true">https://example.com/article</guid>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.ok(item.guid);
    assert.equal(item.guid?.value, 'https://example.com/article');
    assert.equal(item.guid?.isPermaLink, true);
  });

  it('should extract guid with isPermaLink false', () => {
    const xml = `
      <item>
        <title>Article</title>
        <guid isPermaLink="false">unique-id-12345</guid>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.ok(item.guid);
    assert.equal(item.guid?.value, 'unique-id-12345');
    assert.equal(item.guid?.isPermaLink, false);
  });

  it('should default guid isPermaLink to true when not specified', () => {
    const xml = `
      <item>
        <title>Article</title>
        <guid>https://example.com/article</guid>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.equal(item.guid?.isPermaLink, true);
  });

  it('should extract source with attributes', () => {
    const xml = `
      <item>
        <title>Article</title>
        <source url="https://example.com/rss">Source Feed Name</source>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.ok(item.source);
    assert.equal(item.source?.value, 'Source Feed Name');
    assert.equal(item.source?.url, 'https://example.com/rss');
  });

  it('should not include undefined fields', () => {
    const xml = `
      <item>
        <title>Minimal Item</title>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.equal(item.link, undefined);
    assert.equal(item.description, undefined);
    assert.equal(item.author, undefined);
    assert.equal(item.category, undefined);
    assert.equal(item.comments, undefined);
    assert.equal(item.enclosure, undefined);
    assert.equal(item.guid, undefined);
    assert.equal(item.pubDate, undefined);
    assert.equal(item.source, undefined);
  });

  it('should handle empty category elements', () => {
    const xml = `
      <item>
        <title>Article</title>
        <category></category>
        <category>  </category>
        <category>Valid</category>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.ok(Array.isArray(item.category));
    assert.equal(item.category?.length, 1);
    assert.deepEqual(item.category, ['Valid']);
  });

  it('should handle invalid date gracefully', () => {
    const xml = `
      <item>
        <title>Article</title>
        <pubDate>Not a valid date</pubDate>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.equal(item.pubDate, undefined);
  });

  it('should trim whitespace from text fields', () => {
    const xml = `
      <item>
        <title>  Article Title  </title>
        <link>  https://example.com  </link>
        <description>  Description  </description>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.equal(item.title, 'Article Title');
    assert.equal(item.link, 'https://example.com');
    assert.equal(item.description, 'Description');
  });

  it('should handle complex real-world item', () => {
    const xml = `
      <item>
        <title><![CDATA[Ifo-Index fällt erneut – Handel vom Weihnachtsgeschäft enttäuscht]]></title>
        <link>https://www.rnd.de/wirtschaft/article.html</link>
        <guid isPermaLink="true">https://www.rnd.de/wirtschaft/article.html</guid>
        <description><![CDATA[Das wichtigste deutsche Konjunkturbarometer sinkt]]></description>
        <pubDate>Wed, 17 Dec 2025 11:31:00 +0100</pubDate>
        <category>Wirtschaft</category>
        <category>Deutschland</category>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const item = extractItem(doc);

    assert.ok(item.title?.includes('Ifo-Index'));
    assert.ok(item.link);
    assert.ok(item.guid);
    assert.ok(item.description);
    assert.ok(item.pubDate);
    assert.equal(item.category?.length, 2);
  });
});

describe('extractItems', () => {
  it('should extract multiple items from channel', () => {
    const xml = `
      <channel>
        <title>Feed Title</title>
        <item><title>Item 1</title></item>
        <item><title>Item 2</title></item>
        <item><title>Item 3</title></item>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const items = extractItems(doc);

    assert.equal(items.length, 3);
    assert.equal(items[0].title, 'Item 1');
    assert.equal(items[1].title, 'Item 2');
    assert.equal(items[2].title, 'Item 3');
  });

  it('should return empty array when no items', () => {
    const xml = `
      <channel>
        <title>Feed Title</title>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const items = extractItems(doc);

    assert.equal(items.length, 0);
  });

  it('should extract items with varying complexity', () => {
    const xml = `
      <channel>
        <item>
          <title>Simple Item</title>
        </item>
        <item>
          <title>Complex Item</title>
          <link>https://example.com</link>
          <description>Description</description>
          <pubDate>Wed, 17 Dec 2025 10:00:00 GMT</pubDate>
        </item>
        <item>
          <description>Item with description only</description>
        </item>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const items = extractItems(doc);

    assert.equal(items.length, 3);
    assert.equal(items[0].title, 'Simple Item');
    assert.equal(items[1].title, 'Complex Item');
    assert.equal(items[1].link, 'https://example.com');
    assert.equal(items[2].description, 'Item with description only');
  });
});
