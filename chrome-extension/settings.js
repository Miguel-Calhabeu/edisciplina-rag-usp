// Script da página de configurações
document.addEventListener('DOMContentLoaded', async () => {
  const downloadPathInput = document.getElementById('downloadPath');
  const createCourseFolderCheckbox = document.getElementById('createCourseFolder');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusDiv = document.getElementById('status');
  const versionTag = document.getElementById('version');
  const namingOptions = Array.from(document.querySelectorAll('input[name="namingStructure"]'));

  updateVersionTag();
  await loadSettings();

  saveBtn.addEventListener('click', async () => {
    const downloadPath = downloadPathInput.value.trim();
    const createCourseFolder = createCourseFolderCheckbox.checked;
    const namingStructure = getSelectedStructure();

    if (!validatePath(downloadPath)) {
      showStatus('❌ Caminho inválido. Utilize apenas caracteres permitidos e barras (/).', 'error');
      return;
    }

    await chrome.storage.local.set({
      downloadPath,
      createCourseFolder,
      namingStructure
    });

    showStatus('✅ Configurações salvas com sucesso!', 'success');
    hideStatusLater();
  });

  resetBtn.addEventListener('click', async () => {
    if (confirm('Deseja realmente voltar às configurações padrão?')) {
      await chrome.storage.local.set({
        downloadPath: 'e-Disciplinas',
        createCourseFolder: true,
        namingStructure: 'code-file'
      });

      await loadSettings();
      showStatus('✅ Configurações restauradas para o padrão.', 'success');
      hideStatusLater();
    }
  });

  async function loadSettings() {
    const result = await chrome.storage.local.get(['downloadPath', 'createCourseFolder', 'namingStructure']);

    downloadPathInput.value = result.downloadPath || 'e-Disciplinas';
    createCourseFolderCheckbox.checked = result.createCourseFolder !== false; // padrão verdadeiro

    const structure = result.namingStructure || 'code-file';
    const activeOption = namingOptions.find(option => option.value === structure) || namingOptions[0];
    if (activeOption) {
      activeOption.checked = true;
    }
  }

  function getSelectedStructure() {
    const active = namingOptions.find(option => option.checked);
    return active ? active.value : 'code-file';
  }

  function validatePath(path) {
    return /^[a-zA-Z0-9._\/-]*$/.test(path);
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
