import { chromium } from 'playwright';
import assert from 'node:assert/strict';

// Waarom dit bestaat: een menulink zonder eigen kleur erft color:#fff van
// header.v17-header a en staat dan wit op het witte paneel. Dat is precies
// zichtbaar in een echte browser en nergens anders: de tekst staat gewoon in
// de DOM, de klasse bestaat, alleen de berekende kleur klopt niet. Deze
// controle opent daarom ELK paneel in de kop en meet per zichtbaar stuk tekst
// de contrastverhouding tussen de berekende voorgrond- en achtergrondkleur.
// Geen klassenlijst, geen aanname over welk menu bestaat: alles wat opengaat
// wordt gemeten, dus een nieuw menu is automatisch gedekt.

const baseUrl = process.env.UI_VR_BASE_URL || process.env.BASE_URL || 'https://www.bedrijfsgeheugen.nl';
const minimumRatio = Number.parseFloat(process.env.MENU_CONTRAST_MIN_RATIO || '3');
const maxAttempts = Number.parseInt(process.env.MENU_CONTRAST_ATTEMPTS || '12', 10);
const retryDelayMs = Number.parseInt(process.env.MENU_CONTRAST_RETRY_MS || '5000', 10);
const minimumPanels = Number.parseInt(process.env.MENU_CONTRAST_MIN_PANELS || '2', 10);
const minimumMeasured = Number.parseInt(process.env.MENU_CONTRAST_MIN_ITEMS || '20', 10);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const PANEL_SELECTOR = '.mega, .bgkop-paneel';

async function markPanels(page) {
  return page.evaluate((panelSelector) => {
    const header = document.querySelector('header') || document.body;
    const panels = [...header.querySelectorAll(panelSelector)];
    return panels.map((panel, index) => {
      panel.setAttribute('data-contrast-panel', String(index));
      const holder = panel.parentElement;
      const trigger = holder && [...holder.children].find(child => child !== panel && /^(BUTTON|A)$/.test(child.tagName));
      if (trigger) trigger.setAttribute('data-contrast-trigger', String(index));
      return {
        index,
        hasTrigger: Boolean(trigger),
        label: String((trigger || panel).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      };
    });
  }, PANEL_SELECTOR);
}

async function measurePanel(page, index) {
  return page.evaluate((panelIndex) => {
    const panel = document.querySelector(`[data-contrast-panel="${panelIndex}"]`);
    if (!panel) return { open: false, items: [] };

    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0 && r.width > 0 && r.height > 0;
    };
    if (!visible(panel)) return { open: false, items: [] };

    const parse = (value) => {
      const m = String(value || '').match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const parts = m[1].split(',').map(part => Number.parseFloat(part));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    };
    const over = (front, back) => ({
      r: front.r * front.a + back.r * (1 - front.a),
      g: front.g * front.a + back.g * (1 - front.a),
      b: front.b * front.a + back.b * (1 - front.a),
      a: 1,
    });
    const luminance = ({ r, g, b }) => {
      const channel = (value) => {
        const v = value / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const ratioOf = (fg, bg) => {
      const a = luminance(fg);
      const b = luminance(bg);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    const backgroundOf = (el) => {
      let node = el;
      while (node && node !== document.documentElement) {
        const colour = parse(getComputedStyle(node).backgroundColor);
        if (colour && colour.a >= 0.9) return colour;
        node = node.parentElement;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    };
    const ownText = (el) => [...el.childNodes]
      .filter(node => node.nodeType === 3)
      .map(node => node.textContent.replace(/\s+/g, ' ').trim())
      .join(' ')
      .trim();

    const items = [...panel.querySelectorAll('*')]
      .filter(el => visible(el) && ownText(el).length > 0)
      .map((el) => {
        const style = getComputedStyle(el);
        const background = backgroundOf(el);
        const raw = parse(style.color) || { r: 0, g: 0, b: 0, a: 1 };
        const foreground = raw.a >= 1 ? raw : over(raw, background);
        return {
          text: ownText(el).slice(0, 60),
          tag: el.tagName,
          className: String(el.className || '').slice(0, 60),
          color: style.color,
          background: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`,
          ratio: Math.round(ratioOf(foreground, background) * 100) / 100,
        };
      });

    return { open: true, items };
  }, index);
}

async function inspect(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(500);
  const panels = await markPanels(page);
  const measured = [];

  for (const panel of panels) {
    if (!panel.hasTrigger) continue;
    const trigger = page.locator(`[data-contrast-trigger="${panel.index}"]`);
    if (!(await trigger.isVisible().catch(() => false))) continue;
    await trigger.hover({ timeout: 3000 }).catch(() => {});
    await trigger.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(350);
    const result = await measurePanel(page, panel.index);
    if (result.open) measured.push({ ...panel, items: result.items });
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(150);
  }

  return measured;
}

function assertReadable(measured) {
  assert.ok(
    measured.length >= minimumPanels,
    `expected at least ${minimumPanels} openable header panels, measured ${measured.length}`,
  );
  const total = measured.reduce((sum, panel) => sum + panel.items.length, 0);
  assert.ok(
    total >= minimumMeasured,
    `expected at least ${minimumMeasured} measured text elements, got ${total}`,
  );

  const unreadable = [];
  for (const panel of measured) {
    for (const item of panel.items) {
      if (item.ratio < minimumRatio) {
        unreadable.push(`${panel.label} > ${item.tag}.${item.className} "${item.text}": ${item.color} on ${item.background} = ${item.ratio}:1`);
      }
    }
  }
  assert.deepEqual(
    unreadable,
    [],
    `unreadable header menu text (minimum ${minimumRatio}:1):\n  ${unreadable.join('\n  ')}`,
  );
}

const browser = await chromium.launch({ headless: true });
let lastError;
try {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      const measured = await inspect(page);
      assertReadable(measured);
      console.log(`Header menu contrast contract passed on attempt ${attempt} against ${baseUrl}:`, JSON.stringify(
        measured.map(panel => ({ label: panel.label, items: panel.items.length, worst: Math.min(...panel.items.map(item => item.ratio)) })),
      ));
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      console.warn(`Header menu contrast attempt ${attempt}/${maxAttempts} failed: ${error?.message || error}`);
      if (attempt < maxAttempts) await sleep(retryDelayMs);
    } finally {
      await page.close();
    }
  }
  if (lastError) throw lastError;
} finally {
  await browser.close();
}
