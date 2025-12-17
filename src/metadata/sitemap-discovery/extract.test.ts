import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractSitemapDiscovery } from './extract.js';

describe('extractSitemapDiscovery', () => {
  it('should extract sitemap from link tag', () => {
    const html = '<link rel="sitemap" href="/sitemap.xml" type="application/xml">';
    const doc = parseHTML(html);

    const result = extractSitemapDiscovery(doc);

    assert.equal(result.sitemaps.length, 1);
    assert.equal(result.sitemaps[0], '/sitemap.xml');
  });

  it('should extract multiple sitemaps', () => {
    const html = `
      <link rel="sitemap" href="/sitemap1.xml">
      <link rel="sitemap" href="/sitemap2.xml">
      <link rel="sitemap" href="/sitemap_index.xml">
    `;
    const doc = parseHTML(html);

    const result = extractSitemapDiscovery(doc);

    assert.equal(result.sitemaps.length, 3);
    assert.deepEqual(result.sitemaps, ['/sitemap1.xml', '/sitemap2.xml', '/sitemap_index.xml']);
  });

  it('should return empty array if no sitemaps found', () => {
    const html = '<html><head><title>No Sitemap</title></head></html>';
    const doc = parseHTML(html);

    const result = extractSitemapDiscovery(doc);

    assert.deepEqual(result.sitemaps, []);
  });

  it('should generate suggestions when document URL provided', () => {
    const html = '<html><head></head></html>';
    const doc = parseHTML(html);

    const result = extractSitemapDiscovery(doc, 'https://example.com/page');

    assert.ok(result.suggestions);
    assert.ok(result.suggestions.length > 0);
    assert.ok(result.suggestions.includes('https://example.com/sitemap.xml'));
    assert.ok(result.suggestions.includes('https://example.com/robots.txt'));
  });

  it('should not generate suggestions without document URL', () => {
    const html = '<html><head></head></html>';
    const doc = parseHTML(html);

    const result = extractSitemapDiscovery(doc);

    assert.equal(result.suggestions, undefined);
  });

  it('should extract absolute sitemap URLs', () => {
    const html = '<link rel="sitemap" href="https://cdn.example.com/sitemap.xml">';
    const doc = parseHTML(html);

    const result = extractSitemapDiscovery(doc);

    assert.equal(result.sitemaps[0], 'https://cdn.example.com/sitemap.xml');
  });

  it('should handle sitemap with title', () => {
    const html = '<link rel="sitemap" href="/sitemap.xml" title="Main Sitemap">';
    const doc = parseHTML(html);

    const result = extractSitemapDiscovery(doc);

    assert.equal(result.sitemaps.length, 1);
    assert.equal(result.sitemaps[0], '/sitemap.xml');
  });

  it('should extract WordPress-style sitemap declarations', () => {
    const html = `
      <link rel="sitemap" type="application/xml" title="Sitemap" href="https://example.com/wp-sitemap.xml">
    `;
    const doc = parseHTML(html);

    const result = extractSitemapDiscovery(doc);

    assert.equal(result.sitemaps.length, 1);
    assert.equal(result.sitemaps[0], 'https://example.com/wp-sitemap.xml');
  });

  it('should include robots.txt in suggestions', () => {
    const html = '<html><head></head></html>';
    const doc = parseHTML(html);

    const result = extractSitemapDiscovery(doc, 'https://example.com');

    assert.ok(result.suggestions);
    assert.ok(result.suggestions.includes('https://example.com/robots.txt'));
  });
});
