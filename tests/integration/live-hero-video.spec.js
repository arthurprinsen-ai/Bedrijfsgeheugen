const { test, expect, chromium } = require('@playwright/test');

async function findPassiveState(page) {
  return page.evaluate(() => {
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
}

async function boundedPlayProbe(page) {
  return page.evaluate(async () => {
    const video = [...document.querySelectorAll('video')].find(v => {
      if ((v.currentSrc || '').includes('openart-hero-iphone-safe-v1.mp4')) return true;
      return [...v.querySelectorAll('source')].some(s => (s.src || '').includes('openart-hero-iphone-safe-v1.mp4'));
    });
    if (!video) return { found: false, outcome: 'missing' };

    const probe = (async () => {
      try {
        await video.play();
        return { found: true, outcome: 'resolved', paused: video.paused, currentTime: video.currentTime };
      } catch (error) {
        return { found: true, outcome: 'rejected', name: error.name, message: error.message, paused: video.paused };
      }
    })();

    const timeout = new Promise(resolve => setTimeout(() => resolve({
      found: true,
      outcome: 'timeout',
      paused: video.paused,
      currentTime: video.currentTime
    }), 2500));

    return Promise.race([probe, timeout]);
  });
}

async function inspectVideo(page, url, label) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const passive = await findPassiveState(page);
  console.log(`${label} passive`, JSON.stringify(passive));
  const explicit = await boundedPlayProbe(page);
  console.log(`${label} explicit`, JSON.stringify(explicit));
  await page.waitForTimeout(1200);
  const afterPlay = await findPassiveState(page);
  console.log(`${label} after`, JSON.stringify(afterPlay));
  return { passive, explicit, afterPlay };
}

test('preview hero video decodes and preserves production behavior in Chrome', async () => {
  test.setTimeout(45000);
  const previewUrl = process.env.PREVIEW_URL;
  const productionUrl = process.env.PROD_URL || 'https://www.bedrijfsgeheugen.nl';
  if (!previewUrl) throw new Error('PREVIEW_URL is required');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const production = await inspectVideo(page, productionUrl, 'production');
    const preview = await inspectVideo(page, previewUrl, 'preview');

    expect(production.passive.found).toBe(true);
    expect(preview.passive.found).toBe(true);
    expect(preview.passive.autoplay).toBe(production.passive.autoplay);
    expect(preview.passive.muted).toBe(production.passive.muted);
    expect(preview.passive.playsInline).toBe(production.passive.playsInline);
    expect(preview.passive.error).toBeNull();
    expect(preview.passive.width).toBeGreaterThan(0);
    expect(preview.passive.height).toBeGreaterThan(0);
    expect(preview.passive.readyState).toBeGreaterThanOrEqual(2);

    if (!production.passive.paused) {
      expect(preview.passive.paused).toBe(false);
    }

    expect(preview.explicit.outcome).toBe('resolved');
    expect(preview.afterPlay.paused).toBe(false);
    expect(preview.afterPlay.currentTime).toBeGreaterThan(preview.explicit.currentTime + 0.25);
  } finally {
    await browser.close();
  }
});
