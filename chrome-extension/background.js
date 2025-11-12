// Service Worker for e-Disciplinas File Downloader
// Handles download API calls with custom directory organization

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadFile') {
    handleDownload(request, sendResponse);
    return true; // Will respond asynchronously
  }
});

/**
 * Handle file download with custom directory organization
 */
async function handleDownload(request, sendResponse) {
  try {
    // Get user settings
    const settings = await chrome.storage.local.get(['downloadPath', 'createCourseFolder']);
    const customPath = settings.downloadPath || 'e-Disciplinas';
    const createCourseFolder = settings.createCourseFolder !== false; // Default true

    // Build the filename with directory path
    let filename = request.filename;

    // Add course code folder if enabled and provided
    if (createCourseFolder && request.courseCode) {
      filename = `${request.courseCode}/${filename}`;
    }

    // Add custom path prefix
    if (customPath && customPath !== '.') {
      filename = `${customPath}/${filename}`;
    }

    // Use Chrome's download API
    chrome.downloads.download({
      url: request.url,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}
