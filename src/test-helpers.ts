/**
 * Test helpers for accessing cached real-world HTML and feed files.
 *
 * @remarks
 * Provides path-neutral access to cache files for integration testing.
 * Automatically discovers and organizes files by domain and type.
 *
 * @packageDocumentation
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Get the absolute path to the project root directory.
 *
 * @remarks
 * Works from any test file location by navigating from this module's location.
 *
 * @returns Absolute path to project root
 */
function getProjectRoot(): string {
  // Convert import.meta.url to file path
  const currentFile = fileURLToPath(import.meta.url);
  // Go up from src/test-helpers.ts to project root
  return join(dirname(currentFile), '..');
}

/**
 * Cache entry for a single file.
 */
export interface CacheFile {
  /** File name */
  name: string;

  /** Relative path from cache root */
  relativePath: string;

  /** Absolute path to file */
  absolutePath: string;

  /** File content (lazy loaded on first access) */
  content: string;
}

/**
 * Cache entries for a domain.
 */
export interface DomainCache {
  /** Domain name */
  domain: string;

  /** Homepage HTML file */
  homepage?: CacheFile;

  /** Feed files (RSS, Atom, JSON) */
  feeds: Map<string, CacheFile>;

  /** Article HTML files */
  articles: Map<string, CacheFile>;
}

/**
 * Complete cache dictionary.
 */
export interface CacheDict {
  /** All domains indexed by domain name */
  domains: Map<string, DomainCache>;

  /** Get domain cache by name */
  get(domain: string): DomainCache | undefined;

  /** Get all domain names */
  getDomains(): string[];

  /** Get all feed files across all domains */
  getAllFeeds(): CacheFile[];

  /** Get all article files across all domains */
  getAllArticles(): CacheFile[];

  /** Get all homepage files across all domains */
  getAllHomepages(): CacheFile[];
}

/**
 * Create a cache file entry with lazy loading.
 *
 * @param name - File name
 * @param relativePath - Relative path from cache root
 * @param absolutePath - Absolute path to file
 * @returns Cache file entry
 */
function createCacheFile(name: string, relativePath: string, absolutePath: string): CacheFile {
  let contentCache: string | null = null;

  return {
    name,
    relativePath,
    absolutePath,
    get content(): string {
      if (contentCache === null) {
        contentCache = readFileSync(absolutePath, 'utf-8');
      }
      return contentCache;
    },
  };
}

/**
 * Discover and load all cache files.
 *
 * @remarks
 * Recursively scans the cache directory and organizes files by domain and type.
 *
 * @returns Complete cache dictionary
 *
 * @example
 * ```typescript
 * const cache = loadCache();
 * const techcrunch = cache.get('techcrunch.com');
 * const mainFeed = techcrunch?.feeds.get('main.rss.xml');
 * console.log(mainFeed?.content);
 * ```
 */
export function loadCache(): CacheDict {
  const projectRoot = getProjectRoot();
  const cacheRoot = join(projectRoot, 'cache');

  const domains = new Map<string, DomainCache>();

  try {
    const domainDirs = readdirSync(cacheRoot);

    for (const domainDir of domainDirs) {
      const domainPath = join(cacheRoot, domainDir);

      // Skip non-directories and README
      if (!statSync(domainPath).isDirectory() || domainDir === 'node_modules') {
        continue;
      }

      const domainCache: DomainCache = {
        domain: domainDir,
        feeds: new Map(),
        articles: new Map(),
      };

      // Check for homepage.html
      const homepagePath = join(domainPath, 'homepage.html');
      try {
        if (statSync(homepagePath).isFile()) {
          domainCache.homepage = createCacheFile(
            'homepage.html',
            `${domainDir}/homepage.html`,
            homepagePath,
          );
        }
      } catch {
        // homepage.html doesn't exist for this domain
      }

      // Load feeds directory
      const feedsPath = join(domainPath, 'feeds');
      try {
        if (statSync(feedsPath).isDirectory()) {
          const feedFiles = readdirSync(feedsPath);
          for (const feedFile of feedFiles) {
            const feedFilePath = join(feedsPath, feedFile);
            if (statSync(feedFilePath).isFile()) {
              domainCache.feeds.set(
                feedFile,
                createCacheFile(feedFile, `${domainDir}/feeds/${feedFile}`, feedFilePath),
              );
            }
          }
        }
      } catch {
        // feeds directory doesn't exist for this domain
      }

      // Load articles directory
      const articlesPath = join(domainPath, 'articles');
      try {
        if (statSync(articlesPath).isDirectory()) {
          const articleFiles = readdirSync(articlesPath);
          for (const articleFile of articleFiles) {
            const articleFilePath = join(articlesPath, articleFile);
            if (statSync(articleFilePath).isFile()) {
              domainCache.articles.set(
                articleFile,
                createCacheFile(
                  articleFile,
                  `${domainDir}/articles/${articleFile}`,
                  articleFilePath,
                ),
              );
            }
          }
        }
      } catch {
        // articles directory doesn't exist for this domain
      }

      domains.set(domainDir, domainCache);
    }
  } catch (error) {
    throw new Error(`Failed to load cache: ${error}`);
  }

  return {
    domains,
    get(domain: string): DomainCache | undefined {
      return domains.get(domain);
    },
    getDomains(): string[] {
      return Array.from(domains.keys()).sort();
    },
    getAllFeeds(): CacheFile[] {
      const feeds: CacheFile[] = [];
      for (const domain of domains.values()) {
        feeds.push(...domain.feeds.values());
      }
      return feeds;
    },
    getAllArticles(): CacheFile[] {
      const articles: CacheFile[] = [];
      for (const domain of domains.values()) {
        articles.push(...domain.articles.values());
      }
      return articles;
    },
    getAllHomepages(): CacheFile[] {
      const homepages: CacheFile[] = [];
      for (const domain of domains.values()) {
        if (domain.homepage) {
          homepages.push(domain.homepage);
        }
      }
      return homepages;
    },
  };
}

/**
 * Singleton cache instance.
 *
 * @remarks
 * Loaded once and reused across all tests for performance.
 */
let cacheInstance: CacheDict | null = null;

/**
 * Get the cache dictionary.
 *
 * @remarks
 * Returns a singleton instance that is initialized on first access.
 * Reuses the same instance across all tests for performance.
 *
 * @returns Cache dictionary with all discovered files
 *
 * @example
 * ```typescript
 * import { getCache } from './test-helpers.js';
 *
 * // In your test
 * const cache = getCache();
 * const techcrunch = cache.get('techcrunch.com');
 * const mainFeed = techcrunch?.feeds.get('main.rss.xml');
 *
 * // Access content
 * const feedContent = mainFeed?.content;
 * ```
 */
export function getCache(): CacheDict {
  if (!cacheInstance) {
    cacheInstance = loadCache();
  }
  return cacheInstance;
}

/**
 * Convenience helper to get a feed file by domain and filename.
 *
 * @param domain - Domain name (e.g., 'techcrunch.com')
 * @param feedName - Feed filename (e.g., 'main.rss.xml')
 * @returns Cache file or undefined if not found
 *
 * @example
 * ```typescript
 * const feed = getFeed('techcrunch.com', 'main.rss.xml');
 * const content = feed?.content;
 * ```
 */
export function getFeed(domain: string, feedName: string): CacheFile | undefined {
  const cache = getCache();
  return cache.get(domain)?.feeds.get(feedName);
}

/**
 * Convenience helper to get an article file by domain and filename.
 *
 * @param domain - Domain name (e.g., 'techcrunch.com')
 * @param articleName - Article filename (e.g., 'google-upi-card-india.html')
 * @returns Cache file or undefined if not found
 *
 * @example
 * ```typescript
 * const article = getArticle('techcrunch.com', 'google-upi-card-india.html');
 * const content = article?.content;
 * ```
 */
export function getArticle(domain: string, articleName: string): CacheFile | undefined {
  const cache = getCache();
  return cache.get(domain)?.articles.get(articleName);
}

/**
 * Convenience helper to get a homepage file by domain.
 *
 * @param domain - Domain name (e.g., 'techcrunch.com')
 * @returns Cache file or undefined if not found
 *
 * @example
 * ```typescript
 * const homepage = getHomepage('techcrunch.com');
 * const content = homepage?.content;
 * ```
 */
export function getHomepage(domain: string): CacheFile | undefined {
  const cache = getCache();
  return cache.get(domain)?.homepage;
}

/**
 * Get all RSS feed files.
 *
 * @returns Array of RSS feed cache files
 *
 * @example
 * ```typescript
 * const rssFeeds = getRSSFeeds();
 * for (const feed of rssFeeds) {
 *   console.log(feed.name, feed.content.length);
 * }
 * ```
 */
export function getRSSFeeds(): CacheFile[] {
  const cache = getCache();
  return cache.getAllFeeds().filter((f) => f.name.endsWith('.rss.xml'));
}

/**
 * Get all Atom feed files.
 *
 * @returns Array of Atom feed cache files
 *
 * @example
 * ```typescript
 * const atomFeeds = getAtomFeeds();
 * for (const feed of atomFeeds) {
 *   console.log(feed.name, feed.content.length);
 * }
 * ```
 */
export function getAtomFeeds(): CacheFile[] {
  const cache = getCache();
  return cache.getAllFeeds().filter((f) => f.name.endsWith('.atom.xml'));
}

/**
 * Get all JSON Feed files.
 *
 * @returns Array of JSON Feed cache files
 *
 * @example
 * ```typescript
 * const jsonFeeds = getJSONFeeds();
 * for (const feed of jsonFeeds) {
 *   console.log(feed.name, feed.content.length);
 * }
 * ```
 */
export function getJSONFeeds(): CacheFile[] {
  const cache = getCache();
  return cache.getAllFeeds().filter((f) => f.name.endsWith('.json'));
}
