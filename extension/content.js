(function () {
  "use strict";

  const ENABLED_STORAGE_KEY = "gmailArrowNavigationEnabled";
  const KEYBINDINGS_STORAGE_KEY = "gmailArrowNavigationKeybindings";
  const DEFAULT_KEYBINDINGS = {
    newer: "ArrowLeft",
    older: "ArrowRight",
  };
  const extensionApi =
    typeof browser !== "undefined"
      ? browser
      : typeof chrome !== "undefined"
        ? chrome
        : null;

  let isNavigationEnabled = true;
  let keybindings = { ...DEFAULT_KEYBINDINGS };

  const NAVIGATION_SELECTORS = {
    newer: [
      '[role="button"][aria-label="Newer"][data-tooltip]' +
        ', [role="button"][data-tooltip="Newer"]' +
        ', [role="button"][aria-label="Newer"]',
      'div[aria-label="Newer"]',
      'div[data-tooltip*="Newer"]',
    ],
    older: [
      '[role="button"][aria-label="Older"][data-tooltip]' +
        ', [role="button"][data-tooltip="Older"]' +
        ', [role="button"][aria-label="Older"]',
      'div[aria-label="Older"]',
      'div[data-tooltip*="Older"]',
    ],
  };

  function getStorageApi() {
    return extensionApi && extensionApi.storage && extensionApi.storage.local
      ? extensionApi.storage.local
      : null;
  }

  function getRuntimeApi() {
    return extensionApi && extensionApi.runtime ? extensionApi.runtime : null;
  }

  function getStoredValue(key, fallbackValue) {
    const storage = getStorageApi();
    if (!storage) return Promise.resolve(fallbackValue);

    if (typeof storage.get === "function" && storage.get.length <= 1) {
      return storage.get(key).then((result) => {
        return Object.prototype.hasOwnProperty.call(result, key)
          ? result[key]
          : fallbackValue;
      });
    }

    return new Promise((resolve) => {
      storage.get([key], (result) => {
        const runtime = getRuntimeApi();
        if (runtime && runtime.lastError) {
          resolve(fallbackValue);
          return;
        }

        resolve(
          Object.prototype.hasOwnProperty.call(result, key)
            ? result[key]
            : fallbackValue,
        );
      });
    });
  }

  function normalizeKeybindings(value) {
    if (!value || typeof value !== "object") return { ...DEFAULT_KEYBINDINGS };

    return {
      newer:
        typeof value.newer === "string" && value.newer
          ? value.newer
          : DEFAULT_KEYBINDINGS.newer,
      older:
        typeof value.older === "string" && value.older
          ? value.older
          : DEFAULT_KEYBINDINGS.older,
    };
  }

  function normalizeEventKey(key) {
    return key.length === 1 ? key.toLowerCase() : key;
  }

  function loadNavigationEnabledState() {
    return getStoredValue(ENABLED_STORAGE_KEY, true).then((storedValue) => {
      return typeof storedValue === "boolean" ? storedValue : true;
    });
  }

  function loadKeybindings() {
    return getStoredValue(KEYBINDINGS_STORAGE_KEY, DEFAULT_KEYBINDINGS).then(
      normalizeKeybindings,
    );
  }

  function isVisible(element) {
    if (!(element instanceof HTMLElement)) return false;

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return false;

    return element.offsetParent !== null;
  }

  function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) return false;

    if (target.isContentEditable) return true;

    return Boolean(
      target.closest(
        'input, textarea, select, [contenteditable], [role="textbox"], [aria-multiline="true"]',
      ),
    );
  }

  function findActionForKey(key) {
    const normalizedKey = normalizeEventKey(key);

    if (normalizedKey === keybindings.newer) return "newer";
    if (normalizedKey === keybindings.older) return "older";
    return null;
  }

  function findEnabledNavButton(action) {
    const selectors = NAVIGATION_SELECTORS[action];
    if (!selectors) return null;

    for (const selector of selectors) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        const isDisabled =
          button.getAttribute("aria-disabled") === "true" ||
          button.getAttribute("disabled") !== null;

        if (!isDisabled && isVisible(button)) return button;
      }
    }

    return null;
  }

  document.addEventListener("keydown", function (event) {
    if (!isNavigationEnabled) return;

    if (event.repeat) return;

    // Respect combinations used by Gmail/browser shortcuts.
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;

    const action = findActionForKey(event.key);
    if (!action) return;

    if (isEditableTarget(event.target)) return;

    const navButton = findEnabledNavButton(action);
    if (!navButton) return;

    navButton.click();
    event.preventDefault();
  });

  Promise.all([loadNavigationEnabledState(), loadKeybindings()]).then(function (
    values,
  ) {
    isNavigationEnabled = values[0];
    keybindings = values[1];
  });

  // Keep state in sync when popup toggles the feature.
  if (extensionApi && extensionApi.storage && extensionApi.storage.onChanged) {
    extensionApi.storage.onChanged.addListener(function (changes, areaName) {
      if (
        areaName !== "local" ||
        (!Object.prototype.hasOwnProperty.call(changes, ENABLED_STORAGE_KEY) &&
          !Object.prototype.hasOwnProperty.call(
            changes,
            KEYBINDINGS_STORAGE_KEY,
          ))
      ) {
        return;
      }

      if (Object.prototype.hasOwnProperty.call(changes, ENABLED_STORAGE_KEY)) {
        const nextEnabledValue = changes[ENABLED_STORAGE_KEY].newValue;
        if (typeof nextEnabledValue === "boolean") {
          isNavigationEnabled = nextEnabledValue;
        }
      }

      if (
        Object.prototype.hasOwnProperty.call(changes, KEYBINDINGS_STORAGE_KEY)
      ) {
        keybindings = normalizeKeybindings(
          changes[KEYBINDINGS_STORAGE_KEY].newValue,
        );
      }
    });
  }
})();
