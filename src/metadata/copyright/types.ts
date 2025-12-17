/**
 * Copyright and licensing types.
 *
 * @remarks
 * Types for copyright and content licensing information.
 *
 * @packageDocumentation
 */

/**
 * Copyright and licensing metadata.
 *
 * @remarks
 * Contains copyright and license information from various sources.
 */
export interface CopyrightMetadata {
  /** Copyright notice */
  copyright?: string;

  /** License URL or identifier */
  license?: string;

  /** Copyright holder/owner */
  holder?: string;

  /** Copyright year */
  year?: string;
}
