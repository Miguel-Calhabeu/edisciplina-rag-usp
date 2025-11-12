#!/usr/bin/env node
/**
 * Test script to debug Moodle resource page fetches
 * Run with: node test_moodle_fetch.js
 *
 * Note: This requires you to be authenticated with Moodle cookies.
 * You can export cookies from your browser using a browser extension
 * and pass them as environment variables.
 */

const urls = [
  "https://edisciplinas.usp.br/mod/resource/view.php?id=5990264",
  "https://edisciplinas.usp.br/mod/resource/view.php?id=5990245",
  "https://edisciplinas.usp.br/mod/resource/view.php?id=5990285",
  "https://edisciplinas.usp.br/mod/resource/view.php?id=6018408",
  "https://edisciplinas.usp.br/mod/resource/view.php?id=6018417",
];

async function testFetch(url, index) {
  try {
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`[${index}] Fetching: ${url}`);
    console.log('='.repeat(60));

    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Final URL: ${response.url}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`Content-Length: ${response.headers.get('content-length')}`);

    const html = await response.text();
    console.log(`Received ${html.length} bytes of HTML`);

    // Check for pluginfile URLs
    const pluginMatches = html.match(/(https?:\/\/[^\s"'<>]*pluginfile[^\s"'<>()]*)/gi) || [];
    console.log(`\nFound ${pluginMatches.length} pluginfile URLs:`);
    pluginMatches.forEach((url, i) => {
      console.log(`  [${i+1}] ${url.substring(0, 100)}...`);
    });

    // Check for meta refresh
    const metaRefresh = html.match(/<meta\s+http-equiv=["']?refresh/i);
    if (metaRefresh) {
      console.log(`\n✓ Found meta refresh tag`);
      const refreshUrl = html.match(/url=["']?([^"'<>\s)]+)/i);
      if (refreshUrl) {
        console.log(`  Redirect to: ${refreshUrl[1]}`);
      }
    }

    // Check for JavaScript redirect
    const jsRedirect = html.match(/(?:location\.href|window\.location)\s*=\s*["']([^"']+)['"]/i);
    if (jsRedirect) {
      console.log(`\n✓ Found JavaScript redirect`);
      console.log(`  Redirect to: ${jsRedirect[1]}`);
    }

    // Show first 1000 chars of HTML
    console.log(`\nHTML Preview (first 1000 chars):`);
    console.log(html.substring(0, 1000));

  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
  }
}

(async () => {
  for (let i = 0; i < urls.length; i++) {
    await testFetch(urls[i], i + 1);
    // Wait between requests
    if (i < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
})();
