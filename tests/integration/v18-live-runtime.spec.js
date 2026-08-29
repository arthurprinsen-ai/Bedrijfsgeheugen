const { test, expect } = require('@playwright/test');

const previewUrl = process.env.PREVIEW_URL;
if (!previewUrl) throw new Error('PREVIEW_URL is required');

function snapDesktop(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('.navitem[data-mega]')).map((item, i) => {
    const button = item.querySelector(':scope > .navbtn');
    const mega = item.querySelector(':scope > .mega');
    const cs = mega ? getComputedStyle(mega) : null;
    return {
      i,
      label: button ? button.textContent.trim().replace(/\s+/g, ' ') : '',
      pinned: item.getAttribute('data-mega-pinned'),
      expanded: button ? button.getAttribute('aria-expanded') : null,
      display: cs ? cs.display : null,
      visibility: cs ? cs.visibility : null,
      opacity: cs ? cs.opacity : null,
      rect: mega ? mega.getBoundingClientRect().toJSON() : null
    };
  }));
}

test('V18.8 runtime and navigation diagnostics', async ({ page }) => {
  await page.goto(previewUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await expect(page.locator('#heroBackgroundVideo')).toHaveCount(1);
  expect(await page.evaluate(() => window.__BG_PRODUCTION_VERSION__ || null)).toBe('V18.8');
  const head = await page.locator('head').innerHTML();
  expect(head.toLowerCase()).not.toContain('noindex');
  expect(head.toLowerCase()).not.toContain('nofollow');

  console.log('V18_DESKTOP_BEFORE=' + JSON.stringify(await snapDesktop(page)));
  const solutions = page.locator('.navitem[data-mega]').filter({ has: page.locator('.v17-solutions-mega') }).locator(':scope > .navbtn');
  await solutions.click();
  await page.waitForTimeout(150);
  console.log('V18_DESKTOP_AFTER_SOLUTIONS_1=' + JSON.stringify(await snapDesktop(page)));
  await solutions.click();
  await page.waitForTimeout(150);
  console.log('V18_DESKTOP_AFTER_SOLUTIONS_2=' + JSON.stringify(await snapDesktop(page)));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const mobileBefore = await page.evaluate(() => ({
    toggle: document.getElementById('mobileToggle')?.outerHTML || '',
    candidates: Array.from(document.querySelectorAll('[id*="mobile" i], [class*="mobile" i]')).map(el => ({
      tag: el.tagName, id: el.id, cls: typeof el.className === 'string' ? el.className : '',
      hidden: el.hidden, ariaHidden: el.getAttribute('aria-hidden'),
      display: getComputedStyle(el).display, visibility: getComputedStyle(el).visibility,
      text: (el.textContent || '').trim().replace(/\s+/g,' ').slice(0,160)
    }))
  }));
  console.log('V18_MOBILE_BEFORE=' + JSON.stringify(mobileBefore));
  await page.locator('#mobileToggle').click();
  await page.waitForTimeout(150);
  const mobileAfter = await page.evaluate(() => ({
    toggle: document.getElementById('mobileToggle')?.outerHTML || '',
    candidates: Array.from(document.querySelectorAll('[id*="mobile" i], [class*="mobile" i]')).map(el => ({
      tag: el.tagName, id: el.id, cls: typeof el.className === 'string' ? el.className : '',
      hidden: el.hidden, ariaHidden: el.getAttribute('aria-hidden'),
      display: getComputedStyle(el).display, visibility: getComputedStyle(el).visibility,
      text: (el.textContent || '').trim().replace(/\s+/g,' ').slice(0,160)
    }))
  }));
  console.log('V18_MOBILE_AFTER=' + JSON.stringify(mobileAfter));

  expect(await page.locator('nav, [role="navigation"]').count()).toBeGreaterThan(0);
});
