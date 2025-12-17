/**
 * Robots and crawling directives extraction module.
 *
 * @remarks
 * Extracts robot crawling and indexing directives from HTML documents.
 *
 * @packageDocumentation
 */

export { extractRobots } from './extract.js';
export { parseDirectives } from './parse-directives.js';
export type { RobotDirectives, RobotsMetadata } from './types.js';
