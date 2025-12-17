import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assessContentQuality, calculateReadingTime } from './quality.js';
import type { ExtractedContent } from './types.js';

describe('calculateReadingTime', () => {
  it('should calculate reading time for short text', () => {
    const time = calculateReadingTime(100); // 100 words
    assert.equal(time, 1); // Minimum 1 minute
  });

  it('should calculate reading time for medium text', () => {
    const time = calculateReadingTime(600); // 600 words
    assert.equal(time, 3); // ~3 minutes at 200 wpm
  });

  it('should calculate reading time for long text', () => {
    const time = calculateReadingTime(2000); // 2000 words
    assert.equal(time, 10); // 10 minutes at 200 wpm
  });

  it('should always return at least 1 minute', () => {
    const time = calculateReadingTime(50); // Very short
    assert.equal(time, 1);
  });

  it('should round to nearest minute', () => {
    const time = calculateReadingTime(250); // 1.25 minutes
    assert.ok(time === 1 || time === 2); // Should round to 1 or 2
  });
});

describe('assessContentQuality', () => {
  function createMockContent(overrides: Partial<ExtractedContent>): ExtractedContent {
    return {
      success: true,
      title: 'Test Article',
      content: '<p>Test content</p>',
      textContent: 'Test content',
      excerpt: 'Test',
      length: 100,
      wordCount: 20,
      readingTime: 1,
      readerable: true,
      extractionTime: 10,
      ...overrides,
    };
  }

  it('should calculate basic metrics', () => {
    const content = createMockContent({
      content: '<p>This is a test article.</p><p>It has multiple paragraphs.</p>',
      textContent: 'This is a test article. It has multiple paragraphs.',
    });

    const quality = assessContentQuality(content);

    assert.ok(quality.wordCount > 0);
    assert.ok(quality.charCount > 0);
    assert.ok(quality.readingTime > 0);
    assert.ok(quality.paragraphCount >= 0);
    assert.ok(quality.imageCount >= 0);
    assert.ok(quality.linkCount >= 0);
    assert.ok(quality.linkDensity >= 0);
    assert.ok(quality.qualityScore >= 0);
    assert.ok(quality.qualityScore <= 100);
  });

  it('should count paragraphs correctly', () => {
    const content = createMockContent({
      content: '<p>First paragraph.</p><p>Second paragraph.</p><p>Third paragraph.</p>',
      textContent: 'First paragraph. Second paragraph. Third paragraph.',
    });

    const quality = assessContentQuality(content);

    assert.equal(quality.paragraphCount, 3);
  });

  it('should count images correctly', () => {
    const content = createMockContent({
      content: '<p>Text</p><img src="1.jpg"><p>More text</p><img src="2.jpg">',
      textContent: 'Text More text',
    });

    const quality = assessContentQuality(content);

    assert.equal(quality.imageCount, 2);
  });

  it('should count links correctly', () => {
    const content = createMockContent({
      content: '<p>Check <a href="/link1">this</a> and <a href="/link2">that</a>.</p>',
      textContent: 'Check this and that.',
    });

    const quality = assessContentQuality(content);

    assert.equal(quality.linkCount, 2);
  });

  it('should calculate link density', () => {
    const content = createMockContent({
      content: '<p>Text <a href="/link">link text here</a> more text.</p>',
      textContent: 'Text link text here more text.',
    });

    const quality = assessContentQuality(content);

    assert.ok(quality.linkDensity >= 0);
    assert.ok(quality.linkDensity <= 1);
  });

  it('should calculate link density as 0 for no links', () => {
    const content = createMockContent({
      content: '<p>Just plain text without any links.</p>',
      textContent: 'Just plain text without any links.',
    });

    const quality = assessContentQuality(content);

    assert.equal(quality.linkDensity, 0);
  });

  it('should calculate average words per sentence', () => {
    const content = createMockContent({
      textContent: 'Short sentence. Another short one. And one more here.',
    });

    const quality = assessContentQuality(content);

    assert.ok(quality.avgWordsPerSentence > 0);
    assert.ok(quality.avgWordsPerSentence < 50); // Reasonable upper bound
  });

  it('should give higher scores to quality content', () => {
    // High-quality article: good length, low link density, good structure
    const goodContent = createMockContent({
      content: `
        <p>First paragraph with good content.</p>
        <p>Second paragraph continues the story.</p>
        <p>Third paragraph adds more detail.</p>
        <p>Fourth paragraph provides context.</p>
        <p>Fifth paragraph with analysis.</p>
        <img src="image.jpg">
      `,
      textContent: Array.from({ length: 200 }, () => 'word').join(' '), // ~1000 words
    });

    const quality = assessContentQuality(goodContent);

    assert.ok(quality.qualityScore > 40); // Should be decent score
  });

  it('should give lower scores to poor content', () => {
    // Low-quality: short, high link density
    const poorContent = createMockContent({
      content: '<p><a href="/1">link</a> <a href="/2">link</a> <a href="/3">link</a></p>',
      textContent: 'link link link',
    });

    const quality = assessContentQuality(poorContent);

    assert.ok(quality.qualityScore < 60); // Should be lower score
  });

  it('should handle empty content gracefully', () => {
    const content = createMockContent({
      content: '',
      textContent: '',
    });

    const quality = assessContentQuality(content);

    assert.equal(quality.wordCount, 0);
    assert.equal(quality.charCount, 0);
    assert.equal(quality.paragraphCount, 0);
    assert.equal(quality.imageCount, 0);
    assert.equal(quality.linkCount, 0);
    assert.equal(quality.linkDensity, 0);
  });

  it('should handle content with only whitespace', () => {
    const content = createMockContent({
      content: '<p>   </p><p>\n\t</p>',
      textContent: '   \n\t  ',
    });

    const quality = assessContentQuality(content);

    assert.equal(quality.wordCount, 0);
  });

  it('should handle complex HTML structure', () => {
    const content = createMockContent({
      content: `
        <div>
          <p>Introduction paragraph with some text.</p>
          <blockquote>
            <p>A quote with more text.</p>
          </blockquote>
          <p>More content after quote.</p>
          <ul>
            <li>List item one</li>
            <li>List item two</li>
          </ul>
          <p>Final paragraph.</p>
        </div>
      `,
      textContent:
        'Introduction paragraph with some text. A quote with more text. More content after quote. List item one List item two Final paragraph.',
    });

    const quality = assessContentQuality(content);

    assert.ok(quality.wordCount > 0);
    assert.ok(quality.qualityScore > 0);
  });
});
