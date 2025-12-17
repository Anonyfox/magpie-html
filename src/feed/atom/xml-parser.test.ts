import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseXML } from './xml-parser.js';

describe('Atom XML Parser', () => {
  describe('Basic parsing', () => {
    it('should parse simple Atom feed element', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <id>test-id</id>
</feed>`;

      const doc = parseXML(xml);
      assert.equal(doc.tagName, 'feed');
      assert.equal(doc.attributes.xmlns, 'http://www.w3.org/2005/Atom');
    });

    it('should parse nested elements', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <author>
    <name>John Doe</name>
    <email>john@example.com</email>
  </author>
</feed>`;

      const doc = parseXML(xml);
      const author = doc.querySelector('author');
      assert.ok(author);
      assert.equal(author.tagName, 'author');

      const name = author.querySelector('name');
      assert.ok(name);
      assert.equal(name.textContent, 'John Doe');
    });

    it('should parse self-closing tags', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <link href="http://example.com" rel="alternate"/>
</feed>`;

      const doc = parseXML(xml);
      const link = doc.querySelector('link');
      assert.ok(link);
      assert.equal(link.getAttribute('href'), 'http://example.com');
      assert.equal(link.getAttribute('rel'), 'alternate');
    });

    it('should parse multiple attributes', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <link href="http://example.com" rel="alternate" type="text/html" hreflang="en"/>
</feed>`;

      const doc = parseXML(xml);
      const link = doc.querySelector('link');
      assert.ok(link);
      assert.equal(link.getAttribute('href'), 'http://example.com');
      assert.equal(link.getAttribute('rel'), 'alternate');
      assert.equal(link.getAttribute('type'), 'text/html');
      assert.equal(link.getAttribute('hreflang'), 'en');
    });
  });

  describe('Text content', () => {
    it('should extract text content', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example Feed</title>
</feed>`;

      const doc = parseXML(xml);
      const title = doc.querySelector('title');
      assert.ok(title);
      assert.equal(title.textContent, 'Example Feed');
    });

    it('should handle CDATA sections', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <title><![CDATA[Example <Feed>]]></title>
</feed>`;

      const doc = parseXML(xml);
      const title = doc.querySelector('title');
      assert.ok(title);
      assert.equal(title.textContent, 'Example <Feed>');
    });

    it('should handle text with HTML entities', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example &amp; Feed</title>
</feed>`;

      const doc = parseXML(xml);
      const title = doc.querySelector('title');
      assert.ok(title);
      assert.equal(title.textContent, 'Example &amp; Feed');
    });

    it('should trim whitespace from text content', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <title>
    Example Feed
  </title>
</feed>`;

      const doc = parseXML(xml);
      const title = doc.querySelector('title');
      assert.ok(title);
      assert.equal(title.textContent, 'Example Feed');
    });
  });

  describe('Query selectors', () => {
    it('should find element with querySelector', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <id>test</id>
  <title>Feed</title>
</feed>`;

      const doc = parseXML(xml);
      const id = doc.querySelector('id');
      assert.ok(id);
      assert.equal(id.textContent, 'test');
    });

    it('should return null when element not found', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <id>test</id>
</feed>`;

      const doc = parseXML(xml);
      const missing = doc.querySelector('missing');
      assert.equal(missing, null);
    });

    it('should find all matching elements with querySelectorAll', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <author>
    <name>John</name>
  </author>
  <author>
    <name>Jane</name>
  </author>
</feed>`;

      const doc = parseXML(xml);
      const authors = doc.querySelectorAll('author');
      assert.equal(authors.length, 2);
      assert.equal(authors[0].querySelector('name')?.textContent, 'John');
      assert.equal(authors[1].querySelector('name')?.textContent, 'Jane');
    });

    it('should return empty array when no matches found', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <id>test</id>
</feed>`;

      const doc = parseXML(xml);
      const missing = doc.querySelectorAll('missing');
      assert.equal(missing.length, 0);
    });
  });

  describe('Complex Atom structures', () => {
    it('should parse complete feed metadata', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/feed</id>
  <title type="text">Example Feed</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <author>
    <name>John Doe</name>
    <email>john@example.com</email>
    <uri>http://example.com/john</uri>
  </author>
  <link href="http://example.com" rel="alternate" type="text/html"/>
  <link href="http://example.com/feed" rel="self" type="application/atom+xml"/>
  <subtitle>A feed about examples</subtitle>
</feed>`;

      const doc = parseXML(xml);
      assert.equal(doc.querySelector('id')?.textContent, 'http://example.com/feed');
      assert.equal(doc.querySelector('title')?.textContent, 'Example Feed');
      assert.equal(doc.querySelector('title')?.getAttribute('type'), 'text');
      assert.equal(doc.querySelector('updated')?.textContent, '2025-12-17T10:00:00Z');

      const author = doc.querySelector('author');
      assert.ok(author);
      assert.equal(author.querySelector('name')?.textContent, 'John Doe');
      assert.equal(author.querySelector('email')?.textContent, 'john@example.com');
      assert.equal(author.querySelector('uri')?.textContent, 'http://example.com/john');

      const links = doc.querySelectorAll('link');
      assert.equal(links.length, 2);
      assert.equal(links[0].getAttribute('href'), 'http://example.com');
      assert.equal(links[0].getAttribute('rel'), 'alternate');
    });

    it('should parse entry with content', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://example.com/entry/1</id>
    <title>Example Entry</title>
    <updated>2025-12-17T10:00:00Z</updated>
    <content type="html">&lt;p&gt;Hello World&lt;/p&gt;</content>
    <summary>A summary</summary>
  </entry>
</feed>`;

      const doc = parseXML(xml);
      const entry = doc.querySelector('entry');
      assert.ok(entry);
      assert.equal(entry.querySelector('id')?.textContent, 'http://example.com/entry/1');
      assert.equal(entry.querySelector('title')?.textContent, 'Example Entry');
      assert.equal(entry.querySelector('content')?.textContent, '&lt;p&gt;Hello World&lt;/p&gt;');
      assert.equal(entry.querySelector('content')?.getAttribute('type'), 'html');
      assert.equal(entry.querySelector('summary')?.textContent, 'A summary');
    });

    it('should handle namespaced elements', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom" xmlns:custom="http://example.com/ns">
  <custom:element>Custom Value</custom:element>
</feed>`;

      const doc = parseXML(xml);
      assert.equal(doc.getAttribute('xmlns'), 'http://www.w3.org/2005/Atom');
      assert.equal(doc.getAttribute('xmlns:custom'), 'http://example.com/ns');

      const custom = doc.querySelector('custom:element');
      assert.ok(custom);
      assert.equal(custom.textContent, 'Custom Value');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty elements', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <title></title>
</feed>`;

      const doc = parseXML(xml);
      const title = doc.querySelector('title');
      assert.ok(title);
      assert.equal(title.textContent, '');
    });

    it('should handle deeply nested elements', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <a>
    <b>
      <c>
        <d>Deep Value</d>
      </c>
    </b>
  </a>
</feed>`;

      const doc = parseXML(xml);
      const a = doc.querySelector('a');
      const d = a?.querySelector('d');
      assert.ok(d);
      assert.equal(d.textContent, 'Deep Value');
    });

    it('should be case-sensitive for tag names', () => {
      const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <Title>Capital T</Title>
  <title>lowercase t</title>
</feed>`;

      const doc = parseXML(xml);
      const upperTitle = doc.querySelector('Title');
      const lowerTitle = doc.querySelector('title');

      assert.ok(upperTitle);
      assert.ok(lowerTitle);
      assert.equal(upperTitle.textContent, 'Capital T');
      assert.equal(lowerTitle.textContent, 'lowercase t');
    });
  });
});
