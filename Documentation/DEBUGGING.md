# Debugging Download Issues

## How to Check What's Happening

The extension now has comprehensive logging that will help identify why only some files download.

### Step 1: Open the Extension in Chrome
1. Go to `chrome://extensions/`
2. Find "e-Disciplinas File Downloader"
3. Click "Details" to see more info

### Step 2: Check Console Logs
To see what the extension is doing:

1. **For Content Script Logs** (runs on course pages):
   - Go to an e-Disciplinas course page
   - Press `F12` to open DevTools
   - Go to the "Console" tab
   - Look for messages starting with `[e-Disciplinas]`
   - These show: file detection, URL extraction, download status

2. **For Background Service Worker Logs**:
   - Go to `chrome://extensions/`
   - Find "e-Disciplinas File Downloader"
   - Click "Service Worker" or "service_worker" link
   - Press `F12` to open DevTools
   - Go to the "Console" tab
   - Look for messages starting with `[e-Disciplinas BG]`
   - These show: download API calls and results

### Step 3: Interpret the Logs

Expected output when clicking "Download All Files":

```
[e-Disciplinas] Found 18 resource links
[e-Disciplinas] Course code: SSC0534
[e-Disciplinas] [1/18] Processing: Sobre a disciplina
[e-Disciplinas] Resource URL: https://edisciplinas.usp.br/mod/resource/view.php?id=5990264
[e-Disciplinas] Received 2456 bytes, final URL: https://edisciplinas.usp.br/pluginfile.php/...
[e-Disciplinas] Strategy 1 matched: final URL is pluginfile
[e-Disciplinas] File URL extracted: https://edisciplinas.usp.br/pluginfile.php/...
[e-Disciplinas] File extension: pdf, Final filename: Sobre_a_disciplina.pdf
[e-Disciplinas] ✓ Download initiated for: Sobre_a_disciplina.pdf
[e-Disciplinas BG] Downloading: Sobre_a_disciplina.pdf
[e-Disciplinas BG] Full path: e-Disciplinas/SSC0534/Sobre_a_disciplina.pdf
[e-Disciplinas BG] URL: https://edisciplinas.usp.br/pluginfile.php/...
[e-Disciplinas BG] ✓ Download initiated with ID: 123
```

### Common Issues and Solutions

#### Issue 1: "No files found to download"
- **Cause**: The selector `a.aalink.stretched-link` didn't match any elements
- **Solution**: The page structure changed or you're not on a course page

#### Issue 2: "Could not find file URL for [filename]"
- **Cause**: None of the 9 URL extraction strategies matched
- **Possible reasons**:
  - Moodle's response HTML format changed
  - The file requires special permissions
  - The file isn't actually a downloadable resource

#### Issue 3: Fetch fails with "Fetch failed: ..."
- **Cause**: Network error or server issue
- **Check**:
  - Is e-Disciplinas accessible in your browser?
  - Are you logged in?
  - Is there a VPN requirement?

#### Issue 4: Download initiated but file doesn't appear
- **Cause**: Chrome's download API accepted the request but failed
- **Check**:
  - Look in `chrome://downloads/` for errors
  - Verify the file URL is accessible in your browser
  - Check if the file exists on the server

### Extraction Strategies (in order)

The extension tries 9 different strategies to extract the actual file URL:

1. **Strategy 1**: Direct pluginfile URL after redirects
   - Works when: Browser auto-follows redirect to file

2. **Strategy 2**: Full URL with protocol in HTML
   - Works when: HTML has `https://edisciplinas.usp.br/pluginfile.php/...`

3. **Strategy 3**: Relative pluginfile URL
   - Works when: HTML has `/pluginfile.php/...` without protocol

4. **Strategy 4**: Meta refresh tag
   - Works when: Page uses `<meta http-equiv="refresh">`

5. **Strategy 5**: JavaScript redirect
   - Works when: Page uses `location.href = ...`

6. **Strategy 6**: Data attributes
   - Works when: URL is in `data-*` attributes

7. **Strategy 7**: Anchor tags
   - Works when: HTML has `<a href="...pluginfile...">`

8. **Strategy 8**: Direct file extensions
   - Works when: HTML references `.pdf`, `.docx`, etc.

9. **Strategy 9**: Any pluginfile URL (lenient)
   - Fallback: Looks for pluginfile in any format

### Manual Testing

You can test the extraction manually in the browser console:

```javascript
// List all detected files
await window.edisciplinasDownloadAllFiles()

// This will return a message like:
// "Initiated 18 file download(s)"
```

Then check the console logs for details about each file.

## Advanced Debugging

If logs still don't show what's wrong, edit `content.js` and add `console.log()` statements:

```javascript
// Example: Log the HTML response to see what we're working with
console.log("HTML Response:", html.substring(0, 1000));

// Example: Check a specific regex pattern
console.log("Pluginfile Match:", html.match(/(https:\/\/edisciplinas\.usp\.br\/pluginfile\.php\/[^"'\s<>()]+)/i));
```

Then reload the extension and test again.

## Report Issues

If you find a consistent problem, provide:
1. **Console output** (copy-paste the logs)
2. **Number of files detected vs. downloaded**
3. **Whether specific files fail** (names are helpful)
4. **Error messages** from the logs
