// TEST 002: run against an already running local Next.js server.
// TEST_URL, CHROME_PATH and ARTIFACT_DIR can override local defaults.
// No editor POSTs or asset writes; screenshots go outside the checkout by default.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const artifactDir = process.env.ARTIFACT_DIR || '/tmp/test002-dice-feedback';
await fs.mkdir(artifactDir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  defaultViewport: { width: 1440, height: 900 },
});
const checks = [];
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3000/play-v2', {
    waitUntil: 'domcontentloaded', timeout: 60000,
  });
  await page.waitForFunction(() => window.__testBridge && document.querySelector('button[aria-label="Đổ xúc xắc"]'));
  await page.waitForFunction(() => {
    const loading = document.querySelector('div.transition-opacity.duration-700');
    return loading?.classList.contains('pointer-events-none') && getComputedStyle(loading).opacity === '0';
  });
  const button = 'button[aria-busy]';
  await page.screenshot({ path: path.join(artifactDir, 'ready.png') });

  // Force a known double only in this browser's test fixture. Production RNG is unchanged.
  await page.evaluate(() => {
    const bridge = window.__testBridge;
    window.__diceFeedbackStates = [];
    const observe = () => {
      const button = document.querySelector('button[aria-busy]');
      if (button) window.__diceFeedbackStates.push({ label: button.getAttribute('aria-label'), busy: button.getAttribute('aria-busy'), disabled: button.disabled });
    };
    new MutationObserver(observe).observe(document.body, { attributes: true, childList: true, subtree: true });
    bridge.engine.getActivePlayer().position = 39;
    window.__diceFeedbackRolls = 0;
    bridge.rollDice = () => {
      window.__diceFeedbackRolls++;
      const result = bridge.engine.rollDice([1, 1]);
      bridge.notify();
      return result;
    };
    const roll = document.querySelector('button[aria-busy]');
    // All events share one JavaScript task, before React can commit a disabled button.
    for (let i = 0; i < 5; i++) roll.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
  });
  await page.waitForFunction(() => window.__diceFeedbackStates.some(state => state.label === 'Đang tung...' && state.busy === 'true' && state.disabled));
  assert.equal(await page.evaluate(() => window.__diceFeedbackRolls), 1);
  assert.equal(await page.evaluate(() => window.__testBridge.engine.getActivePlayer().position), 1);
  // Snapshot timing is renderer-dependent; the busy label is asserted above.
  await page.screenshot({ path: path.join(artifactDir, 'after-click.png') });
  checks.push('same-task repeated clicks + Space invoke exactly one roll, double moves exactly two tiles');

  await page.waitForFunction(() => document.querySelector('button[aria-busy]')?.getAttribute('aria-busy') === 'false');
  assert.equal(await page.$eval(button, el => el.disabled), true);
  assert.equal(await page.evaluate(() => window.__testBridge.engine.state.gamePhase), 'AWAIT_DECISION');
  await page.evaluate(() => {
    document.querySelector('button[aria-busy]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
  });
  assert.equal(await page.evaluate(() => window.__diceFeedbackRolls), 1);
  checks.push('double does not unlock roll while purchase decision is pending');

  // Use the existing purchase UI to complete the action and retain the double bonus.
  await page.evaluate(() => {
    const buy = [...document.querySelectorAll('button')].find(el => /^MUA\s/.test(el.textContent.trim()));
    assertExists(buy);
    buy.click();
    function assertExists(value) { if (!value) throw new Error('Purchase button missing'); }
  });
  await page.waitForSelector('button[aria-label="Đổ tiếp (đôi)"]:not([disabled])');
  await page.click('button[aria-label="Đổ tiếp (đôi)"]');
  assert.equal(await page.evaluate(() => window.__diceFeedbackRolls), 2);
  checks.push('purchase completes and the legitimate double bonus can roll again');
  await page.waitForFunction(() => document.querySelector('button[aria-busy]')?.getAttribute('aria-busy') === 'false');

  // Show a waiting bot without running its unrelated animation loop.
  await page.evaluate(() => {
    const bridge = window.__testBridge;
    bridge.engine.state.activePlayerIndex = 1;
    bridge.engine.state.gamePhase = 'AWAIT_ROLL';
    bridge.notify();
  });
  await page.waitForFunction(() => document.querySelector('button[aria-busy]')?.disabled);
  await page.evaluate(() => {
    document.querySelector('button[aria-busy]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
  });
  assert.equal(await page.evaluate(() => window.__diceFeedbackRolls), 2);
  checks.push('bot turn rejects click and Space');

  // Start a fresh human page; exercise keyboard + same-task skill consumption.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button[aria-label="Đổ xúc xắc"]:not([disabled])');
  await page.waitForFunction(() => document.querySelector('div.transition-opacity.duration-700')?.classList.contains('pointer-events-none'));
  await page.click('button[aria-label="Kỹ năng Nhảy 2 đến 4"]');
  await page.waitForFunction(() => document.querySelector('button[aria-label="Kỹ năng Nhảy 2 đến 4"]')?.className.includes('scale-105'));
  await page.evaluate(() => {
    const bridge = window.__testBridge;
    bridge.engine.getActivePlayer().position = 39;
    window.__diceFeedbackSkillRolls = 0;
    const original = bridge.rollWithSkill.bind(bridge);
    bridge.rollWithSkill = skill => { window.__diceFeedbackSkillRolls++; return original(skill); };
    for (let i = 0; i < 5; i++) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
  });
  await page.waitForFunction(() => window.__diceFeedbackSkillRolls === 1);
  assert.equal(await page.evaluate(() => window.__diceFeedbackSkillRolls), 1);
  assert.match(await page.$eval('button[aria-label="Kỹ năng Nhảy 2 đến 4"]', el => el.textContent), /x1/);
  checks.push('repeated Space consumes the selected skill once');

  // Inspect the unobscured control, rather than its bounds behind a purchase modal.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button[aria-label="Đổ xúc xắc"]:not([disabled])');
  await page.waitForFunction(() => {
    const loading = document.querySelector('div.transition-opacity.duration-700');
    return loading?.classList.contains('pointer-events-none') && getComputedStyle(loading).opacity === '0';
  });
  const sizes = [];
  for (const [width, height] of [[360, 800], [390, 844], [844, 390], [1440, 900]]) {
    await page.setViewport({ width, height });
    const rect = await page.$eval(button, el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom,
        layoutWidth: el.offsetWidth, layoutHeight: el.offsetHeight };
    });
    assert.ok(rect.x >= 0 && rect.y >= 0 && rect.right <= width && rect.bottom <= height);
    // Press/transition transforms may change the visual bounds, not the 96px layout target.
    assert.equal(rect.layoutWidth, 96);
    assert.equal(rect.layoutHeight, 96);
    assert.equal(await page.$eval(button, el => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }), true);
    sizes.push({ viewport: [width, height], button: rect });
  }
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(artifactDir, 'mobile.png') });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  assert.equal(await page.$eval(`${button} svg`, el => getComputedStyle(el).animationName), 'none');
  checks.push('96px button remains in viewport at four sizes; reduced motion disables icon animation');
  const fps = await page.evaluate(() => new Promise(resolve => {
    let frames = 0;
    const start = performance.now();
    function frame(now) {
      frames++;
      if (now - start >= 2000) resolve(Math.round(frames * 1000 / (now - start)));
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }));
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks, sizes, pageErrors: errors, animationFrameFps: fps,
    rendering: 'headless Chromium with SwiftShader allowed; not a hardware performance benchmark', artifactDir }, null, 2));
} finally {
  await browser.close();
}
