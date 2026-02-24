/**
 * Geographic location extraction.
 *
 * @remarks
 * Extracts geographic location metadata from HTML documents.
 *
 * @packageDocumentation
 */

import { type DocumentInput, ensureDocument } from '../../utils/html-parser.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { GeoMetadata, GeoPosition } from './types.js';

/**
 * Extract geographic metadata from HTML.
 *
 * @remarks
 * Extracts geographic location information including coordinates,
 * place names, and region codes from meta tags.
 *
 * @param input - Parsed HTML document or raw HTML string
 * @returns Geographic metadata
 *
 * @example
 * ```typescript
 * // With parsed document (recommended for multiple extractions)
 * const doc = parseHTML(htmlString);
 * const geo = extractGeo(doc);
 *
 * // Or directly with HTML string
 * const geo = extractGeo(htmlString);
 * ```
 */
export function extractGeo(input: DocumentInput): GeoMetadata {
  const doc = ensureDocument(input);
  const metadata: GeoMetadata = {};

  // Extract position from geo.position (semicolon-separated lat;long)
  const geoPosition = getMetaContent(doc, 'geo.position');
  if (geoPosition) {
    const position = parseGeoPosition(geoPosition);
    if (position) {
      metadata.position = position;
    }
  }

  // Extract from ICBM (legacy format, comma-separated lat,long)
  if (!metadata.position) {
    const icbm = getMetaContent(doc, 'ICBM') || getMetaContent(doc, 'icbm');
    if (icbm) {
      const position = parseICBM(icbm);
      if (position) {
        metadata.position = position;
      }
    }
  }

  // Extract place name
  metadata.placename = getMetaContent(doc, 'geo.placename');

  // Extract region
  metadata.region = getMetaContent(doc, 'geo.region');

  // Extract country
  metadata.country = getMetaContent(doc, 'geo.country');

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as GeoMetadata;
}

/**
 * Parse geo.position format (lat;long).
 *
 * @param position - Position string in "lat;long" format
 * @returns Parsed position or undefined if invalid
 */
function parseGeoPosition(position: string): GeoPosition | undefined {
  const parts = position.split(';').map((p) => p.trim());
  if (parts.length !== 2) {
    return undefined;
  }

  const latitude = Number.parseFloat(parts[0]);
  const longitude = Number.parseFloat(parts[1]);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return undefined;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return undefined;
  }

  return { latitude, longitude };
}

/**
 * Parse ICBM format (lat,long or lat, long).
 *
 * @param icbm - Position string in "lat,long" format
 * @returns Parsed position or undefined if invalid
 */
function parseICBM(icbm: string): GeoPosition | undefined {
  const parts = icbm.split(',').map((p) => p.trim());
  if (parts.length !== 2) {
    return undefined;
  }

  const latitude = Number.parseFloat(parts[0]);
  const longitude = Number.parseFloat(parts[1]);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return undefined;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return undefined;
  }

  return { latitude, longitude };
}
