import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractEntry } from './extract-entry.js';
import { parseXML } from './xml-parser.js';

describe('extractEntry', () => {
  it('should extract minimal required fields', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/entry/1</id>
  <title>Example Entry</title>
  <updated>2025-12-17T10:00:00Z</updated>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.equal(result.id, 'http://example.com/entry/1');
    assert.equal(result.title, 'Example Entry');
    assert.equal(result.updated, '2025-12-17T10:00:00.000Z');
  });

  it('should throw error when missing id', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
</entry>`;

    const doc = parseXML(xml);
    assert.throws(() => extractEntry(doc), /missing required <id> element/);
  });

  it('should throw error when missing title', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <updated>2025-12-17T10:00:00Z</updated>
</entry>`;

    const doc = parseXML(xml);
    assert.throws(() => extractEntry(doc), /missing required <title> element/);
  });

  it('should throw error when missing updated', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
</entry>`;

    const doc = parseXML(xml);
    assert.throws(() => extractEntry(doc), /missing required <updated> element/);
  });

  it('should throw error when updated is invalid date', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
  <updated>not a date</updated>
</entry>`;

    const doc = parseXML(xml);
    assert.throws(() => extractEntry(doc), /invalid <updated> date/);
  });

  it('should extract authors', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <author>
    <name>John Doe</name>
    <email>john@example.com</email>
    <uri>http://example.com/john</uri>
  </author>
  <author>
    <name>Jane Smith</name>
  </author>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.ok(result.authors);
    assert.equal(result.authors.length, 2);
    assert.equal(result.authors[0].name, 'John Doe');
    assert.equal(result.authors[0].email, 'john@example.com');
    assert.equal(result.authors[0].uri, 'http://example.com/john');
    assert.equal(result.authors[1].name, 'Jane Smith');
  });

  it('should extract content with type', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <content type="html">&lt;p&gt;Hello World&lt;/p&gt;</content>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.ok(result.content);
    assert.equal(result.content.value, '&lt;p&gt;Hello World&lt;/p&gt;');
    assert.equal(result.content.type, 'html');
  });

  it('should extract content with src', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <content type="video/mp4" src="http://example.com/video.mp4"/>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.ok(result.content);
    assert.equal(result.content.src, 'http://example.com/video.mp4');
    assert.equal(result.content.type, 'video/mp4');
  });

  it('should extract links', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <link href="http://example.com/entry/1" rel="alternate" type="text/html"/>
  <link href="http://example.com/entry/1.json" rel="alternate" type="application/json"/>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.ok(result.links);
    assert.equal(result.links.length, 2);
    assert.equal(result.links[0].href, 'http://example.com/entry/1');
    assert.equal(result.links[0].rel, 'alternate');
    assert.equal(result.links[0].type, 'text/html');
    assert.equal(result.links[1].href, 'http://example.com/entry/1.json');
    assert.equal(result.links[1].type, 'application/json');
  });

  it('should extract summary', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <summary>This is a summary of the entry</summary>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.equal(result.summary, 'This is a summary of the entry');
  });

  it('should extract categories', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <category term="technology" scheme="http://example.com/categories" label="Technology"/>
  <category term="news"/>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.ok(result.categories);
    assert.equal(result.categories.length, 2);
    assert.equal(result.categories[0].term, 'technology');
    assert.equal(result.categories[0].scheme, 'http://example.com/categories');
    assert.equal(result.categories[0].label, 'Technology');
    assert.equal(result.categories[1].term, 'news');
  });

  it('should extract contributors', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <contributor>
    <name>Contributor One</name>
  </contributor>
  <contributor>
    <name>Contributor Two</name>
  </contributor>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.ok(result.contributors);
    assert.equal(result.contributors.length, 2);
    assert.equal(result.contributors[0].name, 'Contributor One');
    assert.equal(result.contributors[1].name, 'Contributor Two');
  });

  it('should extract published date', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <published>2025-12-16T09:00:00Z</published>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.equal(result.published, '2025-12-16T09:00:00.000Z');
  });

  it('should extract rights', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <rights>© 2025 Example Corp</rights>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.equal(result.rights, '© 2025 Example Corp');
  });

  it('should extract source metadata', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <source>
    <id>http://example.com/feed</id>
    <title>Source Feed</title>
    <updated>2025-12-17T09:00:00Z</updated>
  </source>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.ok(result.source);
    assert.equal(result.source.id, 'http://example.com/feed');
    assert.equal(result.source.title, 'Source Feed');
    assert.equal(result.source.updated, '2025-12-17T09:00:00.000Z');
  });

  it('should handle complex entry with all fields', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/entry/1</id>
  <title type="text">Example Entry</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <published>2025-12-16T08:00:00Z</published>
  <author>
    <name>John Doe</name>
    <email>john@example.com</email>
    <uri>http://example.com/john</uri>
  </author>
  <contributor>
    <name>Jane Smith</name>
  </contributor>
  <link href="http://example.com/entry/1" rel="alternate" type="text/html"/>
  <category term="technology" label="Technology"/>
  <summary>A brief summary</summary>
  <content type="html">&lt;p&gt;Full content here&lt;/p&gt;</content>
  <rights>© 2025</rights>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.equal(result.id, 'http://example.com/entry/1');
    assert.equal(result.title, 'Example Entry');
    assert.equal(result.updated, '2025-12-17T10:00:00.000Z');
    assert.equal(result.published, '2025-12-16T08:00:00.000Z');
    assert.ok(result.authors);
    assert.equal(result.authors.length, 1);
    assert.equal(result.authors[0].name, 'John Doe');
    assert.ok(result.contributors);
    assert.equal(result.contributors.length, 1);
    assert.ok(result.links);
    assert.equal(result.links.length, 1);
    assert.ok(result.categories);
    assert.equal(result.categories.length, 1);
    assert.equal(result.summary, 'A brief summary');
    assert.ok(result.content);
    assert.equal(result.content.value, '&lt;p&gt;Full content here&lt;/p&gt;');
    assert.equal(result.rights, '© 2025');
  });

  it('should handle title with html type', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/1</id>
  <title type="html">&lt;b&gt;Bold Title&lt;/b&gt;</title>
  <updated>2025-12-17T10:00:00Z</updated>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.equal(result.title, '&lt;b&gt;Bold Title&lt;/b&gt;');
  });

  it('should clean whitespace in text fields', () => {
    const xml = `<entry xmlns="http://www.w3.org/2005/Atom">
  <id>  http://example.com/1  </id>
  <title>  Example   Entry  </title>
  <updated>2025-12-17T10:00:00Z</updated>
</entry>`;

    const doc = parseXML(xml);
    const result = extractEntry(doc);

    assert.equal(result.id, 'http://example.com/1');
    assert.equal(result.title, 'Example Entry');
  });
});
