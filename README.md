# Sleuth - Beautiful Network Inspector

Sleuth is a browser extension that provides a beautiful and feature-rich network inspector, offering a better visual experience compared to the native Network panel.

## Features

- 🔍 **Beautiful Network Inspector**: View network requests in a clean, organized interface
- 🔄 **Real-time Updates**: See network requests as they happen
- 🧩 **Advanced Filtering**: Filter requests by URL, method, status code, and content type
- 🎨 **Beautiful Response Viewer**: JSON responses are displayed in a collapsible tree view
- 📋 **Quick Shortcuts**: Copy URL, auth headers, and cURL commands with a single click
- ⚙️ **Customizable Settings**: Configure shortcuts and appearance to your preference

## Installation

### From Chrome Web Store (Coming Soon)

1. Go to [Chrome Web Store](#)
2. Click "Add to Chrome"
3. Click "Add extension"

### From Firefox Add-ons (Coming Soon)

1. Go to [Firefox Add-ons](#)
2. Click "Add to Firefox"
3. Click "Add"

### From Source

#### Chrome

1. Clone this repository
2. Run `pnpm install` to install dependencies
3. Run `pnpm dev` to start the development server
4. Go to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `build/chrome-mv3-dev` directory

#### Firefox

1. Clone this repository
2. Run `pnpm install` to install dependencies
3. Run `pnpm dev:firefox` to start the development server
4. Go to `about:debugging#/runtime/this-firefox`
5. Click "Load Temporary Add-on..."
6. Select any file in the `build/firefox-mv2-dev` directory

## Usage

### Network Inspector

1. Open Browser DevTools (F12 or Ctrl+Shift+I / Cmd+Option+I)
2. Click on the "Sleuth" tab
3. Browse the web and see all network requests in the panel

### Quick Shortcuts

Enable shortcuts in the extension popup or settings page to:
- Copy URL
- Copy Authorization header
- Copy as cURL command

These shortcuts appear automatically when network requests are made.

#### Keyboard Shortcuts

- **Alt+Shift+S**: Toggle Sleuth sidebar in Firefox 

These shortcuts are registered through the browser's commands API, making them visible in Firefox's keyboard shortcuts menu (Settings > Keyboard Shortcuts).

### Firefox Network Monitoring

When using Sleuth in Firefox, you need to follow these additional steps to get network monitoring working properly:

1. Open Firefox and navigate to `about:config`
2. Search for `devtools.chrome.enabled` and set it to `true` 
3. Search for `devtools.debugger.remote-enabled` and set it to `true`
4. Restart Firefox after making these changes

#### Troubleshooting Firefox Network Monitoring

If you don't see network requests in Firefox:

1. Make sure you have the required permissions allowed in Firefox
2. Try opening and closing the DevTools panel
3. Visit a different website and monitor network requests there
4. Check the Firefox Browser Console for any error messages (Menu → More tools → Browser Console)

Note: Firefox has stricter security permissions than Chrome, so some advanced features may be limited.

## Development

This project is built with [Plasmo](https://www.plasmo.com/), a browser extension framework for building extensions with React.

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev            # For Chrome
pnpm dev:firefox    # For Firefox

# Build extension
pnpm build          # For Chrome (creates chrome-mv3-prod.zip)
pnpm build:firefox  # For Firefox (creates firefox-mv2-prod.zip)

# Package extension
pnpm package        # For Chrome
pnpm package:firefox # For Firefox
```

## Distribution

### Chrome Web Store

To create a production-ready zip file for submission to the Chrome Web Store:

1. Run `pnpm build` or `make zip-prod` in the terminal
2. The zip file will be created at `build/chrome-mv3-prod.zip`
3. Upload this file to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)

### Firefox Add-ons

To create a production-ready zip file for submission to Firefox Add-ons:

1. Run `pnpm build:firefox` in the terminal
2. The zip file will be created at `build/firefox-mv2-prod.zip`
3. Upload this file to the [Firefox Add-on Developer Hub](https://addons.mozilla.org/en-US/developers/)

## License

MIT

## Author

Built with ❤️ by [Shubham Singh](https://github.com/shubhsherl)
