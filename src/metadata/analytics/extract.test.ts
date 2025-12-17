import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractAnalytics } from './extract.js';

describe('extractAnalytics', () => {
  it('should extract Google Analytics UA ID from script', () => {
    const html = `
      <script>
        ga('create', 'UA-12345-1', 'auto');
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.googleAnalytics);
    assert.equal(result.googleAnalytics.length, 1);
    assert.equal(result.googleAnalytics[0], 'UA-12345-1');
  });

  it('should extract Google Analytics G- ID (GA4)', () => {
    const html = `
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('config', 'G-ABC123XYZ');
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.googleAnalytics);
    assert.ok(result.googleAnalytics.includes('G-ABC123XYZ'));
  });

  it('should extract Google Tag Manager ID', () => {
    const html = `
      <script>
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-ABC123');
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.googleTagManager);
    assert.equal(result.googleTagManager.length, 1);
    assert.equal(result.googleTagManager[0], 'GTM-ABC123');
  });

  it('should extract Facebook Pixel ID', () => {
    const html = `
      <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '1234567890');
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.facebookPixel);
    assert.equal(result.facebookPixel.length, 1);
    assert.equal(result.facebookPixel[0], '1234567890');
  });

  it('should extract Matomo site ID', () => {
    const html = `
      <script>
        var _paq = window._paq = window._paq || [];
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function() {
          var u="//matomo.example.com/";
          _paq.push(['setTrackerUrl', u+'matomo.php']);
          _paq.push(['setSiteId', '42']);
        })();
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.matomo);
    assert.equal(result.matomo.length, 1);
    assert.equal(result.matomo[0], '42');
  });

  it('should extract Plausible Analytics domain', () => {
    const html = `
      <script defer data-domain="example.com" src="https://plausible.io/js/script.js"></script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.plausible);
    assert.equal(result.plausible.length, 1);
    assert.equal(result.plausible[0], 'example.com');
  });

  it('should extract Adobe Analytics account ID', () => {
    const html = `
      <script>
        var s_account="mycompanyrsid";
        var s=s_gi(s_account);
        s.t();
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.adobe);
    assert.equal(result.adobe.length, 1);
    assert.equal(result.adobe[0], 'mycompanyrsid');
  });

  it('should extract Cloudflare Web Analytics token', () => {
    const html = `
      <script defer src='https://static.cloudflareinsights.com/beacon.min.js'
              data-cf-beacon='{"token": "abc123def456"}'></script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.cloudflare);
    assert.equal(result.cloudflare.length, 1);
    assert.ok(result.cloudflare[0]);
  });

  it('should extract Fathom Analytics site ID', () => {
    const html = `
      <script src="https://cdn.usefathom.com/script.js" data-site="ABCDEFGH" defer></script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.fathom);
    assert.equal(result.fathom.length, 1);
    assert.equal(result.fathom[0], 'ABCDEFGH');
  });

  it('should extract multiple analytics services', () => {
    const html = `
      <script src="https://www.googletagmanager.com/gtag/js?id=G-ABC123"></script>
      <script>gtag('config', 'G-ABC123');</script>
      <script>fbq('init', '9876543210');</script>
      <script defer data-domain="example.com" src="https://plausible.io/js/script.js"></script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.googleAnalytics);
    assert.ok(result.facebookPixel);
    assert.ok(result.plausible);
  });

  it('should extract multiple Google Analytics IDs', () => {
    const html = `
      <script>
        ga('create', 'UA-11111-1', 'auto');
        ga('create', 'UA-22222-2', 'auto');
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.googleAnalytics);
    assert.equal(result.googleAnalytics.length, 2);
    assert.ok(result.googleAnalytics.includes('UA-11111-1'));
    assert.ok(result.googleAnalytics.includes('UA-22222-2'));
  });

  it('should deduplicate analytics IDs', () => {
    const html = `
      <script src="https://www.googletagmanager.com/gtag/js?id=G-ABC123"></script>
      <script>gtag('config', 'G-ABC123');</script>
      <script>gtag('event', 'page_view', { 'send_to': 'G-ABC123' });</script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.googleAnalytics);
    assert.equal(result.googleAnalytics.length, 1);
    assert.equal(result.googleAnalytics[0], 'G-ABC123');
  });

  it('should return empty object if no analytics found', () => {
    const html = '<html><head><title>No Analytics</title></head></html>';
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.deepEqual(result, {});
  });

  it('should extract GT- (Google Tag) IDs', () => {
    const html = `
      <script>
        gtag('config', 'GT-ABC123XYZ');
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.googleAnalytics);
    assert.ok(result.googleAnalytics.includes('GT-ABC123XYZ'));
  });

  it('should handle mixed GA formats', () => {
    const html = `
      <script>
        ga('create', 'UA-12345-1', 'auto');
        gtag('config', 'G-ABC123');
        gtag('config', 'GT-XYZ789');
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.googleAnalytics);
    assert.equal(result.googleAnalytics.length, 3);
    assert.ok(result.googleAnalytics.includes('UA-12345-1'));
    assert.ok(result.googleAnalytics.includes('G-ABC123'));
    assert.ok(result.googleAnalytics.includes('GT-XYZ789'));
  });

  it('should extract analytics from external script src', () => {
    const html = `
      <script async src="https://www.googletagmanager.com/gtag/js?id=UA-98765-4"></script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.googleAnalytics);
    assert.ok(result.googleAnalytics.includes('UA-98765-4'));
  });

  it('should handle Matomo with string site ID', () => {
    const html = `
      <script>
        _paq.push(['setSiteId', "123"]);
      </script>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.matomo);
    assert.equal(result.matomo[0], '123');
  });

  it('should extract complete analytics metadata', () => {
    const html = `
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-EXAMPLE123"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('config', 'G-EXAMPLE123');
          gtag('config', 'GTM-ABCD123');
          fbq('init', '1234567890');
        </script>
        <script defer data-domain="example.com" src="https://plausible.io/js/script.js"></script>
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractAnalytics(doc);

    assert.ok(result.googleAnalytics);
    assert.ok(result.googleAnalytics.includes('G-EXAMPLE123'));
    assert.ok(result.googleTagManager);
    assert.ok(result.googleTagManager.includes('GTM-ABCD123'));
    assert.ok(result.facebookPixel);
    assert.equal(result.facebookPixel[0], '1234567890');
    assert.ok(result.plausible);
    assert.equal(result.plausible[0], 'example.com');
  });
});
