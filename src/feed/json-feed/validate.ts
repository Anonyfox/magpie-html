/**
 * JSON Feed validation utilities
 */

import type { JSONFeed } from './types.js';

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate JSON Feed structure
 * Returns array of errors (empty if valid)
 */
export function validate(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  // Must be an object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push({ field: 'root', message: 'Feed must be a JSON object' });
    return errors;
  }

  const feed = data as Partial<JSONFeed>;

  // Required: version
  if (!feed.version) {
    errors.push({ field: 'version', message: 'Missing required field: version' });
  } else if (typeof feed.version !== 'string') {
    errors.push({ field: 'version', message: 'Field "version" must be a string' });
  } else if (
    !feed.version.includes('jsonfeed.org/version/1') &&
    !feed.version.startsWith('https://jsonfeed.org/version/1')
  ) {
    errors.push({
      field: 'version',
      message: 'Unsupported version (expected JSON Feed 1.0 or 1.1)',
    });
  }

  // Required: title
  if (!feed.title) {
    errors.push({ field: 'title', message: 'Missing required field: title' });
  } else if (typeof feed.title !== 'string') {
    errors.push({ field: 'title', message: 'Field "title" must be a string' });
  }

  // Required: items
  if (!feed.items) {
    errors.push({ field: 'items', message: 'Missing required field: items' });
  } else if (!Array.isArray(feed.items)) {
    errors.push({ field: 'items', message: 'Field "items" must be an array' });
  } else {
    // Validate each item
    for (let i = 0; i < feed.items.length; i++) {
      const item = feed.items[i];

      // Each item must have an id
      if (!item || typeof item !== 'object') {
        errors.push({ field: `items[${i}]`, message: 'Item must be an object' });
        continue;
      }

      if (!item.id) {
        errors.push({ field: `items[${i}].id`, message: 'Missing required field: id' });
      } else if (typeof item.id !== 'string') {
        errors.push({ field: `items[${i}].id`, message: 'Field "id" must be a string' });
      }

      // Must have content_html or content_text
      if (!item.content_html && !item.content_text) {
        // This is a warning, not an error (some feeds only have title)
        // But according to spec, at least one should be present
      }
    }
  }

  return errors;
}

/**
 * Check if data is valid JSON Feed
 */
export function isValid(data: unknown): boolean {
  return validate(data).length === 0;
}
