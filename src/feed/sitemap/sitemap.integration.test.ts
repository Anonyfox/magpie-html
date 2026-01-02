/**
 * Sitemap integration tests using real cached data
 */

import { strict as assert } from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { parseSitemap } from './parse.js';

const CACHE_DIR = path.join(process.cwd(), 'cache');

function getSitemap(domain: string, filename: string): string | null {
  const filePath = path.join(CACHE_DIR, domain, 'feeds', filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return null;
}

describe('Sitemap Integration Tests', () => {
  describe('Real-world Google News sitemap', () => {
    it('should parse genickbruch.com Google News sitemap', () => {
      const content = getSitemap('genickbruch.com', 'googlenews.xml');
      if (!content) {
        // Skip if file doesn't exist
        return;
      }

      const result = parseSitemap(content, 'https://www.genickbruch.com/googlenews.xml');

      assert.equal(result.sitemap.type, 'urlset');
      assert.equal(result.isIndex, false);
      assert.ok(result.sitemap.urls.length > 0, 'Should have URLs');

      // Check first URL has news extension
      const firstUrl = result.sitemap.urls[0];
      assert.ok(firstUrl.loc, 'Should have loc');
      assert.ok(firstUrl.loc.startsWith('https://'), 'Should be absolute URL');
      assert.ok(!firstUrl.loc.includes('&amp;'), 'Should decode XML entities in URLs');

      // Check news extension
      assert.ok(firstUrl.news, 'Should have news extension');
      assert.ok(firstUrl.news.title, 'Should have news title');
      assert.ok(firstUrl.news.publicationDate, 'Should have publication date');
      assert.ok(firstUrl.news.publication, 'Should have publication info');
      assert.equal(firstUrl.news.publication.name, 'Genickbruch.com');
      assert.equal(firstUrl.news.publication.language, 'de');
    });
  });
});
