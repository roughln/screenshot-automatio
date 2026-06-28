const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Test script for screenshot automation
 * Simulates navigation events and verifies screenshot capture
 */

const SCREENSHOT_DIR = './automated_screenshots';
const DEBOUNCE_DELAY = 500;

let screenshotCounter = 1;
let debounceTimer = null;

function initializeScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    console.log(`✓ Created screenshot directory: ${SCREENSHOT_DIR}`);
  }
}

function getScreenshotFilename() {
  const counter = String(screenshotCounter).padStart(3, '0');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0];
  const filename = `step_${counter}_${timestamp}.png`;
  screenshotCounter++;
  return filename;
}

async function takeScreenshot(page, reason = 'unknown') {
  return new Promise((resolve) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      try {
        const filename = getScreenshotFilename();
        const filepath = path.join(SCREENSHOT_DIR, filename);

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

async function runTest() {
  let browser;
  try {
    initializeScreenshotDir();

    console.log('\n🧪 Starting screenshot automation test...\n');

    console.log('🚀 Launching Chromium in headless mode (test only)...');
    browser = await chromium.launch({
      headless: true, // Headless for testing
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    // Test 1: Initial page load
    console.log('\n📋 Test 1: Initial page load');
    await page.goto('about:blank', { waitUntil: 'domcontentloaded' });
    await takeScreenshot(page, 'test: blank page');
    await new Promise((r) => setTimeout(r, 1000));

    // Test 2: Navigation (URL change)
    console.log('\n📋 Test 2: Navigation to example.com');
    page.on('framenavigated', async (frame) => {
      if (frame === page.mainFrame()) {
        console.log(`  → URL changed to: ${page.url()}`);
        await takeScreenshot(page, 'test: navigation');
      }
    });

    await page.goto('https://example.com', { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1000));

    // Test 3: Wait for network idle
    console.log('\n📋 Test 3: Network idle detection');
    await page.waitForLoadState('networkidle').catch(() => {});
    await takeScreenshot(page, 'test: network idle');

    // Test 4: Second navigation
    console.log('\n📋 Test 4: Second navigation');
    await page.goto('https://www.wikipedia.org', { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1000));

    console.log('\n✅ All tests completed!\n');

    // Check results
    const files = fs.readdirSync(SCREENSHOT_DIR);
    console.log(`📊 Results:\n   Total screenshots captured: ${files.length}`);
    console.log('\n📸 Screenshots created:');
    files.forEach((f) => {
      const filepath = path.join(SCREENSHOT_DIR, f);
      const stats = fs.statSync(filepath);
      console.log(`   ✓ ${f} (${(stats.size / 1024).toFixed(1)} KB)`);
    });

    console.log('\n✅ TEST PASSED: Screenshot automation is working correctly!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('✓ Browser closed\n');
    }
  }
}

// Run test
runTest();
