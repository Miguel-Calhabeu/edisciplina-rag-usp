# Update Guide - v1.0.1

## Changes Made to Fix URL Extraction Issues

The extension has been updated with significant improvements to handle URL extraction more robustly. Here's what was fixed:

### 🐛 Bug Fixes

1. **Service Worker Architecture**
   - Added `background.js` (Service Worker) for proper download handling
   - Moved all download API calls to the background script
   - This ensures downloads work correctly in Manifest V3

2. **URL Extraction Improvements**
   - Implemented 9 different strategies to find file URLs
   - Now handles multiple redirect methods (meta refresh, JavaScript, direct URLs)
   - Better URL resolution for relative paths
   - Improved regex patterns to capture full URLs without truncation

3. **Error Handling**
   - Better error messages with context
   - Graceful fallback strategies
   - Status display now shows detailed error information

### 📝 Files Updated

- `content.js` - Complete rewrite of URL extraction logic
- `background.js` - New service worker for downloads
- `popup.js` - Simplified to use background worker
- `manifest.json` - Added background service worker declaration

### 🚀 New Features

1. **Multi-Strategy URL Detection**
   - Direct pluginfile URLs
   - Meta refresh redirects
   - JavaScript location.href
   - Data attributes (data-href, data-src, etc.)
   - Download links
   - File extensions (.pdf, .docx, etc.)

2. **Better Debugging**
   - Added `DEBUGGING.md` with console-based debugging tools
   - Enhanced error messages
   - Console logging of intermediate steps (in dev mode)

### 📋 Installation Steps to Get Latest Version

1. **Reload the Extension**
   - Go to `chrome://extensions/`
   - Find "e-Disciplinas File Downloader"
   - Click the reload (🔄) button

2. **Clear Cache (if needed)**
   - If you still see errors after reload
   - Click "Remove"
   - Go to `chrome-extension` folder
   - Click "Load unpacked" again

### 🔧 Testing the Update

1. **Navigate to a course page** with files
2. **Click the extension icon**
3. **Click "Download All Files"**
4. **Check your Downloads folder** - files should appear

### ❓ If Files Still Don't Download

1. **Open Chrome DevTools** (Cmd+Option+J on Mac)
2. **Run the debugging script** (see DEBUGGING.md)
3. **Look at the output** to understand what's happening
4. **Share findings** for further debugging

### 🔄 URL Extraction Flow (Updated)

```
1. Find aalink stretched-link elements on page
2. For each file link:
   a. Fetch the resource page (follow redirects)
   b. Try 9 different URL extraction strategies
   c. If URL found: initiate download
   d. If not found: log error and continue
3. Report summary with successes and errors
```

### 📦 Extension Structure

```
chrome-extension/
├── manifest.json       # Updated with background service worker
├── content.js          # Completely rewritten URL extraction
├── background.js       # NEW: Service worker for downloads
├── popup.html          # UI interface
├── popup.css           # Styling
├── popup.js            # Simplified popup logic
├── icon.png            # Extension icon
├── README.md           # User documentation
├── DEBUGGING.md        # NEW: Debugging guide
└── CHROME_EXTENSION_SETUP.md  # Installation guide
```

### ✅ Verification Checklist

- [ ] Extension reloaded at chrome://extensions/
- [ ] You can see the extension icon in toolbar
- [ ] Clicking icon shows the popup
- [ ] "Download All Files" button is clickable
- [ ] At least some files show in Downloads (look for success count > 0)
- [ ] Check Downloads folder for new files

### 🆘 Troubleshooting

**Q: Still showing "Could not find file URL"?**
A: Run the debug script in DEBUGGING.md to see what the server is actually returning

**Q: Extension icon not showing?**
A: Reload at chrome://extensions/ and check "Remove" if needed, then "Load unpacked" again

**Q: Downloads not appearing?**
A: Check chrome://downloads/ to see if files are being downloaded but going elsewhere

**Q: "Initiated 0 file download(s)"**
A: This means no files were found on the page. Check:
   - You're on a course page (not a single class page)
   - Course has files
   - Files have the `.aalink.stretched-link` class

### 📞 Debug Information to Collect

If you encounter issues, open the console and run:
```javascript
await window.edisciplinasDebugFiles();
```

Share the console output with details about:
1. How many files were detected
2. What the "Final URL" looks like for a few files
3. Whether the response contains "pluginfile"
4. What error message appears in console

---

**Version**: 1.0.1
**Date**: November 11, 2025
**Status**: Improved with 9-strategy URL extraction
