/**
 * Sitemap XML Parser
 * Supports standard sitemaps, sitemap indexes, and Google News extension
 *
 * @packageDocumentation
 */

import { normalizeUrlHttps } from '../../utils/normalize-url.js';
import type {
  Sitemap,
  SitemapImage,
  SitemapIndexEntry,
  SitemapNews,
  SitemapParseResult,
  SitemapUrl,
  SitemapVideo,
} from './types.js';
import {
  getChild,
  getChildren,
  getText,
  parseSitemapXML,
  querySelector,
  querySelectorAll,
  type SitemapElement,
} from './xml-parser.js';

/**
 * Parse a sitemap XML string
 *
 * @param xml - Sitemap XML content
 * @param baseUrl - Optional base URL for resolving relative URLs
 * @returns Parsed sitemap with URLs or sitemap references
 *
 * @example
 * ```typescript
 * const result = parseSitemap(xmlContent, 'https://example.com/sitemap.xml');
 * console.log(result.sitemap.urls.length);
 * ```
 */
export function parseSitemap(xml: string, baseUrl?: string | URL): SitemapParseResult {
  const doc = parseSitemapXML(xml);

  // Check for sitemap index first
  const sitemapIndex = querySelector(doc, 'sitemapindex');
  if (sitemapIndex) {
    return parseSitemapIndex(sitemapIndex, baseUrl);
  }

  // Check for urlset (standard sitemap)
  const urlset = querySelector(doc, 'urlset');
  if (urlset) {
    return parseUrlset(urlset, baseUrl);
  }

  // Fallback: try to find URLs anyway (forgiving)
  const urls = querySelectorAll(doc, 'url');
  if (urls.length > 0) {
    return {
      sitemap: {
        type: 'urlset',
        urls: urls.map((url) => extractUrl(url, baseUrl)),
        sitemaps: [],
      },
      isIndex: false,
    };
  }

  // Empty sitemap
  return {
    sitemap: {
      type: 'urlset',
      urls: [],
      sitemaps: [],
    },
    isIndex: false,
  };
}

/**
 * Parse a sitemap index
 */
function parseSitemapIndex(
  element: SitemapElement,
  baseUrl?: string | URL,
): SitemapParseResult {
  const sitemapElements = getChildren(element, 'sitemap');

  const sitemaps: SitemapIndexEntry[] = sitemapElements.map((el) => {
    const loc = getText(getChild(el, 'loc'));
    const lastmod = getText(getChild(el, 'lastmod')) || undefined;

    return {
      loc: baseUrl ? normalizeUrlHttps(baseUrl, loc) : loc,
      lastmod,
    };
  });

  return {
    sitemap: {
      type: 'sitemapindex',
      urls: [],
      sitemaps,
    },
    isIndex: true,
  };
}

/**
 * Parse a urlset (standard sitemap)
 */
function parseUrlset(element: SitemapElement, baseUrl?: string | URL): SitemapParseResult {
  const urlElements = getChildren(element, 'url');
  const urls = urlElements.map((el) => extractUrl(el, baseUrl));

  return {
    sitemap: {
      type: 'urlset',
      urls,
      sitemaps: [],
    },
    isIndex: false,
  };
}

/**
 * Extract a single URL entry with all extensions
 */
function extractUrl(element: SitemapElement, baseUrl?: string | URL): SitemapUrl {
  const rawLoc = getText(getChild(element, 'loc'));
  const loc = decodeXmlEntities(rawLoc);
  const lastmod = getText(getChild(element, 'lastmod')) || undefined;
  const changefreq = getText(getChild(element, 'changefreq')) || undefined;
  const priorityText = getText(getChild(element, 'priority'));
  const priority = priorityText ? Number.parseFloat(priorityText) : undefined;

  const result: SitemapUrl = {
    loc: baseUrl ? normalizeUrlHttps(baseUrl, loc) : loc,
    lastmod,
    changefreq: changefreq as SitemapUrl['changefreq'],
    priority: priority && !Number.isNaN(priority) ? priority : undefined,
  };

  // Extract Google News extension
  const news = extractNews(element);
  if (news) {
    result.news = news;
  }

  // Extract Image extension
  const images = extractImages(element, baseUrl);
  if (images.length > 0) {
    result.images = images;
  }

  // Extract Video extension
  const videos = extractVideos(element, baseUrl);
  if (videos.length > 0) {
    result.videos = videos;
  }

  return result;
}

/**
 * Extract Google News extension data
 */
function extractNews(urlElement: SitemapElement): SitemapNews | undefined {
  // Look for news:news element (namespaced)
  const newsEl =
    getChild(urlElement, 'news:news') ||
    getChild(urlElement, 'news') ||
    urlElement.children.find((c) => c.tagName.toLowerCase().endsWith(':news'));

  if (!newsEl) {
    return undefined;
  }

  const news: SitemapNews = {};

  // Publication info
  const pubEl =
    getChild(newsEl, 'news:publication') ||
    getChild(newsEl, 'publication') ||
    newsEl.children.find((c) => c.tagName.toLowerCase().endsWith(':publication'));

  if (pubEl) {
    const name =
      getText(getChild(pubEl, 'news:name')) ||
      getText(getChild(pubEl, 'name')) ||
      getText(pubEl.children.find((c) => c.tagName.toLowerCase().endsWith(':name')));

    const language =
      getText(getChild(pubEl, 'news:language')) ||
      getText(getChild(pubEl, 'language')) ||
      getText(pubEl.children.find((c) => c.tagName.toLowerCase().endsWith(':language')));

    if (name || language) {
      news.publication = {
        name: name || undefined,
        language: language || undefined,
      };
    }
  }

  // Publication date
  const pubDate =
    getText(getChild(newsEl, 'news:publication_date')) ||
    getText(getChild(newsEl, 'publication_date')) ||
    getText(newsEl.children.find((c) => c.tagName.toLowerCase().endsWith(':publication_date')));

  if (pubDate) {
    news.publicationDate = pubDate;
  }

  // Title
  const title =
    getText(getChild(newsEl, 'news:title')) ||
    getText(getChild(newsEl, 'title')) ||
    getText(newsEl.children.find((c) => c.tagName.toLowerCase().endsWith(':title')));

  if (title) {
    news.title = decodeXmlEntities(title);
  }

  // Keywords
  const keywords =
    getText(getChild(newsEl, 'news:keywords')) ||
    getText(getChild(newsEl, 'keywords')) ||
    getText(newsEl.children.find((c) => c.tagName.toLowerCase().endsWith(':keywords')));

  if (keywords) {
    news.keywords = keywords.split(',').map((k) => k.trim());
  }

  // Stock tickers
  const stockTickers =
    getText(getChild(newsEl, 'news:stock_tickers')) ||
    getText(getChild(newsEl, 'stock_tickers')) ||
    getText(newsEl.children.find((c) => c.tagName.toLowerCase().endsWith(':stock_tickers')));

  if (stockTickers) {
    news.stockTickers = stockTickers.split(',').map((t) => t.trim());
  }

  return Object.keys(news).length > 0 ? news : undefined;
}

/**
 * Extract Image extension data
 */
function extractImages(urlElement: SitemapElement, baseUrl?: string | URL): SitemapImage[] {
  const imageElements = urlElement.children.filter(
    (c) =>
      c.tagName.toLowerCase() === 'image:image' ||
      c.tagName.toLowerCase() === 'image' ||
      c.tagName.toLowerCase().endsWith(':image'),
  );

  return imageElements
    .map((imgEl) => {
      const loc =
        getText(getChild(imgEl, 'image:loc')) ||
        getText(getChild(imgEl, 'loc')) ||
        getText(imgEl.children.find((c) => c.tagName.toLowerCase().endsWith(':loc')));

      if (!loc) return null;

      const image: SitemapImage = {
        loc: baseUrl ? normalizeUrlHttps(baseUrl, loc) : loc,
      };

      const caption =
        getText(getChild(imgEl, 'image:caption')) ||
        getText(getChild(imgEl, 'caption')) ||
        getText(imgEl.children.find((c) => c.tagName.toLowerCase().endsWith(':caption')));
      if (caption) image.caption = decodeXmlEntities(caption);

      const geoLocation =
        getText(getChild(imgEl, 'image:geo_location')) ||
        getText(getChild(imgEl, 'geo_location')) ||
        getText(imgEl.children.find((c) => c.tagName.toLowerCase().endsWith(':geo_location')));
      if (geoLocation) image.geoLocation = geoLocation;

      const title =
        getText(getChild(imgEl, 'image:title')) ||
        getText(getChild(imgEl, 'title')) ||
        getText(imgEl.children.find((c) => c.tagName.toLowerCase().endsWith(':title')));
      if (title) image.title = decodeXmlEntities(title);

      const license =
        getText(getChild(imgEl, 'image:license')) ||
        getText(getChild(imgEl, 'license')) ||
        getText(imgEl.children.find((c) => c.tagName.toLowerCase().endsWith(':license')));
      if (license) image.license = baseUrl ? normalizeUrlHttps(baseUrl, license) : license;

      return image;
    })
    .filter((img): img is SitemapImage => img !== null);
}

/**
 * Extract Video extension data
 */
function extractVideos(urlElement: SitemapElement, baseUrl?: string | URL): SitemapVideo[] {
  const videoElements = urlElement.children.filter(
    (c) =>
      c.tagName.toLowerCase() === 'video:video' ||
      c.tagName.toLowerCase() === 'video' ||
      c.tagName.toLowerCase().endsWith(':video'),
  );

  return videoElements
    .map((vidEl) => {
      const thumbnailLoc =
        getText(getChild(vidEl, 'video:thumbnail_loc')) ||
        getText(getChild(vidEl, 'thumbnail_loc')) ||
        getText(vidEl.children.find((c) => c.tagName.toLowerCase().endsWith(':thumbnail_loc')));

      const title =
        getText(getChild(vidEl, 'video:title')) ||
        getText(getChild(vidEl, 'title')) ||
        getText(vidEl.children.find((c) => c.tagName.toLowerCase().endsWith(':title')));

      const description =
        getText(getChild(vidEl, 'video:description')) ||
        getText(getChild(vidEl, 'description')) ||
        getText(vidEl.children.find((c) => c.tagName.toLowerCase().endsWith(':description')));

      // All three are required
      if (!thumbnailLoc || !title || !description) return null;

      const video: SitemapVideo = {
        thumbnailLoc: baseUrl ? normalizeUrlHttps(baseUrl, thumbnailLoc) : thumbnailLoc,
        title: decodeXmlEntities(title),
        description: decodeXmlEntities(description),
      };

      // Optional fields
      const contentLoc =
        getText(getChild(vidEl, 'video:content_loc')) ||
        getText(getChild(vidEl, 'content_loc')) ||
        getText(vidEl.children.find((c) => c.tagName.toLowerCase().endsWith(':content_loc')));
      if (contentLoc) video.contentLoc = baseUrl ? normalizeUrlHttps(baseUrl, contentLoc) : contentLoc;

      const playerLoc =
        getText(getChild(vidEl, 'video:player_loc')) ||
        getText(getChild(vidEl, 'player_loc')) ||
        getText(vidEl.children.find((c) => c.tagName.toLowerCase().endsWith(':player_loc')));
      if (playerLoc) video.playerLoc = baseUrl ? normalizeUrlHttps(baseUrl, playerLoc) : playerLoc;

      const duration =
        getText(getChild(vidEl, 'video:duration')) ||
        getText(getChild(vidEl, 'duration')) ||
        getText(vidEl.children.find((c) => c.tagName.toLowerCase().endsWith(':duration')));
      if (duration) {
        const dur = Number.parseInt(duration, 10);
        if (!Number.isNaN(dur)) video.duration = dur;
      }

      const rating =
        getText(getChild(vidEl, 'video:rating')) ||
        getText(getChild(vidEl, 'rating')) ||
        getText(vidEl.children.find((c) => c.tagName.toLowerCase().endsWith(':rating')));
      if (rating) {
        const r = Number.parseFloat(rating);
        if (!Number.isNaN(r)) video.rating = r;
      }

      const viewCount =
        getText(getChild(vidEl, 'video:view_count')) ||
        getText(getChild(vidEl, 'view_count')) ||
        getText(vidEl.children.find((c) => c.tagName.toLowerCase().endsWith(':view_count')));
      if (viewCount) {
        const vc = Number.parseInt(viewCount, 10);
        if (!Number.isNaN(vc)) video.viewCount = vc;
      }

      const publicationDate =
        getText(getChild(vidEl, 'video:publication_date')) ||
        getText(getChild(vidEl, 'publication_date')) ||
        getText(vidEl.children.find((c) => c.tagName.toLowerCase().endsWith(':publication_date')));
      if (publicationDate) video.publicationDate = publicationDate;

      const familyFriendly =
        getText(getChild(vidEl, 'video:family_friendly')) ||
        getText(getChild(vidEl, 'family_friendly')) ||
        getText(vidEl.children.find((c) => c.tagName.toLowerCase().endsWith(':family_friendly')));
      if (familyFriendly) {
        video.familyFriendly = familyFriendly.toLowerCase() === 'yes';
      }

      const category =
        getText(getChild(vidEl, 'video:category')) ||
        getText(getChild(vidEl, 'category')) ||
        getText(vidEl.children.find((c) => c.tagName.toLowerCase().endsWith(':category')));
      if (category) video.category = category;

      // Tags (multiple elements)
      const tagElements = vidEl.children.filter(
        (c) =>
          c.tagName.toLowerCase() === 'video:tag' ||
          c.tagName.toLowerCase() === 'tag' ||
          c.tagName.toLowerCase().endsWith(':tag'),
      );
      if (tagElements.length > 0) {
        video.tags = tagElements.map((t) => getText(t)).filter(Boolean);
      }

      return video;
    })
    .filter((vid): vid is SitemapVideo => vid !== null);
}

/**
 * Decode common XML entities
 */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

/**
 * Check if content is a sitemap
 */
export function isSitemap(xml: string): boolean {
  if (!xml || typeof xml !== 'string') {
    return false;
  }

  const trimmed = xml.trim();

  // Quick check for sitemap markers
  return (
    (trimmed.includes('<urlset') || trimmed.includes('<sitemapindex')) &&
    trimmed.includes('sitemaps.org')
  );
}

