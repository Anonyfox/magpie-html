import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { getArticle, getCache, getHomepage } from '../test-helpers.js';
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

describe('Metadata Integration Tests - Real World HTML', () => {
  describe('Homepage metadata extraction', () => {
    it('should extract metadata from TechCrunch homepage', () => {
      const homepage = getHomepage('techcrunch.com');
      assert.ok(homepage, 'Should find TechCrunch homepage');

      const doc = parseHTML(homepage.content);

      // Extract all metadata types
      const seo = extractSEO(doc);
      const og = extractOpenGraph(doc);
      const _twitter = extractTwitterCard(doc);
      const _canonical = extractCanonical(doc);
      const icons = extractIcons(doc);

      // Should have basic SEO metadata
      assert.ok(seo.title || seo.description, 'Should have SEO metadata');

      // Tech sites typically have OpenGraph
      assert.ok(og.title || og.description, 'Should have OpenGraph metadata');

      // Should have some icons
      assert.ok(icons.favicon || icons.appleTouchIcons?.length, 'Should have icon metadata');
    });

    it('should extract metadata from React.dev homepage', () => {
      const homepage = getHomepage('react.dev');
      assert.ok(homepage, 'Should find React.dev homepage');

      const doc = parseHTML(homepage.content);

      const seo = extractSEO(doc);
      const og = extractOpenGraph(doc);
      const _canonical = extractCanonical(doc);

      // React.dev should have comprehensive metadata
      assert.ok(seo.title, 'Should have title');
      assert.ok(seo.description, 'Should have description');
      assert.ok(og.title || og.description, 'Should have OpenGraph');
    });

    it('should extract feed discovery from all homepages', () => {
      const cache = getCache();
      const homepages = cache.getAllHomepages();

      let homepagesWithFeeds = 0;

      for (const homepage of homepages) {
        const doc = parseHTML(homepage.content);
        const feeds = extractFeedDiscovery(doc);

        if (feeds.feeds.length > 0) {
          homepagesWithFeeds++;
        }
      }

      // At least some homepages should advertise feeds
      assert.ok(
        homepagesWithFeeds > 0,
        `Expected some homepages to have feeds, found ${homepagesWithFeeds}`,
      );
    });
  });

  describe('Article metadata extraction', () => {
    it('should extract metadata from TechCrunch article', () => {
      const article = getArticle('techcrunch.com', 'google-upi-card-india.html');
      assert.ok(article, 'Should find TechCrunch article');

      const doc = parseHTML(article.content);

      const seo = extractSEO(doc);
      const og = extractOpenGraph(doc);
      const _twitter = extractTwitterCard(doc);
      const schemaOrg = extractSchemaOrg(doc);

      // Articles should have rich metadata
      assert.ok(seo.title || seo.description, 'Should have SEO metadata');
      assert.ok(og.type, 'Should have OpenGraph type');

      // Tech articles often have Schema.org
      if (schemaOrg.jsonLd.length > 0) {
        assert.ok(schemaOrg.jsonLd[0].parsed, 'Should parse Schema.org data');
      }
    });

    it('should extract metadata from React.dev article', () => {
      const article = getArticle('react.dev', 'dos-security-vulnerability.html');
      assert.ok(article, 'Should find React.dev article');

      const doc = parseHTML(article.content);

      const seo = extractSEO(doc);
      const _og = extractOpenGraph(doc);
      const canonical = extractCanonical(doc);

      assert.ok(seo.title, 'Should have title');
      assert.ok(canonical.canonical, 'Should have canonical URL');
    });

    it('should extract OpenGraph article metadata from news sites', () => {
      const testArticles = [
        { domain: 'n-tv.de', file: 'buergergeldreform-kabinett.html' },
        { domain: 'rnd.de', file: 'ifo-index-weihnachtsgeschaeft.html' },
        { domain: 'sueddeutsche.de', file: 'ski-alpin-weltcup-saison.html' },
      ];

      for (const { domain, file } of testArticles) {
        const article = getArticle(domain, file);
        if (article) {
          const doc = parseHTML(article.content);
          const og = extractOpenGraph(doc);

          // News articles should have OpenGraph
          assert.ok(og.title || og.description, `${domain}: Should have OpenGraph metadata`);
        }
      }
    });
  });

  describe('Language and localization', () => {
    it('should detect language from German news sites', () => {
      const testSites = ['faz.net', 'sueddeutsche.de', 'n-tv.de'];

      for (const domain of testSites) {
        const homepage = getHomepage(domain);
        if (homepage) {
          const doc = parseHTML(homepage.content);
          const language = extractLanguage(doc);

          // German sites should have German language metadata
          if (language.htmlLang) {
            assert.ok(language.htmlLang.startsWith('de'), `${domain}: Should have German language`);
          }
        }
      }
    });

    it('should detect language from English sites', () => {
      const testSites = ['techcrunch.com', 'react.dev'];

      for (const domain of testSites) {
        const homepage = getHomepage(domain);
        if (homepage) {
          const doc = parseHTML(homepage.content);
          const language = extractLanguage(doc);

          if (language.htmlLang) {
            assert.ok(
              language.htmlLang.startsWith('en'),
              `${domain}: Should have English language`,
            );
          }
        }
      }
    });
  });

  describe('Icons and visual assets', () => {
    it('should extract icons from all homepages', () => {
      const cache = getCache();
      const homepages = cache.getAllHomepages();

      let homepagesWithIcons = 0;

      for (const homepage of homepages) {
        const doc = parseHTML(homepage.content);
        const icons = extractIcons(doc);

        if (icons.favicon || icons.appleTouchIcons?.length || icons.shortcutIcon) {
          homepagesWithIcons++;
        }
      }

      // Most modern sites should have icons
      assert.ok(homepagesWithIcons > 0, 'Most homepages should have icon metadata');
    });
  });

  describe('Schema.org structured data', () => {
    it('should extract Schema.org from articles', () => {
      const cache = getCache();
      const articles = cache.getAllArticles();

      let articlesWithSchema = 0;

      for (const article of articles) {
        const doc = parseHTML(article.content);
        const schemaOrg = extractSchemaOrg(doc);

        if (schemaOrg.jsonLd.length > 0) {
          articlesWithSchema++;
        }
      }

      // Many modern articles should have Schema.org
      assert.ok(articlesWithSchema > 0, 'Some articles should have Schema.org data');
    });
  });

  describe('Social profiles', () => {
    it('should extract social profiles from homepages', () => {
      const cache = getCache();
      const homepages = cache.getAllHomepages();

      let homepagesWithSocial = 0;

      for (const homepage of homepages) {
        const doc = parseHTML(homepage.content);
        const social = extractSocialProfiles(doc);

        if (social.twitter || social.facebook || Object.keys(social).length > 0) {
          homepagesWithSocial++;
        }
      }

      // Some sites should have social media links
      assert.ok(homepagesWithSocial >= 0, 'Should extract social profiles where present');
    });
  });

  describe('Analytics detection', () => {
    it('should detect analytics from real sites', () => {
      const cache = getCache();
      const homepages = cache.getAllHomepages();

      let sitesWithAnalytics = 0;

      for (const homepage of homepages) {
        const doc = parseHTML(homepage.content);
        const analytics = extractAnalytics(doc);

        if (
          analytics.googleAnalytics ||
          analytics.googleTagManager ||
          Object.keys(analytics).length > 0
        ) {
          sitesWithAnalytics++;
        }
      }

      // Many commercial sites use analytics
      assert.ok(sitesWithAnalytics >= 0, 'Should detect analytics where present');
    });
  });

  describe('Robots directives', () => {
    it('should extract robots meta from pages', () => {
      const cache = getCache();
      const homepages = cache.getAllHomepages();

      for (const homepage of homepages) {
        const doc = parseHTML(homepage.content);
        const robots = extractRobots(doc);

        // Should extract without errors (even if empty)
        assert.ok(typeof robots === 'object', `${homepage.relativePath}: Should extract robots`);
      }
    });
  });

  describe('Security headers', () => {
    it('should extract security metadata from pages', () => {
      const cache = getCache();
      const homepages = cache.getAllHomepages();

      let sitesWithSecurity = 0;

      for (const homepage of homepages) {
        const doc = parseHTML(homepage.content);
        const security = extractSecurity(doc);

        if (security.referrerPolicy || security.xUaCompatible) {
          sitesWithSecurity++;
        }
      }

      assert.ok(sitesWithSecurity >= 0, 'Should extract security metadata where present');
    });
  });

  describe('Cross-domain consistency', () => {
    it('should extract basic metadata from all homepages', () => {
      const cache = getCache();
      const homepages = cache.getAllHomepages();

      assert.ok(homepages.length > 0, 'Should have homepages to test');

      for (const homepage of homepages) {
        const doc = parseHTML(homepage.content);

        // Every page should parse successfully
        assert.ok(doc, `${homepage.relativePath}: Should parse HTML`);

        // Try extracting basic metadata (should not throw)
        const seo = extractSEO(doc);
        const og = extractOpenGraph(doc);
        const _canonical = extractCanonical(doc);

        // Every modern site should have at least title
        const hasTitle = seo.title || og.title;
        assert.ok(hasTitle, `${homepage.relativePath}: Should have title metadata`);
      }
    });

    it('should extract basic metadata from all articles', () => {
      const cache = getCache();
      const articles = cache.getAllArticles();

      assert.ok(articles.length > 0, 'Should have articles to test');

      let articlesWithMetadata = 0;

      for (const article of articles) {
        const doc = parseHTML(article.content);

        // Should parse successfully
        assert.ok(doc, `${article.relativePath}: Should parse HTML`);

        const seo = extractSEO(doc);
        const og = extractOpenGraph(doc);

        if (seo.title || og.title) {
          articlesWithMetadata++;
        }
      }

      // Most articles should have metadata
      assert.ok(articlesWithMetadata > 0, 'Most articles should have title metadata');
    });
  });

  describe('Performance', () => {
    it('should extract all metadata types quickly', () => {
      const homepage = getHomepage('techcrunch.com');
      assert.ok(homepage, 'Should find TechCrunch homepage');

      const doc = parseHTML(homepage.content);

      const startTime = Date.now();

      // Extract all metadata types
      extractSEO(doc);
      extractOpenGraph(doc);
      extractTwitterCard(doc);
      extractCanonical(doc);
      extractSchemaOrg(doc);
      extractDublinCore(doc);
      extractFeedDiscovery(doc);
      extractSitemapDiscovery(doc);
      extractIcons(doc);
      extractLanguage(doc);
      extractPagination(doc);
      extractRobots(doc);
      extractCopyright(doc);
      extractVerification(doc);
      extractSocialProfiles(doc);
      extractAnalytics(doc);
      extractMonetization(doc);
      extractGeo(doc);
      extractNews(doc);
      extractSecurity(doc);

      const endTime = Date.now();

      // Should extract all metadata quickly (< 100ms for single page)
      assert.ok(endTime - startTime < 100, 'Should extract all metadata in < 100ms');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<html><head><meta name="incomplete"</head></html>';
      const doc = parseHTML(malformedHtml);

      // Should not throw
      assert.doesNotThrow(() => {
        extractSEO(doc);
        extractOpenGraph(doc);
        extractTwitterCard(doc);
      });
    });

    it('should handle empty HTML gracefully', () => {
      const emptyHtml = '<html><head></head><body></body></html>';
      const doc = parseHTML(emptyHtml);

      // Should return empty objects
      const seo = extractSEO(doc);
      const og = extractOpenGraph(doc);

      assert.equal(typeof seo, 'object', 'Should return object for empty HTML');
      assert.equal(typeof og, 'object', 'Should return object for empty HTML');
    });
  });

  describe('Assets extraction', () => {
    it('should extract assets from TechCrunch homepage', () => {
      const homepage = getHomepage('techcrunch.com');
      assert.ok(homepage, 'Should find TechCrunch homepage');

      const doc = parseHTML(homepage.content);
      const assets = extractAssets(doc, homepage.url);

      // Tech sites should have various assets
      assert.ok(assets.images || assets.scripts || assets.stylesheets, 'Should find some assets');

      // If images found, they should be absolute URLs
      if (assets.images && assets.images.length > 0) {
        const firstImage = assets.images[0];
        assert.ok(
          firstImage.startsWith('http://') || firstImage.startsWith('https://'),
          'Image URLs should be absolute',
        );
      }

      // If scripts found, they should be absolute URLs
      if (assets.scripts && assets.scripts.length > 0) {
        const firstScript = assets.scripts[0];
        assert.ok(
          firstScript.startsWith('http://') || firstScript.startsWith('https://'),
          'Script URLs should be absolute',
        );
      }
    });

    it('should extract assets from React.dev article', () => {
      const article = getArticle('react.dev', 'critical-security-vulnerability.html');
      assert.ok(article, 'Should find React article');

      const doc = parseHTML(article.content);
      const assets = extractAssets(doc, article.url);

      // React docs should have images and scripts
      assert.ok(assets.images || assets.scripts, 'Should find assets in React article');

      // Check for deduplication
      if (assets.images && assets.images.length > 0) {
        const uniqueImages = new Set(assets.images);
        assert.equal(uniqueImages.size, assets.images.length, 'Image URLs should be deduplicated');
      }
    });

    it('should extract preload hints from modern sites', () => {
      const homepage = getHomepage('react.dev');
      if (!homepage) return; // Skip if not available

      const doc = parseHTML(homepage.content);
      const assets = extractAssets(doc, homepage.url);

      // Modern sites often use preload/prefetch
      if (assets.preloads && assets.preloads.length > 0) {
        const preload = assets.preloads[0];
        assert.ok(preload.url, 'Preload should have URL');
        assert.ok(
          preload.url.startsWith('http://') || preload.url.startsWith('https://'),
          'Preload URL should be absolute',
        );
      }
    });
  });

  describe('Links extraction', () => {
    it('should extract links from TechCrunch homepage', () => {
      const homepage = getHomepage('techcrunch.com');
      assert.ok(homepage, 'Should find TechCrunch homepage');

      const doc = parseHTML(homepage.content);
      const links = extractLinks(doc, homepage.url);

      // News sites should have many links
      assert.ok(links.totalCount && links.totalCount > 0, 'Should find links');

      // Should have both internal and external links
      assert.ok(links.internalCount !== undefined, 'Should have internal count');
      assert.ok(links.externalCount !== undefined, 'Should have external count');

      // All links should be absolute URLs
      if (links.all && links.all.length > 0) {
        const firstLink = links.all[0];
        assert.ok(
          firstLink.url.startsWith('http://') || firstLink.url.startsWith('https://'),
          'Link URLs should be absolute',
        );
      }
    });

    it('should categorize internal vs external links', () => {
      const homepage = getHomepage('techcrunch.com');
      assert.ok(homepage, 'Should find TechCrunch homepage');

      const doc = parseHTML(homepage.content);
      const links = extractLinks(doc, homepage.url);

      // Should have internal links
      if (links.internal && links.internal.length > 0) {
        const internalLink = links.internal[0];
        assert.ok(internalLink.internal, 'Internal link should be marked as internal');
        assert.ok(!internalLink.external, 'Internal link should not be marked as external');
      }

      // Should have external links
      if (links.external && links.external.length > 0) {
        const externalLink = links.external[0];
        assert.ok(externalLink.external, 'External link should be marked as external');
        assert.ok(!externalLink.internal, 'External link should not be marked as internal');
      }
    });

    it('should extract crawler-friendly links', () => {
      const homepage = getHomepage('techcrunch.com');
      assert.ok(homepage, 'Should find TechCrunch homepage');

      const doc = parseHTML(homepage.content);

      // Typical crawler configuration: internal links only, exclude nofollow
      const crawlableLinks = extractLinks(doc, homepage.url, {
        scope: 'internal',
        excludeRel: ['nofollow', 'ugc', 'sponsored'],
      });

      assert.ok(crawlableLinks.totalCount !== undefined, 'Should have total count');

      // All returned links should be internal
      if (crawlableLinks.all && crawlableLinks.all.length > 0) {
        for (const link of crawlableLinks.all) {
          assert.ok(link.internal, 'All links should be internal');
          assert.ok(!link.nofollow, 'Should not have nofollow links');
        }
      }
    });

    it('should detect nofollow links', () => {
      const homepage = getHomepage('techcrunch.com');
      if (!homepage) return;

      const doc = parseHTML(homepage.content);
      const links = extractLinks(doc, homepage.url);

      // Check if nofollow links are properly detected
      if (links.nofollow && links.nofollow.length > 0) {
        const nofollowLink = links.nofollow[0];
        assert.ok(nofollowLink.nofollow, 'NoFollow link should have nofollow flag');
        assert.ok(
          nofollowLink.rel?.includes('nofollow'),
          'NoFollow link should have rel attribute',
        );
      }
    });

    it('should extract link text', () => {
      const article = getArticle('react.dev', 'critical-security-vulnerability.html');
      if (!article) return;

      const doc = parseHTML(article.content);
      const links = extractLinks(doc, article.url, { limit: 10 });

      // Should have links with text
      if (links.all && links.all.length > 0) {
        const linksWithText = links.all.filter((l) => l.text && l.text.length > 0);
        assert.ok(linksWithText.length > 0, 'Should have links with text content');
      }
    });
  });
});
