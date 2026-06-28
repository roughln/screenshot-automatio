const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const SCREENSHOT_DIR = './automated_screenshots';
const DEBOUNCE_DELAY = 500; // ms
const APP_URL = 'http://localhost:3000'; // Change this to your app URL

// State management
let screenshotCounter = 1;
let debounceTimer = null;
let lastNavigationUrl = null;

// Initialize screenshot directory
function initializeScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    console.log(`✓ Created screenshot directory: ${SCREENSHOT_DIR}`);
  }
}

// Generate screenshot filename with incrementing counter
function getScreenshotFilename() {
  const counter = String(screenshotCounter).padStart(3, '0');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0];
  const filename = `step_${counter}_${timestamp}.png`;
  screenshotCounter++;
  return filename;
}

// Debounced screenshot function
async function takeScreenshot(page, reason = 'unknown') {
  return new Promise((resolve) => {
    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new debounce timer
    debounceTimer = setTimeout(async () => {
      try {
        const filename = getScreenshotFilename();
        const filepath = path.join(SCREENSHOT_DIR, filename);

        // Take screenshot of the viewport only
        await page.screenshot({
          path: filepath,
          type: 'png',
        });

        console.log(`📸 Screenshot saved: ${filename} (${reason})`);
        resolve(true);
      } catch (error) {
        console.error(`❌ Failed to take screenshot: ${error.message}`);
        resolve(false);
      }
    }, DEBOUNCE_DELAY);
  });
}

// Monitor for navigation changes
function setupNavigationListener(page) {
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      const currentUrl = page.url();
      if (currentUrl !== lastNavigationUrl) {
        lastNavigationUrl = currentUrl;
        console.log(`🔄 Navigation detected: ${currentUrl}`);
        await takeScreenshot(page, 'URL changed');
      }
    }
  });
}

// Monitor for load state changes
function setupLoadStateListener(page) {
  page.on('load', async () => {
    console.log('⏳ Page load event detected');
    await takeScreenshot(page, 'page load');
  });

  page.on('loadstate', async (loadState) => {
    console.log(`📊 Load state changed: ${loadState}`);
    if (loadState === 'networkidle' || loadState === 'load') {
      await takeScreenshot(page, `load state: ${loadState}`);
    }
  });

  // Also listen to networkidle state via waitForLoadState
  // This provides more robust detection
  (async () => {
    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
        // Timeout is acceptable, just means page is interactive
      });
    } catch (error) {
      // Ignore errors
    }
  })();
}

// Main function
async function main() {
  let browser;
  try {
    initializeScreenshotDir();

    console.log('🚀 Launching Chromium in non-headless mode...');
    browser = await chromium.launch({
      headless: false, // Allow manual interaction
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage', // Avoid memory issues
      ],
    });

    console.log('📖 Creating new page...');
    const page = await browser.newPage();

    // Set viewport to capture app area (excluding toolbars)
    await page.setViewportSize({ width: 1280, height: 720 });

    // Take initial screenshot
    console.log(`🌐 Navigating to ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });

    // Setup event listeners
    setupNavigationListener(page);
    setupLoadStateListener(page);

    // Take first screenshot
    await takeScreenshot(page, 'initial load');

    console.log('\n✅ Script is ready! You can now manually interact with the app.');
    console.log('📸 Screenshots will be automatically captured on navigation and page load events.');
    console.log(`💾 Screenshots are being saved to: ${path.resolve(SCREENSHOT_DIR)}`);
    console.log('\n💡 Tip: Keep this terminal running while using the app.');
    console.log('   Press Ctrl+C to stop the script.\n');

    // Keep the script running
    await new Promise((resolve) => {
      process.on('SIGINT', () => {
        console.log('\n\n🛑 Stopping screenshot automation...');
        resolve();
      });
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('✓ Browser closed');
    }
  }
}

// Run the script
main();
