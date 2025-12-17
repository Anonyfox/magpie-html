/**
 * Meta tag extraction helpers.
 *
 * @remarks
 * Generic utilities for extracting content from <meta> tags in parsed HTML documents.
 * These helpers work with parsed HTMLElement from node-html-parser.
 *
 * @packageDocumentation
 */

import type { HTMLElement } from 'node-html-parser';

/**
 * Get content from a meta tag by name attribute.
 *
 * @remarks
 * Extracts the content attribute from a meta tag matching the specified name.
 * Returns undefined if not found.
 *
 * @param doc - Parsed HTML document
 * @param name - Value of the name attribute to search for
 * @returns Content attribute value, or undefined if not found
 *
 * @example
 * ```typescript
 * const description = getMetaContent(doc, 'description');
 * const keywords = getMetaContent(doc, 'keywords');
 * ```
 */
export function getMetaContent(doc: HTMLElement, name: string): string | undefined {
  const element = doc.querySelector(`meta[name="${name}"]`);
  return element?.getAttribute('content') || undefined;
}

/**
 * Get content from a meta tag by property attribute (OpenGraph, etc.).
 *
 * @remarks
 * Extracts the content attribute from a meta tag matching the specified property.
 * Used primarily for OpenGraph (og:*) and Facebook (fb:*) tags.
 *
 * @param doc - Parsed HTML document
 * @param property - Value of the property attribute to search for
 * @returns Content attribute value, or undefined if not found
 *
 * @example
 * ```typescript
 * const ogTitle = getMetaProperty(doc, 'og:title');
 * const ogImage = getMetaProperty(doc, 'og:image');
 * ```
 */
export function getMetaProperty(doc: HTMLElement, property: string): string | undefined {
  const element = doc.querySelector(`meta[property="${property}"]`);
  return element?.getAttribute('content') || undefined;
}

/**
 * Get all meta tag contents matching a name pattern.
 *
 * @remarks
 * Finds all meta tags where the name attribute starts with the given prefix.
 * Returns a Map of name → content for all matches.
 *
 * Useful for extracting groups of related meta tags (e.g., all "twitter:*" tags).
 *
 * @param doc - Parsed HTML document
 * @param namePrefix - Prefix to match against name attributes
 * @returns Map of name to content values
 *
 * @example
 * ```typescript
 * const twitterTags = getAllMetaByName(doc, 'twitter:');
 * // Map { 'twitter:card' => 'summary', 'twitter:site' => '@example', ... }
 * ```
 */
export function getAllMetaByName(doc: HTMLElement, namePrefix: string): Map<string, string> {
  const result = new Map<string, string>();
  const elements = doc.querySelectorAll(`meta[name^="${namePrefix}"]`);

  for (const element of elements) {
    const name = element.getAttribute('name');
    const content = element.getAttribute('content');
    if (name && content) {
      result.set(name, content);
    }
  }

  return result;
}

/**
 * Get all meta tag contents matching a property pattern.
 *
 * @remarks
 * Finds all meta tags where the property attribute starts with the given prefix.
 * Returns a Map of property → content for all matches.
 *
 * Useful for extracting groups of related property tags (e.g., all "og:*" tags).
 *
 * @param doc - Parsed HTML document
 * @param propertyPrefix - Prefix to match against property attributes
 * @returns Map of property to content values
 *
 * @example
 * ```typescript
 * const ogTags = getAllMetaByProperty(doc, 'og:');
 * // Map { 'og:title' => 'Page Title', 'og:image' => 'https://...', ... }
 * ```
 */
export function getAllMetaByProperty(
  doc: HTMLElement,
  propertyPrefix: string,
): Map<string, string> {
  const result = new Map<string, string>();
  const elements = doc.querySelectorAll(`meta[property^="${propertyPrefix}"]`);

  for (const element of elements) {
    const property = element.getAttribute('property');
    const content = element.getAttribute('content');
    if (property && content) {
      result.set(property, content);
    }
  }

  return result;
}

/**
 * Get all values for a specific meta property that can appear multiple times.
 *
 * @remarks
 * Some meta tags can appear multiple times (e.g., og:image, article:author).
 * This function collects all values into an array.
 *
 * @param doc - Parsed HTML document
 * @param property - Property attribute value to search for
 * @returns Array of all content values (empty if none found)
 *
 * @example
 * ```typescript
 * const images = getAllMetaPropertyValues(doc, 'og:image');
 * // ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
 * ```
 */
export function getAllMetaPropertyValues(doc: HTMLElement, property: string): string[] {
  const elements = doc.querySelectorAll(`meta[property="${property}"]`);
  const values: string[] = [];

  for (const element of elements) {
    const content = element.getAttribute('content');
    if (content) {
      values.push(content);
    }
  }

  return values;
}

/**
 * Get content from meta tag by http-equiv attribute.
 *
 * @remarks
 * Extracts the content attribute from a meta tag matching the specified http-equiv value.
 * Used for HTTP header equivalents like Content-Security-Policy, X-UA-Compatible, etc.
 *
 * @param doc - Parsed HTML document
 * @param httpEquiv - Value of the http-equiv attribute to search for
 * @returns Content attribute value, or undefined if not found
 *
 * @example
 * ```typescript
 * const csp = getMetaHttpEquiv(doc, 'Content-Security-Policy');
 * const compat = getMetaHttpEquiv(doc, 'X-UA-Compatible');
 * ```
 */
export function getMetaHttpEquiv(doc: HTMLElement, httpEquiv: string): string | undefined {
  const element = doc.querySelector(`meta[http-equiv="${httpEquiv}" i]`);
  return element?.getAttribute('content') || undefined;
}
