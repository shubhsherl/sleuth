# Sleuth - Beautiful Network Inspector

Sleuth is a Chrome extension that provides a beautiful and feature-rich network inspector, offering a better visual experience compared to Chrome's native Network panel.

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

### From Source

1. Clone this repository
2. Run `pnpm install` to install dependencies
3. Run `pnpm dev` to start the development server
4. Go to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `build/chrome-mv3-dev` directory

## Usage

### Network Inspector

1. Open Chrome DevTools (F12 or Ctrl+Shift+I / Cmd+Option+I)
2. Click on the "Sleuth" tab
3. Browse the web and see all network requests in the panel

### Quick Shortcuts

Enable shortcuts in the extension popup or settings page to:
- Copy URL
- Copy Authorization header
- Copy as cURL command

These shortcuts appear automatically when network requests are made.

## Development

This project is built with [Plasmo](https://www.plasmo.com/), a browser extension framework for building extensions with React.

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build extension
pnpm build

# Package extension
pnpm package
```

## License

MIT

## Author

Built with ❤️ by [Shubham Singh](https://github.com/shubhsherl)
