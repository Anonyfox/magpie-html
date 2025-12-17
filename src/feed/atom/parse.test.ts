import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAtom } from './parse.js';

describe('parseAtom', () => {
  it('should parse complete Atom feed with entries', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/feed</id>
  <title>Example Feed</title>
  <updated>2025-12-17T10:00:00Z</updated>
  <author>
    <name>John Doe</name>
  </author>
  <link href="http://example.com" rel="alternate"/>

  <entry>
    <id>http://example.com/entry/1</id>
    <title>First Entry</title>
    <updated>2025-12-17T10:00:00Z</updated>
    <summary>First entry summary</summary>
  </entry>

  <entry>
    <id>http://example.com/entry/2</id>
    <title>Second Entry</title>
    <updated>2025-12-17T09:00:00Z</updated>
    <summary>Second entry summary</summary>
  </entry>
</feed>`;

    const result = parseAtom(xml);

    assert.equal(result.version, '1.0');
    assert.equal(result.feed.id, 'http://example.com/feed');
    assert.equal(result.feed.title, 'Example Feed');
    assert.equal(result.entries.length, 2);
    assert.equal(result.entries[0].id, 'http://example.com/entry/1');
    assert.equal(result.entries[0].title, 'First Entry');
    assert.equal(result.entries[1].id, 'http://example.com/entry/2');
    assert.equal(result.entries[1].title, 'Second Entry');
  });

  it('should parse feed with no entries', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/feed</id>
  <title>Empty Feed</title>
  <updated>2025-12-17T10:00:00Z</updated>
</feed>`;

    const result = parseAtom(xml);

    assert.equal(result.version, '1.0');
    assert.equal(result.feed.id, 'http://example.com/feed');
    assert.equal(result.entries.length, 0);
  });

  it('should parse feed with complex entries', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/feed</id>
  <title>Complex Feed</title>
  <updated>2025-12-17T10:00:00Z</updated>

  <entry>
    <id>http://example.com/entry/1</id>
    <title>Complex Entry</title>
    <updated>2025-12-17T10:00:00Z</updated>
    <published>2025-12-16T08:00:00Z</published>
    <author>
      <name>Jane Smith</name>
      <email>jane@example.com</email>
    </author>
    <link href="http://example.com/entry/1" rel="alternate" type="text/html"/>
    <category term="technology" label="Technology"/>
    <summary>Entry summary</summary>
    <content type="html">&lt;p&gt;Entry content&lt;/p&gt;</content>
  </entry>
</feed>`;

    const result = parseAtom(xml);

    assert.equal(result.entries.length, 1);
    const entry = result.entries[0];
    assert.equal(entry.id, 'http://example.com/entry/1');
    assert.equal(entry.published, '2025-12-16T08:00:00.000Z');
    assert.ok(entry.authors);
    assert.equal(entry.authors[0].name, 'Jane Smith');
    assert.equal(entry.authors[0].email, 'jane@example.com');
    assert.ok(entry.links);
    assert.equal(entry.links[0].href, 'http://example.com/entry/1');
    assert.ok(entry.categories);
    assert.equal(entry.categories[0].term, 'technology');
    assert.equal(entry.summary, 'Entry summary');
    assert.ok(entry.content);
    assert.equal(entry.content.value, '&lt;p&gt;Entry content&lt;/p&gt;');
  });

  it('should handle feed with mix of simple and complex entries', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>http://example.com/feed</id>
  <title>Mixed Feed</title>
  <updated>2025-12-17T10:00:00Z</updated>

  <entry>
    <id>http://example.com/entry/1</id>
    <title>Simple Entry</title>
    <updated>2025-12-17T10:00:00Z</updated>
  </entry>

  <entry>
    <id>http://example.com/entry/2</id>
    <title>Complex Entry</title>
    <updated>2025-12-17T09:00:00Z</updated>
    <author>
      <name>Author Name</name>
    </author>
    <summary>A summary</summary>
    <content type="html">Content here</content>
  </entry>
</feed>`;

    const result = parseAtom(xml);

    assert.equal(result.entries.length, 2);
    assert.equal(result.entries[0].title, 'Simple Entry');
    assert.equal(result.entries[0].authors, undefined);
    assert.equal(result.entries[1].title, 'Complex Entry');
    assert.ok(result.entries[1].authors);
    assert.equal(result.entries[1].authors[0].name, 'Author Name');
  });
});
