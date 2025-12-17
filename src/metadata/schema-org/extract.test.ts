import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractSchemaOrg } from './extract.js';

describe('extractSchemaOrg', () => {
  it('should extract basic JSON-LD script', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Test Article"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.equal(result.jsonLd.length, 1);
    assert.equal(result.jsonLd[0].type, 'Article');
    assert.ok(result.articles);
    assert.equal(result.articles.length, 1);
  });

  it('should extract multiple JSON-LD blocks', () => {
    const html = `
      <script type="application/ld+json">
      {"@type": "Article", "headline": "Article 1"}
      </script>
      <script type="application/ld+json">
      {"@type": "Organization", "name": "Company"}
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.equal(result.jsonLd.length, 2);
    assert.ok(result.articles);
    assert.ok(result.organization);
  });

  it('should handle @graph array', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {"@type": "WebSite", "name": "Site"},
          {"@type": "Organization", "name": "Company"}
        ]
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.equal(result.jsonLd.length, 1);
    assert.ok(result.webPages);
    assert.equal(result.webPages.length, 1);
    assert.ok(result.organization);
  });

  it('should extract article types', () => {
    const html = `
      <script type="application/ld+json">
      {"@type": "Article", "headline": "Test 1"}
      </script>
      <script type="application/ld+json">
      {"@type": "NewsArticle", "headline": "Test 2"}
      </script>
      <script type="application/ld+json">
      {"@type": "BlogPosting", "headline": "Test 3"}
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.ok(result.articles);
    assert.equal(result.articles.length, 3);
  });

  it('should extract product', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Product",
        "name": "Test Product",
        "offers": {"price": "99.99"}
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.ok(result.products);
    assert.equal(result.products.length, 1);
  });

  it('should extract breadcrumbs', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home"}
        ]
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.ok(result.breadcrumbs);
    assert.equal(result.breadcrumbs.length, 1);
  });

  it('should extract events', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Event",
        "name": "Conference 2024",
        "startDate": "2024-06-01"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.ok(result.events);
    assert.equal(result.events.length, 1);
  });

  it('should extract recipes', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Recipe",
        "name": "Chocolate Cake",
        "recipeIngredient": ["flour", "sugar", "chocolate"]
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.ok(result.recipes);
    assert.equal(result.recipes.length, 1);
  });

  it('should extract videos', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "VideoObject",
        "name": "Tutorial Video",
        "contentUrl": "https://example.com/video.mp4"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.ok(result.videos);
    assert.equal(result.videos.length, 1);
  });

  it('should extract images', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "ImageObject",
        "contentUrl": "https://example.com/image.jpg"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.ok(result.images);
    assert.equal(result.images.length, 1);
  });

  it('should skip invalid JSON', () => {
    const html = `
      <script type="application/ld+json">
      {invalid json}
      </script>
      <script type="application/ld+json">
      {"@type": "Article", "valid": true}
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    // Should only extract the valid one
    assert.equal(result.jsonLd.length, 1);
    assert.ok(result.articles);
  });

  it('should skip empty scripts', () => {
    const html = `
      <script type="application/ld+json"></script>
      <script type="application/ld+json">  </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.equal(result.jsonLd.length, 0);
  });

  it('should return empty jsonLd array if no scripts found', () => {
    const html = '<html><head><title>No JSON-LD</title></head></html>';
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.deepEqual(result, { jsonLd: [] });
  });

  it('should handle complex real-world article page', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": "https://example.com/#website",
            "url": "https://example.com",
            "name": "Example Site"
          },
          {
            "@type": "WebPage",
            "@id": "https://example.com/article/#webpage",
            "url": "https://example.com/article",
            "name": "Article Page"
          },
          {
            "@type": "Article",
            "@id": "https://example.com/article/#article",
            "headline": "Understanding JSON-LD",
            "author": {
              "@type": "Person",
              "name": "John Doe"
            }
          }
        ]
      }
      </script>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home"},
          {"@type": "ListItem", "position": 2, "name": "Articles"}
        ]
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.equal(result.jsonLd.length, 2);
    assert.ok(result.webPages);
    assert.equal(result.webPages.length, 2); // WebSite + WebPage
    assert.ok(result.articles);
    assert.equal(result.articles.length, 1);
    assert.ok(result.breadcrumbs);
    assert.equal(result.breadcrumbs.length, 1);
  });

  it('should handle @type as array', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": ["Article", "BlogPosting"],
        "headline": "Multi-type article"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    assert.equal(result.jsonLd.length, 1);
    assert.deepEqual(result.jsonLd[0].type, ['Article', 'BlogPosting']);
    assert.ok(result.articles);
    assert.equal(result.articles.length, 1);
  });

  it('should take only first Organization and Person', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@graph": [
          {"@type": "Organization", "name": "First Org"},
          {"@type": "Organization", "name": "Second Org"},
          {"@type": "Person", "name": "First Person"},
          {"@type": "Person", "name": "Second Person"}
        ]
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSchemaOrg(doc);

    // Should only take the first of each
    assert.ok(result.organization);
    assert.ok(result.person);
    const org = result.organization as { name: string };
    const person = result.person as { name: string };
    assert.equal(org.name, 'First Org');
    assert.equal(person.name, 'First Person');
  });
});
