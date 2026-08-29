const { test, expect } = require('@playwright/test');

const previewUrl = process.env.PREVIEW_URL;

test.beforeEach(async ({ page }) => {
  if (!previewUrl) throw new Error('PREVIEW_URL is required');
  await page.goto(previewUrl, { waitUntil: 'domcontentloaded' });
});

test('desktop dropdown toggles open and closed on click', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const triggers = page.locator('.bgkop-trig');
  const first = triggers.nth(0);
  const second = triggers.nth(1);
  const firstPanel = first.locator('xpath=following-sibling::*[1]');
  const secondPanel = second.locator('xpath=following-sibling::*[1]');

  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await first.click();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expect(firstPanel).toBeVisible();

  await first.click();
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(firstPanel).toBeHidden();

  await first.click();
  await second.click();
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(second).toHaveAttribute('aria-expanded', 'true');
  await expect(firstPanel).toBeHidden();
  await expect(secondPanel).toBeVisible();
});

test('mobile menu and accordion toggle open and closed on click', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded' });

  const menuButton = page.locator('#bgkopKnop');
  const mobileMenu = page.locator('#bgkopMob');
  const accordion = mobileMenu.locator('.bgkop-macc').first();
  const panel = accordion.locator('xpath=following-sibling::*[1]');

  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await expect(mobileMenu).toBeVisible();

  await accordion.click();
  await expect(accordion).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();

  await accordion.click();
  await expect(accordion).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();

  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await expect(mobileMenu).toBeHidden();
});
