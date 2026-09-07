import { chromium } from 'playwright';

const baseUrl = String(process.env.UI_VR_BASE_URL || '').replace(/\/$/, '');
if (!baseUrl) throw new Error('UI_VR_BASE_URL ontbreekt');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForSelector('#homepage-expertise-tab', { state: 'visible', timeout: 30000 });

  await page.click('#homepage-expertise-tab');
  await page.waitForFunction(() => document.querySelector('#homepage-expertise-tab')?.getAttribute('aria-selected') === 'true');

  const expertise = await page.evaluate(() => {
    const tab = document.querySelector('#homepage-expertise-tab');
    const panel = document.querySelector('#homepage-expertise-panel');
    const platform = document.querySelector('#homepage-platform-panel');
    if (!tab || !panel || !platform) return { ok: false, reason: 'toggle DOM ontbreekt' };
    const cs = getComputedStyle(panel);
    const rect = panel.getBoundingClientRect();
    const text = (panel.textContent || '').replace(/\s+/g, ' ').trim();
    const visible = !panel.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    return {
      ok: tab.getAttribute('aria-selected') === 'true' && panel.classList.contains('active') && visible && platform.hidden,
      selected: tab.getAttribute('aria-selected'),
      active: panel.classList.contains('active'),
      hidden: panel.hidden,
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      width: rect.width,
      height: rect.height,
      platformHidden: platform.hidden,
      hasFrisseBlik: text.includes('Frisse Blik'),
      hasLaunch: text.includes('Launch'),
      hasContinuous: text.includes('Continuous Improvement'),
    };
  });

  if (!expertise.ok || !expertise.hasFrisseBlik || !expertise.hasLaunch || !expertise.hasContinuous) {
    throw new Error(`Expertise-panel niet zichtbaar na klik: ${JSON.stringify(expertise)}`);
  }

  await page.click('#homepage-platform-tab');
  await page.waitForFunction(() => document.querySelector('#homepage-platform-tab')?.getAttribute('aria-selected') === 'true');
  const restored = await page.evaluate(() => {
    const platform = document.querySelector('#homepage-platform-panel');
    const expertisePanel = document.querySelector('#homepage-expertise-panel');
    return Boolean(platform && expertisePanel && platform.classList.contains('active') && !platform.hidden && expertisePanel.hidden);
  });
  if (!restored) throw new Error('Platform-panel wordt niet correct hersteld na terugschakelen');

  console.log('Homepage Platform/Expertise browser check: groen');
} finally {
  await browser.close();
}
