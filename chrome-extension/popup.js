// Popup script for e-Disciplinas File Downloader
document.addEventListener('DOMContentLoaded', function() {
  const downloadBtn = document.getElementById('downloadBtn');
  const statusDiv = document.getElementById('status');
  const loadingDiv = document.getElementById('loading');
  const settingsLink = document.getElementById('settingsLink');

  // Settings link click
  settingsLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  downloadBtn.addEventListener('click', async function() {
    // Disable button and show loading
    downloadBtn.disabled = true;
    loadingDiv.classList.remove('hidden');
    statusDiv.classList.add('hidden');
    statusDiv.classList.remove('success', 'error');

    try {
      // Get the active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      // Send message to content script
      const response = await chrome.tabs.sendMessage(activeTab.id, {
        action: 'downloadAllFiles'
      });

      // Show result
      if (response.success) {
        let displayMessage = response.message;

        // Add helpful tips for partial downloads
        if (response.message.includes('0 file download')) {
          displayMessage += '\n\n💡 Tip: Check the browser console (F12) for detailed error messages.';
        } else if (response.message.includes('Error')) {
          displayMessage += '\n\n💡 Tip: Some files may have failed. Check the console for details.';
        } else {
          displayMessage += '\n\n✓ Downloads initiated! Check your Downloads folder.';
        }

        statusDiv.textContent = displayMessage;
        statusDiv.classList.add('success');
      } else {
        statusDiv.textContent = '❌ Error: ' + response.message;
        statusDiv.classList.add('error');
      }
    } catch (error) {
      statusDiv.textContent = '❌ Error: ' + error.message + '\n\nMake sure you are on an e-Disciplinas course page.';
      statusDiv.classList.add('error');
    } finally {
      // Hide loading and show status
      loadingDiv.classList.add('hidden');
      statusDiv.classList.remove('hidden');

      // Re-enable button after 3 seconds to allow new attempts
      setTimeout(() => {
        downloadBtn.disabled = false;
      }, 3000);
    }
  });
});
