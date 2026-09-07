const { test, expect } = require('@playwright/test');
const { assertVisibleAndReadable, assertNoForbiddenOverlap } = require('../../quality/browser/interaction-assertions.js');
const { wrapFailure } = require('../../quality/browser/failure-report.js');

const baseUrl = process.env.BASE_URL;
if (!baseUrl) throw new Error('BASE_URL is required');

const viewports = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
};

async function openHome(page, viewport = 'desktop', reducedMotion = 'no-preference') {
  await page.setViewportSize(viewports[viewport]);
  await page.emulateMedia({ reducedMotion });
  await page.goto(`${baseUrl.replace(/\/$/, '')}/`, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '[data-netlify-deploy-id], iframe[title="Netlify Drawer"]{pointer-events:none!important}' });
  await page.waitForSelector('[data-bg-story-root]');
  await page.waitForSelector('#homepage-platform-tab');
}

async function expectStoryState(page, expected) {
  await expect(page.locator('[data-bg-story-root]')).toHaveAttribute('data-bg-story-state', String(expected));
}

async function expectReadable(locator, minOpacity = 0.45) {
  await expect.poll(async () => locator.evaluate((el, threshold) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) >= threshold && rect.width > 0 && rect.height > 0;
  }, minOpacity)).toBe(true);
  await assertVisibleAndReadable(locator, { minOpacity });
}

async function withReport(testInfo, context, fn) {
  try {
    return await fn();
  } catch (error) {
    const wrapped = wrapFailure(error, context);
    await testInfo.attach(`${context.contractId}-${context.viewport}-diagnostic.json`, {
      body: Buffer.from(JSON.stringify(wrapped.interactionReport, null, 2)),
      contentType: 'application/json',
    });
    throw wrapped;
  }
}

for (const viewport of ['desktop', 'mobile']) {
  test(`homepage scroll story click states are reachable on ${viewport}`, async ({ page }, testInfo) => {
    await openHome(page, viewport);
    await withReport(testInfo, { contractId: 'homepage-scroll-story', route: '/', viewport }, async () => {
      const root = page.locator('[data-bg-story-root]');
      const steps = page.locator('[data-bg-story-step]');
      await expect(steps).toHaveCount(4);
      await expectStoryState(page, 0);

      if (viewport === 'desktop') {
        const cta = page.getByText('Analyseer impact', { exact: false }).first();
        if (await cta.count()) {
          await cta.click();
          await expectStoryState(page, 1);
          await steps.nth(0).click();
          await expectStoryState(page, 0);
        }
      }

      for (let state = 0; state < 4; state += 1) {
        await steps.nth(state).click();
        await expectStoryState(page, state);
        await expectReadable(steps.nth(state));
        if (state > 0) {
          const overlay = page.locator(`[data-bg-story-overlay="${state}"]`);
          await expect(overlay).toHaveAttribute('data-show', '1');
          await expectReadable(overlay);
        }
      }

      for (let state = 0; state < 4; state += 1) {
        const opacity = Number(await steps.nth(state).evaluate(el => getComputedStyle(el).opacity));
        expect(opacity).toBeGreaterThanOrEqual(0.45);
      }

      if (viewport === 'mobile') {
        const stages = page.locator('[data-bg-story-stage]');
        expect(await stages.count()).toBeGreaterThan(0);
        const positions = await stages.evaluateAll(elements => elements.map(el => getComputedStyle(el).position));
        expect(positions.every(position => position !== 'sticky')).toBe(true);
      } else {
        const cost = page.locator('[data-bg-story-cost]');
        if (await cost.count()) {
          expect(Number(await cost.first().evaluate(el => getComputedStyle(el).opacity))).toBeLessThanOrEqual(0.05);
        }
      }
      await expect(root).toBeVisible();
    });
  });
}

test('homepage scroll story scroll state machine reaches all four desktop states', async ({ page }, testInfo) => {
  await openHome(page, 'desktop');
  await withReport(testInfo, { contractId: 'homepage-scroll-story', route: '/', viewport: 'desktop', failureClass: 'scroll-desync' }, async () => {
    const metrics = await page.locator('[data-bg-story-root]').evaluate(el => ({
      top: el.getBoundingClientRect().top + window.scrollY,
      span: Math.max(1, el.offsetHeight - window.innerHeight),
    }));
    for (let state = 0; state < 4; state += 1) {
      const target = metrics.top + metrics.span * ((state + 0.15) / 4);
      await page.evaluate(y => window.scrollTo(0, y), target);
      await page.waitForFunction(expected => document.querySelector('[data-bg-story-root]')?.getAttribute('data-bg-story-state') === String(expected), state);
      await expectStoryState(page, state);
    }
  });
});

test('homepage scroll story remains operable with reduced motion', async ({ page }, testInfo) => {
  await openHome(page, 'desktop', 'reduce');
  await withReport(testInfo, { contractId: 'homepage-scroll-story', route: '/', viewport: 'desktop', failureClass: 'motion-regression' }, async () => {
    const steps = page.locator('[data-bg-story-step]');
    await steps.nth(2).click();
    await expectStoryState(page, 2);
    const duration = await page.locator('[data-bg-story-overlay="2"]').evaluate(el => getComputedStyle(el).transitionDuration);
    expect(duration.split(',').every(value => value.trim() === '0s')).toBe(true);
  });
});

for (const viewport of ['desktop', 'mobile']) {
  test(`homepage Platform Expertise toggle works by click and keyboard on ${viewport}`, async ({ page }, testInfo) => {
    await openHome(page, viewport);
    await withReport(testInfo, { contractId: 'homepage-platform-expertise-toggle', route: '/', viewport, failureClass: 'a11y-interaction-regression' }, async () => {
      const platform = page.locator('#homepage-platform-tab');
      const expertise = page.locator('#homepage-expertise-tab');
      const platformPanel = page.locator('#homepage-platform-panel');
      const expertisePanel = page.locator('#homepage-expertise-panel');

      await expect(platform).toHaveAttribute('aria-selected', 'true');
      await expect(platformPanel).toBeVisible();
      await expect(expertisePanel).toBeHidden();
      await expertise.click();
      await expect(expertise).toHaveAttribute('aria-selected', 'true');
      await expect(expertisePanel).toBeVisible();
      await expect(platformPanel).toBeHidden();
      await assertVisibleAndReadable(expertise);
      await expertise.focus();
      await page.keyboard.press('ArrowLeft');
      await expect(platform).toHaveAttribute('aria-selected', 'true');
      await expect(platformPanel).toBeVisible();
      await expect(expertisePanel).toBeHidden();
    });
  });
}

test('forbidden overlap helper catches an obstructing element in-page', async ({ page }) => {
  await page.setContent('<div id="a" style="position:absolute;left:0;top:0;width:100px;height:100px"></div><div id="b" style="position:absolute;left:50px;top:0;width:100px;height:100px"></div>');
  let caught;
  try {
    await assertNoForbiddenOverlap(page.locator('#a'), page.locator('#b'), { maxOverlapRatio: 0.02 });
  } catch (error) {
    caught = error;
  }
  expect(caught?.failureClass).toBe('overlay-obstruction');
});
