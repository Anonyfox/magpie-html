/**
 * Dublin Core metadata types.
 *
 * @remarks
 * Library and academic metadata standard.
 *
 * @packageDocumentation
 */

/**
 * Dublin Core metadata extracted from meta tags.
 *
 * @remarks
 * Contains metadata using the Dublin Core standard, commonly used in
 * academic and library contexts. Supports both DC. and dcterms. prefixes.
 */
export interface DublinCoreMetadata {
  /** Resource title */
  title?: string;

  /** Entity responsible for making the resource (authors, creators) */
  creator?: string[];

  /** Topic or subject of the resource */
  subject?: string[];

  /** Description of the resource */
  description?: string;

  /** Entity responsible for making the resource available */
  publisher?: string;

  /** Entity responsible for contributions to the resource */
  contributor?: string[];

  /** Date of resource creation/publication */
  date?: string;

  /** Nature or genre of the resource */
  type?: string;

  /** File format, physical medium, or dimensions */
  format?: string;

  /** Unambiguous reference to the resource */
  identifier?: string;

  /** Related resource from which the described resource is derived */
  source?: string;

  /** Language of the resource */
  language?: string;

  /** Related resource */
  relation?: string;

  /** Spatial or temporal topic, location, or period */
  coverage?: string;

  /** Information about rights held in and over the resource */
  rights?: string;
}
