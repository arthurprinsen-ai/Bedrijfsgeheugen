import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PRODUCTION_URL || process.env.PREVIEW_URL || 'https://www.bedrijfsgeheugen.nl';

test('Portal V2 is standalone and never routes into the legacy portal', async ({ page }) => {
  test.setTimeout(90_000);
  const nonce = `${Date.now()}`;
  const legacyRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/klantportaal') || url.includes('/portal-next/')) legacyRequests.push(url);
  });

  const response = await page.goto(`${BASE_URL}/portal-v2/?bg_standalone_readback=${nonce}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });

  expect(response, 'Portal V2 must return an HTTP response').not.toBeNull();
  expect(response.status(), 'Portal V2 must be reachable').toBeLessThan(400);

  await expect(page.getByText('Portal V2 bevat alle portalonderdelen standaard', { exact: true })).toBeAttached();
  await expect(page.locator('iframe[src*="/klantportaal"], iframe[src*="/portal-next/"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/klantportaal"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/portal-next/"]')).toHaveCount(0);

  const nativeTargets = ['roadmap', 'ai-scan', 'wijzigingen'];
  for (const pageId of nativeTargets) {
    const trigger = page.locator(`[data-open-page="${pageId}"]`).first();
    await expect(trigger, `${pageId} must have a native V2 trigger`).toBeVisible();
    await expect(trigger).toHaveAttribute('href', new RegExp(`^https://www\\.bedrijfsgeheugen\\.nl/portal-v2/\\?page=${pageId}$`));
    await trigger.click();
    await expect(page).toHaveURL(/\/portal-v2\//);
    expect(page.url()).not.toContain('/klantportaal');
    await expect(page.locator('#portalView')).toHaveAttribute('data-page-id', pageId);
    await expect(page.locator('iframe[src*="/klantportaal"], iframe[src*="/portal-next/"]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#portalView')).toHaveAttribute('aria-hidden', 'true');
  }

  expect(legacyRequests, 'Portal V2 must not request legacy portal routes').toEqual([]);
});
