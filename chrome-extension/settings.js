// Settings page script
document.addEventListener('DOMContentLoaded', async function() {
  const downloadPathInput = document.getElementById('downloadPath');
  const createCourseFolderCheckbox = document.getElementById('createCourseFolder');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusDiv = document.getElementById('status');

  // Load current settings
  await loadSettings();

  // Save button click
  saveBtn.addEventListener('click', async function() {
    const downloadPath = downloadPathInput.value.trim();
    const createCourseFolder = createCourseFolderCheckbox.checked;

    // Validate path
    if (!validatePath(downloadPath)) {
      showStatus('❌ Invalid path. Use forward slashes (/) only.', 'error');
      return;
    }

    // Save to Chrome storage
    await chrome.storage.local.set({
      downloadPath: downloadPath,
      createCourseFolder: createCourseFolder
    });

    showStatus('✅ Settings saved successfully!', 'success');
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 3000);
  });

  // Reset button click
  resetBtn.addEventListener('click', async function() {
    if (confirm('Reset to default settings?')) {
      await chrome.storage.local.set({
        downloadPath: 'e-Disciplinas',
        createCourseFolder: true
      });

      await loadSettings();
      showStatus('✅ Reset to default settings!', 'success');
      setTimeout(() => {
        statusDiv.classList.add('hidden');
      }, 3000);
    }
  });

  async function loadSettings() {
    const result = await chrome.storage.local.get(['downloadPath', 'createCourseFolder']);

    downloadPathInput.value = result.downloadPath || 'e-Disciplinas';
    createCourseFolderCheckbox.checked = result.createCourseFolder !== false; // Default true
  }

  function validatePath(path) {
    // Allow only alphanumeric, hyphens, underscores, dots, and forward slashes
    // Should not contain backslashes or other problematic characters
    return /^[a-zA-Z0-9._\/-]*$/.test(path);
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden', 'success', 'error');
    statusDiv.classList.add(type);
  }
});
