# Playwright Screenshot Automation

Automatically capture screenshots of a web application every time the page changes or navigates, with manual interaction support.

## Features

✨ **Key Capabilities:**
- Launches Chromium in **non-headless mode** for manual interaction
- Automatically captures screenshots when:
  - URL changes (navigation detected)
  - Page reaches `load` state
  - Network becomes `networkidle`
- **Smart debouncing** (500ms) to prevent rapid duplicate screenshots
- Captures **viewport only** (excludes browser UI)
- **Chronological naming** with incrementing counters and timestamps
- Saved to `./automated_screenshots/` folder

## Prerequisites

- Node.js 14+ (check with `node --version`)
- npm or yarn

## Installation

```bash
npm install
```

This will install Playwright and download the Chromium browser.

## Usage

### 1. Configure the Target URL

Edit `screenshot-automation.js` and update the `APP_URL` variable:

```javascript
const APP_URL = 'http://localhost:3000'; // Change this to your app URL
```

### 2. Run the Script

```bash
npm start
```

Or directly:

```bash
node screenshot-automation.js
```

### 3. Manual Interaction

Once the script starts:
- A Chromium browser window will open to your app URL
- The script monitors in the background
- **Manually navigate, click, fill forms, etc.**
- Screenshots are **automatically captured** on page changes/loads

### 4. Check Screenshots

Screenshots are saved to `./automated_screenshots/` with names like:
```
step_001_2026-06-28T18-31-18-182.png
step_002_2026-06-28T18-31-25-456.png
step_003_2026-06-28T18-31-42-789.png
```

### Stop the Script

Press `Ctrl+C` in the terminal to stop monitoring and close the browser.

## Configuration

Edit `screenshot-automation.js` to customize:

```javascript
const SCREENSHOT_DIR = './automated_screenshots';  // Output folder
const DEBOUNCE_DELAY = 500;                        // Wait 500ms after load
const APP_URL = 'http://localhost:3000';           // Your app URL
```

## Screenshot Triggers

The script captures a screenshot when:

| Trigger | Reason |
|---------|--------|
| URL changes | `framenavigated` event on main frame |
| Page load event | `load` event fired |
| Network idle | After all network requests complete |
| Initial load | First screenshot on startup |

All screenshots are **debounced by 500ms** to avoid capturing rapid updates during initial page load.

## Viewport Size

The default viewport is set to **1280×720** pixels. Modify in the script:

```javascript
await page.setViewportSize({ width: 1280, height: 720 });
```

## Cleanup

To delete all screenshots:

```bash
npm run clean
```

Or manually:

```bash
rm -rf automated_screenshots/
```

## Troubleshooting

### "Chromium not found" error
Re-install Playwright browsers:
```bash
npx playwright install chromium
```

### No screenshots being captured
1. Verify the app is running at the configured `APP_URL`
2. Check that the page actually changes/navigates
3. Look at console output for errors or navigation logs
4. Ensure file system permissions allow creating the `automated_screenshots` folder

### Slow screenshot capture
- Increase `DEBOUNCE_DELAY` if you want more spacing between screenshots
- Reduce viewport size if performance is an issue

## Example Workflow

```bash
# Terminal 1: Start your web app
cd my-app && npm start

# Terminal 2: Run this script
npm start

# Browser opens → Manually navigate/interact → Screenshots auto-captured → Ctrl+C to stop
```

## Notes

- ✅ Uses **Chromium in non-headless mode** for manual control
- ✅ Screenshots capture **viewport only** (no UI elements)
- ✅ **Debounced** to prevent spam screenshots
- ✅ **Chronologically ordered** filenames
- ✅ Timestamps are **ISO 8601 formatted** for sorting

## License

ISC
