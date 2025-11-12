# e-Disciplinas File Downloader

The e-Disciplinas File Downloader is a Chrome extension that grabs every resource file from an e-Disciplinas/Moodle course page and saves the downloads in an organized folder structure. It was built to reduce manual downloads for USP students while keeping filenames and directories predictable.

## Key Features
- **One click bulk download** for all resources discovered on the current course page.
- **Nine-step URL extraction pipeline** that follows redirects, parses HTML responses, and resolves relative paths to reach protected `pluginfile.php` assets.
- **Persistent download preferences** stored with the Chrome Storage API, including a custom root directory and optional course-code subfolders.
- **Automatic filename cleanup** that preserves original extensions, normalizes casing, and removes characters that Chrome blocks.
- **Actionable debugging logs** in both the page console and the service worker to track progress and diagnose failures quickly.

## Repository Layout
```
chrome-extension/
├── background.js        # Service worker that builds download paths and calls the Chrome downloads API
├── content.js           # Scans course pages, extracts resource URLs, and coordinates downloads
├── popup.{html,css,js}  # User interface for triggering downloads and opening settings
├── settings.{html,css,js} # Options page that captures download path preferences
└── manifest.json        # Chrome Manifest V3 configuration

documentation/
├── README.md            # This guide
└── CHANGELOG.md         # Release history and notable fixes
```

## Getting Started
1. Open `chrome://extensions/` in a Chromium-based browser (Chrome, Edge, Brave).
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click **Load unpacked** and select the repository's `chrome-extension` folder.
4. Confirm that the "e-Disciplinas File Downloader" tile appears and the toolbar icon is visible.
5. Visit an e-Disciplinas course page and press **Download All Files** in the popup. Files are saved under `~/Downloads/e-Disciplinas/<CourseCode>/` by default.

### Updating the Extension
When the code changes, return to `chrome://extensions/` and click the **Reload (↻)** button on the extension card. You can also remove and re-load the folder if Chrome reports errors after an update.

## Configuration & Organization
- Open the popup and click the ⚙️ icon (or choose **Options** from the extension card) to reach the settings page.
- Set a **Download path** relative to your default Downloads folder (examples: `e-Disciplinas`, `courses/2025`, or `.` to drop files directly in Downloads).
- Toggle **Create course folder** to decide whether the detected course code (e.g., `SSC0534`) becomes a subfolder.
- Settings persist across sessions; use **Reset to Defaults** if you need to restore the standard configuration.

The resulting download path follows this template:
```
~/Downloads/<custom path>/<course code>/<filename>.<extension>
```
If no course code is detected or the toggle is disabled, the `<course code>` segment is omitted.

## How Downloads Work
1. The **content script** scans the page for Moodle resource links (`a.aalink.stretched-link`).
2. For each resource, it fetches the intermediate page and runs a **nine-strategy extractor**, checking for redirects, meta refresh tags, JavaScript assignments, `data-*` attributes, anchor links, explicit file extensions, and generic `pluginfile.php` matches.
3. Successful matches are cleaned to remove query strings, resolve relative URLs, and preserve the correct file extension.
4. Filenames are sanitized so Chrome accepts them (colons, slashes, pipes, and similar characters are replaced).
5. The **service worker** loads stored preferences, assembles the final path, and calls `chrome.downloads.download`.
6. Progress and errors are logged with `[e-Disciplinas]` (page) and `[e-Disciplinas BG]` (background) prefixes for quick diagnosis.

## Troubleshooting
1. Open DevTools (**F12**) on the course page and watch the **Console** for `[e-Disciplinas]` messages. They reveal which extraction strategy matched and whether a download was queued.
2. From `chrome://extensions/`, click the **Service worker** link under the extension and inspect the console there for `[e-Disciplinas BG]` logs about file paths and Chrome download responses.
3. Common issues:
   - **"No files found"** – verify you are on a course page that contains resources using the Moodle `aalink` markup.
   - **"Could not find file URL"** – the Moodle instance returned an unexpected HTML structure or requires additional authentication; capture the logged HTML snippet for investigation.
   - **Timeout messages** – slow responses exceeded the 8-second fetch limit; retry or check connectivity.
   - **"Invalid filename" errors** – confirm you are running version 1.2.2 or later so sanitization is applied.
4. For deeper insight, run `await window.edisciplinasDebugFiles();` in the course page console to print the detected URLs and extraction results.

## Development Tips
- Keep DevTools open while iterating so you can see real-time logs from both scripts.
- The repository ships with `test_moodle_fetch.js`, which can be executed in the browser console to replicate fetch logic on problematic resources.
- After modifying any file inside `chrome-extension/`, reload the extension before testing again.
- Contributions should update the changelog when behavior changes or significant bugs are resolved.
