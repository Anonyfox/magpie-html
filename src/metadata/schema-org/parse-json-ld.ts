/**
 * JSON-LD parsing utilities.
 *
 * @remarks
 * Utilities for parsing and validating JSON-LD structured data.
 *
 * @packageDocumentation
 */

import type { JsonLdBlock } from './types.js';

/**
 * Parse JSON-LD string into structured block.
 *
 * @remarks
 * Attempts to parse JSON-LD content and extract @type and @context.
 * Returns null if parsing fails.
 *
 * @param jsonString - Raw JSON-LD string
 * @returns Parsed JSON-LD block or null if invalid
 */
export function parseJsonLd(jsonString: string): JsonLdBlock | null {
  if (!jsonString || typeof jsonString !== 'string') {
    return null;
  }

  const trimmed = jsonString.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);

    // Extract @type
    let type: string | string[] | undefined;
    if (parsed['@type']) {
      type = parsed['@type'];
    }

    // Extract @context
    const context = parsed['@context'];

    return {
      raw: trimmed,
      parsed,
      type,
      context,
    };
  } catch {
    // Invalid JSON - return null
    return null;
  }
}

/**
 * Check if a type matches a target type (case-insensitive, handles arrays).
 *
 * @remarks
 * Handles both string and array @type values.
 * Case-insensitive comparison.
 *
 * @param type - The @type value from JSON-LD
 * @param targetType - The type to match against
 * @returns True if type matches target
 */
export function isType(type: string | string[] | undefined, targetType: string): boolean {
  if (!type) {
    return false;
  }

  const target = targetType.toLowerCase();

  if (Array.isArray(type)) {
    return type.some((t) => t.toLowerCase() === target);
  }

  return type.toLowerCase() === target;
}

/**
 * Extract items from @graph array if present.
 *
 * @remarks
 * JSON-LD can contain a @graph array with multiple items.
 * This function extracts those items or returns the object itself if no @graph.
 *
 * @param parsed - Parsed JSON-LD object
 * @returns Array of items
 */
export function extractGraphItems(parsed: unknown): unknown[] {
  if (!parsed || typeof parsed !== 'object') {
    return [];
  }

  const obj = parsed as Record<string, unknown>;

  // Check for @graph array
  if (Array.isArray(obj['@graph'])) {
    return obj['@graph'];
  }

  // No @graph - return the object itself
  return [parsed];
}

/**
 * Get @type from an object (handles both string and array).
 *
 * @param obj - Object to extract @type from
 * @returns @type value or undefined
 */
export function getType(obj: unknown): string | string[] | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const record = obj as Record<string, unknown>;
  const type = record['@type'];

  if (typeof type === 'string' || Array.isArray(type)) {
    return type as string | string[];
  }

  return undefined;
}

/**
 * Check if object matches any of the target types.
 *
 * @param obj - Object to check
 * @param targetTypes - Array of type names to match
 * @returns True if object matches any target type
 */
export function matchesAnyType(obj: unknown, targetTypes: string[]): boolean {
  const type = getType(obj);
  return targetTypes.some((target) => isType(type, target));
}
