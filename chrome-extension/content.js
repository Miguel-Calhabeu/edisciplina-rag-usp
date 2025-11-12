// Content script for e-Disciplinas RAG USP
// Este script roda nas páginas de disciplina do e-Disciplinas e organiza os downloads

(function() {
  'use strict';

  const DEFAULT_ALLOWED_EXTENSIONS = [
    'pdf', 'txt', 'md', '3g2', '3gp', 'aac', 'aif', 'aifc', 'aiff', 'amr', 'au', 'avi', 'cda', 'm4a',
    'mid', 'mp3', 'mp4', 'mpeg', 'ogg', 'opus', 'ra', 'ram', 'snd', 'wav', 'wma'
  ];

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'downloadAllFiles') {
      downloadAllFiles().then(result => {
        sendResponse({ success: true, ...result });
      }).catch(error => {
        sendResponse({ success: false, message: error.message });
      });
      return true; // Will respond asynchronously
    } else if (request.action === 'getCourseInfo') {
      const info = getCourseInfo();
      sendResponse(info);
      return true;
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

    console.log(`[e-Disciplinas] Encontrados ${fileLinks.length} links de recurso`);

    if (fileLinks.length === 0) {
      throw new Error('Nenhum arquivo encontrado nesta página.');
    }

    const allowedExtensions = await loadAllowedExtensions();
    console.log(`[e-Disciplinas] Extensões permitidas: ${allowedExtensions.length ? allowedExtensions.join(', ') : 'todas'}`);

    const { courseCode, courseName } = getCourseInfo();
    console.log(`[e-Disciplinas] Curso detectado: ${courseCode || 'sem código'} — ${courseName || 'sem nome'}`);

    let downloadedCount = 0;
    let processedCount = 0;
    let skippedCount = 0;
    let errors = [];

    await notifyBackground('start', { total: fileLinks.length, courseCode, courseName });
    notifyPopup('progress', { current: 0, total: fileLinks.length, courseName });

    // Process each file link with a small delay between requests to avoid rate limiting
    for (let i = 0; i < fileLinks.length; i++) {
      const link = fileLinks[i];
      try {
        // Add a small delay between fetches to avoid rate limiting (100ms)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Get the file name from the link text
        const fileName = extractFileName(link);
        const resourceUrl = link.href;

        console.log(`[e-Disciplinas] [${i+1}/${fileLinks.length}] Processando: ${fileName}`);
        console.log(`[e-Disciplinas] Resource URL: ${resourceUrl}`);

        // Fetch the resource view page with follow redirect
        let response;
        let html;
        const FETCH_TIMEOUT = 8000; // 8 second timeout (reduced from 15s for better UX)

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
            throw new Error(`Tempo esgotado após ${FETCH_TIMEOUT}ms`);
          }
          throw fetchError;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        html = await response.text();
      } catch (fetchError) {
        // If normal fetch fails, try manual follow of redirects (for edge cases)
        console.warn(`[e-Disciplinas] Falha ao seguir redirecionamento: ${fetchError.message}`);
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
            console.log(`[e-Disciplinas] Redirecionamento manual para: ${redirectLocation}`);
            response = await fetch(redirectLocation);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status} ao seguir redirecionamento`);
            }
            html = await response.text();
          } else {
            throw fetchError; // Re-throw original error if no redirect header
          }
        } catch (manualError) {
          throw new Error(`Falha ao buscar arquivo: ${manualError.message}`);
        }
      }

        console.log(`[e-Disciplinas] Recebidos ${html.length} bytes, URL final: ${response.url}`);

        // The final URL after redirects is in response.url
        const fileUrl = extractFileUrl(html, response.url, resourceUrl);

        if (!fileUrl) {
          const err = `Não foi possível encontrar o link do arquivo ${fileName}`;
          console.warn(`[e-Disciplinas] ${err}`);
          errors.push(err);
          continue;
        }

        console.log(`[e-Disciplinas] Link do arquivo extraído: ${fileUrl}`);

        // Extract file extension from the URL
        const fileExtension = extractFileExtension(fileUrl);
        const normalizedExtension = fileExtension ? fileExtension.toLowerCase() : null;
        const fileNameWithExtension = fileExtension ? `${fileName}.${fileExtension}` : fileName;

        console.log(`[e-Disciplinas] Extensão: ${normalizedExtension || 'sem extensão'}, Nome final: ${fileNameWithExtension}`);

        if (!isExtensionAllowed(normalizedExtension, allowedExtensions)) {
          console.log(`[e-Disciplinas] Ignorando arquivo por extensão não permitida: ${normalizedExtension || 'desconhecida'}`);
          skippedCount++;
          continue;
        }

        // Sanitize filename to remove invalid characters
        const sanitizedFilename = sanitizeFilename(fileNameWithExtension);
        if (sanitizedFilename !== fileNameWithExtension) {
          console.log(`[e-Disciplinas] Nome sanitizado: ${fileNameWithExtension} → ${sanitizedFilename}`);
        }

        const sectionName = extractSectionName(link);
        const sanitizedSection = sectionName ? sanitizePathPart(sectionName) : null;

        // Trigger the download using Chrome's download API via background script
        try {
          const downloadResponse = await chrome.runtime.sendMessage({
            action: 'downloadFile',
            url: fileUrl,
            filename: sanitizedFilename,
            courseCode: courseCode,
            courseName: courseName,
            sectionName: sanitizedSection
          });

          if (downloadResponse && downloadResponse.success) {
            console.log(`[e-Disciplinas] ✓ Download iniciado: ${fileNameWithExtension}`);
            downloadedCount++;
          } else {
            const bgError = downloadResponse ? downloadResponse.error : 'Unknown download error';
            console.error(`[e-Disciplinas] Falha no download: ${bgError}`);
            errors.push(`Download falhou para ${fileNameWithExtension}: ${bgError}`);
          }
        } catch (downloadError) {
          console.error(`[e-Disciplinas] Erro ao solicitar download: ${downloadError.message}`);
          errors.push(`Não foi possível iniciar ${fileNameWithExtension}`);
        }
      } catch (error) {
        const errMsg = `Erro ao processar arquivo: ${error.message}`;
        console.error(`[e-Disciplinas] ${errMsg}`);
        errors.push(errMsg);
      }
      finally {
        processedCount++;
        notifyPopup('progress', { current: processedCount, total: fileLinks.length, courseName });
        await notifyBackground('progress', {
          current: processedCount,
          total: fileLinks.length,
          courseCode,
          courseName
        });
      }
    }

    // Build response message
    let message = `Downloads iniciados para ${downloadedCount} arquivo(s).`;
    if (errors.length > 0) {
      message += `\n\nErros (${errors.length}):\n${errors.join('\n')}`;
    }

    if (skippedCount > 0) {
      message += `\n\nIgnorados (${skippedCount}): extensões não permitidas.`;
    }

    console.log(`[e-Disciplinas] Resumo: ${message}`);

    if (errors.length > 0) {
      notifyPopup('error', { message });
      await notifyBackground('error', { courseName, courseCode, errors });
    } else {
      notifyPopup('complete', { message });
      await notifyBackground('complete', {
        total: fileLinks.length,
        courseCode,
        courseName
      });
    }

    return { message, courseCode, courseName };
  }

  async function loadAllowedExtensions() {
    try {
      const result = await chrome.storage.local.get(['allowedExtensions']);
      const normalized = normalizeExtensionsList(result.allowedExtensions);
      if (normalized === null) {
        return DEFAULT_ALLOWED_EXTENSIONS;
      }
      return normalized;
    } catch (error) {
      console.warn(`[e-Disciplinas] Falha ao carregar extensões permitidas: ${error.message}`);
      return DEFAULT_ALLOWED_EXTENSIONS;
    }
  }

  function normalizeExtensionsList(raw) {
    if (raw === undefined || raw === null) {
      return null;
    }

    if (Array.isArray(raw)) {
      return sanitizeExtensionsList(raw);
    }

    if (typeof raw === 'string') {
      return sanitizeExtensionsList(raw.split(','));
    }

    return [];
  }

  function sanitizeExtensionsList(list) {
    return Array.from(new Set(list
      .map(ext => String(ext).trim().replace(/^\./, '').toLowerCase())
      .filter(ext => ext.length > 0 && /^[a-z0-9]+$/.test(ext))));
  }

  function isExtensionAllowed(extension, allowedList) {
    if (!Array.isArray(allowedList) || allowedList.length === 0) {
      return true;
    }

    if (!extension) {
      return false;
    }

    return allowedList.includes(extension.toLowerCase());
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
   * Sanitize filename to remove invalid characters that Chrome rejects
   * Removes: colons, parentheses, and other problematic chars
   */
  function sanitizeFilename(filename) {
    // Remove invalid filename characters
    // Replace colons, parentheses, asterisks, question marks, quotes, pipes, angle brackets
    let sanitized = filename.replace(/[:<>"|?*()]/g, '');

    // Replace common problematic patterns
    sanitized = sanitized.replace(/[\\/]/g, '-'); // Replace slashes with dash
    sanitized = sanitized.replace(/\s+/g, '_');   // Spaces to underscores
    sanitized = sanitized.replace(/_+/g, '_');    // Remove multiple underscores
    sanitized = sanitized.replace(/^_|_$/g, '');  // Remove leading/trailing underscores

    return sanitized || 'file';
  }

  function sanitizePathPart(name) {
    if (!name) return '';
    return name
      .replace(/[\\/:*?"<>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
  }

  function extractCourseName() {
    const heading = document.querySelector('.page-header h1, .page-header-headings h1, .page-title, .header-main h1');
    if (heading) {
      return heading.textContent.trim();
    }

    const breadcrumb = document.querySelector('.breadcrumb-item.current, .breadcrumb-last');
    if (breadcrumb) {
      return breadcrumb.textContent.trim();
    }

    const title = document.title.replace(/^Curso:\s*/i, '').trim();
    return title || null;
  }

  function extractSectionName(link) {
    const activity = link.closest('.activity, li.activity');
    if (!activity) {
      return null;
    }

    const section = activity.closest('li.section, li.topic, section[class*="course-section"], .course-section');
    if (section) {
      const sectionHeading = section.querySelector('.sectionname, .section-title, h3.sectionname, h3.section-title, header h3');
      if (sectionHeading) {
        return sectionHeading.textContent.trim();
      }
    }

    const heading = activity.querySelector('.sectionname, .section-title');
    if (heading) {
      return heading.textContent.trim();
    }

    return null;
  }

  function getCourseInfo() {
    const courseCode = extractCourseCode();
    const courseName = extractCourseName();
    return {
      found: Boolean(courseName || courseCode),
      courseCode: courseCode || null,
      courseName: courseName || 'Disciplina não identificada'
    };
  }

  async function notifyBackground(status, payload) {
    try {
      await chrome.runtime.sendMessage({
        action: 'downloadStatus',
        status,
        payload
      });
    } catch (err) {
      console.debug('[e-Disciplinas] Notificação de plano de fundo indisponível:', err?.message);
    }
  }

  function notifyPopup(type, payload) {
    try {
      chrome.runtime.sendMessage({
        context: 'popup',
        type,
        payload
      }, () => void chrome.runtime.lastError);
    } catch (error) {
      // Popup pode não estar aberto; ignore silenciosamente
    }
  }

  // Make the function available globally for debugging
  window.edisciplinasDownloadAllFiles = downloadAllFiles;
})();
