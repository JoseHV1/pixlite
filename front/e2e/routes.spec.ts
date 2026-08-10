import { test, expect } from '@playwright/test';
import path from 'path';

const SAMPLE_IMAGE = path.join(__dirname, 'fixtures', 'sample.png');

test('home page loads the soft design with no console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');
  await expect(page.getByText('PixLite').first()).toBeVisible();
  await expect(page.getByText('Smart Image Compression')).toBeVisible();
  await expect(page.getByText('sample.png')).not.toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test('unknown routes redirect back to the home page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Smart Image Compression')).toBeVisible();
});

test('compresses a real uploaded image end-to-end', async ({ page }) => {
  // Real upload + sharp processing over the network, slower than the other
  // tests under load — give it more room than the 30s default.
  test.setTimeout(60_000);
  await page.goto('/');

  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().endsWith('/images/compress'), { timeout: 45_000 }),
    page.setInputFiles('input[type="file"]', SAMPLE_IMAGE),
    page.getByRole('button', { name: 'Optimize Now' }).click(),
  ]);
  expect(response.status()).toBe(201);

  await expect(page.getByText('sample.png')).toBeVisible();
  await expect(page.getByText('Done')).toBeVisible({ timeout: 10_000 });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download individual file' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('sample.png');
});
