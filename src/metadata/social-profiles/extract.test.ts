import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractSocialProfiles } from './extract.js';

describe('extractSocialProfiles', () => {
  it('should extract Twitter handle from meta tag', () => {
    const html = '<meta name="twitter:site" content="@example">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.twitter, 'example');
  });

  it('should extract Twitter handle without @ symbol', () => {
    const html = '<meta name="twitter:creator" content="example">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.twitter, 'example');
  });

  it('should extract Facebook from OpenGraph', () => {
    const html = '<meta property="og:url" content="https://facebook.com/example">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.facebook, 'https://facebook.com/example');
  });

  it('should extract Instagram username', () => {
    const html = '<meta name="instagram:site" content="@example">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.instagram, '@example');
  });

  it('should extract LinkedIn profile', () => {
    const html = '<meta property="linkedin:owner" content="https://linkedin.com/in/example">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.linkedin, 'https://linkedin.com/in/example');
  });

  it('should extract YouTube channel', () => {
    const html = '<meta name="youtube:channel" content="https://youtube.com/c/example">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.youtube, 'https://youtube.com/c/example');
  });

  it('should extract GitHub user', () => {
    const html = '<meta name="github:user" content="example">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.github, 'example');
  });

  it('should extract TikTok profile', () => {
    const html = '<meta name="tiktok:site" content="@example">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.tiktok, '@example');
  });

  it('should extract Pinterest profile', () => {
    const html = '<meta name="pinterest:profile" content="example">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.pinterest, 'example');
  });

  it('should extract Mastodon profile', () => {
    const html = '<meta property="fediverse:creator" content="@example@mastodon.social">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.mastodon, '@example@mastodon.social');
  });

  it('should extract Reddit username', () => {
    const html = '<meta name="reddit:user" content="example">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.reddit, 'example');
  });

  it('should extract multiple social profiles', () => {
    const html = `
      <meta name="twitter:site" content="@twitter_example">
      <meta name="instagram:site" content="@instagram_example">
      <meta name="github:user" content="github_example">
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.twitter, 'twitter_example');
    assert.equal(result.instagram, '@instagram_example');
    assert.equal(result.github, 'github_example');
  });

  it('should extract profiles from Schema.org sameAs', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "sameAs": [
          "https://twitter.com/example",
          "https://facebook.com/example",
          "https://github.com/example"
        ]
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.twitter, 'example');
    assert.equal(result.facebook, 'https://facebook.com/example');
    assert.equal(result.github, 'example');
  });

  it('should extract profiles from Schema.org @graph', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Person",
            "sameAs": "https://twitter.com/person_example"
          }
        ]
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.twitter, 'person_example');
  });

  it('should handle single sameAs string', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "sameAs": "https://linkedin.com/in/example"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.linkedin, 'https://linkedin.com/in/example');
  });

  it('should extract other social platforms', () => {
    const html = '<meta name="vk:site" content="https://vk.com/example">';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.ok(result.other);
    assert.equal(result.other['vk:site'], 'https://vk.com/example');
  });

  it('should collect multiple other platforms', () => {
    const html = `
      <meta name="telegram:site" content="@example">
      <meta name="discord:server" content="discord.gg/example">
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.ok(result.other);
    assert.equal(result.other['telegram:site'], '@example');
    assert.equal(result.other['discord:server'], 'discord.gg/example');
  });

  it('should prefer meta tags over Schema.org', () => {
    const html = `
      <meta name="twitter:site" content="@meta_twitter">
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "sameAs": "https://twitter.com/schema_twitter"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.twitter, 'meta_twitter');
  });

  it('should return empty object if no social profiles', () => {
    const html = '<html><head><title>No Social</title></head></html>';
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.deepEqual(result, {});
  });

  it('should extract Instagram from Schema.org URL', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Person",
        "sameAs": "https://instagram.com/example"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.instagram, 'example');
  });

  it('should extract YouTube from Schema.org URL', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Organization",
        "sameAs": "https://youtube.com/c/example"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.youtube, 'https://youtube.com/c/example');
  });

  it('should extract TikTok from Schema.org URL', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Person",
        "sameAs": "https://tiktok.com/@example"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.tiktok, 'example');
  });

  it('should extract Pinterest from Schema.org URL', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Person",
        "sameAs": "https://pinterest.com/example"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.pinterest, 'example');
  });

  it('should extract Reddit from Schema.org URL', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Person",
        "sameAs": "https://reddit.com/u/example"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.reddit, 'example');
  });

  it('should handle X.com (Twitter) URLs', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Person",
        "sameAs": "https://x.com/example"
      }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.twitter, 'example');
  });

  it('should handle invalid JSON in Schema.org scripts', () => {
    const html = `
      <script type="application/ld+json">
      { invalid json }
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.deepEqual(result, {});
  });

  it('should extract complete social profiles', () => {
    const html = `
      <head>
        <meta name="twitter:site" content="@example">
        <meta property="og:url" content="https://facebook.com/example">
        <meta name="instagram:site" content="@example">
        <meta name="github:user" content="example">
        <script type="application/ld+json">
        {
          "@type": "Organization",
          "sameAs": [
            "https://linkedin.com/company/example",
            "https://youtube.com/c/example"
          ]
        }
        </script>
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractSocialProfiles(doc);

    assert.equal(result.twitter, 'example');
    assert.equal(result.facebook, 'https://facebook.com/example');
    assert.equal(result.instagram, '@example');
    assert.equal(result.github, 'example');
    assert.equal(result.linkedin, 'https://linkedin.com/company/example');
    assert.equal(result.youtube, 'https://youtube.com/c/example');
  });
});
