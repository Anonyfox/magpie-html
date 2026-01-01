# Magpie HTML 🦅

[![npm version](https://img.shields.io/npm/v/magpie-html.svg?style=flat-square)](https://www.npmjs.com/package/magpie-html)
[![npm downloads](https://img.shields.io/npm/dm/magpie-html.svg?style=flat-square)](https://www.npmjs.com/package/magpie-html)
[![CI](https://img.shields.io/github/actions/workflow/status/Anonyfox/magpie-html/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/Anonyfox/magpie-html/actions/workflows/ci.yml)
[![Documentation](https://img.shields.io/badge/docs-live-brightgreen?style=flat-square)](https://anonyfox.github.io/magpie-html)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-CrispRead-eb6864?style=flat-square&logo=rss&logoColor=white)](https://crispread.com)

**Modern web scraping for when you need the good parts, not the markup soup.** Extracts clean article content, parses feeds (RSS, Atom, JSON), and gathers metadata from any page. Handles broken encodings, malformed feeds, and the chaos of real-world HTML. TypeScript-native, works everywhere. Named after the bird known for collecting valuable things... you get the idea.

<div align="center">
  <img src="https://raw.githubusercontent.com/Anonyfox/magpie-html/main/assets/magpie-html-logo.png" alt="Magpie HTML Logo" width="300">

<br><br>
<strong>Production-ready</strong> · Powers <a href="https://crispread.com">CrispRead</a>, a trilingual news aggregator processing thousands of articles daily.

</div>

## Features

- 🎯 **Isomorphic** - Works in Node.js and browsers
- 📦 **Modern ESM/CJS** - Dual format support
- 🔒 **Type-safe** - Full TypeScript support
- 🧪 **Well-tested** - Built with Node.js native test runner
- 🚀 **Minimal dependencies** - Lightweight and fast
- 🔄 **Multi-Format Feed Parser** - Parse RSS 2.0, Atom 1.0, and JSON Feed
- 🔗 **Smart URL Resolution** - Automatic normalization to absolute URLs
- 🛡️ **Error Resilient** - Graceful handling of malformed data
- 🦅 **High-Level Convenience** - One-line functions for common tasks

## Installation

```bash
npm install magpie-html
```

## Quick Start

```typescript
import { gatherWebsite, gatherArticle, gatherFeed } from "magpie-html";

// Gather complete website metadata
const site = await gatherWebsite("https://example.com");
console.log(site.title); // Page title
console.log(site.description); // Meta description
console.log(site.image); // Featured image
console.log(site.feeds); // Discovered feeds
console.log(site.internalLinks); // Internal links

// Gather article content + metadata
const article = await gatherArticle("https://example.com/article");
console.log(article.title); // Article title
console.log(article.content); // Clean article text
console.log(article.wordCount); // Word count
console.log(article.readingTime); // Reading time in minutes

// Gather feed data
const feed = await gatherFeed("https://example.com/feed.xml");
console.log(feed.title); // Feed title
console.log(feed.items); // Feed items
```

## Usage

### Gathering Websites

Extract comprehensive metadata from any webpage:

```typescript
import { gatherWebsite } from "magpie-html";

const site = await gatherWebsite("https://example.com");

// Basic metadata
console.log(site.url); // Final URL (after redirects)
console.log(site.title); // Best title (cleaned)
console.log(site.description); // Meta description
console.log(site.image); // Featured image URL
console.log(site.icon); // Site favicon/icon

// Language & region
console.log(site.language); // ISO 639-1 code (e.g., 'en')
console.log(site.region); // ISO 3166-1 alpha-2 (e.g., 'US')

// Discovered content
console.log(site.feeds); // Array of feed URLs
console.log(site.internalLinks); // Internal links (same domain)
console.log(site.externalLinks); // External links (other domains)

// Raw content
console.log(site.html); // Raw HTML
console.log(site.text); // Plain text (full page)
```

**What it does:**

- Fetches the page with automatic redirect handling
- Extracts metadata from multiple sources (OpenGraph, Schema.org, Twitter Card, etc.)
- Picks the "best" value for each field (longest, highest priority, cleaned)
- Discovers RSS/Atom/JSON feeds linked on the page
- Categorizes internal vs external links
- Returns normalized, absolute URLs

### Gathering Articles

Extract clean article content with metadata:

```typescript
import { gatherArticle } from "magpie-html";

const article = await gatherArticle("https://example.com/article");

// Core content
console.log(article.url); // Final URL
console.log(article.title); // Article title (Readability or metadata)
console.log(article.content); // Clean article text (formatted)
console.log(article.description); // Excerpt/summary

// Metrics
console.log(article.wordCount); // Word count
console.log(article.readingTime); // Est. reading time (minutes)

// Media & language
console.log(article.image); // Article image
console.log(article.language); // Language code
console.log(article.region); // Region code

// Links & raw content
console.log(article.internalLinks); // Internal links
console.log(article.externalLinks); // External links (citations)
console.log(article.html); // Raw HTML
console.log(article.text); // Plain text (full page)
```

**What it does:**

- Uses Mozilla Readability to extract clean article content
- Falls back to metadata extraction if Readability fails
- Converts cleaned HTML to well-formatted plain text
- Calculates reading metrics (word count, reading time)
- Provides both cleaned content and raw HTML

### Gathering Feeds

Parse any feed format with one function:

```typescript
import { gatherFeed } from "magpie-html";

const feed = await gatherFeed("https://example.com/feed.xml");

// Feed metadata
console.log(feed.title); // Feed title
console.log(feed.description); // Feed description
console.log(feed.url); // Feed URL
console.log(feed.siteUrl); // Website URL

// Feed items
for (const item of feed.items) {
  console.log(item.title); // Item title
  console.log(item.url); // Item URL (absolute)
  console.log(item.description); // Item description
  console.log(item.publishedAt); // Publication date
  console.log(item.author); // Author
}

// Format detection
console.log(feed.format); // 'rss', 'atom', or 'json-feed'
```

**What it does:**

- Auto-detects feed format (RSS 2.0, Atom 1.0, JSON Feed)
- Normalizes all formats to a unified interface
- Resolves relative URLs to absolute
- Handles malformed data gracefully

## Advanced Usage

For more control, use the lower-level modules directly:

### Feed Parsing

```typescript
import { pluck, parseFeed } from "magpie-html";

// Fetch feed content
const response = await pluck("https://example.com/feed.xml");
const feedContent = await response.textUtf8();

// Parse with base URL for relative links
const result = parseFeed(feedContent, response.finalUrl);

console.log(result.feed.title);
console.log(result.feed.items[0].title);
console.log(result.feed.format); // 'rss', 'atom', or 'json-feed'
```

### Content Extraction

```typescript
import { parseHTML, extractContent, htmlToText } from "magpie-html";

// Parse HTML once
const doc = parseHTML(html);

// Extract article with Readability
const result = extractContent(doc, {
  baseUrl: "https://example.com/article",
  cleanConditionally: true,
  keepClasses: false,
});

if (result.success) {
  console.log(result.title); // Article title
  console.log(result.excerpt); // Article excerpt
  console.log(result.content); // Clean HTML
  console.log(result.textContent); // Plain text
  console.log(result.wordCount); // Word count
  console.log(result.readingTime); // Reading time
}

// Or convert any HTML to text
const plainText = htmlToText(html, {
  preserveWhitespace: false,
  includeLinks: true,
  wrapColumn: 80,
});
```

### Metadata Extraction

```typescript
import {
  parseHTML,
  extractOpenGraph,
  extractSchemaOrg,
  extractSEO,
} from "magpie-html";

const doc = parseHTML(html);

// Extract OpenGraph metadata
const og = extractOpenGraph(doc);
console.log(og.title);
console.log(og.description);
console.log(og.image);

// Extract Schema.org data
const schema = extractSchemaOrg(doc);
console.log(schema.articles); // NewsArticle, etc.

// Extract SEO metadata
const seo = extractSEO(doc);
console.log(seo.title);
console.log(seo.description);
console.log(seo.keywords);
```

**Available extractors:**

- `extractSEO` - SEO meta tags
- `extractOpenGraph` - OpenGraph metadata
- `extractTwitterCard` - Twitter Card metadata
- `extractSchemaOrg` - Schema.org / JSON-LD
- `extractCanonical` - Canonical URLs
- `extractLanguage` - Language detection
- `extractIcons` - Favicon and icons
- `extractAssets` - All linked assets (images, scripts, fonts, etc.)
- `extractLinks` - Navigation links (with internal/external split)
- `extractFeedDiscovery` - Discover RSS/Atom/JSON feeds
- ...and more

### Enhanced Fetching

Use `pluck()` for robust fetching with automatic encoding and redirect handling:

```typescript
import { pluck } from "magpie-html";

const response = await pluck("https://example.com", {
  timeout: 30000, // 30 second timeout
  maxRedirects: 10, // Follow up to 10 redirects
  maxSize: 10485760, // 10MB limit
  userAgent: "MyBot/1.0",
  throwOnHttpError: true,
  strictContentType: false,
});

// Enhanced response properties
console.log(response.finalUrl); // URL after redirects
console.log(response.redirectChain); // All redirect URLs
console.log(response.detectedEncoding); // Detected charset
console.log(response.timing); // Request timing

// Get UTF-8 decoded content
const text = await response.textUtf8();
```

**Why `pluck()`?**

- Handles broken sites with wrong/missing encoding declarations
- Follows redirect chains and tracks them
- Enforces timeouts and size limits
- Compatible with standard `fetch()` API
- Named `pluck()` to avoid confusion (magpies pluck things! 🦅)

## Experimental: `swoop()` (client-side DOM rendering without a browser engine)

> **⚠️ SECURITY WARNING — Remote Code Execution (RCE)**
>
> `swoop()` **executes remote, third‑party JavaScript inside your current Node.js process** (via `node:vm` + browser shims).
> This is **fundamentally insecure**. Only use `swoop()` on **fully trusted targets** and treat inputs as **hostile by default**.
> For any professional/untrusted scraping, run this in a **real sandbox** (container/VM/locked-down OS user + seccomp/apparmor/firejail, etc.).

> **Note:** `magpie-html` does **not** use `swoop()` internally. It’s provided as an **optional standalone utility** for the few cases where you really need DOM-only client-side rendering.

`swoop()` is an **explicitly experimental** helper that tries to execute client-side scripts against a **DOM-only** environment and then returns a **best-effort HTML snapshot**.

### Why this exists

Sometimes `curl` / `fetch` / `pluck()` isn’t enough because the page is a SPA and only renders content after client-side JavaScript runs.
`swoop()` exists to **quickly turn “CSR-only” pages into HTML** so the rest of `magpie-html` can work with the result.

If it works, it can be **comparably light and fast** because it avoids a full browser engine by using a custom `node:vm`-based execution environment with browser shims.

For very complicated targets (heavy JS, complex navigation, strong anti-bot, layout-dependent rendering), you should use a **real browser engine** instead.

`swoop()` is best seen as a **building block**—you still need to provide the **real sandboxing** around it.

### What it is

- A pragmatic “SPA snapshotter” for cases where a page renders content via client-side JavaScript.
- **No browser engine**: no layout/paint/CSS correctness.

### What it is NOT

- Not a headless browser replacement (no navigation lifecycle, no reliable layout APIs).

### Usage

```typescript
import { swoop } from "magpie-html";

const result = await swoop("https://example.com/spa", {
  waitStrategy: "networkidle",
  timeout: 3000,
});

console.log(result.html);
console.log(result.errors);
```

## Performance Tips

**Best Practice:** Parse HTML once and reuse the document:

```typescript
import {
  parseHTML,
  extractSEO,
  extractOpenGraph,
  extractContent,
} from "magpie-html";

const doc = parseHTML(html);

// Reuse the same document for multiple extractions
const seo = extractSEO(doc); // Fast: <5ms
const og = extractOpenGraph(doc); // Fast: <5ms
const content = extractContent(doc); // ~100-500ms

// Total: One parse + all extractions
```

## Development

### Setup

```bash
npm install
```

### Run Tests

```bash
npm test
```

The test suite includes both unit tests (`*.test.ts`) and integration tests using real-world HTML/feed files from `cache/`.

### Watch Mode

```bash
npm run test:watch
```

### Build

```bash
npm run build
```

### Linting & Formatting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format

# Run all checks (typecheck + lint)
npm run check
```

### Type Check

```bash
npm run typecheck
```

### Documentation

Generate API documentation:

```bash
npm run docs
npm run docs:serve
```

## Integration Testing

The `cache/` directory contains real-world HTML and feed samples for integration testing. This enables testing against actual production data without network calls.

## Publishing

```bash
npm publish
```

The `prepublishOnly` script automatically builds the package before publishing.

---

<div align="center">

### Support

If this package helps your project, consider sponsoring its maintenance:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

---

**[Anonyfox](https://anonyfox.com) • [API Docs](https://anonyfox.github.io/magpie-html) • [MIT License](LICENSE)**

</div>
