/**
 * Content quality assessment.
 *
 * @remarks
 * Analyzes extracted content to provide quality metrics.
 *
 * @packageDocumentation
 */

import type { ContentQuality, ExtractedContent } from './types.js';

/**
 * Calculate word count from text.
 *
 * @param text - Text to count words in
 * @returns Number of words
 */
export function countWords(text: string): number {
  // Remove extra whitespace and split on word boundaries
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/**
 * Calculate reading time in minutes.
 *
 * @remarks
 * Uses average reading speed of 200 words per minute.
 *
 * @param wordCount - Number of words
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  const minutes = wordCount / wordsPerMinute;
  return Math.max(1, Math.round(minutes));
}

/**
 * Count paragraphs in HTML content.
 *
 * @param html - HTML content
 * @returns Number of paragraph tags
 */
function countParagraphs(html: string): number {
  const matches = html.match(/<p[^>]*>/gi);
  return matches ? matches.length : 0;
}

/**
 * Count images in HTML content.
 *
 * @param html - HTML content
 * @returns Number of image tags
 */
function countImages(html: string): number {
  const matches = html.match(/<img[^>]*>/gi);
  return matches ? matches.length : 0;
}

/**
 * Count links in HTML content.
 *
 * @param html - HTML content
 * @returns Number of anchor tags
 */
function countLinks(html: string): number {
  const matches = html.match(/<a[^>]*>/gi);
  return matches ? matches.length : 0;
}

/**
 * Calculate link density.
 *
 * @remarks
 * Ratio of link text to total text. Lower is generally better for articles.
 *
 * @param html - HTML content
 * @param textContent - Plain text content
 * @returns Link density (0-1)
 */
function calculateLinkDensity(html: string, textContent: string): number {
  // Extract all link text
  const linkMatches = html.match(/<a[^>]*>(.*?)<\/a>/gi);
  if (!linkMatches) {
    return 0;
  }

  const linkText = linkMatches.map((match) => match.replace(/<[^>]*>/g, '')).join(' ');

  const linkLength = linkText.length;
  const totalLength = textContent.length;

  if (totalLength === 0) {
    return 0;
  }

  return Math.min(1, linkLength / totalLength);
}

/**
 * Calculate average words per sentence.
 *
 * @param text - Text content
 * @returns Average words per sentence
 */
function calculateAvgWordsPerSentence(text: string): number {
  // Split on sentence boundaries (., !, ?)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  if (sentences.length === 0) {
    return 0;
  }

  const totalWords = countWords(text);
  return Math.round(totalWords / sentences.length);
}

/**
 * Calculate quality score.
 *
 * @remarks
 * Composite score based on multiple factors:
 * - Length (longer is better, up to a point)
 * - Link density (lower is better)
 * - Paragraph count (more is better)
 * - Images (some is good, too many is bad)
 *
 * @param metrics - Quality metrics
 * @returns Score from 0-100
 */
function calculateQualityScore(metrics: Omit<ContentQuality, 'qualityScore'>): number {
  let score = 0;

  // Length score (0-30 points)
  // Optimal: 1000-5000 words
  if (metrics.wordCount >= 1000 && metrics.wordCount <= 5000) {
    score += 30;
  } else if (metrics.wordCount >= 500 && metrics.wordCount < 1000) {
    score += 20;
  } else if (metrics.wordCount < 500) {
    score += 10;
  } else {
    score += 15; // Very long articles
  }

  // Link density score (0-25 points)
  // Lower is better for articles
  if (metrics.linkDensity < 0.1) {
    score += 25;
  } else if (metrics.linkDensity < 0.2) {
    score += 15;
  } else if (metrics.linkDensity < 0.3) {
    score += 5;
  }

  // Paragraph score (0-20 points)
  if (metrics.paragraphCount >= 10) {
    score += 20;
  } else if (metrics.paragraphCount >= 5) {
    score += 15;
  } else if (metrics.paragraphCount >= 3) {
    score += 10;
  }

  // Image score (0-15 points)
  // Some images are good, too many is suspicious
  if (metrics.imageCount >= 1 && metrics.imageCount <= 10) {
    score += 15;
  } else if (metrics.imageCount === 0) {
    score += 10;
  } else {
    score += 5;
  }

  // Readability score (0-10 points)
  // Optimal: 15-20 words per sentence
  if (metrics.avgWordsPerSentence >= 15 && metrics.avgWordsPerSentence <= 25) {
    score += 10;
  } else if (metrics.avgWordsPerSentence >= 10 && metrics.avgWordsPerSentence <= 30) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Assess content quality.
 *
 * @remarks
 * Analyzes extracted content and returns comprehensive quality metrics.
 *
 * @param content - Extracted content
 * @returns Quality assessment
 *
 * @example
 * ```typescript
 * const content = extractContent(html);
 * if (content.success) {
 *   const quality = assessContentQuality(content);
 *   console.log(`Quality score: ${quality.qualityScore}/100`);
 *   console.log(`Reading time: ${quality.readingTime} minutes`);
 * }
 * ```
 */
export function assessContentQuality(content: ExtractedContent): ContentQuality {
  const wordCount = countWords(content.textContent);
  const charCount = content.textContent.length;
  const readingTime = calculateReadingTime(wordCount);
  const avgWordsPerSentence = calculateAvgWordsPerSentence(content.textContent);
  const paragraphCount = countParagraphs(content.content);
  const imageCount = countImages(content.content);
  const linkCount = countLinks(content.content);
  const linkDensity = calculateLinkDensity(content.content, content.textContent);

  const metrics = {
    wordCount,
    charCount,
    readingTime,
    avgWordsPerSentence,
    paragraphCount,
    imageCount,
    linkCount,
    linkDensity,
  };

  const qualityScore = calculateQualityScore(metrics);

  return {
    ...metrics,
    qualityScore,
  };
}
