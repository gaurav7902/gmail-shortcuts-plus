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

  const statusElement = document.getElementById("status");
  const toggleButton = document.getElementById("toggle");
  const keyButtons = Array.from(document.querySelectorAll(".key-button"));
  const keybindingMessage = document.getElementById("keybinding-message");
  const resetKeybindingsButton = document.getElementById("reset-keybindings");

  let keybindings = { ...DEFAULT_KEYBINDINGS };
  let listeningAction = null;

  function getStorageApi() {
    if (!extensionApi || !extensionApi.storage || !extensionApi.storage.local) {
      return null;
    }

    return extensionApi.storage.local;
  }

  function getStoredValue(key, fallbackValue) {
    const storage = getStorageApi();
    if (!storage) return Promise.resolve(fallbackValue);

    // Firefox supports promise-based API, Chromium commonly uses callbacks.
    if (typeof storage.get === "function" && storage.get.length <= 1) {
      return storage.get(key).then((result) => {
        return Object.prototype.hasOwnProperty.call(result, key)
          ? result[key]
          : fallbackValue;
      });
    }

    return new Promise((resolve) => {
      storage.get([key], (result) => {
        resolve(
          Object.prototype.hasOwnProperty.call(result, key)
            ? result[key]
            : fallbackValue,
        );
      });
    });
  }

  function setStoredValue(key, value) {
    const storage = getStorageApi();
    if (!storage) return Promise.resolve();

    if (typeof storage.set === "function" && storage.set.length <= 1) {
      return storage.set({ [key]: value });
    }

    return new Promise((resolve) => {
      storage.set({ [key]: value }, () => {
        resolve();
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

  function normalizeKeyValue(key) {
    return key.length === 1 ? key.toLowerCase() : key;
  }

  function getEnabledState() {
    return getStoredValue(ENABLED_STORAGE_KEY, true).then((value) => {
      return typeof value === "boolean" ? value : true;
    });
  }

  function setEnabledState(enabled) {
    return setStoredValue(ENABLED_STORAGE_KEY, enabled);
  }

  function getKeybindings() {
    return getStoredValue(KEYBINDINGS_STORAGE_KEY, DEFAULT_KEYBINDINGS).then(
      normalizeKeybindings,
    );
  }

  function setKeybindings(nextKeybindings) {
    keybindings = normalizeKeybindings(nextKeybindings);
    return setStoredValue(KEYBINDINGS_STORAGE_KEY, keybindings);
  }

  function formatKey(key) {
    const labels = {
      ArrowLeft: "Left Arrow",
      ArrowRight: "Right Arrow",
      ArrowUp: "Up Arrow",
      ArrowDown: "Down Arrow",
      " ": "Space",
    };

    if (Object.prototype.hasOwnProperty.call(labels, key)) return labels[key];
    if (key.length === 1) return key.toUpperCase();

    return key;
  }

  function updateUi(enabled) {
    statusElement.textContent = enabled ? "Active" : "Inactive";
    statusElement.dataset.state = enabled ? "active" : "inactive";
    toggleButton.textContent = enabled ? "Deactivate" : "Activate";
    toggleButton.setAttribute("aria-pressed", enabled ? "true" : "false");
  }

  function updateKeybindingUi() {
    keyButtons.forEach((button) => {
      const action = button.dataset.action;
      const isListening = action === listeningAction;

      button.textContent = isListening
        ? "Press a key..."
        : formatKey(keybindings[action]);
      button.classList.toggle("is-listening", isListening);
      button.setAttribute(
        "aria-label",
        `${action === "newer" ? "Previous email" : "Next email"} keybinding: ${formatKey(
          keybindings[action],
        )}`,
      );
    });
  }

  function setMessage(message, tone) {
    keybindingMessage.textContent = message;
    if (tone) {
      keybindingMessage.dataset.tone = tone;
      return;
    }

    delete keybindingMessage.dataset.tone;
  }

  function beginKeyCapture(action) {
    listeningAction = action;
    setMessage("Press a key to assign it.");
    updateKeybindingUi();
  }

  async function assignKey(action, event) {
    const normalizedKey = normalizeKeyValue(event.key);
    const otherAction = action === "newer" ? "older" : "newer";
    const modifierKeys = ["Alt", "Control", "Meta", "Shift"];

    if (normalizedKey === "Escape") {
      listeningAction = null;
      setMessage("");
      updateKeybindingUi();
      return;
    }

    if (normalizedKey === "Tab") {
      listeningAction = null;
      setMessage("");
      updateKeybindingUi();
      return;
    }

    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      modifierKeys.includes(normalizedKey)
    ) {
      setMessage("Choose a key without Ctrl, Alt, Shift, or Meta.", "error");
      return;
    }

    if (keybindings[otherAction] === normalizedKey) {
      setMessage("That key is already assigned.", "error");
      return;
    }

    await setKeybindings({
      ...keybindings,
      [action]: normalizedKey,
    });

    listeningAction = null;
    setMessage("Keybinding saved.");
    updateKeybindingUi();
  }

  async function init() {
    let enabled = await getEnabledState();
    keybindings = await getKeybindings();
    updateUi(enabled);
    updateKeybindingUi();

    toggleButton.addEventListener("click", async () => {
      enabled = !enabled;
      await setEnabledState(enabled);
      updateUi(enabled);
    });

    keyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        beginKeyCapture(button.dataset.action);
      });
    });

    document.addEventListener("keydown", async (event) => {
      if (!listeningAction) return;

      event.preventDefault();
      event.stopPropagation();
      await assignKey(listeningAction, event);
    });

    resetKeybindingsButton.addEventListener("click", async () => {
      await setKeybindings(DEFAULT_KEYBINDINGS);
      listeningAction = null;
      setMessage("Keybindings reset.");
      updateKeybindingUi();
    });
  }

  init();
})();
