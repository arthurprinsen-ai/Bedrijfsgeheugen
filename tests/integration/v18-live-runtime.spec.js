const { test, expect } = require('@playwright/test');

const previewUrl = process.env.PREVIEW_URL;
if (!previewUrl) throw new Error('PREVIEW_URL is required');

test('V18.8 runtime and navigation diagnostics', async ({ page }) => {
  await page.goto(previewUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);

  await expect(page.locator('#heroBackgroundVideo')).toHaveCount(1);
  const version = await page.evaluate(() => window.__BG_PRODUCTION_VERSION__ || null);
  expect(version).toBe('V18.8');

  const head = await page.locator('head').innerHTML();
  expect(head.toLowerCase()).not.toContain('noindex');
  expect(head.toLowerCase()).not.toContain('nofollow');

  const navState = await page.evaluate(() => {
    const selector = 'header button, nav button, [role="navigation"] button, header [aria-expanded], nav [aria-expanded]';
    return Array.from(document.querySelectorAll(selector)).map((el, index) => ({
      index,
      tag: el.tagName,
      id: el.id || '',
      cls: typeof el.className === 'string' ? el.className : '',
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
      ariaExpanded: el.getAttribute('aria-expanded'),
      ariaControls: el.getAttribute('aria-controls'),
      ariaHaspopup: el.getAttribute('aria-haspopup')
    }));
  });
  console.log('V18_NAV_STATE=' + JSON.stringify(navState));

  const structures = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const pick = label => {
      const el = buttons.find(b => (b.textContent || '').trim().startsWith(label));
      return el ? {
        label,
        self: el.outerHTML.slice(0, 1800),
        parent: el.parentElement ? el.parentElement.outerHTML.slice(0, 7000) : '',
        next: el.nextElementSibling ? el.nextElementSibling.outerHTML.slice(0, 3500) : ''
      } : null;
    };
    const mobile = document.getElementById('mobileToggle');
    return {
      oplossingen: pick('Oplossingen'),
      meer: pick('Meer'),
      mobile: mobile ? {
        self: mobile.outerHTML.slice(0,1800),
        parent: mobile.parentElement ? mobile.parentElement.outerHTML.slice(0,7000) : '',
        next: mobile.nextElementSibling ? mobile.nextElementSibling.outerHTML.slice(0,5000) : ''
      } : null
    };
  });
  console.log('V18_NAV_STRUCTURES=' + JSON.stringify(structures));

  const navCount = await page.locator('nav, [role="navigation"]').count();
  expect(navCount).toBeGreaterThan(0);
});
