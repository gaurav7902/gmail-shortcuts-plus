# Gmail Shortcuts Plus

A lightweight browser extension that enhances Gmail navigation with shortcuts.

## Features

- **Left Arrow**: Jump to the previous email
- **Right Arrow**: Jump to the next email
- **Toggle**: Enable or disable navigation on demand via the popup
- **Customizable Keybindings**: Set different keys for previous and next email navigation from the popup

## Installation

### Firefox

1. Download `gmail-shortcuts-plus-extension.zip`
2. Unzip the file to a local folder
3. Open Firefox and go to `about:debugging`
4. Click **This Firefox** in the left sidebar
5. Click **Load Temporary Add-on...** and select `manifest.json` from the unzipped folder
6. Open Gmail and use the configured navigation keys (default left right arrows)

### Chromium (Chrome/Edge/Brave)

1. Download `gmail-shortcuts-plus-extension.zip`
2. Unzip the file to a local folder
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked" and select `manifest.json` from the unzipped folder
6. Open Gmail and use the configured navigation keys (default left right arrows)

## Contributing

Contributions are welcome! Feel free to fork, improve, and submit pull requests.

## Future Enhancements

- [ ] **Expanded Navigation**: Add support for `Up`/`Down` arrows to move through the email list without leaving the current thread.
- [ ] **Visual Feedback**: Implement subtle highlights or animations to indicate the transition between emails.
- [ ] **Advanced Gmail View Support**: Optimize navigation for split-pane and conversation layouts.
- [ ] **Quick-Action Shortcuts**: Add shortcuts for marking emails as read/unread or archiving using keyboard combinations.
