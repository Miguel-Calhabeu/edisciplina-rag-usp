# Chrome Extension Quick Start

## Installation Steps

1. **Open Chrome Extensions Page**
   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to the `chrome-extension` folder in this project
   - Select and open the folder

4. **Verify Installation**
   - You should see "e-Disciplinas File Downloader" in your extensions list
   - You'll see the extension icon in your Chrome toolbar

## Using the Extension

1. Navigate to any e-Disciplinas course page (e.g., https://edisciplinas.usp.br/course/view.php?id=XXXXX)
2. Click the extension icon in the toolbar
3. Click "Download All Files" button
4. All files on the page will be downloaded to your default Downloads folder

## What It Does

- **Scans** the course page for all resources (files)
- **Extracts** the actual file URLs from the resource redirect pages
- **Downloads** each file to your computer automatically

## Files Structure

```
chrome-extension/
├── manifest.json       # Extension configuration & permissions
├── content.js          # Detects files on course pages
├── popup.html          # Extension popup interface
├── popup.css           # Popup styling
├── popup.js            # Popup logic & download coordination
├── icon.png            # Extension icon
└── README.md           # Detailed documentation
```

## Key Features

✅ One-click download of all course files
✅ Automatic filename handling
✅ Follows redirect chains automatically
✅ Clean, modern UI
✅ Works with e-Disciplinas (USP's Moodle)

## Troubleshooting

**"Content script cannot be injected"**
- Make sure you're on an e-Disciplinas page: https://edisciplinas.usp.br/course/view.php?id=XXX

**Files not downloading**
- Check your browser's download settings
- Ensure pop-ups and downloads are allowed for e-Disciplinas

**Extension not appearing**
- Refresh the chrome://extensions/ page
- Try reloading the extension with the refresh button

## Next Steps

- Edit files in `chrome-extension/` folder to customize
- Reload the extension after making changes (refresh button at chrome://extensions/)
- Test on different course pages

For more details, see `chrome-extension/README.md`
