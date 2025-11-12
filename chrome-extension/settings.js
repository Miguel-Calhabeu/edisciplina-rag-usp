// Script da página de configurações
document.addEventListener('DOMContentLoaded', async () => {
  const downloadPathInput = document.getElementById('downloadPath');
  const createCourseFolderCheckbox = document.getElementById('createCourseFolder');
  const allowedExtensionsInput = document.getElementById('allowedExtensions');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusDiv = document.getElementById('status');
  const versionTag = document.getElementById('version');
  const namingOptions = Array.from(document.querySelectorAll('input[name="namingStructure"]'));

  const DEFAULT_ALLOWED_EXTENSIONS = [
    'pdf', 'txt', 'md', '3g2', '3gp', 'aac', 'aif', 'aifc', 'aiff', 'amr', 'au', 'avi', 'cda', 'm4a',
    'mid', 'mp3', 'mp4', 'mpeg', 'ogg', 'opus', 'ra', 'ram', 'snd', 'wav', 'wma'
  ];

  updateVersionTag();
  await loadSettings();

  saveBtn.addEventListener('click', async () => {
    const downloadPath = downloadPathInput.value.trim();
    const createCourseFolder = createCourseFolderCheckbox.checked;
    const namingStructure = getSelectedStructure();
    const parsedExtensions = parseExtensionsInput(allowedExtensionsInput.value);

    if (!validatePath(downloadPath)) {
      showStatus('❌ Caminho inválido. Utilize apenas caracteres permitidos e barras (/).', 'error');
      return;
    }

    if (parsedExtensions === null) {
      showStatus('❌ Informe extensões válidas separadas por vírgula (ex.: pdf, txt, mp3).', 'error');
      return;
    }

    await chrome.storage.local.set({
      downloadPath,
      createCourseFolder,
      namingStructure,
      allowedExtensions: parsedExtensions
    });

    allowedExtensionsInput.value = formatExtensions(parsedExtensions);

    showStatus('✅ Configurações salvas com sucesso!', 'success');
    hideStatusLater();
  });

  resetBtn.addEventListener('click', async () => {
    if (confirm('Deseja realmente voltar às configurações padrão?')) {
      await chrome.storage.local.set({
        downloadPath: 'e-Disciplinas',
        createCourseFolder: true,
        namingStructure: 'code-file',
        allowedExtensions: DEFAULT_ALLOWED_EXTENSIONS
      });

      await loadSettings();
      showStatus('✅ Configurações restauradas para o padrão.', 'success');
      hideStatusLater();
    }
  });

  async function loadSettings() {
    const result = await chrome.storage.local.get(['downloadPath', 'createCourseFolder', 'namingStructure', 'allowedExtensions']);

    downloadPathInput.value = result.downloadPath || 'e-Disciplinas';
    createCourseFolderCheckbox.checked = result.createCourseFolder !== false; // padrão verdadeiro

    const structure = result.namingStructure || 'code-file';
    const activeOption = namingOptions.find(option => option.value === structure) || namingOptions[0];
    if (activeOption) {
      activeOption.checked = true;
    }

    const storedExtensions = normalizeStoredExtensions(result.allowedExtensions);
    if (storedExtensions === null) {
      allowedExtensionsInput.value = formatExtensions(DEFAULT_ALLOWED_EXTENSIONS);
    } else if (storedExtensions.length > 0) {
      allowedExtensionsInput.value = formatExtensions(storedExtensions);
    } else {
      allowedExtensionsInput.value = '';
    }
  }

  function getSelectedStructure() {
    const active = namingOptions.find(option => option.checked);
    return active ? active.value : 'code-file';
  }

  function validatePath(path) {
    return /^[a-zA-Z0-9._\/-]*$/.test(path);
  }

  function parseExtensionsInput(value) {
    if (!value || !value.trim()) {
      return [];
    }

    const candidates = value
      .split(',')
      .map(ext => ext.trim())
      .filter(Boolean)
      .map(ext => ext.replace(/^\./, '').toLowerCase());

    if (candidates.some(ext => !/^[a-z0-9]+$/.test(ext))) {
      return null;
    }

    return Array.from(new Set(candidates));
  }

  function normalizeStoredExtensions(raw) {
    if (raw === undefined || raw === null) {
      return null;
    }

    if (Array.isArray(raw)) {
      return sanitizeExtensions(raw);
    }

    if (typeof raw === 'string') {
      const parsed = parseExtensionsInput(raw);
      return parsed === null ? [] : parsed;
    }

    return [];
  }

  function sanitizeExtensions(list) {
    return Array.from(new Set(list
      .map(ext => String(ext).trim().replace(/^\./, '').toLowerCase())
      .filter(ext => /^[a-z0-9]+$/.test(ext))));
  }

  function formatExtensions(list) {
    if (!list || list.length === 0) {
      return '';
    }

    return list.join(', ');
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden', 'success', 'error');
    statusDiv.classList.add(type);
  }

  function hideStatusLater() {
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 3200);
  }

  function updateVersionTag() {
    try {
      const manifest = chrome.runtime.getManifest();
      if (manifest?.version) {
        versionTag.textContent = `v${manifest.version}`;
      }
    } catch (error) {
      console.warn('Não foi possível obter a versão da extensão.', error);
    }
  }
});
