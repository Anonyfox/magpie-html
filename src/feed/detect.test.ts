import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detectFormat, isAtom, isFeed, isJSONFeed, isRSS } from './detect.js';

describe('detectFormat', () => {
  describe('RSS detection', () => {
    it('should detect RSS 2.0', () => {
      const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test</title>
  </channel>
</rss>`;
      assert.equal(detectFormat(rss), 'rss');
    });

    it('should detect RSS without version', () => {
      const rss = `<rss>
  <channel>
    <title>Test</title>
  </channel>
</rss>`;
      assert.equal(detectFormat(rss), 'rss');
    });

    it('should detect RSS with whitespace', () => {
      const rss = `

<?xml version="1.0"?>
<rss version="2.0">
  <channel><title>Test</title></channel>
</rss>`;
      assert.equal(detectFormat(rss), 'rss');
    });

    it('should detect RSS with comments', () => {
      const rss = `<?xml version="1.0"?>
<!-- This is a comment -->
<rss version="2.0">
  <channel><title>Test</title></channel>
</rss>`;
      assert.equal(detectFormat(rss), 'rss');
    });

    it('should detect RSS 1.0 (RDF)', () => {
      const rss = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns="http://purl.org/rss/1.0/">
  <channel>
    <title>Test</title>
  </channel>
</rdf:RDF>`;
      assert.equal(detectFormat(rss), 'rss');
    });

    it('should detect RSS by channel element', () => {
      const rss = `<channel>
  <title>Test</title>
  <item><title>Item</title></item>
</channel>`;
      assert.equal(detectFormat(rss), 'rss');
    });

    it('should be case insensitive for RSS', () => {
      const rss = `<RSS version="2.0">
  <channel><title>Test</title></channel>
</RSS>`;
      assert.equal(detectFormat(rss), 'rss');
    });
  });

  describe('Atom detection', () => {
    it('should detect Atom by namespace', () => {
      const atom = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test</title>
  <id>test</id>
  <updated>2025-01-01T00:00:00Z</updated>
</feed>`;
      assert.equal(detectFormat(atom), 'atom');
    });

    it('should detect Atom by feed element', () => {
      const atom = `<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test</title>
</feed>`;
      assert.equal(detectFormat(atom), 'atom');
    });

    it('should detect Atom with xmlns:atom', () => {
      const atom = `<feed xmlns:atom="http://www.w3.org/2005/Atom">
  <title>Test</title>
</feed>`;
      assert.equal(detectFormat(atom), 'atom');
    });

    it('should detect Atom with whitespace', () => {
      const atom = `

<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test</title>
</feed>`;
      assert.equal(detectFormat(atom), 'atom');
    });

    it('should be case insensitive for Atom', () => {
      const atom = `<FEED xmlns="http://www.w3.org/2005/Atom">
  <title>Test</title>
</FEED>`;
      assert.equal(detectFormat(atom), 'atom');
    });
  });

  describe('JSON Feed detection', () => {
    it('should detect JSON Feed 1.1', () => {
      const json = JSON.stringify({
        version: 'https://jsonfeed.org/version/1.1',
        title: 'Test',
        items: [],
      });
      assert.equal(detectFormat(json), 'json-feed');
    });

    it('should detect JSON Feed 1.0', () => {
      const json = JSON.stringify({
        version: 'https://jsonfeed.org/version/1',
        title: 'Test',
        items: [],
      });
      assert.equal(detectFormat(json), 'json-feed');
    });

    it('should detect JSON Feed with whitespace', () => {
      const json = `

${JSON.stringify({
  version: 'https://jsonfeed.org/version/1.1',
  title: 'Test',
  items: [],
})}`;
      assert.equal(detectFormat(json), 'json-feed');
    });

    it('should not detect random JSON as feed', () => {
      const json = JSON.stringify({ foo: 'bar' });
      assert.equal(detectFormat(json), 'unknown');
    });

    it('should not detect JSON array as feed', () => {
      const json = JSON.stringify([1, 2, 3]);
      assert.equal(detectFormat(json), 'unknown');
    });
  });

  describe('Unknown/Invalid detection', () => {
    it('should return unknown for empty string', () => {
      assert.equal(detectFormat(''), 'unknown');
    });

    it('should return unknown for whitespace only', () => {
      assert.equal(detectFormat('   '), 'unknown');
    });

    it('should return unknown for null input', () => {
      assert.equal(detectFormat(null as unknown as string), 'unknown');
    });

    it('should return unknown for undefined input', () => {
      assert.equal(detectFormat(undefined as unknown as string), 'unknown');
    });

    it('should return unknown for plain text', () => {
      assert.equal(detectFormat('This is just plain text'), 'unknown');
    });

    it('should return unknown for HTML', () => {
      const html = `<!DOCTYPE html>
<html>
  <head><title>Test</title></head>
  <body>Content</body>
</html>`;
      assert.equal(detectFormat(html), 'unknown');
    });

    it('should return unknown for invalid JSON', () => {
      assert.equal(detectFormat('{ invalid json }'), 'unknown');
    });

    it('should return unknown for malformed XML', () => {
      assert.equal(detectFormat('<xml><unclosed>'), 'unknown');
    });
  });

  describe('Ambiguous cases', () => {
    it('should prefer RSS when RSS root element is present', () => {
      // RSS root element takes precedence over namespace extensions
      const mixed = `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel><title>Test</title></channel>
</rss>`;
      assert.equal(detectFormat(mixed), 'rss');
    });

    it('should handle RSS with Atom namespace extension', () => {
      // RSS with Atom namespace extensions (common pattern)
      const rss = `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Test</title>
    <atom:link href="http://example.com" rel="self" type="application/rss+xml"/>
  </channel>
</rss>`;
      assert.equal(detectFormat(rss), 'rss'); // RSS because <rss> is root
    });

    it('should detect Atom when feed is root with Atom namespace', () => {
      const atom = `<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test</title>
</feed>`;
      assert.equal(detectFormat(atom), 'atom');
    });
  });
});

describe('Helper functions', () => {
  it('isFeed should return true for RSS', () => {
    const rss = '<rss><channel><title>Test</title></channel></rss>';
    assert.equal(isFeed(rss), true);
  });

  it('isFeed should return true for Atom', () => {
    const atom = '<feed xmlns="http://www.w3.org/2005/Atom"><title>Test</title></feed>';
    assert.equal(isFeed(atom), true);
  });

  it('isFeed should return true for JSON Feed', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test',
      items: [],
    });
    assert.equal(isFeed(json), true);
  });

  it('isFeed should return false for unknown', () => {
    assert.equal(isFeed('plain text'), false);
  });

  it('isRSS should identify RSS correctly', () => {
    const rss = '<rss><channel><title>Test</title></channel></rss>';
    assert.equal(isRSS(rss), true);
    assert.equal(isAtom(rss), false);
    assert.equal(isJSONFeed(rss), false);
  });

  it('isAtom should identify Atom correctly', () => {
    const atom = '<feed xmlns="http://www.w3.org/2005/Atom"><title>Test</title></feed>';
    assert.equal(isAtom(atom), true);
    assert.equal(isRSS(atom), false);
    assert.equal(isJSONFeed(atom), false);
  });

  it('isJSONFeed should identify JSON Feed correctly', () => {
    const json = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test',
      items: [],
    });
    assert.equal(isJSONFeed(json), true);
    assert.equal(isRSS(json), false);
    assert.equal(isAtom(json), false);
  });
});
