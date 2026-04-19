(function () {
  'use strict';

  const STORAGE_KEY = 'gmailArrowNavigationEnabled';

  let isNavigationEnabled = true;

  const NAVIGATION_SELECTORS = {
    ArrowLeft: [
      '[role="button"][aria-label="Newer"][data-tooltip]'
        + ', [role="button"][data-tooltip="Newer"]'
        + ', [role="button"][aria-label="Newer"]',
      'div[aria-label="Newer"]',
      'div[data-tooltip*="Newer"]',
    ],
    ArrowRight: [
      '[role="button"][aria-label="Older"][data-tooltip]'
        + ', [role="button"][data-tooltip="Older"]'
        + ', [role="button"][aria-label="Older"]',
      'div[aria-label="Older"]',
      'div[data-tooltip*="Older"]',
    ],
  };

  function getStorageApi() {
    return chrome && chrome.storage && chrome.storage.local ? chrome.storage.local : null;
  }

  function loadNavigationEnabledState() {
    const storage = getStorageApi();
    if (!storage) return Promise.resolve(true);

    return new Promise((resolve) => {
      storage.get([STORAGE_KEY], (result) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve(true);
          return;
        }

        const storedValue = result[STORAGE_KEY];
        resolve(typeof storedValue === 'boolean' ? storedValue : true);
      });
    });
  }

  function saveNavigationEnabledState(enabled) {
    const storage = getStorageApi();
    if (!storage) return;

    storage.set({ [STORAGE_KEY]: enabled }, function () {
      // Ignore runtime errors silently and keep session state in memory.
    });
  }

  function isVisible(element) {
    if (!(element instanceof HTMLElement)) return false;

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    return element.offsetParent !== null;
  }

  function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) return false;

    if (target.isContentEditable) return true;

    return Boolean(
      target.closest(
        'input, textarea, select, [contenteditable], [role="textbox"], [aria-multiline="true"]'
      )
    );
  }

  function findEnabledNavButton(key) {
    const selectors = NAVIGATION_SELECTORS[key];
    if (!selectors) return null;

    for (const selector of selectors) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        const isDisabled =
          button.getAttribute('aria-disabled') === 'true' ||
          button.getAttribute('disabled') !== null;

        if (!isDisabled && isVisible(button)) return button;
      }
    }

    return null;
  }

  document.addEventListener('keydown', function (event) {
    if (!isNavigationEnabled) return;

    if (event.repeat) return;

    // Respect combinations used by Gmail/browser shortcuts.
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    if (isEditableTarget(event.target)) return;

    const navButton = findEnabledNavButton(event.key);
    if (!navButton) return;

    navButton.click();
    event.preventDefault();
  });

  loadNavigationEnabledState().then(function (enabled) {
    isNavigationEnabled = enabled;
  });

  // Keep state in sync when popup toggles the feature.
  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== 'local' || !Object.prototype.hasOwnProperty.call(changes, STORAGE_KEY)) {
      return;
    }

    const nextValue = changes[STORAGE_KEY].newValue;
    if (typeof nextValue === 'boolean') {
      isNavigationEnabled = nextValue;
    }
  });
})();

