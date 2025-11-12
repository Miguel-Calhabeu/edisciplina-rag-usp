// Content script for e-Disciplinas File Downloader
// This script runs on course pages and provides file downloading functionality

(function() {
  'use strict';

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'downloadAllFiles') {
      downloadAllFiles().then(result => {
        sendResponse({ success: true, message: result });
      }).catch(error => {
        sendResponse({ success: false, message: error.message });
      });
      return true; // Will respond asynchronously
    }
  });

  /**
   * Download all file resources from the course page
   * Finds all aalink stretched-link anchors and follows redirects to get final file URLs
   */
  async function downloadAllFiles() {
    // Find all resource links (mod/resource/view.php)
    const resourceLinks = document.querySelectorAll('a.aalink.stretched-link');
    const fileLinks = Array.from(resourceLinks).filter(link => {
      return link.href && link.href.includes('/mod/resource/view.php');
    });

    console.log(`[e-Disciplinas] Found ${fileLinks.length} resource links`);

    if (fileLinks.length === 0) {
      return 'No files found to download';
    }

    // Try to extract course code from page
    const courseCode = extractCourseCode();
    console.log(`[e-Disciplinas] Course code: ${courseCode || 'Not found'}`);

    let downloadedCount = 0;
    let errors = [];

    // Process each file link with a small delay between requests to avoid rate limiting
    for (let i = 0; i < fileLinks.length; i++) {
      const link = fileLinks[i];
      try {
        // Add a small delay between fetches to avoid rate limiting (200ms)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Get the file name from the link text
        const fileName = extractFileName(link);
        const resourceUrl = link.href;
        
        console.log(`[e-Disciplinas] [${i+1}/${fileLinks.length}] Processing: ${fileName}`);
        console.log(`[e-Disciplinas] Resource URL: ${resourceUrl}`);

        // Fetch the resource view page with follow redirect
        let response;
        let html;
        const FETCH_TIMEOUT = 15000; // 15 second timeout
        
        try {
          // Create an AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
          
          try {
            // First try with automatic redirect following
            response = await fetch(resourceUrl, { 
              redirect: 'follow',
              signal: controller.signal 
            });
            clearTimeout(timeoutId);
          } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
              throw new Error(`Timeout after ${FETCH_TIMEOUT}ms`);
            }
            throw fetchError;
          }
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          html = await response.text();
        } catch (fetchError) {
          // If normal fetch fails, try manual follow of redirects (for edge cases)
          console.warn(`[e-Disciplinas] Fetch with redirect failed: ${fetchError.message}`);
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            
            response = await fetch(resourceUrl, { 
              redirect: 'manual',
              signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            const redirectLocation = response.headers.get('location');
            if (redirectLocation) {
              console.log(`[e-Disciplinas] Got manual redirect to: ${redirectLocation}`);
              response = await fetch(redirectLocation);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status} on redirect`);
              }
              html = await response.text();
            } else {
              throw fetchError; // Re-throw original error if no redirect header
            }
          } catch (manualError) {
            throw new Error(`Fetch failed: ${manualError.message}`);
          }
        }
        
        console.log(`[e-Disciplinas] Received ${html.length} bytes, final URL: ${response.url}`);

        // The final URL after redirects is in response.url
        const fileUrl = extractFileUrl(html, response.url, resourceUrl);

        if (!fileUrl) {
          const err = `Could not find file URL for ${fileName}`;
          console.warn(`[e-Disciplinas] ${err}`);
          errors.push(err);
          continue;
        }

        console.log(`[e-Disciplinas] File URL extracted: ${fileUrl}`);

        // Extract file extension from the URL
        const fileExtension = extractFileExtension(fileUrl);
        const fileNameWithExtension = fileExtension ? `${fileName}.${fileExtension}` : fileName;

        console.log(`[e-Disciplinas] File extension: ${fileExtension || 'none'}, Final filename: ${fileNameWithExtension}`);

        // Trigger the download using Chrome's download API via background script
        await chrome.runtime.sendMessage({
          action: 'downloadFile',
          url: fileUrl,
          filename: fileNameWithExtension,
          courseCode: courseCode
        });

        console.log(`[e-Disciplinas] ✓ Download initiated for: ${fileNameWithExtension}`);
        downloadedCount++;
      } catch (error) {
        const errMsg = `Error processing file: ${error.message}`;
        console.error(`[e-Disciplinas] ${errMsg}`);
        errors.push(errMsg);
      }
    }

    // Build response message
    let message = `Initiated ${downloadedCount} file download(s)`;
    if (errors.length > 0) {
      message += `\n\nErrors (${errors.length}):\n${errors.join('\n')}`;
    }

    console.log(`[e-Disciplinas] Summary: ${message}`);
    return message;
  }

  /**
   * Extract file name from the link element
   */
  function extractFileName(link) {
    // Try to get from instancename span
    const instanceName = link.querySelector('.instancename');
    if (instanceName) {
      let text = instanceName.textContent.trim();
      // Clean up the text - remove extra whitespace and line breaks
      text = text.replace(/\s+/g, ' ').trim();
      // Remove common module indicators
      text = text.replace(/\s+(Arquivo|File|Resource)$/i, '');
      return text.replace(/\s+/g, '_') || 'file';
    }

    // Fallback to link text
    let text = link.textContent.trim();
    text = text.replace(/\s+/g, ' ');
    // Remove "Arquivo" or similar module indicators
    text = text.replace(/^\s*(Arquivo|File|Resource)\s*/i, '');
    return text.replace(/\s+/g, '_') || 'file';
  }

  /**
   * Extract file extension from URL
   * Gets the file extension from the URL query parameters or file path
   */
  function extractFileExtension(url) {
    if (!url) return null;

    try {
      // Parse the URL
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Remove query parameters
      const pathWithoutQuery = pathname.split('?')[0];

      // Get the last part of the path (filename)
      const fileName = pathWithoutQuery.split('/').pop();

      // Extract extension
      const extensionMatch = fileName.match(/\.([^.]+)$/);
      if (extensionMatch) {
        return extensionMatch[1].toLowerCase();
      }
    } catch (e) {
      console.error('Error extracting extension:', e);
    }

    return null;
  }

  /**
   * Extract the actual file URL from the resource page
   * Looks for redirect or direct links to pluginfile.php
   */
  function extractFileUrl(html, baseUrl, resourceUrl) {
    // Strategy 1: Check if the final URL (after redirects) is already the pluginfile URL
    if (baseUrl && baseUrl.includes('/pluginfile.php/')) {
      console.log(`[e-Disciplinas] Strategy 1 matched: final URL is pluginfile`);
      return baseUrl;
    }

    // Strategy 2: Look for pluginfile.php URLs in the HTML with full protocol
    const pluginFileMatch = html.match(/(https:\/\/edisciplinas\.usp\.br\/pluginfile\.php\/[^"'\s<>()]+)/i);
    if (pluginFileMatch) {
      console.log(`[e-Disciplinas] Strategy 2 matched: full protocol pluginfile URL`);
      return cleanUrl(pluginFileMatch[1]);
    }

    // Strategy 3: Look for pluginfile without protocol
    const relativePluginMatch = html.match(/(\/pluginfile\.php\/[^"'\s<>()]+)/i);
    if (relativePluginMatch && baseUrl) {
      try {
        const url = new URL(relativePluginMatch[1], baseUrl);
        console.log(`[e-Disciplinas] Strategy 3 matched: relative pluginfile URL`);
        return url.href;
      } catch (e) {
        console.error('URL construction failed:', e);
      }
    }

    // Strategy 4: Meta refresh tag
    const metaRefresh = html.match(/<meta\s+http-equiv=["']?refresh["']?\s+content=["']?[^"'>]*url=["']?([^"'<>\s)]+)/i);
    if (metaRefresh) {
      console.log(`[e-Disciplinas] Strategy 4 matched: meta refresh tag`);
      return resolveUrl(metaRefresh[1], baseUrl);
    }

    // Strategy 5: JavaScript location.href
    const locationMatch = html.match(/(?:location\.href|window\.location\.href|document\.location)\s*=\s*["']([^"']+)['"]/i);
    if (locationMatch) {
      console.log(`[e-Disciplinas] Strategy 5 matched: JavaScript location`);
      return resolveUrl(locationMatch[1], baseUrl);
    }

    // Strategy 6: data-attributes with URL
    const dataAttrMatch = html.match(/data-(?:href|src|url|file)=["']([^"'>]+pluginfile[^"'<>()]*)['"]/i);
    if (dataAttrMatch) {
      console.log(`[e-Disciplinas] Strategy 6 matched: data attribute`);
      return resolveUrl(dataAttrMatch[1], baseUrl);
    }

    // Strategy 7: Download link in anchor tag
    const downloadMatch = html.match(/<a[^>]+href=["']([^"'>]*pluginfile[^"'<>()]*)['"]/i);
    if (downloadMatch) {
      console.log(`[e-Disciplinas] Strategy 7 matched: anchor tag pluginfile link`);
      return resolveUrl(downloadMatch[1], baseUrl);
    }

    // Strategy 8: Direct file link (might be in src or other attributes)
    const directFileMatch = html.match(/(?:href|src|url)=["']([^"']*\.(?:pdf|doc|docx|xls|xlsx|ppt|pptx|zip|txt|jpg|png|gif|mp4)(?:\?[^"']*)?)['"]/i);
    if (directFileMatch) {
      console.log(`[e-Disciplinas] Strategy 8 matched: direct file extension link`);
      return resolveUrl(directFileMatch[1], baseUrl);
    }

    // Strategy 9: Search for any HTTP URL containing pluginfile (more lenient)
    const anyPluginUrl = html.match(/(https?:\/\/[^\s"'<>]*pluginfile[^\s"'<>()]*)/i);
    if (anyPluginUrl) {
      console.log(`[e-Disciplinas] Strategy 9 matched: any pluginfile URL`);
      return cleanUrl(anyPluginUrl[1]);
    }

    // If nothing found, return the resource page URL itself in case it's being hosted there
    if (baseUrl && baseUrl !== resourceUrl && baseUrl.includes('edisciplinas.usp.br')) {
      console.log(`[e-Disciplinas] Using final response URL as fallback`);
      return baseUrl;
    }

    console.log(`[e-Disciplinas] ✗ No extraction strategy matched`);
    return null;
  }

  /**
   * Resolve relative or absolute URLs
   */
  function resolveUrl(url, baseUrl) {
    if (!url) return null;

    // Already absolute URL
    if (url.startsWith('http')) {
      return cleanUrl(url);
    }

    // Try to construct from base
    if (baseUrl) {
      try {
        return cleanUrl(new URL(url, baseUrl).href);
      } catch (e) {
        console.error('URL resolution failed:', e);
      }
    }

    return null;
  }

  /**
   * Clean up URL by removing fragment and extra parameters if needed
   */
  function cleanUrl(url) {
    if (!url) return null;

    try {
      // Remove fragment
      const urlObj = new URL(url);
      return urlObj.href.split('#')[0];
    } catch (e) {
      return url;
    }
  }

  /**
   * Extract course code from the page
   * Looks for course code in page title or meta tags
   */
  function extractCourseCode() {
    // Try to get from page title (e.g., "Curso: SSC0534 - Course Name")
    const titleMatch = document.title.match(/([A-Z]+\d+)/);
    if (titleMatch) {
      return titleMatch[1];
    }

    // Try to get from course name heading
    const heading = document.querySelector('.page-header h1, .page-title, [role="heading"]');
    if (heading) {
      const headingText = heading.textContent;
      const codeMatch = headingText.match(/([A-Z]+\d+)/);
      if (codeMatch) {
        return codeMatch[1];
      }
    }

    // Try to get from meta tags
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      const metaMatch = meta.content.match(/([A-Z]+\d+)/);
      if (metaMatch) {
        return metaMatch[1];
      }
    }

    // Default fallback
    return null;
  }  // Make the function available globally for debugging
  window.edisciplinasDownloadAllFiles = downloadAllFiles;
})();
