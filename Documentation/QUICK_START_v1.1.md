# Update to v1.1 - Quick Start

## What's New? 🎉

Your extension now has **custom download organization**! Files are organized by:
1. **Custom directory** (you configure)
2. **Course code** (auto-detected)
3. **Filename** (from e-Disciplinas)

Example: `~/Downloads/e-Disciplinas/SSC0534/Aula1.pdf`

---

## Installation (2 minutes)

### Step 1: Reload Extension
```
1. Go to chrome://extensions/
2. Find "e-Disciplinas File Downloader"
3. Click the reload button (🔄)
4. Done!
```

### Step 2: (Optional) Configure Settings
```
1. Click the extension icon in toolbar
2. Click ⚙️ button (top right of popup)
3. Modify download path if desired
4. Click "Save Settings"
```

---

## Usage

### Download Files
1. Go to e-Disciplinas course page
2. Click extension icon
3. Click "Download All Files"
4. Files appear in: `~/Downloads/[custom-path]/[course-code]/`

### Change Settings
1. Click extension icon
2. Click ⚙️ or "Settings" link at bottom
3. Modify path (example: `courses/2025`)
4. Toggle course folder on/off
5. Click "Save Settings"

---

## Default Settings

**Path**: `e-Disciplinas`
**Course Folder**: Enabled
**Result**: `~/Downloads/e-Disciplinas/SSC0534/files/`

---

## Examples

### Example 1: Single Directory
- **Path**: `e-Disciplinas`
- **Result**: `Downloads/e-Disciplinas/SSC0534/file.pdf`

### Example 2: By Year
- **Path**: `courses/2025`
- **Result**: `Downloads/courses/2025/SSC0534/file.pdf`

### Example 3: Downloads Root
- **Path**: `.` (dot)
- **Result**: `Downloads/SSC0534/file.pdf`

---

## Features

✅ **Automatic Organization** - Files organized by course automatically
✅ **Persistent Settings** - Configuration saved between sessions
✅ **Course Detection** - Automatically extracts course code
✅ **Easy Configuration** - Simple settings page with examples
✅ **Backward Compatible** - Works with v1.0 downloads

---

## Troubleshooting

**Q: Files not saving to custom path?**
A: Reload extension and try again. Settings require browser restart in some cases.

**Q: Course code not detected?**
A: Manual override: settings page won't auto-detect if page structure is unusual. Disable course folder toggle and organize manually.

**Q: Want to go back to defaults?**
A: Click "Reset to Default" button in settings page.

---

## File Structure

```
chrome-extension/
├── manifest.json           ← Updated (v1.1)
├── background.js           ← Updated (path handling)
├── content.js              ← Updated (course code extraction)
├── popup.html              ← Updated (settings link)
├── popup.css               ← Updated (new UI)
├── popup.js                ← Updated (settings handler)
├── settings.html           ← NEW ✨
├── settings.css            ← NEW ✨
├── settings.js             ← NEW ✨
├── icon.png
└── README.md
```

---

## Next Steps

1. ✅ Reload extension at `chrome://extensions/`
2. ✅ Test download on course page
3. ✅ Check `~/Downloads/e-Disciplinas/` for files
4. ✅ (Optional) Customize path in settings

---

## Need Help?

See `IMPLEMENTATION_OVERVIEW_v1.1.md` for detailed technical information.

**Version**: 1.1
**Status**: Ready to use! 🚀
