/**
 * Integration tests for extractor functions accepting raw HTML strings.
 *
 * @remarks
 * Tests that all extractors work correctly when passed a raw HTML string
 * instead of a parsed Document, using the fischereihafenrestaurant.de homepage
 * as the test case (which was the source of the original bug report).
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { getHomepage } from '../test-helpers.js';
import { parseHTML } from '../utils/html-parser.js';
import { extractAnalytics } from './analytics/index.js';
import { extractAssets } from './assets/index.js';
import { extractCanonical } from './canonical/index.js';
import { extractCopyright } from './copyright/index.js';
import { extractDublinCore } from './dublin-core/index.js';
import { extractFeedDiscovery } from './feed-discovery/index.js';
import { extractGeo } from './geo/index.js';
import { extractIcons } from './icons/index.js';
import { extractLanguage } from './language/index.js';
import { extractLinks } from './links/index.js';
import { extractMonetization } from './monetization/index.js';
import { extractNews } from './news/index.js';
import { extractOpenGraph } from './opengraph/index.js';
import { extractPagination } from './pagination/index.js';
import { extractRobots } from './robots/index.js';
import { extractSchemaOrg } from './schema-org/index.js';
import { extractSecurity } from './security/index.js';
import { extractSEO } from './seo/index.js';
import { extractSitemapDiscovery } from './sitemap-discovery/index.js';
import { extractSocialProfiles } from './social-profiles/index.js';
import { extractTwitterCard } from './twitter-card/index.js';
import { extractVerification } from './verification/index.js';

describe('Extractors with string input (fischereihafenrestaurant.de)', () => {
  const homepage = getHomepage('fischereihafenrestaurant.de');

  it('should find the test homepage', () => {
    assert.ok(homepage, 'Should find fischereihafenrestaurant.de homepage in cache');
    assert.ok(homepage.content.length > 0, 'Homepage should have content');
  });

  describe('extractCanonical - the original bug', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractCanonical(homepage.content);
      assert.ok(result.canonical, 'Should extract canonical URL');
      assert.equal(
        result.canonical,
        'https://www.fischereihafenrestaurant.de/',
        'Should have correct canonical URL',
      );
    });

    it('should return same result as parsed Document', () => {
      assert.ok(homepage, 'Should have homepage');
      const doc = parseHTML(homepage.content);
      const fromString = extractCanonical(homepage.content);
      const fromDoc = extractCanonical(doc);
      assert.deepEqual(fromString, fromDoc, 'Results should match');
    });

    it('should extract alternate language links', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractCanonical(homepage.content);
      assert.ok(result.alternates, 'Should have alternates');
      assert.ok(result.alternates.length >= 2, 'Should have at least 2 alternates (de, en)');
      const deAlternate = result.alternates.find((a) => a.hreflang === 'de-DE');
      const enAlternate = result.alternates.find((a) => a.hreflang === 'en-GB');
      assert.ok(deAlternate, 'Should have German alternate');
      assert.ok(enAlternate, 'Should have English alternate');
    });
  });

  describe('extractSEO', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractSEO(homepage.content);
      assert.ok(result.title, 'Should extract title');
      assert.ok(result.title.includes('Fischereihafen'), 'Title should contain Fischereihafen');
    });
  });

  describe('extractOpenGraph', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractOpenGraph(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
    });
  });

  describe('extractTwitterCard', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractTwitterCard(homepage.content);
      assert.equal(result.card, 'summary', 'Should have twitter:card summary');
    });
  });

  describe('extractLanguage', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractLanguage(homepage.content);
      assert.equal(result.htmlLang, 'de-DE', 'Should detect German language');
      assert.equal(result.primary, 'de', 'Primary should be de');
      assert.equal(result.region, 'DE', 'Region should be DE');
    });
  });

  describe('extractIcons', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractIcons(homepage.content);
      assert.ok(result.favicon, 'Should have favicon');
      assert.ok(result.appleTouchIcons, 'Should have apple touch icons');
      assert.ok(result.appleTouchIcons.length >= 5, 'Should have multiple apple touch icons');
    });

    it('should extract MS tile icons', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractIcons(homepage.content);
      assert.ok(result.msTile, 'Should have MS tile configuration');
      assert.ok(result.msTile.image, 'Should have tile image');
      assert.ok(result.msTile.color, 'Should have tile color');
    });
  });

  describe('extractAnalytics', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractAnalytics(homepage.content);
      assert.ok(result.googleAnalytics, 'Should detect Google Analytics');
      assert.ok(
        result.googleAnalytics.includes('G-VWNC0Y0CND'),
        'Should find correct GA4 measurement ID',
      );
    });
  });

  describe('extractAssets', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractAssets(homepage.content, 'https://www.fischereihafenrestaurant.de/');
      assert.ok(result.stylesheets, 'Should find stylesheets');
      assert.ok(result.stylesheets.length > 0, 'Should have multiple stylesheets');
      assert.ok(result.scripts, 'Should find scripts');
      assert.ok(result.scripts.length > 0, 'Should have multiple scripts');
    });
  });

  describe('extractLinks', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractLinks(homepage.content, 'https://www.fischereihafenrestaurant.de/');
      assert.ok(result.totalCount && result.totalCount > 0, 'Should find links');
      assert.ok(result.internal && result.internal.length > 0, 'Should have internal links');
    });
  });

  describe('extractSchemaOrg', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractSchemaOrg(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
      assert.ok(Array.isArray(result.jsonLd), 'Should have jsonLd array');
    });
  });

  describe('extractRobots', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractRobots(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
    });
  });

  describe('extractSecurity', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractSecurity(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
    });
  });

  describe('extractVerification', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractVerification(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
    });
  });

  describe('extractFeedDiscovery', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractFeedDiscovery(
        homepage.content,
        'https://www.fischereihafenrestaurant.de/',
      );
      assert.equal(typeof result, 'object', 'Should return object');
      assert.ok(Array.isArray(result.feeds), 'Should have feeds array');
    });
  });

  describe('extractSitemapDiscovery', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractSitemapDiscovery(
        homepage.content,
        'https://www.fischereihafenrestaurant.de/',
      );
      assert.equal(typeof result, 'object', 'Should return object');
      assert.ok(Array.isArray(result.sitemaps), 'Should have sitemaps array');
    });
  });

  describe('extractSocialProfiles', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractSocialProfiles(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
    });
  });

  describe('extractPagination', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractPagination(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
    });
  });

  describe('extractNews', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractNews(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
    });
  });

  describe('extractGeo', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractGeo(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
    });
  });

  describe('extractMonetization', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractMonetization(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
    });
  });

  describe('extractDublinCore', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractDublinCore(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
    });
  });

  describe('extractCopyright', () => {
    it('should work with raw HTML string', () => {
      assert.ok(homepage, 'Should have homepage');
      const result = extractCopyright(homepage.content);
      assert.equal(typeof result, 'object', 'Should return object');
    });
  });

  describe('All extractors produce consistent results', () => {
    it('should produce identical results from string and Document inputs', () => {
      assert.ok(homepage, 'Should have homepage');
      const html = homepage.content;
      const doc = parseHTML(html);
      const baseUrl = 'https://www.fischereihafenrestaurant.de/';

      assert.deepEqual(extractSEO(html), extractSEO(doc), 'extractSEO should match');
      assert.deepEqual(
        extractOpenGraph(html),
        extractOpenGraph(doc),
        'extractOpenGraph should match',
      );
      assert.deepEqual(
        extractTwitterCard(html),
        extractTwitterCard(doc),
        'extractTwitterCard should match',
      );
      assert.deepEqual(
        extractCanonical(html),
        extractCanonical(doc),
        'extractCanonical should match',
      );
      assert.deepEqual(extractLanguage(html), extractLanguage(doc), 'extractLanguage should match');
      assert.deepEqual(extractIcons(html), extractIcons(doc), 'extractIcons should match');
      assert.deepEqual(
        extractAnalytics(html),
        extractAnalytics(doc),
        'extractAnalytics should match',
      );
      assert.deepEqual(extractRobots(html), extractRobots(doc), 'extractRobots should match');
      assert.deepEqual(extractSecurity(html), extractSecurity(doc), 'extractSecurity should match');
      assert.deepEqual(
        extractVerification(html),
        extractVerification(doc),
        'extractVerification should match',
      );
      assert.deepEqual(
        extractSchemaOrg(html),
        extractSchemaOrg(doc),
        'extractSchemaOrg should match',
      );
      assert.deepEqual(
        extractSocialProfiles(html),
        extractSocialProfiles(doc),
        'extractSocialProfiles should match',
      );
      assert.deepEqual(
        extractPagination(html),
        extractPagination(doc),
        'extractPagination should match',
      );
      assert.deepEqual(extractNews(html), extractNews(doc), 'extractNews should match');
      assert.deepEqual(extractGeo(html), extractGeo(doc), 'extractGeo should match');
      assert.deepEqual(
        extractMonetization(html),
        extractMonetization(doc),
        'extractMonetization should match',
      );
      assert.deepEqual(
        extractDublinCore(html),
        extractDublinCore(doc),
        'extractDublinCore should match',
      );
      assert.deepEqual(
        extractCopyright(html),
        extractCopyright(doc),
        'extractCopyright should match',
      );
      assert.deepEqual(
        extractAssets(html, baseUrl),
        extractAssets(doc, baseUrl),
        'extractAssets should match',
      );
      assert.deepEqual(
        extractLinks(html, baseUrl),
        extractLinks(doc, baseUrl),
        'extractLinks should match',
      );
      assert.deepEqual(
        extractFeedDiscovery(html, baseUrl),
        extractFeedDiscovery(doc, baseUrl),
        'extractFeedDiscovery should match',
      );
      assert.deepEqual(
        extractSitemapDiscovery(html, baseUrl),
        extractSitemapDiscovery(doc, baseUrl),
        'extractSitemapDiscovery should match',
      );
    });
  });
});
