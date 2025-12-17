import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { COMMON_FEED_PATHS, generateFeedSuggestions } from './heuristics.js';

describe('COMMON_FEED_PATHS', () => {
  it('should contain common feed paths', () => {
    assert.ok(COMMON_FEED_PATHS.includes('/feed'));
    assert.ok(COMMON_FEED_PATHS.includes('/rss.xml'));
    assert.ok(COMMON_FEED_PATHS.includes('/atom.xml'));
    assert.ok(COMMON_FEED_PATHS.includes('/feed.json'));
  });

  it('should have reasonable number of paths', () => {
    assert.ok(COMMON_FEED_PATHS.length > 10);
    assert.ok(COMMON_FEED_PATHS.length < 30);
  });
});

describe('generateFeedSuggestions', () => {
  it('should generate absolute URLs from document URL', () => {
    const suggestions = generateFeedSuggestions('https://example.com/page');

    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.every((s) => s.startsWith('https://example.com/')));
    assert.ok(suggestions.includes('https://example.com/feed'));
    assert.ok(suggestions.includes('https://example.com/rss.xml'));
    assert.ok(suggestions.includes('https://example.com/atom.xml'));
  });

  it('should handle URL object', () => {
    const url = new URL('https://example.com/blog/post');
    const suggestions = generateFeedSuggestions(url);

    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.every((s) => s.startsWith('https://example.com/')));
  });

  it('should return relative paths if no document URL', () => {
    const suggestions = generateFeedSuggestions();

    assert.ok(suggestions.length > 0);
    assert.deepEqual(suggestions, COMMON_FEED_PATHS);
  });

  it('should handle invalid URL gracefully', () => {
    const suggestions = generateFeedSuggestions('not-a-valid-url');

    assert.ok(suggestions.length > 0);
    assert.deepEqual(suggestions, COMMON_FEED_PATHS);
  });

  it('should preserve origin from document URL', () => {
    const suggestions = generateFeedSuggestions('https://blog.example.com/some/deep/path');

    assert.ok(suggestions.every((s) => s.startsWith('https://blog.example.com/')));
  });

  it('should handle different ports', () => {
    const suggestions = generateFeedSuggestions('http://localhost:3000/page');

    assert.ok(suggestions.every((s) => s.startsWith('http://localhost:3000/')));
  });
});
