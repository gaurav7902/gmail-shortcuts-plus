(function () {
  'use strict';

  const STORAGE_KEY = 'gmailArrowNavigationEnabled';
  const extensionApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  const statusElement = document.getElementById('status');
  const toggleButton = document.getElementById('toggle');

  function getEnabledState() {
    if (!extensionApi || !extensionApi.storage || !extensionApi.storage.local) {
      return Promise.resolve(true);
    }

    const storage = extensionApi.storage.local;

    // Firefox supports promise-based API, Chromium commonly uses callbacks.
    if (typeof storage.get === 'function' && storage.get.length <= 1) {
      return storage.get(STORAGE_KEY).then((result) => {
        const value = result[STORAGE_KEY];
        return typeof value === 'boolean' ? value : true;
      });
    }

    return new Promise((resolve) => {
      storage.get([STORAGE_KEY], (result) => {
        const value = result[STORAGE_KEY];
        resolve(typeof value === 'boolean' ? value : true);
      });
    });
  }

  function setEnabledState(enabled) {
    if (!extensionApi || !extensionApi.storage || !extensionApi.storage.local) {
      return Promise.resolve();
    }

    const storage = extensionApi.storage.local;

    if (typeof storage.set === 'function' && storage.set.length <= 1) {
      return storage.set({ [STORAGE_KEY]: enabled });
    }

    return new Promise((resolve) => {
      storage.set({ [STORAGE_KEY]: enabled }, () => {
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
