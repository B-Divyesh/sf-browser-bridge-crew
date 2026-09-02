import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function selectTab(page: Page, name: string) {
  await page.getByRole('tab', { name }).click();
}

test('@claim:sample-demo one click opens a populated repair', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Try it with sample data/ }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('FAULT 01')).toBeVisible();
  await expect(page.getByText('76%')).toBeVisible();
});

test('@claim:round-length a new run is twelve minutes', async ({ page }) => {
  await page.goto('/demo');
  expect(await page.evaluate(() => window.__bridge?.state().durationMs)).toBe(720_000);
});

test('@claim:complete-run repairs a fault and reaches the end screen', async ({ page }) => {
  await page.goto('/demo');
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
  await expect(page.locator('#repair-value')).toHaveText('4');
  await page.evaluate(() => window.__bridge?.finish());
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The ship made it through' })).toBeVisible();
});

test('@claim:replay restart resets a completed run', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(() => window.__bridge?.finish());
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

test('@claim:local-room room actions sync between browser tabs', async ({ context, page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a room' }).click();
  const roomUrl = page.url();
  const code = roomUrl.match(/room\/([A-Z2-9]{5})/)?.[1];
  expect(code).toBeTruthy();
  await page.getByRole('button', { name: 'Start 12-minute run' }).click();

  const crew = await context.newPage();
  await crew.goto(`/room/${code}`);
  await crew.getByRole('button', { name: /Signals/ }).click();
  await crew.getByRole('button', { name: 'Scan active fault' }).click();
  await expect(page.locator('#fault-module')).not.toHaveText('Scanning required');
});

test('@claim:keyboard-controls keyboard commands operate stations', async ({ page }) => {
  await page.goto('/demo');
  await selectTab(page, 'Helm');
  await page.locator('main').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Current bearing').locator('..').locator('strong')).toHaveText('+15°');
  await page.getByRole('button', { name: '+30°' }).click();
  await expect(page.getByText('Current bearing').locator('..').locator('strong')).toHaveText('+30°');
});

test('@claim:frame-rate the active game targets 60 frames per second', async ({ page }) => {
  await page.goto('/demo');
  const frames = await page.evaluate(() => new Promise<number>((resolve) => {
    let count = 0;
    const start = performance.now();
    const sample = (now: number) => {
      count += 1;
      if (now - start >= 1_000) resolve(count);
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  expect(frames).toBeGreaterThanOrEqual(50);
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

test('@claim:free-play has no payment action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Free to play')).toBeVisible();
  await expect(page.getByRole('link', { name: /buy|pay|checkout/i })).toHaveCount(0);
});

test('@claim:room-expiry expired room state cannot be joined', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a room' }).click();
  const code = page.url().match(/room\/([A-Z2-9]{5})/)?.[1];
  expect(code).toBeTruthy();
  await page.getByRole('button', { name: 'Pause run' }).click();
  await page.evaluate((roomCode) => {
    const key = `bridge:room:${roomCode}`;
    const room = JSON.parse(localStorage.getItem(key)!);
    room.expiresAt = 0;
    localStorage.setItem(key, JSON.stringify(room));
  }, code);
  await page.goto(`/room/${code}`);
  await expect(page.getByRole('heading', { name: 'This room is missing or expired' })).toBeVisible();
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

declare global {
  interface Window { __bridge?: { finish: () => void; state: () => { durationMs: number } } }
}
