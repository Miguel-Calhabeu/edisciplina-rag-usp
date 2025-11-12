// Popup script for e-Disciplinas RAG USP
document.addEventListener('DOMContentLoaded', async () => {
  const downloadBtn = document.getElementById('downloadBtn');
  const statusDiv = document.getElementById('status');
  const settingsLink = document.getElementById('settingsLink');
  const courseNameEl = document.getElementById('courseName');
  const courseCodeEl = document.getElementById('courseCode');
  const progressBlock = document.getElementById('progressBlock');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');

  let currentCourseCode = null;
  let defaultButtonLabel = downloadBtn.textContent.trim();

  // Listen for progress updates from the content script / background
  chrome.runtime.onMessage.addListener((request) => {
    if (!request || request.context !== 'popup') {
      return;
    }

    if (request.type === 'progress') {
      updateProgress(request.payload);
    } else if (request.type === 'complete') {
      showStatus('✅ Download concluído! Verifique sua pasta de downloads.', 'success');
      resetButton('Download concluído!');
      hideProgressSoon();
    } else if (request.type === 'error') {
      const message = request.payload?.message || 'Não foi possível concluir o download.';
      showStatus(`❌ ${message}`, 'error');
      resetButton('Tentar novamente');
      hideProgressSoon();
    }
  });

  // Settings navigation
  settingsLink.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Detect course information on load
  await detectCourseInfo();

  downloadBtn.addEventListener('click', async () => {
    const { tabId } = await getActiveTab();
    if (!tabId) {
      showStatus('❌ Abra a página de uma disciplina no e-Disciplinas para iniciar o download.', 'error');
      resetButton();
      return;
    }

    prepareForDownload();

    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: 'downloadAllFiles' });

      if (response?.success) {
        // Conteúdo script controlará feedback contínuo
        if (response.courseCode) {
          currentCourseCode = response.courseCode;
          courseCodeEl.textContent = `Código: ${response.courseCode}`;
          courseCodeEl.classList.remove('hidden');
        }
      } else {
        const message = response?.message || 'Falha ao comunicar com a página.';
        showStatus(`❌ ${message}`, 'error');
        resetButton('Tentar novamente');
        hideProgressSoon();
      }
    } catch (error) {
      showStatus(`❌ ${translateError(error)}`, 'error');
      resetButton('Tentar novamente');
      hideProgressSoon();
    }
  });

  async function detectCourseInfo() {
    const { tabId } = await getActiveTab();
    if (!tabId) {
      courseNameEl.textContent = 'Abra uma disciplina no e-Disciplinas';
      return;
    }

    try {
      const info = await chrome.tabs.sendMessage(tabId, { action: 'getCourseInfo' });
      if (info?.found) {
        courseNameEl.textContent = info.courseName;
        if (info.courseCode) {
          courseCodeEl.textContent = `Código: ${info.courseCode}`;
          courseCodeEl.classList.remove('hidden');
          currentCourseCode = info.courseCode;
        } else {
          courseCodeEl.classList.add('hidden');
        }
      } else {
        courseNameEl.textContent = 'Disciplina não detectada';
        courseCodeEl.classList.add('hidden');
      }
    } catch (error) {
      courseNameEl.textContent = 'Disciplina não detectada';
      courseCodeEl.classList.add('hidden');
    }
  }

  async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs?.[0];
    return { tabId: activeTab?.id };
  }

  function prepareForDownload() {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Baixando…';
    statusDiv.classList.add('hidden');
    statusDiv.classList.remove('success', 'error');
    progressBlock.classList.remove('hidden');
    setProgress(0, 'Preparando downloads…');
  }

  function updateProgress({ current, total, courseName }) {
    if (typeof total === 'number' && total > 0) {
      const percentage = Math.round((current / total) * 100);
      const labelCourse = courseName || courseNameEl.textContent;
      setProgress(percentage, `Baixando arquivos (${current}/${total}) — ${labelCourse}`);
      downloadBtn.textContent = `Baixando… (${current}/${total})`;
    }
  }

  function setProgress(value, label) {
    const clamped = Math.max(0, Math.min(100, value));
    progressFill.style.width = `${clamped}%`;
    progressBlock.setAttribute('aria-hidden', 'false');
    const bar = progressFill.parentElement;
    if (bar) {
      bar.setAttribute('aria-valuenow', String(clamped));
    }
    progressLabel.textContent = label;
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden', 'success', 'error');
    statusDiv.classList.add(type);
  }

  function hideProgressSoon() {
    setTimeout(() => {
      progressBlock.classList.add('hidden');
      progressBlock.setAttribute('aria-hidden', 'true');
      setProgress(0, '');
    }, 1800);
  }

  function resetButton(label = defaultButtonLabel) {
    downloadBtn.disabled = false;
    downloadBtn.textContent = label;
    setTimeout(() => {
      downloadBtn.textContent = defaultButtonLabel;
    }, 3000);
  }

  function translateError(error) {
    if (error?.message?.includes('Receiving end does not exist')) {
      return 'Abra uma disciplina no e-Disciplinas antes de tentar novamente.';
    }
    return error?.message || 'Ocorreu um erro inesperado.';
  }
});
