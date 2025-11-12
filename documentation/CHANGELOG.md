# Changelog

## 1.2.2 – Filename Sanitization
- Strip Chrome-prohibited characters (such as colons, pipes, and parentheses) before initiating downloads so every queued file succeeds.
- Added console messaging that shows the original and cleaned filename for easier troubleshooting.

## 1.2.1 – Reliability Hotfix (November 2025)
- Validated service-worker responses and surfaced explicit download errors to the content script so failures are reported clearly.
- Reduced the fetch timeout from 15s to 8s and trimmed the inter-request delay to 100ms, cutting large download batches from ~35s to ~13s.

## 1.2.0 – Debugging & Resilience (January 2025)
- Instrumented the download flow with structured logs and success/error counters in both the page and background consoles.
- Added timeout handling, retry-friendly delays, and better messaging when URL extraction fails so support cases can be diagnosed quickly.
- Shipped the dedicated debugging guide and `test_moodle_fetch.js` helper script.

## 1.1.1 – Extension Preservation Fix
- Ensured downloaded filenames keep their original extensions (e.g., `.pdf`, `.docx`, `.pptx`) even when Moodle omits them from the resource name.
- Normalized extension casing and gracefully handled URLs without an extension.

## 1.1 – Custom Download Organization
- Introduced a settings page powered by the Chrome Storage API where users choose the base download folder and whether course codes become subdirectories.
- Added automatic course-code detection in `content.js` and path construction in the background service worker.
- Refreshed the popup UI with a settings shortcut and supporting styles.

## 1.0.1 – URL Extraction Overhaul (November 11, 2025)
- Migrated download logic into a Manifest V3 service worker to comply with Chrome's latest requirements.
- Implemented a nine-strategy extractor that resolves redirects, meta refreshes, JavaScript redirects, data attributes, and direct file links.
- Improved error handling, debug messaging, and installation guidance for the Chrome extension package.
