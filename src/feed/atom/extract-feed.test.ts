import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractFeed } from './extract-feed.js';

describe('extractFeed', () => {
  it('should extract minimal required fields', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/feed</id>
  <title>Example Feed</title>
  <updated>2025-12-17T10:00:00Z</updated>
</feed>`;

    const result = extractFeed(xml);

    assert.equal(result.id, 'http://example.com/feed');
    assert.equal(result.title, 'Example Feed');
    assert.equal(result.updated, '2025-12-17T10:00:00.000Z');
  });

  it('should throw error when missing feed element', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<root xmlns="http://www.w3.org/2005/Atom">
  <id>test</id>
</root>`;

    assert.throws(() => extractFeed(xml), /missing <feed> element/);
  });

  it('should throw error when missing id', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
</feed>`;

    assert.throws(() => extractFeed(xml), /missing required <id> element/);
  });

  it('should throw error when missing title', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <updated>2025-12-17T10:00:00Z</updated>
</feed>`;

    assert.throws(() => extractFeed(xml), /missing required <title> element/);
  });

  it('should throw error when missing updated', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
</feed>`;

    assert.throws(() => extractFeed(xml), /missing or invalid date/);
  });

  it('should throw error when updated is invalid date', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>not a date</updated>
</feed>`;

    assert.throws(() => extractFeed(xml), /missing or invalid date/);
  });

  it('should extract single author', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <author>
    <name>John Doe</name>
    <email>john@example.com</email>
    <uri>http://example.com/john</uri>
  </author>
</feed>`;

    const result = extractFeed(xml);

    assert.ok(result.authors);
    assert.equal(result.authors.length, 1);
    assert.equal(result.authors[0].name, 'John Doe');
    assert.equal(result.authors[0].email, 'john@example.com');
    assert.equal(result.authors[0].uri, 'http://example.com/john');
  });

  it('should extract multiple authors', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <author>
    <name>John Doe</name>
  </author>
  <author>
    <name>Jane Smith</name>
  </author>
</feed>`;

    const result = extractFeed(xml);

    assert.ok(result.authors);
    assert.equal(result.authors.length, 2);
    assert.equal(result.authors[0].name, 'John Doe');
    assert.equal(result.authors[1].name, 'Jane Smith');
  });

  it('should skip authors without name', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <author>
    <email>john@example.com</email>
  </author>
</feed>`;

    const result = extractFeed(xml);

    assert.equal(result.authors, undefined);
  });

  it('should extract links', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <link href="http://example.com" rel="alternate" type="text/html"/>
  <link href="http://example.com/feed" rel="self" type="application/atom+xml"/>
</feed>`;

    const result = extractFeed(xml);

    assert.ok(result.links);
    assert.equal(result.links.length, 2);
    assert.equal(result.links[0].href, 'http://example.com');
    assert.equal(result.links[0].rel, 'alternate');
    assert.equal(result.links[0].type, 'text/html');
    assert.equal(result.links[1].href, 'http://example.com/feed');
    assert.equal(result.links[1].rel, 'self');
    assert.equal(result.links[1].type, 'application/atom+xml');
  });

  it('should extract link with all attributes', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <link href="http://example.com"
        rel="alternate"
        type="text/html"
        hreflang="en"
        title="Example Site"
        length="12345"/>
</feed>`;

    const result = extractFeed(xml);

    assert.ok(result.links);
    assert.equal(result.links[0].href, 'http://example.com');
    assert.equal(result.links[0].rel, 'alternate');
    assert.equal(result.links[0].type, 'text/html');
    assert.equal(result.links[0].hreflang, 'en');
    assert.equal(result.links[0].title, 'Example Site');
    assert.equal(result.links[0].length, 12345);
  });

  it('should extract categories', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <category term="technology" scheme="http://example.com/categories" label="Technology"/>
  <category term="news"/>
</feed>`;

    const result = extractFeed(xml);

    assert.ok(result.categories);
    assert.equal(result.categories.length, 2);
    assert.equal(result.categories[0].term, 'technology');
    assert.equal(result.categories[0].scheme, 'http://example.com/categories');
    assert.equal(result.categories[0].label, 'Technology');
    assert.equal(result.categories[1].term, 'news');
  });

  it('should extract contributors', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <contributor>
    <name>Contributor One</name>
  </contributor>
  <contributor>
    <name>Contributor Two</name>
  </contributor>
</feed>`;

    const result = extractFeed(xml);

    assert.ok(result.contributors);
    assert.equal(result.contributors.length, 2);
    assert.equal(result.contributors[0].name, 'Contributor One');
    assert.equal(result.contributors[1].name, 'Contributor Two');
  });

  it('should extract generator', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <generator uri="http://example.com/generator" version="1.0">Example Generator</generator>
</feed>`;

    const result = extractFeed(xml);

    assert.ok(result.generator);
    assert.equal(result.generator.value, 'Example Generator');
    assert.equal(result.generator.uri, 'http://example.com/generator');
    assert.equal(result.generator.version, '1.0');
  });

  it('should extract icon', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <icon>http://example.com/icon.png</icon>
</feed>`;

    const result = extractFeed(xml);

    assert.equal(result.icon, 'http://example.com/icon.png');
  });

  it('should extract logo', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <logo>http://example.com/logo.png</logo>
</feed>`;

    const result = extractFeed(xml);

    assert.equal(result.logo, 'http://example.com/logo.png');
  });

  it('should extract rights', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <rights>© 2025 Example Corp</rights>
</feed>`;

    const result = extractFeed(xml);

    assert.equal(result.rights, '© 2025 Example Corp');
  });

  it('should extract subtitle', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title>Example</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <subtitle>A feed about examples</subtitle>
</feed>`;

    const result = extractFeed(xml);

    assert.equal(result.subtitle, 'A feed about examples');
  });

  it('should handle text type attributes in title', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title type="text">  Example   Feed  </title>
  <updated>2025-12-17T10:00:00Z</updated>
</feed>`;

    const result = extractFeed(xml);

    assert.equal(result.title, 'Example Feed');
  });

  it('should handle html type attributes', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com</id>
  <title type="html">&lt;b&gt;Example&lt;/b&gt;</title>
  <updated>2025-12-17T10:00:00Z</updated>
</feed>`;

    const result = extractFeed(xml);

    assert.equal(result.title, '&lt;b&gt;Example&lt;/b&gt;');
  });

  it('should clean whitespace in all text fields', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>  http://example.com  </id>
  <title>  Example   Feed  </title>
  <updated>2025-12-17T10:00:00Z</updated>
</feed>`;

    const result = extractFeed(xml);

    assert.equal(result.id, 'http://example.com');
    assert.equal(result.title, 'Example Feed');
  });
});
