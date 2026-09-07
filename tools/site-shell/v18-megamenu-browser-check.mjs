import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl = process.env.UI_VR_BASE_URL || 'https://www.bedrijfsgeheugen.nl';
const labels = ['BEDRIJF', 'KENNIS', 'VERTROUWEN', 'SUPPORT'];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 90_000 });
  const meer = page.getByRole('button', { name: /^Meer(?:\s*▼)?$/i }).first();
  await meer.waitFor({ state: 'visible', timeout: 30_000 });
  await meer.click();
  await page.waitForTimeout(250);

  const result = await page.evaluate((expectedLabels) => {
    const visible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    };
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim().toUpperCase();
    const hasMenuContext = (el) => {
      let node = el.parentElement;
      for (let depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
        const text = normalize(node.textContent);
        if (text.includes('MENSEN EERST. DAN TECHNIEK.') && text.includes('VOLLEDIGE WEBSITEKAART')) return true;
      }
      return false;
    };

    return expectedLabels.map((label) => {
      const candidates = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')]
        .filter((el) => normalize(el.textContent) === label && visible(el) && hasMenuContext(el));
      const el = candidates[0];
      if (!el) return { label, found: false };
      const style = getComputedStyle(el);
      return {
        label,
        found: true,
        tag: el.tagName,
        className: el.className,
        color: style.color,
        fontWeight: style.fontWeight,
        text: el.textContent.trim()
      };
    });
  }, labels);

  for (const item of result) {
    assert.equal(item.found, true, `${item.label}: visible megamenu heading not found in real menu context`);
    assert.equal(item.color, 'rgb(0, 0, 0)', `${item.label}: expected black, got ${item.color}`);
    assert.ok(Number.parseInt(item.fontWeight, 10) >= 700, `${item.label}: expected bold >=700, got ${item.fontWeight}`);
  }

  console.log('V18 megamenu heading browser contract passed:', JSON.stringify(result));
} finally {
  await browser.close();
}
