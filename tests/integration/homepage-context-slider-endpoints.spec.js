import { test, expect } from '@playwright/test';

test('mobile homepage compare slider reaches exact left and right edges', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(preview, { waitUntil: 'networkidle' });

  const slider = page.locator('[data-bg-compare-slider]').first();
  await expect(slider).toBeVisible();
  const box = await slider.boundingBox();
  if (!box) throw new Error('compare slider has no bounding box');

  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x - 40, y, { steps: 8 });
  await page.mouse.up();

  await expect(slider.locator('.compare-knob')).toHaveAttribute('aria-valuenow', '0');
  await expect(slider.locator('.compare-handle')).toHaveCSS('left', '0px');
  await expect(slider).toHaveAttribute('data-bg-readable-side', 'after');
  await expect(slider.locator('.compare-after .compare-copy')).toBeVisible();
  await expect(slider.locator('.compare-before .compare-copy')).toBeHidden();

  await page.mouse.move(box.x + 1, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 40, y, { steps: 8 });
  await page.mouse.up();

  await expect(slider.locator('.compare-knob')).toHaveAttribute('aria-valuenow', '100');
  await expect(slider).toHaveAttribute('data-bg-readable-side', 'before');
  await expect(slider.locator('.compare-before .compare-copy')).toBeVisible();
  await expect(slider.locator('.compare-after .compare-copy')).toBeHidden();
});
