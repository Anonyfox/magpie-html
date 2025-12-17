import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { extractText } from './index.js';

/**
 * Integration tests using real-world cached HTML and feed files
 * These tests ensure parsing works with actual production data
 */

const CACHE_DIR = join(process.cwd(), 'cache');

describe('Integration Tests - Real World Data', () => {
  describe('RND.de RSS Feed Parsing', () => {
    it('should read and process wirtschaft category RSS feed', () => {
      const feedPath = join(CACHE_DIR, 'rnd.de/feeds/wirtschaft-category.rss.xml');
      const feedContent = readFileSync(feedPath, 'utf-8');

      assert.ok(feedContent.length > 0, 'Feed content should not be empty');
      assert.ok(feedContent.includes('<?xml'), 'Should be valid XML');
      assert.ok(feedContent.includes('<rss'), 'Should contain RSS tags');
      assert.ok(feedContent.includes('<channel>'), 'Should have channel element');
    });

    it('should extract text from RSS feed', () => {
      const feedPath = join(CACHE_DIR, 'rnd.de/feeds/wirtschaft-category.rss.xml');
      const feedContent = readFileSync(feedPath, 'utf-8');
      const text = extractText(feedContent);

      assert.ok(text.length > 100, 'Should extract substantial text');
      // Should not contain raw XML tags
      assert.ok(!text.includes('<item>'), 'Should not contain XML tags');
      assert.ok(!text.includes('<description>'), 'Should not contain XML tags');
      assert.ok(!text.includes('<rss'), 'Should not contain RSS tags');
    });
  });

  describe('RND.de Article Parsing', () => {
    it('should read and process ifo-index article HTML', () => {
      const articlePath = join(CACHE_DIR, 'rnd.de/articles/ifo-index-weihnachtsgeschaeft.html');
      const articleContent = readFileSync(articlePath, 'utf-8');

      assert.ok(articleContent.length > 0, 'Article content should not be empty');
      assert.ok(
        articleContent.includes('<!DOCTYPE html') || articleContent.includes('<html'),
        'Should be valid HTML',
      );
    });

    it('should extract text from article HTML', () => {
      const articlePath = join(CACHE_DIR, 'rnd.de/articles/ifo-index-weihnachtsgeschaeft.html');
      const articleContent = readFileSync(articlePath, 'utf-8');
      const text = extractText(articleContent);

      assert.ok(text.length > 100, 'Should extract substantial text from article');
      // Should not contain HTML tags or script/style content
      assert.ok(!text.includes('<div'), 'Should not contain HTML tags');
      assert.ok(!text.includes('<script'), 'Should not contain script tags');
      assert.ok(!text.includes('function('), 'Should not contain JavaScript code');
    });

    it('should read and process trade-republic article HTML', () => {
      const articlePath = join(CACHE_DIR, 'rnd.de/articles/trade-republic-startup.html');
      const articleContent = readFileSync(articlePath, 'utf-8');

      assert.ok(articleContent.length > 0, 'Article content should not be empty');

      const text = extractText(articleContent);
      assert.ok(text.length > 100, 'Should extract substantial text');
      assert.ok(!text.includes('<'), 'Should not contain angle brackets from tags');
    });
  });

  describe('Cross-source Consistency', () => {
    it('should handle different content types consistently', () => {
      const feedPath = join(CACHE_DIR, 'rnd.de/feeds/wirtschaft-category.rss.xml');
      const articlePath = join(CACHE_DIR, 'rnd.de/articles/ifo-index-weihnachtsgeschaeft.html');

      const feedContent = readFileSync(feedPath, 'utf-8');
      const articleContent = readFileSync(articlePath, 'utf-8');

      const feedText = extractText(feedContent);
      const articleText = extractText(articleContent);

      // Both should produce clean text output
      assert.ok(feedText.length > 0, 'Feed should produce text');
      assert.ok(articleText.length > 0, 'Article should produce text');

      // Neither should contain HTML tags
      assert.ok(!feedText.includes('<'), 'Feed text should not have tags');
      assert.ok(!articleText.includes('<'), 'Article text should not have tags');

      // Both should have normalized whitespace
      assert.ok(!feedText.includes('  '), 'Feed text should not have double spaces');
      assert.ok(!articleText.includes('  '), 'Article text should not have double spaces');
    });
  });
});
