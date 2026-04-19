(function () {
  'use strict';

  const STORAGE_KEY = 'gmailArrowNavigationEnabled';

  const statusElement = document.getElementById('status');
  const toggleButton = document.getElementById('toggle');

  function getEnabledState() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const value = result[STORAGE_KEY];
        resolve(typeof value === 'boolean' ? value : true);
      });
    });
  }

  function setEnabledState(enabled) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: enabled }, () => {
        resolve();
      });
    });
  }

  function updateUi(enabled) {
    statusElement.textContent = enabled ? 'Status: Active' : 'Status: Inactive';
    toggleButton.textContent = enabled ? 'Deactivate' : 'Activate';
    toggleButton.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  async function init() {
    let enabled = await getEnabledState();
    updateUi(enabled);

    toggleButton.addEventListener('click', async () => {
      enabled = !enabled;
      await setEnabledState(enabled);
      updateUi(enabled);
    });
  }

  init();
})();
