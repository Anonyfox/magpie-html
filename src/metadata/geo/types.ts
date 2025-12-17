/**
 * Geographic location types.
 *
 * @remarks
 * Types for geographic location metadata.
 *
 * @packageDocumentation
 */

/**
 * Geographic coordinates.
 *
 * @remarks
 * Latitude and longitude coordinates.
 */
export interface GeoPosition {
  /** Latitude in decimal degrees */
  latitude: number;

  /** Longitude in decimal degrees */
  longitude: number;
}

/**
 * Geographic metadata.
 *
 * @remarks
 * Contains geographic location information from meta tags.
 */
export interface GeoMetadata {
  /** Geographic position (latitude/longitude) */
  position?: GeoPosition;

  /** Place name */
  placename?: string;

  /** Region code (e.g., US-CA for California, USA) */
  region?: string;

  /** Country name or code */
  country?: string;
}
