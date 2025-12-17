/**
 * Integration tests for title cleaning with real-world HTML samples.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getArticle, getHomepage, getPages } from '../test-helpers.js';
import { cleanTitle } from './clean-title.js';
import { parseHTML } from './html-parser.js';

/**
 * Extract raw title from HTML document.
 */
function extractRawTitle(html: string): string | undefined {
  const doc = parseHTML(html);

  // Try <title> tag first
  const titleTag = doc.querySelector('title');
  if (titleTag?.textContent?.trim()) {
    return titleTag.textContent.trim();
  }

  // Try og:title
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (ogTitle?.getAttribute('content')?.trim()) {
    return ogTitle.getAttribute('content')!.trim();
  }

  // Try twitter:title
  const twitterTitle = doc.querySelector('meta[name="twitter:title"]');
  if (twitterTitle?.getAttribute('content')?.trim()) {
    return twitterTitle.getAttribute('content')!.trim();
  }

  return undefined;
}

describe('cleanTitle - Integration Tests', () => {
  it('should clean titles from TechCrunch articles', () => {
    const article = getArticle('techcrunch.com', 'techcrunch-article.html');
    if (!article) {
      console.log('⚠️  TechCrunch article not found, skipping');
      return;
    }

    const rawTitle = extractRawTitle(article.content);
    if (!rawTitle) {
      console.log('⚠️  No title found in TechCrunch article');
      return;
    }

    const cleaned = cleanTitle(rawTitle);

    console.log('TechCrunch Article:');
    console.log('  Raw:     ', rawTitle);
    console.log('  Cleaned: ', cleaned);

    // TechCrunch typically uses " | TechCrunch" suffix
    assert.ok(cleaned.length > 0);
    assert.ok(cleaned.length <= rawTitle.length);
  });

  it('should clean titles from React.dev articles', () => {
    const article = getArticle('react.dev', 'react-articles.html');
    if (!article) {
      console.log('⚠️  React.dev article not found, skipping');
      return;
    }

    const rawTitle = extractRawTitle(article.content);
    if (!rawTitle) {
      console.log('⚠️  No title found in React.dev article');
      return;
    }

    const cleaned = cleanTitle(rawTitle);

    console.log('React.dev Article:');
    console.log('  Raw:     ', rawTitle);
    console.log('  Cleaned: ', cleaned);

    assert.ok(cleaned.length > 0);
    assert.ok(cleaned.length <= rawTitle.length);
  });

  it('should process all cached articles', () => {
    const pages = getPages();
    const results: Array<{
      site: string;
      file: string;
      raw: string;
      cleaned: string;
      changed: boolean;
    }> = [];

    console.log('\n=== All Cached Pages Title Cleaning ===\n');

    for (const page of pages) {
      const rawTitle = extractRawTitle(page.content);
      if (!rawTitle) {
        continue;
      }

      const cleaned = cleanTitle(rawTitle);
      const changed = rawTitle !== cleaned;

      results.push({
        site: page.site,
        file: page.file,
        raw: rawTitle,
        cleaned,
        changed,
      });

      if (changed) {
        console.log(`${page.site} (${page.file}):`);
        console.log(`  Raw:     ${rawTitle}`);
        console.log(`  Cleaned: ${cleaned}`);
        console.log('');
      }
    }

    console.log(`Processed ${results.length} pages`);
    console.log(`Changed: ${results.filter((r) => r.changed).length}`);
    console.log(`Unchanged: ${results.filter((r) => !r.changed).length}`);

    // All results should have valid titles
    for (const result of results) {
      assert.ok(result.cleaned.length > 0, `Cleaned title should not be empty for ${result.site}`);
      assert.ok(
        result.cleaned.length <= result.raw.length,
        `Cleaned title should not be longer than raw for ${result.site}`,
      );
    }
  });

  it('should handle CNN homepage', () => {
    const homepage = getHomepage('cnn.com');
    if (!homepage) {
      console.log('⚠️  CNN homepage not found, skipping');
      return;
    }

    const rawTitle = extractRawTitle(homepage.content);
    if (!rawTitle) {
      console.log('⚠️  No title found in CNN homepage');
      return;
    }

    const cleaned = cleanTitle(rawTitle);

    console.log('CNN Homepage:');
    console.log('  Raw:     ', rawTitle);
    console.log('  Cleaned: ', cleaned);

    assert.ok(cleaned.length > 0);
    // CNN typically uses " - CNN" or " | CNN" suffix
    if (rawTitle.includes('CNN')) {
      // Should ideally remove CNN brand
      assert.ok(cleaned.length < rawTitle.length || cleaned === rawTitle);
    }
  });

  it('should handle GitHub repositories', () => {
    const homepage = getHomepage('github.com');
    if (!homepage) {
      console.log('⚠️  GitHub homepage not found, skipping');
      return;
    }

    const rawTitle = extractRawTitle(homepage.content);
    if (!rawTitle) {
      console.log('⚠️  No title found in GitHub homepage');
      return;
    }

    const cleaned = cleanTitle(rawTitle);

    console.log('GitHub Page:');
    console.log('  Raw:     ', rawTitle);
    console.log('  Cleaned: ', cleaned);

    assert.ok(cleaned.length > 0);
  });

  it('should preserve titles without brand patterns', () => {
    const pages = getPages();
    let noBrandPatternCount = 0;

    for (const page of pages) {
      const rawTitle = extractRawTitle(page.content);
      if (!rawTitle) {
        continue;
      }

      const cleaned = cleanTitle(rawTitle);

      // If title has no common separators, should remain unchanged
      const hasSeparator = ['|', '-', '·', ':', '—', '–'].some((sep) => rawTitle.includes(sep));
      if (!hasSeparator) {
        assert.strictEqual(
          cleaned,
          rawTitle,
          `Title without separators should remain unchanged: ${rawTitle}`,
        );
        noBrandPatternCount++;
      }
    }

    console.log(`\nTitles without brand patterns: ${noBrandPatternCount}`);
  });

  it('should not make titles too short', () => {
    const pages = getPages();

    for (const page of pages) {
      const rawTitle = extractRawTitle(page.content);
      if (!rawTitle) {
        continue;
      }

      const cleaned = cleanTitle(rawTitle);

      // Cleaned title should still be meaningful (at least a few chars)
      if (cleaned.length < 3) {
        console.warn(`Warning: Very short cleaned title for ${page.site}: "${cleaned}"`);
      }

      // Should not remove everything
      assert.ok(cleaned.length > 0, `Should not produce empty title for ${page.site}`);
    }
  });
});
