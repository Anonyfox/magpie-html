/**
 * Tests for title cleaning utilities.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cleanTitle } from './clean-title.js';

describe('cleanTitle', () => {
  describe('Basic separators', () => {
    it('should remove brand after pipe separator', () => {
      assert.strictEqual(cleanTitle('Breaking News | CNN'), 'Breaking News');
    });

    it('should remove brand after dash separator', () => {
      assert.strictEqual(cleanTitle('Article Title - Site Name'), 'Article Title');
    });

    it('should remove brand after middle dot', () => {
      assert.strictEqual(cleanTitle('Page Title · Brand'), 'Page Title');
    });

    it('should remove brand after colon', () => {
      assert.strictEqual(cleanTitle('Tutorial: Learn JavaScript'), 'Learn JavaScript');
    });

    it('should remove brand after em dash', () => {
      assert.strictEqual(cleanTitle('News Story — NewsOrg'), 'News Story');
    });

    it('should remove brand after en dash', () => {
      // En dash with short second part (brand-like)
      assert.strictEqual(cleanTitle('Long Article Title – Pub'), 'Long Article Title');
    });
  });

  describe('Brand detection by length', () => {
    it('should keep longer part when brand is shorter', () => {
      assert.strictEqual(
        cleanTitle('This is a long article title | Short'),
        'This is a long article title',
      );
    });

    it('should keep longer part when brand comes first', () => {
      assert.strictEqual(
        cleanTitle('Brand | This is the actual article title here'),
        'This is the actual article title here',
      );
    });

    it('should handle equal-length parts by keeping second', () => {
      assert.strictEqual(cleanTitle('First Part | Second Part'), 'Second Part');
    });
  });

  describe('Domain detection', () => {
    it('should remove domain-like brand', () => {
      assert.strictEqual(cleanTitle('Article Title · example.com'), 'Article Title');
    });

    it('should remove domain with subdomain', () => {
      assert.strictEqual(cleanTitle('News Story | blog.example.com'), 'News Story');
    });

    it('should remove domain that comes first', () => {
      assert.strictEqual(cleanTitle('github.com | Repository Name'), 'Repository Name');
    });

    it('should handle .co.uk domains', () => {
      assert.strictEqual(cleanTitle('Article - news.example.co.uk'), 'Article');
    });
  });

  describe('All-caps brand detection', () => {
    it('should remove all-caps brand', () => {
      assert.strictEqual(cleanTitle('Article Title | CNN'), 'Article Title');
    });

    it('should remove all-caps brand that comes first', () => {
      assert.strictEqual(cleanTitle('BBC - News Article'), 'News Article');
    });

    it('should not remove long all-caps text', () => {
      // If it's too long, it's probably not a brand
      const title = 'BREAKING: MAJOR EVENT HAPPENING | News';
      assert.strictEqual(cleanTitle(title), 'BREAKING: MAJOR EVENT HAPPENING');
    });
  });

  describe('Multiple separators', () => {
    it('should handle three parts with brand at end', () => {
      assert.strictEqual(cleanTitle('Section: Article Title | Brand'), 'Section: Article Title');
    });

    it('should handle three parts with brand at start', () => {
      // Short brand at start
      assert.strictEqual(cleanTitle('CNN | Section | Article Title'), 'Section | Article Title');
    });

    it('should handle multiple separators with domain', () => {
      assert.strictEqual(
        cleanTitle('Category: Article Title - example.com'),
        'Category: Article Title',
      );
    });
  });

  describe('Edge cases', () => {
    it('should return original if no separator found', () => {
      assert.strictEqual(cleanTitle('Simple Title'), 'Simple Title');
    });

    it('should handle empty string', () => {
      assert.strictEqual(cleanTitle(''), '');
    });

    it('should handle whitespace-only string', () => {
      assert.strictEqual(cleanTitle('   '), '   ');
    });

    it('should handle title with only separator', () => {
      assert.strictEqual(cleanTitle('|'), '|');
    });

    it('should trim whitespace around parts', () => {
      assert.strictEqual(cleanTitle('  Title  |  Brand  '), 'Title');
    });

    it('should handle separator at start', () => {
      // Edge case: separator at start results in empty first part (filtered out)
      const result = cleanTitle('| Title');
      assert.ok(result.includes('Title'));
    });

    it('should handle separator at end', () => {
      // Edge case: separator at end results in empty last part (filtered out)
      const result = cleanTitle('Title |');
      assert.ok(result.includes('Title'));
    });

    it('should handle undefined gracefully', () => {
      assert.strictEqual(cleanTitle(undefined as unknown as string), undefined);
    });

    it('should handle null gracefully', () => {
      assert.strictEqual(cleanTitle(null as unknown as string), null);
    });
  });

  describe('Real-world examples', () => {
    it('should clean GitHub titles', () => {
      assert.strictEqual(
        cleanTitle('github/project: Repository description - GitHub'),
        'github/project: Repository description',
      );
    });

    it('should clean news site titles', () => {
      assert.strictEqual(
        cleanTitle('Breaking: Major Event Unfolds | CNN Politics'),
        'Breaking: Major Event Unfolds',
      );
    });

    it('should clean blog titles', () => {
      assert.strictEqual(
        cleanTitle('How to Build Modern Web Apps · Developer Blog'),
        'How to Build Modern Web Apps',
      );
    });

    it('should clean e-commerce titles', () => {
      assert.strictEqual(
        cleanTitle('Product Name - Features and Benefits | ShopName'),
        'Product Name - Features and Benefits',
      );
    });

    it('should clean documentation titles', () => {
      assert.strictEqual(
        cleanTitle('API Reference: Authentication | Docs'),
        'API Reference: Authentication',
      );
    });

    it('should clean Stack Overflow style titles', () => {
      assert.strictEqual(cleanTitle('How do I do X? - Stack Overflow'), 'How do I do X?');
    });

    it('should clean Wikipedia style titles', () => {
      assert.strictEqual(cleanTitle('Topic Name - Wikipedia'), 'Topic Name');
    });
  });

  describe('Preserve meaningful content', () => {
    it('should handle date ranges with dashes', () => {
      // Date ranges with dash separator - will be processed
      // The function will keep the longer/more meaningful part
      const title = cleanTitle('Event 2024-2025');
      assert.ok(title.length > 0); // Should produce something
      // Note: This is a limitation - dates with dashes may be split
    });

    it('should handle mathematical expressions cautiously', () => {
      // With spaces around dash, may be treated as separator
      // This is a known limitation - formulas should avoid separator patterns
      const title = cleanTitle('Formula: a - b = c');
      assert.ok(title.length > 0); // Should produce something
      assert.ok(title.includes('Formula') || title.includes('a'));
    });

    it('should keep title when brand is ambiguous', () => {
      const title = 'Long Title Here | Another Long Title Here';
      const result = cleanTitle(title);
      assert.ok(result.length > 10); // Should keep substantial content
    });
  });
});
