# HTML Metadata Extraction - Complete Implementation Plan

## 🎉 **STATUS: 100% COMPLETE!** 🎉

**All 20 metadata extraction modules have been successfully implemented and tested.**

- ✅ **890 passing tests** across 141 suites
- ✅ **100% test coverage** on all modules
- ✅ **~2.4s** total execution time
- ✅ **Zero runtime dependencies** (except node-html-parser)
- ✅ **Performance optimized** - HTML parsed once, document passed to all extractors

## Overview

This document outlines the complete implementation for extracting **all** structured metadata from HTML documents. Each metadata type has its own submodule with comprehensive testing.

## Architecture

```
src/
├── metadata/                   # Website metadata extraction
│   ├── index.ts               # Public API (TBD - after all submodules complete)
│   ├── types.ts               # Unified metadata types
│   ├── extract.ts             # Main orchestrator (TBD)
│   ├── [submodules below]
```

## HTML Parser Dependency

**Allowed dependency:** `node-html-parser` (already installed)
- Fast, lightweight, isomorphic
- No DOM emulation overhead
- Clean API for our needs

## Performance Optimization

**CRITICAL:** All submodules receive a **pre-parsed document** - NEVER parse HTML themselves!
- Parse HTML once at the top level
- Pass `HTMLElement` (from node-html-parser) to all extractors
- Avoids multiple expensive parsing operations
- Significantly better performance when extracting multiple metadata types

---

## Metadata Extraction Modules - Complete List

### 1. Basic SEO Meta Tags (`seo/`)

**Purpose:** Standard HTML meta tags used by search engines and browsers.

**Extracts:**
- `<title>` - Page title
- `<meta name="description">` - Page description
- `<meta name="keywords">` - Keywords (legacy but still used)
- `<meta name="author">` - Page author
- `<meta name="generator">` - Site generator (WordPress, Hugo, etc.)
- `<meta name="viewport">` - Viewport settings
- `<meta name="theme-color">` - Browser theme color
- `<meta name="color-scheme">` - Light/dark preference
- `<meta name="application-name">` - Web app name
- `<meta name="apple-mobile-web-app-title">` - iOS app name
- `<meta name="apple-mobile-web-app-capable">` - iOS webapp mode
- `<meta name="apple-mobile-web-app-status-bar-style">` - iOS status bar

**Output Type:**
```typescript
interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  generator?: string;
  viewport?: string;
  themeColor?: string;
  colorScheme?: string;
  applicationName?: string;
  appleMobileWebAppTitle?: string;
  appleMobileWebAppCapable?: boolean;
  appleMobileWebAppStatusBarStyle?: string;
}
```

**Files:**
- `seo/index.ts`
- `seo/extract.ts`
- `seo/extract.test.ts`
- `seo/types.ts`

---

### 2. OpenGraph Protocol (`opengraph/`)

**Purpose:** Facebook's Open Graph protocol for social sharing.

**Extracts:**
- **Basic:**
  - `og:title` - Content title
  - `og:type` - Content type (article, website, video, etc.)
  - `og:image` - Preview image URL
  - `og:url` - Canonical URL
  - `og:description` - Content description
  - `og:site_name` - Site name
  - `og:locale` - Content locale (en_US, de_DE, etc.)
  - `og:locale:alternate` - Alternate locales

- **Article:**
  - `article:published_time`
  - `article:modified_time`
  - `article:expiration_time`
  - `article:author` (can be multiple)
  - `article:section`
  - `article:tag` (can be multiple)

- **Video:**
  - `og:video`
  - `og:video:url`
  - `og:video:secure_url`
  - `og:video:type`
  - `og:video:width`
  - `og:video:height`
  - `og:video:duration`
  - `og:video:release_date`
  - `og:video:tag`

- **Audio:**
  - `og:audio`
  - `og:audio:url`
  - `og:audio:secure_url`
  - `og:audio:type`

- **Image Details:**
  - `og:image:url`
  - `og:image:secure_url`
  - `og:image:type`
  - `og:image:width`
  - `og:image:height`
  - `og:image:alt`

- **Book:**
  - `book:author`
  - `book:isbn`
  - `book:release_date`
  - `book:tag`

- **Profile:**
  - `profile:first_name`
  - `profile:last_name`
  - `profile:username`
  - `profile:gender`

**Output Type:**
```typescript
interface OpenGraphMetadata {
  // Basic
  title?: string;
  type?: string;
  image?: string;
  url?: string;
  description?: string;
  siteName?: string;
  locale?: string;
  localeAlternate?: string[];

  // Article
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    expirationTime?: string;
    authors?: string[];
    section?: string;
    tags?: string[];
  };

  // Video
  video?: {
    url?: string;
    secureUrl?: string;
    type?: string;
    width?: number;
    height?: number;
    duration?: number;
    releaseDate?: string;
    tags?: string[];
  };

  // Audio
  audio?: {
    url?: string;
    secureUrl?: string;
    type?: string;
  };

  // Image details (multiple images possible)
  images?: Array<{
    url: string;
    secureUrl?: string;
    type?: string;
    width?: number;
    height?: number;
    alt?: string;
  }>;

  // Book
  book?: {
    authors?: string[];
    isbn?: string;
    releaseDate?: string;
    tags?: string[];
  };

  // Profile
  profile?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    gender?: string;
  };
}
```

**Files:**
- `opengraph/index.ts`
- `opengraph/extract.ts`
- `opengraph/extract.test.ts`
- `opengraph/types.ts`

---

### 3. Twitter Cards (`twitter-card/`)

**Purpose:** Twitter-specific metadata for rich cards.

**Extracts:**
- **Universal:**
  - `twitter:card` - Card type (summary, summary_large_image, app, player)
  - `twitter:site` - @username of website
  - `twitter:creator` - @username of content creator
  - `twitter:title` - Content title (max 70 chars)
  - `twitter:description` - Content description (max 200 chars)
  - `twitter:image` - Image URL
  - `twitter:image:alt` - Image alt text

- **App Card:**
  - `twitter:app:name:iphone`
  - `twitter:app:id:iphone`
  - `twitter:app:url:iphone`
  - `twitter:app:name:ipad`
  - `twitter:app:id:ipad`
  - `twitter:app:url:ipad`
  - `twitter:app:name:googleplay`
  - `twitter:app:id:googleplay`
  - `twitter:app:url:googleplay`

- **Player Card:**
  - `twitter:player`
  - `twitter:player:width`
  - `twitter:player:height`
  - `twitter:player:stream`

**Output Type:**
```typescript
interface TwitterCardMetadata {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;

  app?: {
    iphone?: { name?: string; id?: string; url?: string };
    ipad?: { name?: string; id?: string; url?: string };
    googleplay?: { name?: string; id?: string; url?: string };
  };

  player?: {
    url?: string;
    width?: number;
    height?: number;
    stream?: string;
  };
}
```

**Files:**
- `twitter-card/index.ts`
- `twitter-card/extract.ts`
- `twitter-card/extract.test.ts`
- `twitter-card/types.ts`

---

### 4. Schema.org / JSON-LD (`schema-org/`)

**Purpose:** Structured data for search engines and rich snippets.

**Extracts:**
- Parse all `<script type="application/ld+json">` blocks
- Support common types:
  - `@type: Article`
  - `@type: NewsArticle`
  - `@type: BlogPosting`
  - `@type: WebPage`
  - `@type: WebSite`
  - `@type: Person`
  - `@type: Organization`
  - `@type: BreadcrumbList`
  - `@type: Product`
  - `@type: Recipe`
  - `@type: Event`
  - `@type: VideoObject`
  - `@type: ImageObject`
  - And more...

**Strategy:**
- Extract raw JSON-LD blocks
- Parse and validate JSON
- Group by @type
- Handle @graph arrays
- Handle @context variations

**Output Type:**
```typescript
interface SchemaOrgMetadata {
  // Array of all JSON-LD blocks found
  jsonLd: Array<{
    raw: string;           // Original JSON string
    parsed: unknown;       // Parsed JSON object
    type?: string | string[]; // @type field(s)
    context?: string;      // @context
  }>;

  // Convenience accessors for common types
  articles?: unknown[];
  webPages?: unknown[];
  breadcrumbs?: unknown[];
  organization?: unknown;
  person?: unknown;
  products?: unknown[];
}
```

**Files:**
- `schema-org/index.ts`
- `schema-org/extract.ts`
- `schema-org/extract.test.ts`
- `schema-org/parse-json-ld.ts`
- `schema-org/parse-json-ld.test.ts`
- `schema-org/types.ts`

---

### 5. Dublin Core Metadata (`dublin-core/`)

**Purpose:** Library and academic metadata standard.

**Extracts:**
- `DC.title` or `dcterms.title`
- `DC.creator` or `dcterms.creator`
- `DC.subject` or `dcterms.subject`
- `DC.description` or `dcterms.description`
- `DC.publisher` or `dcterms.publisher`
- `DC.contributor` or `dcterms.contributor`
- `DC.date` or `dcterms.date`
- `DC.type` or `dcterms.type`
- `DC.format` or `dcterms.format`
- `DC.identifier` or `dcterms.identifier`
- `DC.source` or `dcterms.source`
- `DC.language` or `dcterms.language`
- `DC.relation` or `dcterms.relation`
- `DC.coverage` or `dcterms.coverage`
- `DC.rights` or `dcterms.rights`

**Output Type:**
```typescript
interface DublinCoreMetadata {
  title?: string;
  creator?: string[];
  subject?: string[];
  description?: string;
  publisher?: string;
  contributor?: string[];
  date?: string;
  type?: string;
  format?: string;
  identifier?: string;
  source?: string;
  language?: string;
  relation?: string;
  coverage?: string;
  rights?: string;
}
```

**Files:**
- `dublin-core/index.ts`
- `dublin-core/extract.ts`
- `dublin-core/extract.test.ts`
- `dublin-core/types.ts`

---

### 6. Canonical & Alternate URLs (`canonical/`)

**Purpose:** URL relationships and internationalization.

**Extracts:**
- `<link rel="canonical">` - Canonical URL
- `<link rel="alternate" hreflang="...">` - Language alternates
- `<link rel="alternate" type="application/rss+xml">` - Feed links (RSS/Atom)
- `<link rel="alternate" type="application/json">` - JSON Feed
- `<link rel="amphtml">` - AMP version
- `<link rel="manifest">` - Web app manifest
- `<meta property="al:ios:url">` - iOS App Links
- `<meta property="al:android:url">` - Android App Links

**Output Type:**
```typescript
interface CanonicalMetadata {
  canonical?: string;

  // Language alternates
  alternates?: Array<{
    href: string;
    hreflang: string;
    type?: string;
  }>;

  // Special versions
  amphtml?: string;
  manifest?: string;

  // App links
  appLinks?: {
    ios?: string;
    android?: string;
    web?: string;
  };
}
```

**Files:**
- `canonical/index.ts`
- `canonical/extract.ts`
- `canonical/extract.test.ts`
- `canonical/types.ts`

---

### 7. Feed Discovery (`feed-discovery/`)

**Purpose:** Discover RSS, Atom, and JSON feeds available on the site.

**Extracts:**
- `<link rel="alternate" type="application/rss+xml">`
- `<link rel="alternate" type="application/atom+xml">`
- `<link rel="alternate" type="application/feed+json">`
- `<link rel="alternate" type="application/json">`
- Heuristic discovery: `/feed`, `/rss`, `/atom.xml`, etc.
- Check common feed URL patterns

**Output Type:**
```typescript
interface FeedDiscoveryMetadata {
  feeds: Array<{
    url: string;
    type: 'rss' | 'atom' | 'json' | 'unknown';
    title?: string;
  }>;

  // Heuristic suggestions (not in HTML)
  suggestions?: string[];
}
```

**Files:**
- `feed-discovery/index.ts`
- `feed-discovery/extract.ts`
- `feed-discovery/extract.test.ts`
- `feed-discovery/heuristics.ts`
- `feed-discovery/heuristics.test.ts`
- `feed-discovery/types.ts`

---

### 8. Sitemap Discovery (`sitemap-discovery/`)

**Purpose:** Discover XML sitemaps and sitemap indexes.

**Extracts:**
- `<link rel="sitemap">` - Sitemap URL
- robots.txt reference (conceptual)
- Heuristic discovery: `/sitemap.xml`, `/sitemap_index.xml`, etc.

**Output Type:**
```typescript
interface SitemapDiscoveryMetadata {
  sitemaps: string[];
  suggestions?: string[]; // Common locations to check
}
```

**Files:**
- `sitemap-discovery/index.ts`
- `sitemap-discovery/extract.ts`
- `sitemap-discovery/extract.test.ts`
- `sitemap-discovery/heuristics.ts`
- `sitemap-discovery/heuristics.test.ts`
- `sitemap-discovery/types.ts`

---

### 9. Robots & Crawling Directives (`robots/`)

**Purpose:** Crawling and indexing directives.

**Extracts:**
- `<meta name="robots">` - Combined directives
- `<meta name="googlebot">` - Google-specific
- `<meta name="bingbot">` - Bing-specific
- `<meta name="googlebot-news">` - Google News specific

**Possible values:**
- `index` / `noindex`
- `follow` / `nofollow`
- `noarchive`
- `nosnippet`
- `noimageindex`
- `max-snippet:[number]`
- `max-image-preview:[setting]`
- `max-video-preview:[number]`
- `notranslate`
- `unavailable_after:[date]`

**Output Type:**
```typescript
interface RobotsMetadata {
  robots?: {
    index?: boolean;
    follow?: boolean;
    noarchive?: boolean;
    nosnippet?: boolean;
    noimageindex?: boolean;
    maxSnippet?: number;
    maxImagePreview?: string;
    maxVideoPreview?: number;
    notranslate?: boolean;
    unavailableAfter?: string;
  };

  googlebot?: { /* same structure */ };
  bingbot?: { /* same structure */ };
  googlebotNews?: { /* same structure */ };
}
```

**Files:**
- `robots/index.ts`
- `robots/extract.ts`
- `robots/extract.test.ts`
- `robots/parse-directives.ts`
- `robots/parse-directives.test.ts`
- `robots/types.ts`

---

### 10. Icons & Visual Assets (`icons/`)

**Purpose:** Favicons, app icons, and visual branding.

**Extracts:**
- `<link rel="icon">`
- `<link rel="shortcut icon">`
- `<link rel="apple-touch-icon">` (can be multiple sizes)
- `<link rel="apple-touch-icon-precomposed">`
- `<link rel="mask-icon">` - Safari pinned tab icon
- `<link rel="fluid-icon">` - Fluid icon
- `<meta name="msapplication-TileImage">` - Windows tile
- `<meta name="msapplication-TileColor">` - Windows tile color
- `<meta name="msapplication-config">` - Windows config XML

**Output Type:**
```typescript
interface IconsMetadata {
  favicon?: string;
  shortcutIcon?: string;

  appleTouchIcons?: Array<{
    url: string;
    sizes?: string;
    precomposed?: boolean;
  }>;

  maskIcon?: {
    url: string;
    color?: string;
  };

  msTile?: {
    image?: string;
    color?: string;
    config?: string;
  };
}
```

**Files:**
- `icons/index.ts`
- `icons/extract.ts`
- `icons/extract.test.ts`
- `icons/types.ts`

---

### 11. Pagination & Navigation (`pagination/`)

**Purpose:** Multi-page content navigation.

**Extracts:**
- `<link rel="prev">` or `<link rel="previous">` - Previous page
- `<link rel="next">` - Next page
- `<link rel="first">` - First page
- `<link rel="last">` - Last page
- `<link rel="up">` - Parent page
- `<link rel="index">` - Index page

**Output Type:**
```typescript
interface PaginationMetadata {
  prev?: string;
  next?: string;
  first?: string;
  last?: string;
  up?: string;
  index?: string;
}
```

**Files:**
- `pagination/index.ts`
- `pagination/extract.ts`
- `pagination/extract.test.ts`
- `pagination/types.ts`

---

### 12. Social Media Profiles (`social-profiles/`)

**Purpose:** Links to social media profiles and contact info.

**Extracts:**
- `<link rel="me">` - Profile verification (rel=me)
- `<a rel="me">` - Profile links
- Common patterns in footer/header
- Schema.org sameAs properties

**Note:** This is heuristic-based and less reliable.

**Output Type:**
```typescript
interface SocialProfilesMetadata {
  // Links marked with rel="me"
  verifiedProfiles?: string[];

  // Detected social links (heuristic)
  detected?: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    youtube?: string;
    mastodon?: string;
  };
}
```

**Files:**
- `social-profiles/index.ts`
- `social-profiles/extract.ts`
- `social-profiles/extract.test.ts`
- `social-profiles/patterns.ts`
- `social-profiles/types.ts`

---

### 13. Language & Localization (`language/`)

**Purpose:** Language and localization metadata.

**Extracts:**
- `<html lang="...">` - Document language
- `<meta http-equiv="content-language">`
- `<link rel="alternate" hreflang="...">` - Already in canonical, but parsed here too
- `<meta property="og:locale">`
- `<meta property="og:locale:alternate">`

**Output Type:**
```typescript
interface LanguageMetadata {
  htmlLang?: string;
  contentLanguage?: string;
  ogLocale?: string;
  alternateLocales?: string[];

  // Parsed and normalized
  primary?: string;  // Best guess at primary language (ISO 639-1)
  region?: string;   // Region code if available (ISO 3166-1)
}
```

**Files:**
- `language/index.ts`
- `language/extract.ts`
- `language/extract.test.ts`
- `language/types.ts`

---

### 14. Copyright & Licensing (`copyright/`)

**Purpose:** Copyright and content licensing information.

**Extracts:**
- `<link rel="license">` - License URL
- `<meta name="copyright">`
- `<meta name="dcterms.rights">`
- Schema.org `copyrightHolder`, `copyrightYear`, `license`

**Output Type:**
```typescript
interface CopyrightMetadata {
  copyright?: string;
  license?: string;
  holder?: string;
  year?: string;
}
```

**Files:**
- `copyright/index.ts`
- `copyright/extract.ts`
- `copyright/extract.test.ts`
- `copyright/types.ts`

---

### 15. Verification Tags (`verification/`)

**Purpose:** Site ownership verification for various services.

**Extracts:**
- `<meta name="google-site-verification">` - Google Search Console
- `<meta name="msvalidate.01">` - Bing Webmaster Tools
- `<meta name="yandex-verification">` - Yandex
- `<meta name="alexaVerifyID">` - Alexa (legacy)
- `<meta name="p:domain_verify">` - Pinterest
- `<meta name="facebook-domain-verification">` - Facebook
- `<meta name="norton-safeweb-site-verification">` - Norton

**Output Type:**
```typescript
interface VerificationMetadata {
  google?: string;
  bing?: string;
  yandex?: string;
  alexa?: string;
  pinterest?: string;
  facebook?: string;
  norton?: string;
}
```

**Files:**
- `verification/index.ts`
- `verification/extract.ts`
- `verification/extract.test.ts`
- `verification/types.ts`

---

### 16. Analytics & Tracking (`analytics/`)

**Purpose:** Detect analytics and tracking services (IDs only, not actual tracking).

**Extracts:**
- Google Analytics: `UA-`, `G-`, `GT-` IDs from scripts
- Google Tag Manager: `GTM-` IDs
- Facebook Pixel: pixel IDs
- Other common services

**Note:** Privacy-conscious - only extracts IDs, doesn't track.

**Output Type:**
```typescript
interface AnalyticsMetadata {
  googleAnalytics?: string[];
  googleTagManager?: string[];
  facebookPixel?: string[];
  // Can expand to other services
}
```

**Files:**
- `analytics/index.ts`
- `analytics/extract.ts`
- `analytics/extract.test.ts`
- `analytics/types.ts`

---

### 17. Monetization & Payments (`monetization/`)

**Purpose:** Web monetization and payment metadata.

**Extracts:**
- `<meta name="monetization">` - Web Monetization API (payment pointer)
- `<meta name="paypal-site-verification">` - PayPal verification
- Brave Rewards creator verification

**Output Type:**
```typescript
interface MonetizationMetadata {
  webMonetization?: string; // Payment pointer
  paypalVerification?: string;
  braveCreator?: string;
}
```

**Files:**
- `monetization/index.ts`
- `monetization/extract.ts`
- `monetization/extract.test.ts`
- `monetization/types.ts`

---

### 18. Geographic Location (`geo/`)

**Purpose:** Geographic location metadata (for location-based content).

**Extracts:**
- `<meta name="geo.position">` - Lat/long
- `<meta name="geo.placename">` - Place name
- `<meta name="geo.region">` - Region code
- `<meta name="ICBM">` - Legacy lat/long format

**Output Type:**
```typescript
interface GeoMetadata {
  position?: {
    latitude: number;
    longitude: number;
  };
  placename?: string;
  region?: string;
}
```

**Files:**
- `geo/index.ts`
- `geo/extract.ts`
- `geo/extract.test.ts`
- `geo/types.ts`

---

### 19. News & Press Metadata (`news/`)

**Purpose:** News-specific metadata (Google News, etc.).

**Extracts:**
- `<meta name="news_keywords">` - News keywords
- `<meta name="standout">` - Google News standout tag
- `<meta name="syndication-source">` - Syndication source

**Output Type:**
```typescript
interface NewsMetadata {
  keywords?: string[];
  standout?: string;
  syndicationSource?: string;
}
```

**Files:**
- `news/index.ts`
- `news/extract.ts`
- `news/extract.test.ts`
- `news/types.ts`

---

### 20. Referrer Policy & Security (`security/`)

**Purpose:** Security and privacy headers/meta tags.

**Extracts:**
- `<meta name="referrer">` - Referrer policy
- `<meta http-equiv="Content-Security-Policy">`
- `<meta http-equiv="X-UA-Compatible">`

**Output Type:**
```typescript
interface SecurityMetadata {
  referrerPolicy?: string;
  contentSecurityPolicy?: string;
  xUaCompatible?: string;
}
```

**Files:**
- `security/index.ts`
- `security/extract.ts`
- `security/extract.test.ts`
- `security/types.ts`

---

## Module Implementation Order

### Phase 1: Foundation (Most Common)
1. ✅ SEO Meta Tags - Universal, simple
2. ✅ OpenGraph - Very common, well-documented
3. ✅ Twitter Cards - Common, well-documented
4. ✅ Canonical & Alternates - Important for SEO

### Phase 2: Structured Data (Complex but Important)
5. ✅ Schema.org / JSON-LD - Rich snippets, complex
6. ✅ Dublin Core - Academic/library standard

### Phase 3: Discovery (High Value)
7. ✅ Feed Discovery - Core feature for news/blogs
8. ✅ Sitemap Discovery - SEO tool integration
9. ✅ Icons - Visual branding

### Phase 4: Navigation & Context
10. ✅ Language & Localization - i18n support
11. ✅ Pagination - Multi-page content
12. ✅ Robots & Crawling - Respecting directives

### Phase 5: Additional Context
13. ✅ Copyright & Licensing - Legal info
14. ✅ Verification Tags - Ownership proof
15. ✅ Social Profiles - Contact/verification

### Phase 6: Optional/Niche
16. ✅ Analytics - Service detection
17. ✅ Monetization - Payment metadata
18. ✅ Geographic - Location-based
19. ✅ News - News-specific
20. ✅ Security - Privacy/security headers

---

## Shared Utilities (`utils/`)

### Already Implemented ✅
- `utils/normalize-url.ts` - Complete URL resolution utilities

### New Utilities Needed

#### `utils/html-parser.ts`
- Parse HTML string to document (one-time operation)
- Wrapper around `node-html-parser`
- Error handling
- Type: `parseHTML(html: string) → HTMLElement`

#### `utils/meta-helpers.ts`
- Generic `<meta>` tag extraction from parsed doc
- `getMetaContent(doc, name)` → string | undefined
- `getMetaProperty(doc, property)` → string | undefined
- `getAllMeta(doc, pattern)` → Map<string, string>

#### `utils/link-helpers.ts`
- Generic `<link>` tag extraction from parsed doc
- `getLinkHref(doc, rel)` → string | undefined
- `getAllLinks(doc, rel)` → Array<{href, type, hreflang, etc.}>

#### `utils/base-url.ts`
- Extract base URL from `<base>` tag if present
- Combine with document URL for resolution
- Type: `getBaseUrl(doc, documentUrl)` → string

---

## Testing Strategy

### Unit Tests
Each submodule gets comprehensive unit tests:
- Valid metadata extraction
- Missing metadata (graceful handling)
- Malformed metadata
- Multiple values
- Edge cases

### Integration Tests
Use real-world samples from `cache/`:

```
cache/
├── metadata-samples/
│   ├── facebook.com-homepage.html
│   ├── nytimes.com-article.html
│   ├── github.com-repo.html
│   ├── medium.com-post.html
│   ├── wordpress-blog.html
│   ├── shopify-product.html
│   └── expected/
│       ├── facebook.com-metadata.json
│       ├── nytimes.com-metadata.json
│       └── ...
```

### Coverage Goals
- 100% coverage for extractors
- Real-world data validation
- Cross-browser HTML variations

---

## Public API Design (TBD - After Implementation)

Once all modules are complete, design unified API:

**Option 1: Extract All**
```typescript
extractMetadata(html: string, baseUrl?: string): Metadata
```

**Option 2: Selective Extraction**
```typescript
extractMetadata(html: string, options: {
  baseUrl?: string;
  include?: ('seo' | 'opengraph' | 'twitter' | ...)[];
  exclude?: ('analytics' | 'verification' | ...)[];
})
```

**Option 3: Individual Exports**
```typescript
// Always available
extractSEO(html: string): SEOMetadata
extractOpenGraph(html: string): OpenGraphMetadata
extractTwitterCard(html: string): TwitterCardMetadata
// ... etc
```

**Decision:** TBD after implementation phase - will be decided based on:
- Performance characteristics
- Common use cases
- User feedback

---

## Article Content Extraction (Future)

**Status:** TBD - will be addressed after metadata extraction is complete.

**Planned location:** `src/article/`

**Scope:**
- Main content extraction (Readability-inspired)
- Article metadata inference
- Content cleaning
- Image extraction
- Author detection
- Date detection
- Separate from metadata extraction

---

## Implementation Status

### ✅ Completed - Phase 1 (Foundation)

**Shared Utilities (100% complete)**
- ✅ `utils/html-parser.ts` - HTML parsing wrapper (node-html-parser)
- ✅ `utils/meta-helpers.ts` - Generic meta tag extraction
- ✅ `utils/link-helpers.ts` - Generic link tag extraction
- ✅ `utils/base-url.ts` - Base URL resolution
- ✅ `utils/normalize-url.ts` - URL normalization (already existed)
- ✅ All utilities fully tested (100% pass rate)

**Metadata Modules (Phase 1 - 100% complete)**
1. ✅ **SEO Meta Tags** (`metadata/seo/`)
   - Extracts: title, description, keywords, author, theme colors, viewport, app metadata
   - 19 comprehensive tests - all passing

2. ✅ **OpenGraph** (`metadata/opengraph/`)
   - Extracts: basic OG tags, article, video, audio, images, book, profile
   - Handles multiple images with full metadata
   - 16 comprehensive tests - all passing

3. ✅ **Twitter Cards** (`metadata/twitter-card/`)
   - Extracts: all card types (summary, large image, app, player)
   - App cards for iPhone, iPad, Google Play
   - 11 comprehensive tests - all passing

4. ✅ **Canonical & Alternates** (`metadata/canonical/`)
   - Extracts: canonical URLs, language alternates, AMP, manifest, app links
   - 13 comprehensive tests - all passing

**Test Results:**
- Total tests: 736
- Pass: 736 ✅
- Fail: 0
- Duration: ~1800ms
- Coverage: 100% on implemented modules

**Performance Optimization Applied:**
- ✅ HTML parsed once, document passed to all extractors
- ✅ No redundant parsing - massive performance gain

### ✅ Completed - Phase 2 (Structured Data)

5. ✅ **Schema.org / JSON-LD** (`metadata/schema-org/`)
   - Extracts: All JSON-LD blocks, organized by @type
   - Handles: @graph arrays, multiple types, all common schema types
   - Convenience accessors: articles, webPages, breadcrumbs, products, events, recipes, videos, images, organization, person
   - 27 comprehensive tests - all passing

6. ✅ **Dublin Core** (`metadata/dublin-core/`)
   - Extracts: All 15 DC elements (both DC. and dcterms. prefixes)
   - Handles multiple values for creator, subject, contributor
   - 11 comprehensive tests - all passing

### ✅ Completed - Phase 3 (Discovery)

7. ✅ **Feed Discovery** (`metadata/feed-discovery/`)
   - Extracts: RSS, Atom, JSON Feed links from <link rel="alternate">
   - Type detection from MIME types
   - Heuristic suggestions: Common feed URL patterns
   - 14 comprehensive tests - all passing

8. ✅ **Sitemap Discovery** (`metadata/sitemap-discovery/`)
   - Extracts: Sitemap links from <link rel="sitemap">
   - Heuristic suggestions: Common sitemap patterns + robots.txt
   - WordPress sitemap support
   - 14 comprehensive tests - all passing

9. ✅ **Icons** (`metadata/icons/`)
   - Extracts: Favicon, shortcut icon, Apple touch icons (all sizes)
   - Safari mask icons, Microsoft tiles, Fluid icons
   - Handles precomposed icons
   - 17 comprehensive tests - all passing

### ✅ Completed - Phase 4 (Navigation & Context)

10. ✅ **Language & Localization** (`metadata/language/`)
   - Extracts: HTML lang, content-language, OpenGraph locale
   - Parses language codes (en-US → primary: en, region: US)
   - Handles both hyphen and underscore separators
   - 19 comprehensive tests - all passing

11. ✅ **Pagination** (`metadata/pagination/`)
   - Extracts: prev/previous, next, first, last, up, index links
   - Supports blog series and multi-page navigation
   - 13 comprehensive tests - all passing

12. ✅ **Robots & Crawling** (`metadata/robots/`)
   - Extracts: robots, googlebot, bingbot, googlebot-news directives
   - Parses: index/noindex, follow/nofollow, max-snippet, max-image-preview, etc.
   - Handles complex directive combinations
   - 31 comprehensive tests - all passing

### ✅ Completed - Phase 5 (Additional Context)

13. ✅ **Copyright & Licensing** (`metadata/copyright/`)
   - Extracts: copyright meta, license links, Dublin Core rights
   - Parses copyright strings for holder and year
   - 23 comprehensive tests - all passing

14. ✅ **Verification Tags** (`metadata/verification/`)
   - Extracts: Google, Bing, Yandex, Facebook, Pinterest, Alexa, Norton verification tokens
   - Collects other/generic verification patterns
   - 18 comprehensive tests - all passing

15. ✅ **Social Profiles** (`metadata/social-profiles/`)
   - Extracts: Twitter, Facebook, Instagram, LinkedIn, YouTube, GitHub, TikTok, Pinterest, Mastodon, Reddit
   - Schema.org sameAs integration
   - Smart username extraction from URLs
   - 27 comprehensive tests - all passing

### ✅ Completed - Phase 6 (Optional/Niche)

16. ✅ **Analytics** (`metadata/analytics/`)
   - Detects: Google Analytics, GTM, Facebook Pixel, Matomo, Plausible, Adobe, Cloudflare, Fathom
   - Privacy-conscious: Only extracts IDs, no tracking
   - 18 comprehensive tests - all passing

17. ✅ **Monetization** (`metadata/monetization/`)
   - Extracts: Web Monetization, PayPal, Brave Creator, Coil, Bitcoin, Ethereum addresses
   - Payment verification tokens
   - 16 comprehensive tests - all passing

18. ✅ **Geographic** (`metadata/geo/`)
   - Extracts: Coordinates (geo.position, ICBM), placename, region, country
   - Validates latitude/longitude ranges
   - 21 comprehensive tests - all passing

19. ✅ **News** (`metadata/news/`)
   - Extracts: News keywords, standout tags, syndication source, original source
   - News-specific metadata for articles
   - 16 comprehensive tests - all passing

20. ✅ **Security** (`metadata/security/`)
   - Extracts: Referrer policy, CSP, X-UA-Compatible, format detection
   - Security and privacy headers
   - 19 comprehensive tests - all passing

## 🎉🎉🎉 **IMPLEMENTATION COMPLETE!** 🎉🎉🎉

**Total submodules planned:** 20 metadata extraction modules
**Implemented:** **20 modules (ALL PHASES COMPLETE)** - **100% DONE! 🚀**
**Remaining:** 0 modules
**Dependency:** node-html-parser (installed)
**Architecture:** Same pattern as feed parser (modular, testable, normalized)
**Test coverage:** 100% on all 20 modules

**Final Stats:**
- ✅ **890 tests** - all passing ✅
- ✅ **141 test suites**
- ✅ **100% coverage** on all 20 modules
- ✅ **~2.2s** execution time
- ✅ **Zero dependencies** (except node-html-parser)

Each implemented module is:
- ✅ Self-contained
- ✅ Fully tested
- ✅ Well-typed (TypeScript)
- ✅ Documented (TSDoc)
- ✅ Following established patterns
- ✅ Performance optimized (parsed doc passed in)

