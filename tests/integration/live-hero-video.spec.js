const { test, expect } = require('@playwright/test');

async function inspectVideo(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const passive = await page.evaluate(() => {
    const video = [...document.querySelectorAll('video')].find(v => {
      if ((v.currentSrc || '').includes('openart-hero-iphone-safe-v1.mp4')) return true;
      return [...v.querySelectorAll('source')].some(s => (s.src || '').includes('openart-hero-iphone-safe-v1.mp4'));
    });
    if (!video) return { found: false };
    return {
      found: true,
      autoplay: video.autoplay,
      muted: video.muted,
      defaultMuted: video.defaultMuted,
      playsInline: video.playsInline,
      paused: video.paused,
      readyState: video.readyState,
      networkState: video.networkState,
      currentTime: video.currentTime,
      currentSrc: video.currentSrc,
      width: video.videoWidth,
      height: video.videoHeight,
      error: video.error ? { code: video.error.code, message: video.error.message } : null
    };
  });

  const explicit = await page.evaluate(async () => {
    const video = [...document.querySelectorAll('video')].find(v => {
      if ((v.currentSrc || '').includes('openart-hero-iphone-safe-v1.mp4')) return true;
      return [...v.querySelectorAll('source')].some(s => (s.src || '').includes('openart-hero-iphone-safe-v1.mp4'));
    });
    if (!video) return { found: false, ok: false, error: 'video not found' };
    try {
      await video.play();
      return { found: true, ok: true, currentTime: video.currentTime, paused: video.paused };
    } catch (error) {
      return { found: true, ok: false, name: error.name, message: error.message, paused: video.paused };
    }
  });

  await page.waitForTimeout(1200);
  const afterPlay = await page.evaluate(() => {
    const video = [...document.querySelectorAll('video')].find(v => {
      if ((v.currentSrc || '').includes('openart-hero-iphone-safe-v1.mp4')) return true;
      return [...v.querySelectorAll('source')].some(s => (s.src || '').includes('openart-hero-iphone-safe-v1.mp4'));
    });
    return video ? { currentTime: video.currentTime, paused: video.paused } : { currentTime: 0, paused: true };
  });

  return { passive, explicit, afterPlay };
}

test('preview hero video matches production playability', async ({ page }) => {
  const previewUrl = process.env.PREVIEW_URL;
  const productionUrl = process.env.PROD_URL || 'https://www.bedrijfsgeheugen.nl';
  if (!previewUrl) throw new Error('PREVIEW_URL is required');

  const production = await inspectVideo(page, productionUrl);
  const preview = await inspectVideo(page, previewUrl);
  console.log('production video state', JSON.stringify(production));
  console.log('preview video state', JSON.stringify(preview));

  expect(production.passive.found).toBe(true);
  expect(preview.passive.found).toBe(true);
  expect(preview.passive.width).toBeGreaterThan(0);
  expect(preview.passive.height).toBeGreaterThan(0);
  expect(preview.passive.readyState).toBeGreaterThanOrEqual(2);

  if (!production.passive.paused) {
    expect(preview.passive.paused).toBe(false);
  }

  expect(preview.explicit.ok).toBe(true);
  expect(preview.afterPlay.paused).toBe(false);
  expect(preview.afterPlay.currentTime).toBeGreaterThan(preview.explicit.currentTime + 0.25);
});
