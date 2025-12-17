/**
 * Social profiles extraction.
 *
 * @remarks
 * Extracts social media profile links from HTML documents.
 *
 * @packageDocumentation
 */

import type { HTMLElement } from '../../utils/html-parser.js';
import { getMetaContent } from '../../utils/meta-helpers.js';
import type { SocialProfilesMetadata } from './types.js';

/**
 * Extract social profiles metadata from parsed HTML document.
 *
 * @remarks
 * Extracts social media profile URLs and handles from meta tags and structured data.
 *
 * @param doc - Parsed HTML document
 * @returns Social profiles metadata
 *
 * @example
 * ```typescript
 * const doc = parseHTML(htmlString);
 * const profiles = extractSocialProfiles(doc);
 * console.log(profiles.twitter);
 * console.log(profiles.facebook);
 * ```
 */
export function extractSocialProfiles(doc: HTMLElement): SocialProfilesMetadata {
  const metadata: SocialProfilesMetadata = {};

  // Twitter - extract from multiple sources
  metadata.twitter =
    getMetaContent(doc, 'twitter:site') ||
    getMetaContent(doc, 'twitter:creator') ||
    extractFromProperty(doc, 'twitter:site') ||
    extractFromProperty(doc, 'twitter:creator');

  // Clean Twitter handle (remove @ if present)
  if (metadata.twitter) {
    metadata.twitter = metadata.twitter.replace(/^@/, '');
  }

  // Facebook - from OpenGraph
  metadata.facebook =
    extractFromProperty(doc, 'og:url', 'facebook.com') ||
    extractFromProperty(doc, 'fb:profile_id') ||
    extractFromProperty(doc, 'fb:page_id');

  // Instagram
  metadata.instagram =
    getMetaContent(doc, 'instagram:site') || extractFromProperty(doc, 'instagram:site');

  // LinkedIn
  metadata.linkedin = extractFromProperty(doc, 'linkedin:owner');

  // YouTube
  metadata.youtube =
    getMetaContent(doc, 'youtube:channel') || extractFromProperty(doc, 'youtube:channel');

  // GitHub
  metadata.github = getMetaContent(doc, 'github:user');

  // TikTok
  metadata.tiktok = getMetaContent(doc, 'tiktok:site');

  // Pinterest
  metadata.pinterest = getMetaContent(doc, 'pinterest:profile');

  // Mastodon
  metadata.mastodon = extractFromProperty(doc, 'fediverse:creator');

  // Reddit
  metadata.reddit = getMetaContent(doc, 'reddit:user');

  // Look for Schema.org sameAs links (common for social profiles)
  const schemaProfiles = extractSchemaOrgSameAs(doc);
  if (schemaProfiles.length > 0) {
    for (const url of schemaProfiles) {
      categorizeSchemaProfile(url, metadata);
    }
  }

  // Collect other social profiles
  const otherProfiles: Record<string, string> = {};

  // Look for other common social meta tags
  const socialPatterns = [
    'vk:site', // VKontakte
    'telegram:site', // Telegram
    'snapchat:site', // Snapchat
    'whatsapp:number', // WhatsApp
    'discord:server', // Discord
  ];

  for (const pattern of socialPatterns) {
    const value = getMetaContent(doc, pattern);
    if (value) {
      otherProfiles[pattern] = value;
    }
  }

  // Add other profiles if any found
  if (Object.keys(otherProfiles).length > 0) {
    metadata.other = otherProfiles;
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(metadata).filter(([_, value]) => value !== undefined),
  ) as SocialProfilesMetadata;
}

/**
 * Extract content from meta tag with property attribute.
 *
 * @param doc - Parsed HTML document
 * @param property - Property name to search for
 * @param mustContain - Optional string that the content must contain
 * @returns Meta content or undefined
 */
function extractFromProperty(
  doc: HTMLElement,
  property: string,
  mustContain?: string,
): string | undefined {
  const meta = doc.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    return undefined;
  }

  const content = meta.getAttribute('content');
  if (!content) {
    return undefined;
  }

  if (mustContain && !content.includes(mustContain)) {
    return undefined;
  }

  return content;
}

/**
 * Extract Schema.org sameAs links.
 *
 * @remarks
 * Schema.org often uses sameAs property to list social media profiles.
 *
 * @param doc - Parsed HTML document
 * @returns Array of profile URLs
 */
function extractSchemaOrgSameAs(doc: HTMLElement): string[] {
  const profiles: string[] = [];

  // Look for JSON-LD scripts
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '{}');

      // Handle array or single object
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        // Check for sameAs property
        if (item.sameAs) {
          if (Array.isArray(item.sameAs)) {
            profiles.push(...item.sameAs);
          } else if (typeof item.sameAs === 'string') {
            profiles.push(item.sameAs);
          }
        }

        // Check @graph
        if (item['@graph']) {
          for (const node of item['@graph']) {
            if (node.sameAs) {
              if (Array.isArray(node.sameAs)) {
                profiles.push(...node.sameAs);
              } else if (typeof node.sameAs === 'string') {
                profiles.push(node.sameAs);
              }
            }
          }
        }
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  return profiles;
}

/**
 * Categorize Schema.org profile URL into appropriate social platform.
 *
 * @param url - Profile URL
 * @param metadata - Metadata object to update
 */
function categorizeSchemaProfile(url: string, metadata: SocialProfilesMetadata): void {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    if (!metadata.twitter) {
      // Extract username from URL
      const match = url.match(/(?:twitter\.com|x\.com)\/([^/?]+)/i);
      if (match) {
        metadata.twitter = match[1];
      }
    }
  } else if (lowerUrl.includes('facebook.com')) {
    if (!metadata.facebook) {
      metadata.facebook = url;
    }
  } else if (lowerUrl.includes('instagram.com')) {
    if (!metadata.instagram) {
      const match = url.match(/instagram\.com\/([^/?]+)/i);
      if (match) {
        metadata.instagram = match[1];
      }
    }
  } else if (lowerUrl.includes('linkedin.com')) {
    if (!metadata.linkedin) {
      metadata.linkedin = url;
    }
  } else if (lowerUrl.includes('youtube.com')) {
    if (!metadata.youtube) {
      metadata.youtube = url;
    }
  } else if (lowerUrl.includes('github.com')) {
    if (!metadata.github) {
      const match = url.match(/github\.com\/([^/?]+)/i);
      if (match) {
        metadata.github = match[1];
      }
    }
  } else if (lowerUrl.includes('tiktok.com')) {
    if (!metadata.tiktok) {
      const match = url.match(/tiktok\.com\/@?([^/?]+)/i);
      if (match) {
        metadata.tiktok = match[1];
      }
    }
  } else if (lowerUrl.includes('pinterest.com')) {
    if (!metadata.pinterest) {
      const match = url.match(/pinterest\.com\/([^/?]+)/i);
      if (match) {
        metadata.pinterest = match[1];
      }
    }
  } else if (lowerUrl.includes('reddit.com')) {
    if (!metadata.reddit) {
      const match = url.match(/reddit\.com\/(?:u|user)\/([^/?]+)/i);
      if (match) {
        metadata.reddit = match[1];
      }
    }
  }
}
