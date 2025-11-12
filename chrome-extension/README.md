# e-Disciplinas File Downloader - Chrome Extension

A Chrome extension that automatically downloads all files from e-Disciplinas course pages.

## Features

- 🚀 **Download All Files**: One-click download of all files in a course page
- 📥 **Automatic File Naming**: Files are saved with meaningful names
- 🔗 **Follows Redirects**: Automatically handles the redirect chain from mod/resource/view.php to the actual file
- 🎨 **Beautiful UI**: Clean and intuitive interface

## How It Works

1. The extension scans the course page for all file resources (links with class `aalink stretched-link` pointing to `/mod/resource/view.php`)
2. For each file, it fetches the resource page to extract the actual download URL
3. Downloads are triggered using Chrome's downloads API

## Installation

### Method 1: Load Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from this repository
5. The extension should now appear in your extensions list

### Method 2: Manual Installation for Users

Once the extension is packaged:
1. Download the `.crx` file
2. Open `chrome://extensions/`
3. Drag and drop the `.crx` file onto the page
4. Click "Add extension" to confirm

## Usage

1. Navigate to any e-Disciplinas course page
2. Click the extension icon in the Chrome toolbar
3. Click "Download All Files"
4. Files will be downloaded to your default Downloads folder

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── content.js             # Runs on course pages, handles file detection
├── popup.html             # Popup UI
├── popup.css              # Popup styling
├── popup.js               # Popup logic and download coordination
├── icon.png               # Extension icon
└── README.md              # This file
```

## How Files Are Extracted

The extension follows this process:

1. **Detect Files**: Finds all `<a>` tags with class `aalink stretched-link` that link to `/mod/resource/view.php?id=XXXXX`
2. **Fetch Resource Page**: Makes a request to the resource view page
3. **Extract Download URL**: Looks for the actual file URL by:
   - Searching for `pluginfile.php` URLs in the HTML
   - Checking for meta refresh tags
   - Looking for download links
4. **Download**: Uses Chrome's download API to save the file

## Troubleshooting

### Files not downloading
- Make sure you're on an e-Disciplinas course page
- Check if the course page contains files (visible in the HTML as aalink stretched-link elements)
- Check your browser's download settings and ensure downloads are allowed

### "Manifest Version 2" warning
- This extension uses Manifest Version 3 (the current standard)
- Ignore any warnings about deprecated versions

### Permission Issues
- The extension requires `downloads` permission to save files
- Grant the permission when prompted or in extension settings

## Permissions Explained

- **activeTab**: Needed to access the current active tab
- **scripting**: Allows injecting content scripts to detect files
- **downloads**: Required to programmatically download files
- **host_permissions**: Limited to `https://edisciplinas.usp.br/*`

## Development

To modify or extend this extension:

1. Edit the desired files in the `chrome-extension` folder
2. Go to `chrome://extensions/`
3. Find this extension and click the reload button (🔄)
4. Changes take effect immediately

## Known Limitations

- Only works with e-Disciplinas (edisciplinas.usp.br)
- Requires Chrome/Chromium-based browsers
- File URLs must be accessible without additional authentication beyond what's stored in cookies
- Progress tracking is limited (downloads are initiated asynchronously)

## Future Improvements

- [ ] Progress indicator showing number of files downloaded
- [ ] Ability to select specific files to download
- [ ] Folder organization by course/topic
- [ ] Pause/resume functionality
- [ ] File filter options (by type, date, etc.)

## License

This extension is provided as-is for educational purposes.

## Support

For issues or suggestions, please create an issue in the repository.
