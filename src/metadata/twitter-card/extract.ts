/**
 * Twitter Card metadata extraction.
 *
 * @remarks
 * Extracts Twitter Card metadata from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLElement } from '../../utils/html-parser.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { TwitterApp, TwitterCardMetadata, TwitterPlayer } from './types.js';

/**
 * Extract Twitter Card metadata from parsed HTML document.
 *
 * @remarks
 * Extracts Twitter Card metadata including card type, site/creator info,
 * title/description, images, app cards, and player cards.
 *
 * @param doc - Parsed HTML document
 * @returns Twitter Card metadata object
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const twitter = extractTwitterCard(doc);
 * console.log(twitter.card);
 * console.log(twitter.title);
 * ```
 */
export function extractTwitterCard(doc: HTMLElement): TwitterCardMetadata {
  const metadata: TwitterCardMetadata = {};

  // Basic Twitter Card properties
  metadata.card = getMetaContent(doc, 'twitter:card') as TwitterCardMetadata['card'];
  metadata.site = getMetaContent(doc, 'twitter:site');
  metadata.creator = getMetaContent(doc, 'twitter:creator');
  metadata.title = getMetaContent(doc, 'twitter:title');
  metadata.description = getMetaContent(doc, 'twitter:description');
  metadata.image = getMetaContent(doc, 'twitter:image');
  metadata.imageAlt = getMetaContent(doc, 'twitter:image:alt');

  // Extract app card data
  const app = extractApp(doc);
  if (Object.keys(app).length > 0) {
    metadata.app = app;
  }

  // Extract player card data
  const player = extractPlayer(doc);
  if (Object.keys(player).length > 0) {
    metadata.player = player;
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as TwitterCardMetadata;
}

/**
 * Extract app card metadata.
 */
function extractApp(doc: HTMLElement): TwitterApp {
  const app: TwitterApp = {};

  // iPhone
  const iphoneName = getMetaContent(doc, 'twitter:app:name:iphone');
  const iphoneId = getMetaContent(doc, 'twitter:app:id:iphone');
  const iphoneUrl = getMetaContent(doc, 'twitter:app:url:iphone');
  if (iphoneName || iphoneId || iphoneUrl) {
    app.iphone = { name: iphoneName, id: iphoneId, url: iphoneUrl };
    // Clean up undefined values
    app.iphone = Object.fromEntries(
      Object.entries(app.iphone).filter(([_, value]) => value !== undefined),
    ) as typeof app.iphone;
  }

  // iPad
  const ipadName = getMetaContent(doc, 'twitter:app:name:ipad');
  const ipadId = getMetaContent(doc, 'twitter:app:id:ipad');
  const ipadUrl = getMetaContent(doc, 'twitter:app:url:ipad');
  if (ipadName || ipadId || ipadUrl) {
    app.ipad = { name: ipadName, id: ipadId, url: ipadUrl };
    app.ipad = Object.fromEntries(
      Object.entries(app.ipad).filter(([_, value]) => value !== undefined),
    ) as typeof app.ipad;
  }

  // Google Play
  const googleplayName = getMetaContent(doc, 'twitter:app:name:googleplay');
  const googleplayId = getMetaContent(doc, 'twitter:app:id:googleplay');
  const googleplayUrl = getMetaContent(doc, 'twitter:app:url:googleplay');
  if (googleplayName || googleplayId || googleplayUrl) {
    app.googleplay = { name: googleplayName, id: googleplayId, url: googleplayUrl };
    app.googleplay = Object.fromEntries(
      Object.entries(app.googleplay).filter(([_, value]) => value !== undefined),
    ) as typeof app.googleplay;
  }

  return app;
}

/**
 * Extract player card metadata.
 */
function extractPlayer(doc: HTMLElement): TwitterPlayer {
  const player: TwitterPlayer = {};

  player.url = getMetaContent(doc, 'twitter:player');
  player.stream = getMetaContent(doc, 'twitter:player:stream');

  // Parse numeric values
  const width = getMetaContent(doc, 'twitter:player:width');
  if (width) {
    player.width = Number.parseInt(width, 10);
  }

  const height = getMetaContent(doc, 'twitter:player:height');
  if (height) {
    player.height = Number.parseInt(height, 10);
  }

  return Object.fromEntries(
    Object.entries(player).filter(([_, value]) => value !== undefined),
  ) as TwitterPlayer;
}
