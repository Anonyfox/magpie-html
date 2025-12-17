import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeUrl, normalizeUrlHttps, normalizeUrls, preferHttps } from './normalize-url.js';

describe('normalizeUrl', () => {
  const baseUrl = 'https://example.com/feed.xml';

  describe('Already absolute URLs', () => {
    it('should return absolute HTTPS URL as-is', () => {
      const url = 'https://other.com/page';
      assert.equal(normalizeUrl(baseUrl, url), 'https://other.com/page');
    });

    it('should return absolute HTTP URL as-is', () => {
      const url = 'http://other.com/page';
      assert.equal(normalizeUrl(baseUrl, url), 'http://other.com/page');
    });

    it('should handle URL with query params', () => {
      const url = 'https://example.com/page?foo=bar&baz=qux';
      assert.equal(normalizeUrl(baseUrl, url), url);
    });

    it('should handle URL with hash', () => {
      const url = 'https://example.com/page#section';
      assert.equal(normalizeUrl(baseUrl, url), url);
    });

    it('should handle URL with port', () => {
      const url = 'https://example.com:8080/page';
      assert.equal(normalizeUrl(baseUrl, url), url);
    });
  });

  describe('Protocol-relative URLs', () => {
    it('should resolve protocol-relative URL with HTTPS', () => {
      const url = '//cdn.example.com/image.jpg';
      assert.equal(normalizeUrl(baseUrl, url), 'https://cdn.example.com/image.jpg');
    });

    it('should use base protocol for protocol-relative URL', () => {
      const httpBase = 'http://example.com/feed.xml';
      const url = '//cdn.example.com/image.jpg';
      assert.equal(normalizeUrl(httpBase, url), 'http://cdn.example.com/image.jpg');
    });
  });

  describe('Absolute paths', () => {
    it('should resolve absolute path', () => {
      const url = '/article/123';
      assert.equal(normalizeUrl(baseUrl, url), 'https://example.com/article/123');
    });

    it('should resolve absolute path with query', () => {
      const url = '/search?q=test';
      assert.equal(normalizeUrl(baseUrl, url), 'https://example.com/search?q=test');
    });

    it('should handle root path', () => {
      const url = '/';
      assert.equal(normalizeUrl(baseUrl, url), 'https://example.com/');
    });
  });

  describe('Relative paths', () => {
    it('should resolve relative path', () => {
      const url = 'article.html';
      assert.equal(normalizeUrl(baseUrl, url), 'https://example.com/article.html');
    });

    it('should resolve relative path with ./', () => {
      const url = './article.html';
      assert.equal(normalizeUrl(baseUrl, url), 'https://example.com/article.html');
    });

    it('should resolve relative path with ../', () => {
      const base = 'https://example.com/blog/feed.xml';
      const url = '../images/photo.jpg';
      assert.equal(normalizeUrl(base, url), 'https://example.com/images/photo.jpg');
    });

    it('should handle complex relative paths', () => {
      const base = 'https://example.com/a/b/c/feed.xml';
      const url = '../../d/e.html';
      assert.equal(normalizeUrl(base, url), 'https://example.com/a/d/e.html');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should return empty string for null', () => {
      assert.equal(normalizeUrl(baseUrl, null), '');
    });

    it('should return empty string for undefined', () => {
      assert.equal(normalizeUrl(baseUrl, undefined), '');
    });

    it('should return original for empty string', () => {
      assert.equal(normalizeUrl(baseUrl, ''), '');
    });

    it('should return original for whitespace', () => {
      assert.equal(normalizeUrl(baseUrl, '   '), '   ');
    });

    it('should return original for invalid URL without base', () => {
      const invalid = 'not a url at all';
      assert.equal(normalizeUrl(null, invalid), invalid);
    });

    it('should return original for mailto link', () => {
      const mailto = 'mailto:test@example.com';
      assert.equal(normalizeUrl(baseUrl, mailto), mailto);
    });

    it('should return original for tel link', () => {
      const tel = 'tel:+1234567890';
      assert.equal(normalizeUrl(baseUrl, tel), tel);
    });

    it('should return original for javascript pseudo-protocol', () => {
      const js = 'javascript:void(0)';
      assert.equal(normalizeUrl(baseUrl, js), js);
    });

    it('should handle invalid base URL gracefully', () => {
      const invalidBase = 'not a url';
      const url = '/path';
      assert.equal(normalizeUrl(invalidBase, url), url);
    });

    it('should handle base URL as URL object', () => {
      const base = new URL('https://example.com/feed.xml');
      const url = '/article';
      assert.equal(normalizeUrl(base, url), 'https://example.com/article');
    });

    it('should handle trimming whitespace', () => {
      const url = '  /article  ';
      const result = normalizeUrl(baseUrl, url);
      assert.equal(result, 'https://example.com/article');
    });

    it('should try to resolve even garbage input as relative path', () => {
      // URL constructor will try to resolve anything as relative to base
      const garbage = ':::invalid:::';
      const result = normalizeUrl(baseUrl, garbage);
      // It gets resolved as a relative path
      assert.equal(result, 'https://example.com/:::invalid:::');
    });
  });

  describe('Without base URL', () => {
    it('should validate absolute URL without base', () => {
      const url = 'https://example.com/page';
      assert.equal(normalizeUrl(null, url), url);
    });

    it('should return original for relative URL without base', () => {
      const url = '/page';
      assert.equal(normalizeUrl(null, url), url);
    });

    it('should return original for relative path without base', () => {
      const url = 'article.html';
      assert.equal(normalizeUrl(null, url), url);
    });
  });
});

describe('normalizeUrls', () => {
  const baseUrl = 'https://example.com/feed.xml';

  it('should normalize array of URLs', () => {
    const urls = ['/page1', '/page2', 'https://other.com/page3'];
    const result = normalizeUrls(baseUrl, urls);

    assert.equal(result.length, 3);
    assert.equal(result[0], 'https://example.com/page1');
    assert.equal(result[1], 'https://example.com/page2');
    assert.equal(result[2], 'https://other.com/page3');
  });

  it('should filter out null and undefined', () => {
    const urls = ['/page1', null, '/page2', undefined];
    const result = normalizeUrls(baseUrl, urls);

    assert.equal(result.length, 2);
    assert.equal(result[0], 'https://example.com/page1');
    assert.equal(result[1], 'https://example.com/page2');
  });

  it('should return empty array for null input', () => {
    const result = normalizeUrls(baseUrl, null);
    assert.deepEqual(result, []);
  });

  it('should return empty array for undefined input', () => {
    const result = normalizeUrls(baseUrl, undefined);
    assert.deepEqual(result, []);
  });

  it('should return empty array for non-array', () => {
    const result = normalizeUrls(baseUrl, 'not an array' as unknown as string[]);
    assert.deepEqual(result, []);
  });
});

describe('preferHttps', () => {
  it('should upgrade HTTP to HTTPS', () => {
    const url = 'http://example.com/page';
    assert.equal(preferHttps(null, url), 'https://example.com/page');
  });

  it('should keep HTTPS as-is', () => {
    const url = 'https://example.com/page';
    assert.equal(preferHttps(null, url), url);
  });

  it('should keep HTTP if base is HTTP', () => {
    const baseUrl = 'http://example.com/feed.xml';
    const url = 'http://example.com/page';
    assert.equal(preferHttps(baseUrl, url), url);
  });

  it('should upgrade HTTP even with HTTPS base', () => {
    const baseUrl = 'https://example.com/feed.xml';
    const url = 'http://other.com/page';
    assert.equal(preferHttps(baseUrl, url), 'https://other.com/page');
  });

  it('should not affect non-HTTP URLs', () => {
    const url = 'ftp://example.com/file';
    assert.equal(preferHttps(null, url), url);
  });

  it('should handle invalid base gracefully', () => {
    const url = 'http://example.com/page';
    assert.equal(preferHttps('invalid', url), 'https://example.com/page');
  });
});

describe('normalizeUrlHttps', () => {
  const baseUrl = 'https://example.com/feed.xml';

  it('should normalize and upgrade to HTTPS', () => {
    const url = '/page';
    assert.equal(normalizeUrlHttps(baseUrl, url), 'https://example.com/page');
  });

  it('should upgrade normalized HTTP URL', () => {
    const httpBase = 'https://example.com/feed.xml';
    const url = 'http://other.com/page';
    assert.equal(normalizeUrlHttps(httpBase, url), 'https://other.com/page');
  });

  it('should keep HTTP if base is HTTP', () => {
    const httpBase = 'http://example.com/feed.xml';
    const url = '/page';
    assert.equal(normalizeUrlHttps(httpBase, url), 'http://example.com/page');
  });

  it('should handle all edge cases', () => {
    assert.equal(normalizeUrlHttps(baseUrl, null), '');
    assert.equal(normalizeUrlHttps(baseUrl, ''), '');
    // Even "garbage" gets resolved as relative path
    assert.equal(normalizeUrlHttps(baseUrl, 'garbage'), 'https://example.com/garbage');
  });
});
