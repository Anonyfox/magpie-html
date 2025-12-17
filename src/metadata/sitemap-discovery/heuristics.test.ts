import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { COMMON_SITEMAP_PATHS, generateSitemapSuggestions } from './heuristics.js';

describe('COMMON_SITEMAP_PATHS', () => {
  it('should contain standard sitemap paths', () => {
    assert.ok(COMMON_SITEMAP_PATHS.includes('/sitemap.xml'));
    assert.ok(COMMON_SITEMAP_PATHS.includes('/sitemap_index.xml'));
  });

  it('should include WordPress sitemap paths', () => {
    assert.ok(COMMON_SITEMAP_PATHS.includes('/wp-sitemap.xml'));
  });

  it('should have reasonable number of paths', () => {
    assert.ok(COMMON_SITEMAP_PATHS.length > 5);
    assert.ok(COMMON_SITEMAP_PATHS.length < 30);
  });
});

describe('generateSitemapSuggestions', () => {
  it('should generate absolute URLs from document URL', () => {
    const suggestions = generateSitemapSuggestions('https://example.com/page');

    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.every((s) => s.startsWith('https://example.com/')));
    assert.ok(suggestions.includes('https://example.com/sitemap.xml'));
    assert.ok(suggestions.includes('https://example.com/robots.txt'));
  });

  it('should handle URL object', () => {
    const url = new URL('https://example.com/blog/post');
    const suggestions = generateSitemapSuggestions(url);

    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.every((s) => s.startsWith('https://example.com/')));
  });

  it('should return relative paths if no document URL', () => {
    const suggestions = generateSitemapSuggestions();

    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.includes('/sitemap.xml'));
    assert.ok(suggestions.includes('/robots.txt'));
  });

  it('should handle invalid URL gracefully', () => {
    const suggestions = generateSitemapSuggestions('not-a-valid-url');

    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.includes('/sitemap.xml'));
  });

  it('should include robots.txt as first suggestion', () => {
    const suggestions = generateSitemapSuggestions('https://example.com');

    assert.equal(suggestions[0], 'https://example.com/robots.txt');
  });

  it('should handle different ports', () => {
    const suggestions = generateSitemapSuggestions('http://localhost:8080/page');

    assert.ok(suggestions.every((s) => s.startsWith('http://localhost:8080/')));
  });
});
