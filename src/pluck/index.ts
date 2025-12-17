/**
 * Enhanced fetch for web scraping.
 *
 * @remarks
 * fetch-compatible HTTP client with robust handling of real-world web content.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * @packageDocumentation
 */

export { pluck } from './pluck.js';
export type { PluckInit, PluckResponse } from './types.js';
export {
  PluckContentTypeError,
  PluckEncodingError,
  PluckError,
  PluckHttpError,
  PluckNetworkError,
  PluckRedirectError,
  PluckSizeError,
  PluckTimeoutError,
} from './types.js';
