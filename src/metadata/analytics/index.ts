/**
 * Analytics and tracking extraction module.
 *
 * @remarks
 * Detects analytics service IDs from HTML documents.
 * Privacy-conscious - only extracts IDs, doesn't perform any tracking.
 *
 * @packageDocumentation
 */

export { extractAnalytics } from './extract.js';
export type { AnalyticsMetadata } from './types.js';
