import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getAttribute,
  getText,
  parseRSSXML,
  querySelector,
  querySelectorAll,
} from './xml-parser.js';

describe('parseRSSXML', () => {
  it('should parse simple element', () => {
    const xml = '<title>Hello World</title>';
    const root = parseRSSXML(xml);
    assert.equal(root.tagName, 'title');
    assert.equal(root.text, 'Hello World');
    assert.equal(root.children.length, 0);
  });

  it('should parse nested elements', () => {
    const xml = `
      <channel>
        <title>Feed Title</title>
        <link>https://example.com</link>
      </channel>
    `;
    const root = parseRSSXML(xml);
    assert.equal(root.tagName, 'channel');
    assert.equal(root.children.length, 2);
    assert.equal(root.children[0].tagName, 'title');
    assert.equal(root.children[0].text, 'Feed Title');
    assert.equal(root.children[1].tagName, 'link');
    assert.equal(root.children[1].text, 'https://example.com');
  });

  it('should parse element with attributes', () => {
    const xml = '<enclosure url="https://example.com/file.mp3" length="12345" type="audio/mpeg"/>';
    const root = parseRSSXML(xml);
    assert.equal(root.tagName, 'enclosure');
    assert.equal(root.attributes.url, 'https://example.com/file.mp3');
    assert.equal(root.attributes.length, '12345');
    assert.equal(root.attributes.type, 'audio/mpeg');
  });

  it('should handle CDATA sections', () => {
    const xml = '<description><![CDATA[Hello & <b>World</b>]]></description>';
    const root = parseRSSXML(xml);
    assert.equal(root.tagName, 'description');
    assert.equal(root.text, 'Hello & <b>World</b>');
  });

  it('should handle multiple CDATA sections', () => {
    const xml = `
      <item>
        <title><![CDATA[Title]]></title>
        <description><![CDATA[Description]]></description>
      </item>
    `;
    const root = parseRSSXML(xml);
    const title = root.children.find((c) => c.tagName === 'title');
    const desc = root.children.find((c) => c.tagName === 'description');
    assert.equal(title?.text, 'Title');
    assert.equal(desc?.text, 'Description');
  });

  it('should handle namespaced elements', () => {
    const xml = `
      <item>
        <content:encoded>Full content</content:encoded>
        <dc:creator>John Doe</dc:creator>
      </item>
    `;
    const root = parseRSSXML(xml);
    assert.equal(root.children.length, 2);
    assert.equal(root.children[0].tagName, 'content:encoded');
    assert.equal(root.children[0].text, 'Full content');
    assert.equal(root.children[1].tagName, 'dc:creator');
    assert.equal(root.children[1].text, 'John Doe');
  });

  it('should handle self-closing tags', () => {
    const xml = '<cloud domain="example.com" port="80" path="/rpc" />';
    const root = parseRSSXML(xml);
    assert.equal(root.tagName, 'cloud');
    assert.equal(root.attributes.domain, 'example.com');
    assert.equal(root.attributes.port, '80');
    assert.equal(root.text, '');
  });

  it('should handle deeply nested elements', () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title>Article</title>
          </item>
        </channel>
      </rss>
    `;
    const root = parseRSSXML(xml);
    assert.equal(root.tagName, 'rss');
    const channel = root.children[0];
    assert.equal(channel.tagName, 'channel');
    const item = channel.children[0];
    assert.equal(item.tagName, 'item');
    const title = item.children[0];
    assert.equal(title.tagName, 'title');
    assert.equal(title.text, 'Article');
  });

  it('should handle empty elements', () => {
    const xml = '<title></title>';
    const root = parseRSSXML(xml);
    assert.equal(root.tagName, 'title');
    assert.equal(root.text, '');
  });

  it('should handle elements with only whitespace', () => {
    const xml = '<title>   </title>';
    const root = parseRSSXML(xml);
    assert.equal(root.text, '');
  });

  it('should strip XML declaration', () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?><title>Test</title>';
    const root = parseRSSXML(xml);
    assert.equal(root.tagName, 'title');
    assert.equal(root.text, 'Test');
  });

  it('should handle mixed content (text + elements)', () => {
    const xml = `
      <description>
        Some text
        <![CDATA[<b>bold</b>]]>
        more text
      </description>
    `;
    const root = parseRSSXML(xml);
    assert.ok(root.text.includes('<b>bold</b>'));
  });

  it('should handle multiple nested items', () => {
    const xml = `
      <channel>
        <item><title>Item 1</title></item>
        <item><title>Item 2</title></item>
        <item><title>Item 3</title></item>
      </channel>
    `;
    const root = parseRSSXML(xml);
    const items = root.children.filter((c) => c.tagName === 'item');
    assert.equal(items.length, 3);
    assert.equal(items[0].children[0].text, 'Item 1');
    assert.equal(items[1].children[0].text, 'Item 2');
    assert.equal(items[2].children[0].text, 'Item 3');
  });

  it('should handle attributes with single quotes', () => {
    const xml = "<link href='https://example.com'/>";
    const root = parseRSSXML(xml);
    assert.equal(root.attributes.href, 'https://example.com');
  });

  it('should handle real RSS channel structure', () => {
    const xml = `
      <channel>
        <title><![CDATA[RND]]></title>
        <link>https://www.rnd.de</link>
        <description>RND News Feed</description>
        <language>de</language>
        <lastBuildDate>Wed, 17 Dec 2025 11:31:41 +0100</lastBuildDate>
        <ttl>1</ttl>
      </channel>
    `;
    const root = parseRSSXML(xml);
    assert.equal(root.tagName, 'channel');
    assert.equal(root.children.length, 6);
  });

  it('should handle real RSS item structure', () => {
    const xml = `
      <item>
        <title><![CDATA[Test Article]]></title>
        <link>https://example.com/article</link>
        <guid isPermaLink="true">https://example.com/article</guid>
        <description><![CDATA[Article description]]></description>
        <pubDate>Wed, 17 Dec 2025 10:00:00 GMT</pubDate>
        <dc:creator>Author Name</dc:creator>
        <content:encoded><![CDATA[<p>Full article content</p>]]></content:encoded>
      </item>
    `;
    const root = parseRSSXML(xml);
    assert.equal(root.tagName, 'item');
    assert.ok(root.children.length >= 7);
  });
});

describe('querySelector', () => {
  it('should find element by tag name', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
      </channel>
    `;
    const root = parseRSSXML(xml);
    const title = querySelector(root, 'title');
    assert.ok(title);
    assert.equal(title.tagName, 'title');
    assert.equal(title.text, 'Test');
  });

  it('should find nested element', () => {
    const xml = `
      <rss>
        <channel>
          <title>Test</title>
        </channel>
      </rss>
    `;
    const root = parseRSSXML(xml);
    const title = querySelector(root, 'title');
    assert.ok(title);
    assert.equal(title.text, 'Test');
  });

  it('should return null if not found', () => {
    const xml = '<channel><title>Test</title></channel>';
    const root = parseRSSXML(xml);
    const result = querySelector(root, 'nonexistent');
    assert.equal(result, null);
  });

  it('should find namespaced element', () => {
    const xml = `
      <item>
        <content:encoded>Content</content:encoded>
      </item>
    `;
    const root = parseRSSXML(xml);
    const content = querySelector(root, 'content:encoded');
    assert.ok(content);
    assert.equal(content.text, 'Content');
  });

  it('should be case insensitive by default', () => {
    const xml = '<Title>Test</Title>';
    const root = parseRSSXML(xml);
    const title = querySelector(root, 'title');
    assert.ok(title);
    assert.equal(title.text, 'Test');
  });

  it('should support case-sensitive matching', () => {
    const xml = '<Title>Test</Title>';
    const root = parseRSSXML(xml);
    const titleLower = querySelector(root, 'title', true);
    const titleUpper = querySelector(root, 'Title', true);
    assert.equal(titleLower, null);
    assert.ok(titleUpper);
    assert.equal(titleUpper.text, 'Test');
  });
});

describe('querySelectorAll', () => {
  it('should find all matching elements', () => {
    const xml = `
      <channel>
        <item><title>Item 1</title></item>
        <item><title>Item 2</title></item>
        <item><title>Item 3</title></item>
      </channel>
    `;
    const root = parseRSSXML(xml);
    const items = querySelectorAll(root, 'item');
    assert.equal(items.length, 3);
  });

  it('should find all nested matches', () => {
    const xml = `
      <channel>
        <title>Channel Title</title>
        <item><title>Item Title</title></item>
      </channel>
    `;
    const root = parseRSSXML(xml);
    const titles = querySelectorAll(root, 'title');
    assert.equal(titles.length, 2);
  });

  it('should return empty array if none found', () => {
    const xml = '<channel><title>Test</title></channel>';
    const root = parseRSSXML(xml);
    const results = querySelectorAll(root, 'item');
    assert.equal(results.length, 0);
  });
});

describe('getText', () => {
  it('should get text from element', () => {
    const xml = '<title>Hello World</title>';
    const root = parseRSSXML(xml);
    assert.equal(getText(root), 'Hello World');
  });

  it('should return empty string for null', () => {
    assert.equal(getText(null), '');
  });

  it('should return empty string for undefined', () => {
    assert.equal(getText(undefined), '');
  });
});

describe('getAttribute', () => {
  it('should get attribute value', () => {
    const xml = '<link href="https://example.com">Text</link>';
    const root = parseRSSXML(xml);
    assert.equal(getAttribute(root, 'href'), 'https://example.com');
  });

  it('should return null if attribute not found', () => {
    const xml = '<link>Text</link>';
    const root = parseRSSXML(xml);
    assert.equal(getAttribute(root, 'href'), null);
  });

  it('should return null for null element', () => {
    assert.equal(getAttribute(null, 'href'), null);
  });
});

describe('Real-world RSS parsing', () => {
  it('should parse minimal valid RSS', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Example Feed</title>
          <link>https://example.com</link>
          <description>Example description</description>
          <item>
            <title>Article 1</title>
            <link>https://example.com/1</link>
          </item>
        </channel>
      </rss>
    `;
    const root = parseRSSXML(xml);
    assert.equal(root.tagName, 'rss');
    const channel = querySelector(root, 'channel');
    assert.ok(channel);
    const items = querySelectorAll(channel!, 'item');
    assert.equal(items.length, 1);
  });
});
