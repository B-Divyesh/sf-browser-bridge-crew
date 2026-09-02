import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function selectTab(page: Page, name: string) {
  await page.getByRole('tab', { name }).click();
}

async function repairCurrentFault(page: Page) {
  const clueText = await page.locator('.clue-sheet').innerText();
  const bearing = Number(clueText.match(/([+-]?\d+)°/)?.[1] ?? '0');
  const module = clueText.match(/engines|life support|navigation/i)?.[0] ?? 'engines';
  const codeLine = clueText.trim().split('\n').at(-1) ?? '';

  await selectTab(page, 'Helm');
  await page.getByRole('button', { name: `${bearing > 0 ? '+' : ''}${bearing}°` }).click();
  await selectTab(page, 'Power');
  await page.getByRole('button', { name: new RegExp(module, 'i') }).click();
  await selectTab(page, 'Engineering');
  for (const name of codeLine.split(' · ')) await page.getByRole('button', { name: new RegExp(name, 'i') }).click();
  await page.getByRole('button', { name: /Repair module/ }).click();
}

async function endRunThroughNormalPlay(page: Page) {
  await page.getByLabel('Assist mode').uncheck();
  await selectTab(page, 'Engineering');
  for (let attempt = 0; attempt < 7; attempt += 1) await page.getByRole('button', { name: /Repair module/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('@claim:sample-demo one click opens a populated repair', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Try it with sample data/ }).click();
  await expect(page).toHaveURL(/\/?demo=1$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('FAULT 01')).toBeVisible();
  await expect(page.getByText('76%')).toBeVisible();
});

test('@claim:playable-first-screen the first screen contains a working fault control', async ({ page }) => {
  await page.goto('/');
  const scan = page.locator('.hero-fault').getByRole('button', { name: 'Scan sample fault' });
  await expect(scan).toBeVisible();
  await scan.click();
  await expect(page.locator('.hero-fault').getByText('Bearing +15°. Route navigation. Enter Ring, Wave, Kite.')).toBeVisible();
});

test('@claim:round-length a new run is twelve minutes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a room' }).click();
  await expect(page.locator('#time-value')).toHaveText('12:00');
});

test('@claim:complete-run repairs a fault and reaches the end screen', async ({ page }) => {
  await page.goto('/demo');
  await repairCurrentFault(page);
  await expect(page.locator('#repair-value')).toHaveText('4');
  await endRunThroughNormalPlay(page);
  await expect(page.getByRole('heading', { name: 'The ship needs another crew' })).toBeVisible();
});

test('@claim:replay restart resets a completed run', async ({ page }) => {
  await page.goto('/demo');
  await endRunThroughNormalPlay(page);
  await page.getByRole('button', { name: 'Play this seed again' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('#repair-value')).toHaveText('0');
  await expect(page.locator('#integrity-value')).toHaveText('100%');
});

test('@claim:settings-persist assist setting persists locally', async ({ page }) => {
  await page.goto('/demo');
  const assist = page.getByLabel('Assist mode');
  await assist.uncheck();
  await page.getByRole('button', { name: 'Mute sound' }).click();
  await page.reload();
  await expect(page.getByLabel('Assist mode')).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Turn sound on' })).toBeVisible();
});

test('@claim:demo-isolation keeps sample storage separate, resets the sample, and leaves real storage untouched', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('bridge:review-sentinel', 'real-value'));
  await page.getByRole('link', { name: /Try it with sample data/ }).click();
  await page.getByLabel('Assist mode').uncheck();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('demo:bridge:settings'))).not.toBeNull();
  await expect(page.getByText('76%')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('76%')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('demo:bridge:settings'))).toBeNull();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('bridge:review-sentinel'))).toBe('real-value');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('bridge:review-sentinel'))).toBe('real-value');
});

test('@claim:demo-stations exposes all four stations with working controls', async ({ page }) => {
  await page.goto('/demo');
  for (const station of ['Helm', 'Power', 'Signals', 'Engineering']) {
    await selectTab(page, station);
    await expect(page.getByRole('heading', { name: station })).toBeVisible();
  }
  await selectTab(page, 'Helm');
  await page.getByRole('button', { name: '+15°' }).click();
  await expect(page.getByText('Current bearing').locator('..').locator('strong')).toHaveText('+15°');
  await selectTab(page, 'Power');
  await page.getByRole('button', { name: /navigation/i }).click();
  await expect(page.getByRole('button', { name: /navigation/i })).toHaveAttribute('aria-pressed', 'true');
  await selectTab(page, 'Engineering');
  await page.getByRole('button', { name: /Ring/ }).click();
  await expect(page.getByLabel('Entered repair code')).toContainText('○');
  await selectTab(page, 'Signals');
  await expect(page.locator('.clue-sheet')).toBeVisible();
});

test('@claim:cross-device-room room actions sync between separate browser contexts', async ({ browser, page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a room' }).click();
  await expect(page).toHaveURL(/\/room\/[A-Z2-9]{5}\?host=1/);
  const roomUrl = page.url();
  const code = roomUrl.match(/room\/([A-Z2-9]{5})/)?.[1];
  expect(code).toBeTruthy();
  await page.getByRole('button', { name: 'Start 12-minute run' }).click();

  const crewContext = await browser.newContext();
  const crew = await crewContext.newPage();
  await crew.goto(`http://127.0.0.1:4173/room/${code}`);
  await expect(crew.getByRole('heading', { name: 'Choose your station' })).toBeVisible();
  await crew.getByRole('button', { name: /Signals/ }).click();
  await expect(crew.getByText(new RegExp(`Connected to room ${code}`))).toBeVisible();
  await crew.getByRole('button', { name: 'Scan active fault' }).click();
  await expect(page.locator('#fault-module')).not.toHaveText('Scanning required');
  await crewContext.close();
});

test('@claim:room-reconnect a station reload reconnects to its role and current room state', async ({ browser, page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a room' }).click();
  await expect(page).toHaveURL(/\/room\/[A-Z2-9]{5}\?host=1/);
  const code = page.url().match(/room\/([A-Z2-9]{5})/)?.[1];
  expect(code).toBeTruthy();
  const crewContext = await browser.newContext();
  const crew = await crewContext.newPage();
  await crew.goto(`http://127.0.0.1:4173/room/${code}`);
  await crew.getByRole('button', { name: /Helm/ }).click();
  await expect(crew.getByText(new RegExp(`Connected to room ${code}`))).toBeVisible();
  await crew.reload();
  await expect(crew.getByRole('heading', { name: 'Control the Helm station' })).toBeVisible();
  await expect(crew.getByText(new RegExp(`Connected to room ${code}`))).toBeVisible();
  await crewContext.close();
});

test('@claim:keyboard-controls keyboard commands operate stations', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('main').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('s');
  await expect(page.locator('.clue-sheet')).toBeVisible();
  await selectTab(page, 'Helm');
  await page.locator('main').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Current bearing').locator('..').locator('strong')).toHaveText('+15°');
  const touchControl = page.getByRole('button', { name: '+30°' });
  if (test.info().project.name === 'mobile') await touchControl.tap();
  else await touchControl.click();
  await expect(page.getByText('Current bearing').locator('..').locator('strong')).toHaveText('+30°');
  await selectTab(page, 'Power');
  await page.locator('main').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('3');
  await expect(page.getByRole('button', { name: /navigation/i })).toHaveAttribute('aria-pressed', 'true');
  await selectTab(page, 'Engineering');
  await page.locator('main').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('1');
  await expect(page.getByLabel('Entered repair code')).toContainText('○');
  await page.keyboard.press('r');
  await expect(page.getByLabel('Entered repair code')).not.toContainText('○');
});

test('@claim:privacy-local demo sends requests only to its own origin', async ({ page }) => {
  const foreign: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') foreign.push(request.url());
  });
  await page.goto('/demo');
  await expect(page.locator('input[type="email"], input[name="name"], textarea')).toHaveCount(0);
  await selectTab(page, 'Helm');
  await page.getByRole('button', { name: '+15°' }).click();
  expect(foreign).toEqual([]);
});

test('@claim:no-personal-data live rooms ask for no accounts, names, chat, cameras, microphones, or recordings', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as unknown as { __mediaCalls?: unknown[][] };
    const originalGetUserMedia = navigator.mediaDevices?.getUserMedia.bind(navigator.mediaDevices);
    if (originalGetUserMedia) navigator.mediaDevices.getUserMedia = (...args) => {
      state.__mediaCalls ??= [];
      state.__mediaCalls.push(args);
      return originalGetUserMedia(...args);
    };
  });
  await page.goto('/');
  await expect(page.getByText(/No names, chat, cameras, or recordings/)).toBeVisible();
  await expect(page.locator('input[type="email"], input[name*="name" i], textarea, [contenteditable="true"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create a room' }).click();
  await expect(page.locator('input[type="email"], input[name*="name" i], textarea, [contenteditable="true"]')).toHaveCount(0);
  const mediaCalls = await page.evaluate(() => (window as unknown as { __mediaCalls?: unknown[][] }).__mediaCalls ?? []);
  expect(mediaCalls).toEqual([]);
});

test('@claim:no-tracking public pages and a live room load only Bridge Crew files and its room service', async ({ page }) => {
  const seen = new Set<string>();
  page.on('request', (request) => seen.add(new URL(request.url()).origin));
  page.on('websocket', (socket) => seen.add(new URL(socket.url()).origin));
  for (const path of ['/', '/demo', '/privacy', '/terms']) await page.goto(path);
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a room' }).click();
  await expect(page).toHaveURL(/\/room\//);
  await expect(page.getByText(/Connected to room/)).toBeVisible();
  await expect.poll(() => seen.has('ws://127.0.0.1:8787')).toBeTruthy();
  expect([...seen].sort()).toEqual(['http://127.0.0.1:4173', 'http://127.0.0.1:8787', 'ws://127.0.0.1:8787']);
  const scriptOrigins = await page.locator('script[src]').evaluateAll((scripts) => scripts.map((script) => new URL((script as HTMLScriptElement).src).origin));
  expect([...new Set(scriptOrigins)]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:free-play has no payment action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Free to play')).toBeVisible();
  await expect(page.getByRole('link', { name: /buy|pay|checkout/i })).toHaveCount(0);
});

test('@claim:offline-reload demo reloads after the first visit while offline', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/demo');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Keep the research ship running' })).toBeVisible();
  await expect(page.getByText(/This tab is offline/)).toBeVisible();
  await context.close();
});

test('pages have one h1 and no serious accessibility findings', async ({ page }) => {
  for (const path of ['/', '/demo', '/privacy', '/terms', '/missing-page']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  }
});

test('local routes load without console errors or broken links', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const paths = await page.locator('a[href^="/"]').evaluateAll((links) => [...new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute('href')!))]);
  for (const path of paths) {
    const response = await page.request.get(path);
    expect(response.ok(), `${path} should load`).toBeTruthy();
  }
  await page.goto('/demo');
  expect(errors).toEqual([]);
});
