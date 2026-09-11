const { test, expect } = require('@playwright/test');

const targetUrl = process.env.PREVIEW_URL;
if (!targetUrl) throw new Error('PREVIEW_URL is required');

test('homepage Platform and Expertise toggle changes the visible card set', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const platform = page.locator('#homepage-platform-tab');
  const expertise = page.locator('#homepage-expertise-tab');
  const platformPanel = page.locator('#homepage-platform-panel');
  const expertisePanel = page.locator('#homepage-expertise-panel');

  await expect(platform).toHaveCount(1);
  await expect(expertise).toHaveCount(1);
  await expect(platform).toHaveAttribute('aria-selected', 'true');
  await expect(expertise).toHaveAttribute('aria-selected', 'false');
  await expect(platformPanel).toBeVisible();
  await expect(expertisePanel).toBeHidden();
  await expect(platformPanel.getByRole('heading', { name: 'AI-copilot' })).toBeVisible();
  await expect(platformPanel.getByRole('heading', { name: 'Organisatiebeheersing' })).toBeVisible();
  await expect(platformPanel.getByRole('heading', { name: 'Externe signalen & acties' })).toBeVisible();

  await expertise.click();

  await expect(platform).toHaveAttribute('aria-selected', 'false');
  await expect(expertise).toHaveAttribute('aria-selected', 'true');
  await expect(platformPanel).toBeHidden();
  await expect(expertisePanel).toBeVisible();
  await expect(expertisePanel.getByRole('heading', { name: 'Frisse Blik' })).toBeVisible();
  await expect(expertisePanel.getByRole('heading', { name: 'Launch' })).toBeVisible();
  await expect(expertisePanel.getByRole('heading', { name: 'Continuous Improvement' })).toBeVisible();

  await platform.click();
  await expect(platform).toHaveAttribute('aria-selected', 'true');
  await expect(expertise).toHaveAttribute('aria-selected', 'false');
  await expect(platformPanel).toBeVisible();
  await expect(expertisePanel).toBeHidden();
});
