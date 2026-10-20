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

  await expect(page.getByText('Alle onderdelen van je ondernemingssturing', { exact: true })).toBeAttached();
  await expect(page.locator('[data-bg-portal-daily-steering="v1"]')).toBeAttached();
  await expect(page.locator('#dailySteeringTitle')).toHaveText('Wat verandert er in je bedrijf — en wat doe je ermee?');
  await expect(page.locator('[data-portal-sample-only]')).toHaveCount(4);
  await expect(page.locator('[data-portal-sample-only]:visible')).toHaveCount(0);
  await expect(page.locator('iframe[src*="/klantportaal"], iframe[src*="/portal-next/"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/klantportaal"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/portal-next/"]')).toHaveCount(0);

  const nativeTargets = ['roadmap', 'ai-scan', 'wijzigingen'];
  for (const pageId of nativeTargets) {
    // Use the one canonical customer navigation, not hidden demonstration
    // cards. Hiding fictional static widgets must never break deep routing.
    const trigger = page.locator(`.sidebar .nav [data-nav-target="${pageId}"]`);
    await expect(trigger, `${pageId} must be present in the canonical V2 navigation`).toBeVisible();
    await trigger.scrollIntoViewIfNeeded();
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
