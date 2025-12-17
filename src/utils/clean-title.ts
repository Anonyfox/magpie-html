/**
 * Title cleaning utilities.
 *
 * @remarks
 * Utilities for cleaning page titles by removing brand names and other noise.
 *
 * @packageDocumentation
 */

/**
 * Common title separators used between content title and brand name.
 */
const TITLE_SEPARATORS = [
  '|',
  '-',
  '·',
  '•',
  ':',
  '—', // em dash
  '–', // en dash
  '›',
  '»',
  '//',
];

/**
 * Clean a page title by removing brand names and separators.
 *
 * @remarks
 * Many websites use patterns like "Page Title | Brand Name" or "Article - Site Name".
 * This function applies heuristics to detect and remove the brand portion:
 *
 * 1. Splits on common separators (|, -, ·, :, etc.)
 * 2. Identifies brand by length (usually shorter)
 * 3. Detects domain-like patterns (contains dots)
 * 4. Returns the more meaningful content title
 *
 * If no clear brand pattern is detected, returns the original title.
 *
 * @param title - Raw page title string
 * @returns Cleaned title without brand suffix/prefix
 *
 * @example
 * ```typescript
 * cleanTitle('Breaking News | CNN');           // 'Breaking News'
 * cleanTitle('GitHub - Where the world builds software'); // 'Where the world builds software'
 * cleanTitle('Article Title · example.com');   // 'Article Title'
 * cleanTitle('Simple Title');                  // 'Simple Title' (no change)
 * ```
 */
export function cleanTitle(title: string): string {
  if (!title?.trim()) {
    return title;
  }

  const trimmed = title.trim();

  // Try each separator
  for (const separator of TITLE_SEPARATORS) {
    if (!trimmed.includes(separator)) {
      continue;
    }

    // Detect spacing pattern around separator (check first occurrence)
    const sepIndex = trimmed.indexOf(separator);
    const hasSpaceBefore = sepIndex > 0 && trimmed[sepIndex - 1] === ' ';
    const hasSpaceAfter = sepIndex < trimmed.length - 1 && trimmed[sepIndex + 1] === ' ';

    // Build join string that preserves original spacing
    let joinStr = separator;
    if (hasSpaceBefore) joinStr = ` ${joinStr}`;
    if (hasSpaceAfter) joinStr = `${joinStr} `;

    // Split by separator and clean up parts
    const parts = trimmed
      .split(separator)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    // If only one part after split, continue to next separator
    if (parts.length < 2) {
      continue;
    }

    // For exactly 2 parts, try to identify brand
    // Common patterns: "Title | Brand" or "Brand | Title"
    if (parts.length === 2) {
      const [first, second] = parts;
      const brandIndex = identifyBrandIndex([first, second]);

      // Return the non-brand part
      return brandIndex === 0 ? second : first;
    }

    // For 3+ parts, heuristic: brand is usually first or last
    // Keep the middle/longer parts
    const firstIsBrand = isBrand(parts[0], parts.slice(1));
    const lastIsBrand = isBrand(parts[parts.length - 1], parts.slice(0, -1));

    if (firstIsBrand && !lastIsBrand) {
      return parts.slice(1).join(joinStr);
    }
    if (lastIsBrand && !firstIsBrand) {
      return parts.slice(0, -1).join(joinStr);
    }

    // If both or neither seem like brand, return original (no brand detected)
    return trimmed;
  }

  // No brand pattern detected, return original
  return trimmed;
}

/**
 * Identify which part is likely the brand (0 or 1).
 *
 * @param parts - Array of exactly 2 title parts
 * @returns Index of the brand part (0 or 1)
 */
function identifyBrandIndex(parts: [string, string]): 0 | 1 {
  const [first, second] = parts;

  // Check for domain-like pattern (contains dots)
  const firstHasDots = /\w+\.\w+/.test(first);
  const secondHasDots = /\w+\.\w+/.test(second);

  if (firstHasDots && !secondHasDots) {
    return 0; // First is brand (domain)
  }
  if (secondHasDots && !firstHasDots) {
    return 1; // Second is brand (domain)
  }

  // Check for all-caps pattern (often brands/sites)
  const firstAllCaps = first === first.toUpperCase() && /[A-Z]/.test(first);
  const secondAllCaps = second === second.toUpperCase() && /[A-Z]/.test(second);

  if (firstAllCaps && !secondAllCaps && first.length < 20) {
    return 0; // First is brand (short all-caps)
  }
  if (secondAllCaps && !firstAllCaps && second.length < 20) {
    return 1; // Second is brand (short all-caps)
  }

  // Default: shorter part is likely the brand
  return first.length < second.length ? 0 : 1;
}

/**
 * Check if a part is likely a brand name.
 *
 * @param candidate - Potential brand string
 * @param others - Other parts to compare against
 * @returns True if candidate is likely a brand
 */
function isBrand(candidate: string, others: string[]): boolean {
  // Domain-like pattern
  if (/\w+\.\w+/.test(candidate)) {
    return true;
  }

  // Very short compared to others
  const avgLength = others.reduce((sum, s) => sum + s.length, 0) / others.length;
  if (candidate.length < avgLength * 0.5 && candidate.length < 30) {
    return true;
  }

  // All caps and short
  if (candidate === candidate.toUpperCase() && /[A-Z]/.test(candidate) && candidate.length < 20) {
    return true;
  }

  return false;
}
