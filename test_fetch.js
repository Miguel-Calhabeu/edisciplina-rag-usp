// Test script to debug what the resource pages return
// This will help understand why only 2/18 files download

const testUrls = [
  "https://edisciplinas.usp.br/mod/resource/view.php?id=5990264",
  "https://edisciplinas.usp.br/mod/resource/view.php?id=5990245",
  "https://edisciplinas.usp.br/mod/resource/view.php?id=5990285",
  "https://edisciplinas.usp.br/mod/resource/view.php?id=6018408",
];

async function testFetch(url) {
  try {
    console.log(`\n\n========== Testing: ${url} ==========`);
    const response = await fetch(url, { redirect: 'follow' });

    console.log(`Status: ${response.status}`);
    console.log(`Final URL: ${response.url}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);

    const html = await response.text();
    console.log(`HTML length: ${html.length}`);

    // Check for pluginfile URLs
    const pluginMatch = html.match(/(https:\/\/edisciplinas\.usp\.br\/pluginfile\.php\/[^"'\s<>()]+)/i);
    if (pluginMatch) {
      console.log(`Found pluginfile URL: ${pluginMatch[1]}`);
    } else {
      console.log(`No pluginfile URL found`);
      // Show first 500 chars
      console.log(`HTML sample: ${html.substring(0, 500)}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Run tests
(async () => {
  for (const url of testUrls) {
    await testFetch(url);
  }
})();
