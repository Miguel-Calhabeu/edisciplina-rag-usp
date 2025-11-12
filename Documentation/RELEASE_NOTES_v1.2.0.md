# v1.2.0 Release Notes

**Version**: 1.2.0
**Released**: January 2025
**Type**: Enhancement & Debugging Release

## Overview

This release addresses the issue where only 2 out of 18 files were downloading, by adding comprehensive debugging tools and improving error handling throughout the extension.

## What Was Fixed

### 1. **Enhanced Debugging (v1.2.0)**
- ✅ Added comprehensive console logging with `[e-Disciplinas]` prefix
- ✅ Logs show file detection, URL extraction strategy used, and download status
- ✅ Service worker logs (`[e-Disciplinas BG]`) for download API calls
- ✅ Each file shows progress: `[1/18] Processing: Filename`
- ✅ Detailed error messages showing exactly which strategy succeeded/failed

**How to use:**
1. Go to your e-Disciplinas course page
2. Press `F12` to open Developer Tools
3. Click "Download All Files"
4. Watch console for detailed logs
5. Check Service Worker console too at `chrome://extensions/`

### 2. **Improved Error Handling**
- ✅ Better fetch error messages (HTTP status codes, timeouts, network errors)
- ✅ Fallback to manual redirect following if automatic follow fails
- ✅ 15-second timeout to prevent hanging on slow server responses
- ✅ Individual error tracking for each file (doesn't stop on first error)
- ✅ Rate limiting: 200ms delay between fetches to avoid server throttling

### 3. **Better User Feedback**
- ✅ Popup now shows helpful tips when downloads fail
- ✅ Error summary shows count of failed files
- ✅ Suggested actions (e.g., "Check console for details")
- ✅ Button re-enables after 3 seconds to allow retry attempts

### 4. **New Documentation**
- ✅ `DEBUGGING.md` - Complete guide to analyze console logs
- ✅ `test_moodle_fetch.js` - Script to manually test resource page fetches
- ✅ Updated README with debugging section
- ✅ Version history updated

## Installation

The extension auto-updates in Chrome. To manually update:

1. Go to `chrome://extensions/`
2. Find "e-Disciplinas File Downloader"
3. Click the reload button (↻)
4. Version should now show 1.2.0

## What to Do If Still Having Issues

### If only 2 files download:

1. **Enable console logging**:
   - Go to your course page
   - Press F12
   - Click "Download All Files"
   - Look for logs starting with `[e-Disciplinas]`

2. **Find the pattern**:
   - Check which files show `✓ Download initiated`
   - Check which files show errors
   - Look for the strategy that matched: `Strategy 1`, `Strategy 2`, etc.

3. **Check if it's a timing issue**:
   - If you see timeout errors, the server is slow or blocked
   - If you see HTTP 403/401 errors, files may require permissions
   - If you see "No extraction strategy matched", the HTML format changed

4. **Report with logs**:
   - Copy the console output
   - Share which files succeeded and which failed
   - Include any error messages

### Interpreting Console Logs

```
[e-Disciplinas] Found 18 resource links        ← Correct number detected
[e-Disciplinas] [1/18] Processing: Aula 1.pdf  ← Processing file
[e-Disciplinas] Strategy 1 matched             ← URL found via redirect
[e-Disciplinas] ✓ Download initiated           ← Success!

[e-Disciplinas] [2/18] Processing: Aula 2.pdf
[e-Disciplinas] No extraction strategy matched ← Problem!
[e-Disciplinas] Could not find file URL        ← File failed
```

## Technical Details

### What Changed in the Code

1. **content.js**:
   - Added detailed console logging throughout
   - Added timeout mechanism (15 seconds per fetch)
   - Added fallback redirect handling
   - Added 200ms delay between requests
   - Better error messages with context

2. **background.js**:
   - Added logging for download API calls
   - Better error reporting

3. **popup.js**:
   - Added helpful tips based on results
   - Better error display formatting

4. **manifest.json**:
   - Version bumped to 1.2.0

### Why Only 2 Files Were Downloading

The most likely causes:

1. **Different URL structures**: Some Moodle resources may use different redirect patterns
2. **Server rate limiting**: 18 rapid requests might trigger throttling
3. **Timeout issues**: Slow servers causing fetch timeouts
4. **Authentication**: Some files may have different permission levels
5. **HTML format variations**: Different resource types may have different HTML structure

### How v1.2.0 Helps

- **Debugging**: You can now see exactly which strategy works and which fails
- **Rate Limiting**: 200ms delay reduces server throttling
- **Timeout Protection**: 15s timeout prevents hanging indefinitely
- **Better Errors**: You get context about what went wrong

## Files Modified

```
chrome-extension/
├── manifest.json       (version bump to 1.2.0)
├── content.js          (+ logging, timeout, rate limiting)
├── background.js       (+ logging)
└── popup.js            (+ helpful tips)

Root:
├── README.md           (updated with v1.2.0 features)
├── DEBUGGING.md        (new - complete debugging guide)
└── test_moodle_fetch.js (new - manual testing script)
```

## Testing the Update

1. Go to a course page with 10+ files
2. Open Developer Tools (F12)
3. Click "Download All Files"
4. Watch the console for logs
5. If some files fail, share the console output for analysis

## Next Steps

If the debugging tools don't reveal the issue:

1. Collect the console logs
2. Note which files succeed vs. fail
3. Check if there's a pattern (e.g., "all PDFs fail" or "first 2 work")
4. Compare successful vs. failed HTML (if needed)

## Compatibility

- Chrome/Chromium v88+
- Edge, Brave, and other Chromium browsers
- Requires e-Disciplinas access (edisciplinas.usp.br)

## Known Limitations

- Still has 15-second per-file timeout (can't change easily)
- Rate limiting delay of 200ms (helps but not perfect)
- If server genuinely blocks downloads, extension can't override

## Future Improvements

- [ ] Batch retry for failed downloads
- [ ] Download pause/resume functionality
- [ ] Real-time progress bar
- [ ] Selective file downloading
- [ ] Download speed optimization

---

**Questions or issues?**

1. Check `DEBUGGING.md` for detailed troubleshooting
2. Run `test_moodle_fetch.js` for manual testing
3. Review console logs as described above
4. Check README for configuration options

**Feedback welcome!** Report issues with console log output for faster resolution.
