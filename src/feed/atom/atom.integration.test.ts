import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { parseAtom } from './parse.js';

describe('Atom Integration Tests', () => {
  describe('Rust Blog Feed', () => {
    it('should parse Rust blog main feed', () => {
      const xml = readFileSync(
        join(process.cwd(), 'cache/blog.rust-lang.org/feeds/main.atom.xml'),
        'utf-8',
      );

      const result = parseAtom(xml);

      // Verify feed structure
      assert.equal(result.version, '1.0');
      assert.ok(result.feed.id);
      assert.ok(result.feed.title);
      assert.ok(result.feed.updated);

      // Verify entries exist
      assert.ok(result.entries.length > 0, 'Should have entries');

      // Verify entry structure
      const firstEntry = result.entries[0];
      assert.ok(firstEntry.id, 'Entry should have id');
      assert.ok(firstEntry.title, 'Entry should have title');
      assert.ok(firstEntry.updated, 'Entry should have updated date');

      // Entries should have links
      assert.ok(firstEntry.links, 'Entry should have links');
      assert.ok(firstEntry.links.length > 0, 'Entry should have at least one link');

      // Verify specific content from the feed
      assert.ok(result.feed.title.includes('Rust'), 'Feed title should mention Rust');
      assert.ok(result.feed.links, 'Feed should have links');
      assert.ok(result.feed.links.some((link) => link.href.includes('rust-lang.org')));
    });

    it('should parse Rust blog Inside Rust feed', () => {
      const xml = readFileSync(
        join(process.cwd(), 'cache/blog.rust-lang.org/feeds/inside-rust.atom.xml'),
        'utf-8',
      );

      const result = parseAtom(xml);

      assert.equal(result.version, '1.0');
      assert.ok(result.feed.id);
      assert.ok(result.feed.title);
      assert.ok(result.entries.length > 0);

      // Check that entries have required fields
      for (const entry of result.entries) {
        assert.ok(entry.id, 'Each entry should have id');
        assert.ok(entry.title, 'Each entry should have title');
        assert.ok(entry.updated, 'Each entry should have updated date');
      }
    });

    it('should extract specific entry content from Rust blog', () => {
      const xml = readFileSync(
        join(process.cwd(), 'cache/blog.rust-lang.org/feeds/main.atom.xml'),
        'utf-8',
      );

      const result = parseAtom(xml);
      const firstEntry = result.entries[0];

      // Verify entry has content or summary
      assert.ok(firstEntry.content || firstEntry.summary, 'Entry should have content or summary');

      // Verify links are properly parsed
      if (firstEntry.links) {
        for (const link of firstEntry.links) {
          assert.ok(link.href, 'Each link should have href');
          // href should be a valid URL structure
          assert.ok(
            link.href.startsWith('http://') || link.href.startsWith('https://'),
            `Link href should be valid URL: ${link.href}`,
          );
        }
      }

      // Verify dates are valid ISO 8601
      assert.ok(firstEntry.updated.match(/^\d{4}-\d{2}-\d{2}T/), 'Updated should be ISO 8601');
      if (firstEntry.published) {
        assert.ok(
          firstEntry.published.match(/^\d{4}-\d{2}-\d{2}T/),
          'Published should be ISO 8601',
        );
      }
    });
  });

  describe('Golem.de Feed', () => {
    it('should parse Golem.de Atom feed', () => {
      const xml = readFileSync(join(process.cwd(), 'cache/golem.de/feeds/main.atom.xml'), 'utf-8');

      const result = parseAtom(xml);

      assert.equal(result.version, '1.0');
      assert.ok(result.feed.id);
      assert.ok(result.feed.title);
      assert.ok(result.feed.updated);
      assert.ok(result.entries.length > 0);

      // Check feed metadata
      assert.ok(result.feed.links, 'Feed should have links');
      assert.ok(
        result.feed.links.some((link) => link.href.includes('golem.de')),
        'Feed should have golem.de link',
      );

      // Check entries
      for (const entry of result.entries) {
        assert.ok(entry.id);
        assert.ok(entry.title);
        assert.ok(entry.updated);
      }
    });

    it('should extract authors from Golem.de entries', () => {
      const xml = readFileSync(join(process.cwd(), 'cache/golem.de/feeds/main.atom.xml'), 'utf-8');

      const result = parseAtom(xml);
      const firstEntry = result.entries[0];

      // Check if entry has authors (Golem may have feed-level or entry-level authors)
      const hasAuthors = firstEntry.authors || result.feed.authors;
      if (hasAuthors) {
        const authors = (firstEntry.authors || result.feed.authors)!;
        assert.ok(authors.length > 0, 'Should have at least one author');
        assert.ok(authors[0].name, 'Author should have name');
      }
    });
  });

  describe('Cross-feed Consistency', () => {
    it('should parse all cached Atom feeds without errors', () => {
      const feeds = [
        'cache/blog.rust-lang.org/feeds/main.atom.xml',
        'cache/blog.rust-lang.org/feeds/inside-rust.atom.xml',
        'cache/golem.de/feeds/main.atom.xml',
      ];

      for (const feedPath of feeds) {
        const xml = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const result = parseAtom(xml);

        // Every feed should have these required fields
        assert.ok(result.feed.id, `${feedPath}: Feed should have id`);
        assert.ok(result.feed.title, `${feedPath}: Feed should have title`);
        assert.ok(result.feed.updated, `${feedPath}: Feed should have updated`);

        // Every entry should have required fields
        for (const entry of result.entries) {
          assert.ok(entry.id, `${feedPath}: Entry should have id`);
          assert.ok(entry.title, `${feedPath}: Entry should have title`);
          assert.ok(entry.updated, `${feedPath}: Entry should have updated`);
        }
      }
    });

    it('should have consistent date formats across all feeds', () => {
      const feeds = [
        'cache/blog.rust-lang.org/feeds/main.atom.xml',
        'cache/golem.de/feeds/main.atom.xml',
      ];

      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

      for (const feedPath of feeds) {
        const xml = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const result = parseAtom(xml);

        // Feed updated should be normalized to ISO 8601
        assert.ok(
          isoDateRegex.test(result.feed.updated),
          `${feedPath}: Feed updated should be normalized ISO 8601`,
        );

        // All entry dates should be normalized
        for (const entry of result.entries) {
          assert.ok(
            isoDateRegex.test(entry.updated),
            `${feedPath}: Entry updated should be normalized ISO 8601`,
          );
          if (entry.published) {
            assert.ok(
              isoDateRegex.test(entry.published),
              `${feedPath}: Entry published should be normalized ISO 8601`,
            );
          }
        }
      }
    });

    it('should extract links from all feeds', () => {
      const feeds = [
        'cache/blog.rust-lang.org/feeds/main.atom.xml',
        'cache/golem.de/feeds/main.atom.xml',
      ];

      for (const feedPath of feeds) {
        const xml = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const result = parseAtom(xml);

        // Feed should have self or alternate link
        assert.ok(result.feed.links, `${feedPath}: Feed should have links`);
        assert.ok(result.feed.links.length > 0, `${feedPath}: Feed should have at least one link`);

        // At least some entries should have links
        const entriesWithLinks = result.entries.filter((e) => e.links && e.links.length > 0);
        assert.ok(
          entriesWithLinks.length > 0,
          `${feedPath}: At least some entries should have links`,
        );
      }
    });
  });
});
