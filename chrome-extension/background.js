// Service Worker for e-Disciplinas RAG USP
// Responsável por organizar diretórios personalizados e emitir notificações nativas

const NOTIFICATION_IDS = {
  progress: 'edisciplinas-progress'
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadFile') {
    handleDownload(request, sendResponse);
    return true; // Will respond assincronamente
  }

  if (request.action === 'downloadStatus') {
    handleDownloadStatus(request.status, request.payload)
      .then(() => sendResponse({ acknowledged: true }))
      .catch(error => {
        console.warn('[e-Disciplinas BG] Falha ao manipular status:', error.message);
        sendResponse({ acknowledged: false });
      });
    return true;
  }
});

async function handleDownload(request, sendResponse) {
  try {
    const settings = await chrome.storage.local.get(['downloadPath', 'createCourseFolder', 'namingStructure']);
    const downloadPath = settings.downloadPath ?? 'e-Disciplinas';
    const createCourseFolder = settings.createCourseFolder !== false; // Mantém compatibilidade
    const namingStructure = settings.namingStructure || 'code-file';

    const fullPath = buildDownloadPath({
      basePath: downloadPath,
      createCourseFolder,
      namingStructure,
      filename: request.filename,
      courseCode: request.courseCode,
      courseName: request.courseName,
      sectionName: request.sectionName
    });

    console.log(`[e-Disciplinas BG] Downloading: ${request.filename}`);
    console.log(`[e-Disciplinas BG] Full path: ${fullPath}`);
    console.log(`[e-Disciplinas BG] URL: ${request.url}`);

    chrome.downloads.download({
      url: request.url,
      filename: fullPath,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error(`[e-Disciplinas BG] Download failed: ${chrome.runtime.lastError.message}`);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log(`[e-Disciplinas BG] ✓ Download initiated with ID: ${downloadId}`);
        sendResponse({ success: true, downloadId });
      }
    });
  } catch (error) {
    console.error(`[e-Disciplinas BG] Error: ${error.message}`);
    sendResponse({ success: false, error: error.message });
  }
}

function buildDownloadPath({ basePath, createCourseFolder, namingStructure, filename, courseCode, courseName, sectionName }) {
  const segments = [];

  if (basePath && basePath !== '.') {
    const cleanedBase = basePath.split('/').map(sanitizePathSegment).filter(Boolean);
    segments.push(...cleanedBase);
  }

  switch (namingStructure) {
    case 'code-section-file':
      if (courseCode) {
        segments.push(sanitizePathSegment(courseCode));
      } else if (courseName) {
        segments.push(sanitizePathSegment(courseName));
      }
      if (sectionName) {
        segments.push(sanitizePathSegment(sectionName));
      }
      break;
    case 'discipline-file':
      if (courseName) {
        segments.push(sanitizePathSegment(courseName));
      }
      break;
    case 'code-file':
    default:
      if (createCourseFolder) {
        if (courseCode) {
          segments.push(sanitizePathSegment(courseCode));
        } else if (courseName) {
          segments.push(sanitizePathSegment(courseName));
        }
      }
      break;
  }

  if (!segments.length && createCourseFolder && courseCode) {
    segments.push(sanitizePathSegment(courseCode));
  }

  segments.push(filename);
  return segments.filter(Boolean).join('/');
}

async function handleDownloadStatus(status, payload = {}) {
  switch (status) {
    case 'start':
      await createOrUpdateProgressNotification({
        title: 'Download iniciado',
        message: payload.courseName ? `Baixando arquivos de ${payload.courseName}` : 'Baixando arquivos',
        progress: 0
      });
      break;
    case 'progress':
      if (typeof payload.current === 'number' && typeof payload.total === 'number' && payload.total > 0) {
        const percentage = Math.round((payload.current / payload.total) * 100);
        await createOrUpdateProgressNotification({
          title: 'Baixando arquivos…',
          message: `${payload.current}/${payload.total} concluído(s)`,
          progress: percentage
        });
      }
      break;
    case 'complete':
      await createBasicNotification({
        title: 'Download concluído',
        message: payload.courseName ? `Arquivos de ${payload.courseName} baixados com sucesso.` : 'Todos os downloads foram concluídos.',
        priority: 1
      });
      await clearProgressNotification();
      break;
    case 'error':
      await createBasicNotification({
        title: 'Falha no download',
        message: Array.isArray(payload.errors) && payload.errors.length
          ? payload.errors[0]
          : 'Não foi possível concluir o download. Verifique sua conexão ou tente novamente.',
        priority: 2
      });
      await clearProgressNotification();
      break;
    default:
      break;
  }
}

function createOrUpdateProgressNotification({ title, message, progress }) {
  return new Promise((resolve) => {
    chrome.notifications.create(NOTIFICATION_IDS.progress, {
      type: 'progress',
      iconUrl: 'icon.png',
      title,
      message,
      progress,
      priority: 0
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[e-Disciplinas BG] Notificação indisponível:', chrome.runtime.lastError.message);
      }
      resolve();
    });
  });
}

function createBasicNotification({ title, message, priority = 0 }) {
  return new Promise((resolve) => {
    chrome.notifications.create('', {
      type: 'basic',
      iconUrl: 'icon.png',
      title,
      message,
      priority
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[e-Disciplinas BG] Notificação indisponível:', chrome.runtime.lastError.message);
      }
      resolve();
    });
  });
}

function clearProgressNotification() {
  return new Promise((resolve) => {
    chrome.notifications.clear(NOTIFICATION_IDS.progress, () => resolve());
  });
}

function sanitizePathSegment(value) {
  if (!value) return '';
  return value
    .toString()
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+/g, '_');
}
