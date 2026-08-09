import { test, expect } from '@playwright/test';
import path from 'path';

const SAMPLE_IMAGE = path.join(__dirname, 'fixtures', 'sample.png');

const THEMES = [
  { path: '/professional', theme: 'professional', doneCta: 'Download Optimized Images' },
  { path: '/dark', theme: 'dark', doneCta: 'Download All (1)' },
  { path: '/soft', theme: 'soft', doneCta: null },
];

test('index page links to the 3 theme previews', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Clean Professional/ })).toHaveAttribute('href', '/professional');
  await expect(page.getByRole('link', { name: /Modern Dark/ })).toHaveAttribute('href', '/dark');
  await expect(page.getByRole('link', { name: /Soft Minimalist/ })).toHaveAttribute('href', '/soft');
});

for (const theme of THEMES) {
  test(`${theme.path} loads empty with no console errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(theme.path);
    await expect(page.getByText('PixLite').first()).toBeVisible();
    await expect(page.getByText('sample.png')).not.toBeVisible();

    const themeAttr = await page.evaluate(() => document.documentElement.dataset['theme']);
    expect(themeAttr).toBe(theme.theme);
    expect(consoleErrors).toEqual([]);
  });

  test(`${theme.path} compresses a real uploaded image end-to-end`, async ({ page }) => {
    await page.goto(theme.path);

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().endsWith('/images/compress')),
      page.setInputFiles('input[type="file"]', SAMPLE_IMAGE),
      theme.path === '/soft' ? page.getByRole('button', { name: 'Optimize Now' }).click() : Promise.resolve(),
    ]);
    expect(response.status()).toBe(201);

    await expect(page.getByText('sample.png')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible({ timeout: 10_000 });

    if (theme.doneCta) {
      await expect(page.getByText(theme.doneCta)).toBeVisible();
    }

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download individual file' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('sample.png');
  });
}
