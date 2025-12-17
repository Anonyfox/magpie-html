/**
 * Robot directives parsing utilities.
 *
 * @remarks
 * Utilities for parsing robot meta tag content into structured directives.
 *
 * @packageDocumentation
 */

import type { RobotDirectives } from './types.js';

/**
 * Parse robot directives from meta content string.
 *
 * @remarks
 * Parses comma-separated directives like "noindex, nofollow" or "max-snippet:20".
 * Handles both simple flags and key:value pairs.
 *
 * @param content - Meta tag content string
 * @returns Parsed directives object
 *
 * @example
 * ```typescript
 * parseDirectives('noindex, nofollow');
 * // { index: false, follow: false }
 *
 * parseDirectives('max-snippet:150, noarchive');
 * // { maxSnippet: 150, noarchive: true }
 * ```
 */
export function parseDirectives(content?: string): RobotDirectives {
  if (!content) {
    return {};
  }

  const directives: RobotDirectives = {};

  // Split by comma and process each directive
  const parts = content.split(',').map((p) => p.trim().toLowerCase());

  for (const part of parts) {
    if (!part) continue;

    // Check for key:value format
    if (part.includes(':')) {
      const [key, value] = part.split(':').map((s) => s.trim());
      parseKeyValueDirective(key, value, directives);
    } else {
      // Simple flag directive
      parseFlagDirective(part, directives);
    }
  }

  return directives;
}

/**
 * Parse flag-based directive (e.g., "noindex", "nofollow").
 */
function parseFlagDirective(directive: string, result: RobotDirectives): void {
  switch (directive) {
    case 'index':
      result.index = true;
      break;
    case 'noindex':
      result.index = false;
      break;
    case 'follow':
      result.follow = true;
      break;
    case 'nofollow':
      result.follow = false;
      break;
    case 'noarchive':
      result.noarchive = true;
      break;
    case 'nosnippet':
      result.nosnippet = true;
      break;
    case 'noimageindex':
      result.noimageindex = true;
      break;
    case 'notranslate':
      result.notranslate = true;
      break;
    case 'all':
      // "all" means index and follow
      result.index = true;
      result.follow = true;
      break;
    case 'none':
      // "none" means noindex and nofollow
      result.index = false;
      result.follow = false;
      break;
  }
}

/**
 * Parse key:value directive (e.g., "max-snippet:150").
 */
function parseKeyValueDirective(key: string, value: string, result: RobotDirectives): void {
  switch (key) {
    case 'max-snippet':
      // Parse as number, or -1 for unlimited
      if (value === '-1') {
        result.maxSnippet = -1;
      } else {
        const num = Number.parseInt(value, 10);
        if (!Number.isNaN(num)) {
          result.maxSnippet = num;
        }
      }
      break;

    case 'max-image-preview':
      // Values: none, standard, large
      result.maxImagePreview = value;
      break;

    case 'max-video-preview':
      // Parse as number (seconds), or -1 for unlimited
      if (value === '-1') {
        result.maxVideoPreview = -1;
      } else {
        const num = Number.parseInt(value, 10);
        if (!Number.isNaN(num)) {
          result.maxVideoPreview = num;
        }
      }
      break;

    case 'unavailable_after':
      // Date string (RFC 850 format typically)
      result.unavailableAfter = value;
      break;
  }
}
