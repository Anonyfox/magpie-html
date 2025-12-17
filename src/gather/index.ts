/**
 * High-level convenience methods for gathering web content.
 *
 * @remarks
 * The `gather` module provides convenient all-in-one methods that combine
 * fetching, parsing, and extracting content. These are ideal for common
 * use cases where you want to get structured data with minimal code.
 *
 * @packageDocumentation
 */

export { gatherArticle } from './article/index.js';
export { gatherFeed } from './feed.js';
export type { Article, Website } from './types.js';
export { gatherWebsite } from './website/index.js';
