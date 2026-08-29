const { test, expect } = require('@playwright/test');

test('live hero video loads real pixels and advances playback', async ({ page }) => {
  const url = process.env.PREVIEW_URL;
  if (!url) throw new Error('PREVIEW_URL is required');

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const video = page.locator('[data-bg-component="hero-video"] video');
  await expect(video).toHaveCount(1);

  await expect.poll(async () => video.evaluate(v => ({
    readyState: v.readyState,
    width: v.videoWidth,
    height: v.videoHeight,
    paused: v.paused,
    currentTime: v.currentTime
  })), { timeout: 10000 }).toMatchObject({
    readyState: expect.any(Number),
    width: expect.any(Number),
    height: expect.any(Number),
    paused: false,
    currentTime: expect.any(Number)
  });

  const before = await video.evaluate(v => ({
    readyState: v.readyState,
    width: v.videoWidth,
    height: v.videoHeight,
    currentTime: v.currentTime
  }));
  expect(before.readyState).toBeGreaterThanOrEqual(2);
  expect(before.width).toBeGreaterThan(0);
  expect(before.height).toBeGreaterThan(0);

  await page.waitForTimeout(1200);
  const after = await video.evaluate(v => v.currentTime);
  expect(after).toBeGreaterThan(before.currentTime + 0.25);
  await expect(page.locator('[data-bg-component="hero-video"]')).toHaveClass(/is-playing/);
});
