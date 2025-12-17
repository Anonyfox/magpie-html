/**
 * Pagination metadata types.
 *
 * @remarks
 * Types for multi-page content navigation.
 *
 * @packageDocumentation
 */

/**
 * Pagination metadata.
 *
 * @remarks
 * Contains navigation links for multi-page content series.
 */
export interface PaginationMetadata {
  /** Previous page URL */
  prev?: string;

  /** Next page URL */
  next?: string;

  /** First page URL */
  first?: string;

  /** Last page URL */
  last?: string;

  /** Parent/up level URL */
  up?: string;

  /** Index/table of contents URL */
  index?: string;
}
