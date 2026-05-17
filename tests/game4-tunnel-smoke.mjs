import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.GAME4_URL ?? 'http://127.0.0.1:5173/game4/';
const artifactDir = process.env.GAME4_ARTIFACT_DIR ?? path.resolve('artifacts');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
const consoleErrors = [];
const failedResponses = [];

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('response', (response) => {
  if (response.status() >= 400) {
    failedResponses.push(`${response.status()} ${response.url()}`);
  }
});

try {
  await fs.mkdir(artifactDir, { recursive: true });
  await page.goto(`${baseUrl}?smoke=tunnel-${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForFunction(() => window.__gameDebug?.getState, null, { timeout: 30000 });
  await page.evaluate(() => window.__gameDebug.setFreeDrive());

  await page.evaluate(() => window.__gameDebug.teleportToTunnel(0, 'approaching'));
  await waitForTunnelState(page, ['approachingTunnel']);
  await assertPageNonBlank(page, path.join(artifactDir, 'tunnel-approaching-1366x768.png'));

  await page.evaluate(() => window.__gameDebug.teleportToTunnel(0, 'inside'));
  await waitForTunnelState(page, ['insideTunnel', 'enteringTunnel', 'exitingTunnel']);
  await assertTunnelDebug(page, 'inside');
  await assertPageNonBlank(page, path.join(artifactDir, 'tunnel-inside-1366x768.png'));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(450);
  await assertTunnelDebug(page, 'mobile-resize');
  await assertPageNonBlank(page, path.join(artifactDir, 'tunnel-inside-390x844.png'));

  await page.setViewportSize({ width: 430, height: 932 });
  await page.waitForTimeout(300);
  await assertPageNonBlank(page, path.join(artifactDir, 'tunnel-inside-430x932.png'));

  await page.evaluate(() => window.__gameDebug.reset());
  await page.waitForFunction(() => window.__gameDebug.getState().tunnelState === 'outsideTunnel', null, { timeout: 15000 });

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
  }

  if (failedResponses.length > 0) {
    throw new Error(`HTTP errors: ${failedResponses.slice(0, 3).join(' | ')}`);
  }

  const finalState = await page.evaluate(() => window.__gameDebug.getState());
  console.log(JSON.stringify({
    activeLoopsCount: finalState.activeLoopsCount,
    screenshots: artifactDir,
    status: 'passed',
    tunnelStateAfterReset: finalState.tunnelState
  }, null, 2));
} finally {
  await browser.close();
}

async function waitForTunnelState(page, states) {
  await page.waitForFunction((expectedStates) => {
    const state = window.__gameDebug?.getState?.();
    return state && expectedStates.includes(state.tunnelState);
  }, states, { timeout: 20000 });
}

async function assertTunnelDebug(page, label) {
  const state = await page.evaluate(() => window.__gameDebug.getState());

  if (!Number.isFinite(state.lightingFactor) || state.lightingFactor <= 0 || state.lightingFactor > 1) {
    throw new Error(`${label}: invalid lightingFactor ${state.lightingFactor}`);
  }

  if (!state.playerPosition || !Number.isFinite(state.playerPosition.x) || !Number.isFinite(state.playerPosition.z)) {
    throw new Error(`${label}: invalid playerPosition`);
  }

  if (state.activeLoopsCount !== 1) {
    throw new Error(`${label}: expected one active scene loop, got ${state.activeLoopsCount}`);
  }
}

async function assertPageNonBlank(page, screenshotPath) {
  const buffer = await page.screenshot({ path: screenshotPath, fullPage: true });
  const png = PNG.sync.read(buffer);
  const first = `${png.data[0]},${png.data[1]},${png.data[2]},${png.data[3]}`;
  let differentPixels = 0;

  for (let index = 0; index < png.data.length; index += 4) {
    const current = `${png.data[index]},${png.data[index + 1]},${png.data[index + 2]},${png.data[index + 3]}`;
    if (current !== first) differentPixels += 1;
    if (differentPixels > 512) return;
  }

  throw new Error(`Screenshot appears blank: ${screenshotPath}`);
}
