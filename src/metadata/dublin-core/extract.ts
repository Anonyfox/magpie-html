/**
 * Dublin Core metadata extraction.
 *
 * @remarks
 * Extracts Dublin Core metadata from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLDocument as Document } from '../../utils/html-parser.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { DublinCoreMetadata } from './types.js';

/**
 * Extract Dublin Core metadata from parsed HTML document.
 *
 * @remarks
 * Extracts Dublin Core metadata using both DC. and dcterms. prefixes.
 * Fields that can have multiple values (creator, subject, contributor)
 * are extracted as arrays.
 *
 * @param doc - Parsed HTML document
 * @returns Dublin Core metadata object
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const dc = extractDublinCore(doc);
 * console.log(dc.title);
 * console.log(dc.creator);
 * ```
 */
export function extractDublinCore(doc: Document): DublinCoreMetadata {
  const metadata: DublinCoreMetadata = {};

  // Extract single-value fields (try DC. first, then dcterms.)
  metadata.title = getMetaContent(doc, 'DC.title') || getMetaContent(doc, 'dcterms.title');
  metadata.description =
    getMetaContent(doc, 'DC.description') || getMetaContent(doc, 'dcterms.description');
  metadata.publisher =
    getMetaContent(doc, 'DC.publisher') || getMetaContent(doc, 'dcterms.publisher');
  metadata.date = getMetaContent(doc, 'DC.date') || getMetaContent(doc, 'dcterms.date');
  metadata.type = getMetaContent(doc, 'DC.type') || getMetaContent(doc, 'dcterms.type');
  metadata.format = getMetaContent(doc, 'DC.format') || getMetaContent(doc, 'dcterms.format');
  metadata.identifier =
    getMetaContent(doc, 'DC.identifier') || getMetaContent(doc, 'dcterms.identifier');
  metadata.source = getMetaContent(doc, 'DC.source') || getMetaContent(doc, 'dcterms.source');
  metadata.language = getMetaContent(doc, 'DC.language') || getMetaContent(doc, 'dcterms.language');
  metadata.relation = getMetaContent(doc, 'DC.relation') || getMetaContent(doc, 'dcterms.relation');
  metadata.coverage = getMetaContent(doc, 'DC.coverage') || getMetaContent(doc, 'dcterms.coverage');
  metadata.rights = getMetaContent(doc, 'DC.rights') || getMetaContent(doc, 'dcterms.rights');

  // Extract multi-value fields as arrays
  metadata.creator = extractMultiValue(doc, 'creator');
  metadata.subject = extractMultiValue(doc, 'subject');
  metadata.contributor = extractMultiValue(doc, 'contributor');

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as DublinCoreMetadata;
}

/**
 * Extract multiple values for a Dublin Core field.
 *
 * @remarks
 * Dublin Core fields can appear multiple times. This function collects all values.
 * Tries both DC. and dcterms. prefixes.
 */
function extractMultiValue(doc: Document, field: string): string[] | undefined {
  const values: string[] = [];

  // Try DC. prefix
  const dcElements = doc.querySelectorAll(`meta[name="DC.${field}"]`);
  for (const element of Array.from(dcElements)) {
    const content = element.getAttribute('content');
    if (content) {
      values.push(content);
    }
  }

  // Try dcterms. prefix
  const dctermsElements = doc.querySelectorAll(`meta[name="dcterms.${field}"]`);
  for (const element of Array.from(dctermsElements)) {
    const content = element.getAttribute('content');
    if (content) {
      values.push(content);
    }
  }

  return values.length > 0 ? values : undefined;
}
