/**
 * High-level article gathering functionality.
 *
 * @packageDocumentation
 */

import { htmlToText } from '../../content/html-to-text/index.js';
import { calculateReadingTime, countWords, extractContent } from '../../content/index.js';
import { pluck } from '../../pluck/index.js';
import { parseHTML } from '../../utils/html-parser.js';
import type { Article } from '../types.js';
import { extractBestDescription } from '../website/description.js';
import { extractBestImage } from '../website/image.js';
import { extractBestLanguage } from '../website/language.js';
import { extractPageLinks } from '../website/links.js';
import { extractBestTitle } from '../website/title.js';
import { extractBestUrl } from '../website/url.js';

/**
 * Gather article data from a URL in one convenient call.
 *
 * @remarks
 * This is a high-level convenience method that fetches an article page and extracts
 * relevant data. It handles encoding detection, redirects, and provides
 * a unified interface for all article data.
 *
 * This method will be extended incrementally to include metadata extraction,
 * content extraction, and more.
 *
 * @param url - Article URL as string or URL object
 * @returns Gathered article data including URL, content, metadata, language, and links
 * @throws Error if URL is invalid or fetch fails
 *
 * @example
 * ```typescript
 * // Fetch an article and get its data
 * const article = await gatherArticle('https://example.com/article');
 * console.log(article.url);            // Final URL after redirects
 * console.log(article.html);           // Raw HTML content (UTF-8)
 * console.log(article.text);           // Plain text (full page HTML converted)
 * console.log(article.content);        // Cleaned article content (Readability + htmlToText)
 * console.log(article.title);          // Article title (from Readability or metadata)
 * console.log(article.description);    // Article excerpt or description
 * console.log(article.image);          // Article keyvisual/image (from best source)
 * console.log(article.language);       // Language code (ISO 639-1, e.g., 'en')
 * console.log(article.region);         // Region code (ISO 3166-1 alpha-2, e.g., 'US')
 * console.log(article.internalLinks);  // Array of internal link URLs
 * console.log(article.externalLinks);  // Array of external link URLs
 * console.log(article.wordCount);      // Word count (from content or text)
 * console.log(article.readingTime);    // Estimated reading time in minutes
 * ```
 */
export async function gatherArticle(url: string | URL): Promise<Article> {
  // Convert string to URL and validate
  let articleUrl: URL;
  try {
    articleUrl = typeof url === 'string' ? new URL(url) : url;
  } catch (error) {
    throw new Error(`Invalid article URL: ${typeof url === 'string' ? url : url.toString()}`, {
      cause: error,
    });
  }

  // Ensure URL is valid (has protocol and host)
  if (!articleUrl.protocol || !articleUrl.host) {
    throw new Error(`Invalid article URL: must have protocol and host (${articleUrl.toString()})`);
  }

  // Fetch the article
  const response = await pluck(articleUrl);
  const html = await response.textUtf8();

  // Parse HTML document
  const doc = parseHTML(html);

  // Extract plain text from HTML
  const text = htmlToText(html);

  // Extract best URL (canonical or final redirect URL)
  const pageUrl = extractBestUrl(doc, response.finalUrl);

  // Extract title, description, and content: try Readability first, fall back to metadata
  let title: string | undefined;
  let description: string | undefined;
  let content: string | undefined;

  try {
    // Try to extract article content with Mozilla Readability
    const contentResult = extractContent(doc, { baseUrl: pageUrl });

    if (contentResult.success) {
      // Extract title if available
      if (contentResult.title?.trim()) {
        title = contentResult.title.trim();
      }

      // Extract excerpt/description if available
      if (contentResult.excerpt?.trim()) {
        description = contentResult.excerpt.trim();
      }

      // Extract cleaned HTML content and convert to plain text
      if (contentResult.content?.trim()) {
        content = htmlToText(contentResult.content);
      }
    }
  } catch {
    // Readability extraction failed, will fall back to metadata
  }

  // If no title from Readability, fall back to metadata title
  if (!title) {
    title = extractBestTitle(doc);
  }

  // If no excerpt from Readability, fall back to metadata description
  if (!description) {
    description = extractBestDescription(doc);
  }

  // Extract best image from metadata
  const imageUrl = extractBestImage(doc, pageUrl);
  let image: URL | undefined;
  if (imageUrl) {
    try {
      image = new URL(imageUrl);
    } catch {
      // Skip invalid image URL
    }
  }

  // Extract language and region
  const { language, region } = extractBestLanguage(doc);

  // Extract internal and external links
  const { internal, external } = extractPageLinks(doc, pageUrl);
  const internalLinks: URL[] = [];
  for (const link of internal) {
    try {
      internalLinks.push(new URL(link));
    } catch {
      // Skip invalid URLs
    }
  }
  const externalLinks: URL[] = [];
  for (const link of external) {
    try {
      externalLinks.push(new URL(link));
    } catch {
      // Skip invalid URLs
    }
  }

  // Calculate word count and reading time
  // Prefer content (Readability-cleaned) over text (full page)
  const textForCounting = content?.trim() ? content : text;
  const wordCount = countWords(textForCounting);
  const readingTime = calculateReadingTime(wordCount);

  // Return the gathered article data
  return {
    url: new URL(pageUrl),
    html,
    text,
    content,
    title,
    description,
    image,
    language,
    region,
    internalLinks,
    externalLinks,
    wordCount,
    readingTime,
  };
}
