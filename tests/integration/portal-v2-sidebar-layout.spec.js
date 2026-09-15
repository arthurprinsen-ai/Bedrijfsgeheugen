/* De zijbalk van Portal V2 moet binnen zijn eigen vak blijven, kunnen scrollen,
 * en nooit als onzichtbaar klikschild over de pagina liggen.
 *
 * Dit is het contract dat de drie defecten van 15 september 2026 vastlegt.
 * Het toetst gedrag en geometrie, geen broncode en geen labels.
 *
 * Hangt nog in geen enkele workflow: pas toevoegen aan
 * .github/workflows/portal-v2-live-preview.yml zodra de zes vragen op main staan.
 */
const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1280, height: 640 },
];

async function openPortal(page, base) {
  const response = await page.goto(`${base}/portal-v2/?klant=ijsselmonde&bg_layout=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  expect(response, 'portal response').not.toBeNull();
  expect(response.status(), 'portal status').toBeLessThan(400);
  await page.waitForSelector('.sidebar .nav', { timeout: 30_000 });
}

test.describe('zijbalk Portal V2', () => {
  for (const viewport of VIEWPORTS) {
    test(`blijft bruikbaar op ${viewport.width}x${viewport.height}`, async ({ page }) => {
      const base = process.env.PREVIEW_URL || process.env.PRODUCTION_URL;
      if (!base) throw new Error('PREVIEW_URL of PRODUCTION_URL is verplicht');

      await page.setViewportSize(viewport);
      await openPortal(page, base);

      const box = await page.evaluate(() => {
        const aside = document.querySelector('.sidebar');
        const nav = document.querySelector('.sidebar .nav');
        return {
          asideHeight: aside.clientHeight,
          asideScroll: aside.scrollHeight,
          navHeight: nav.clientHeight,
          navScroll: nav.scrollHeight,
          overflowY: getComputedStyle(nav).overflowY,
        };
      });

      // Defect 3: de nav mag nooit platgedrukt worden tot nul.
      expect(box.navHeight, 'nav heeft hoogte').toBeGreaterThan(100);

      // Defect 2: te veel inhoud scrolt binnen de nav, niet daarbuiten.
      expect(box.overflowY, 'nav scrollt zelf').toBe('auto');
      expect(box.asideScroll, 'aside groeit niet buiten zijn vak')
        .toBeLessThanOrEqual(box.asideHeight + 1);

      // Defect 1: sublijsten staan dicht; hooguit de tak van de actieve pagina is open.
      const openSubs = await page.locator('.nav .dvnav-sub:visible').count();
      expect(openSubs, 'hooguit één open tak bij laden').toBeLessThanOrEqual(1);

      // De onderste navknop is echt bereikbaar, desnoods na scrollen.
      const lastButton = page.locator('.nav button').last();
      await lastButton.scrollIntoViewIfNeeded();
      await expect(lastButton).toBeVisible();

      // De aside onderschept geen kliks in het werkgebied.
      const intercepts = await page.evaluate(() => {
        const main = document.querySelector('.main').getBoundingClientRect();
        const x = main.left + main.width / 2;
        const y = main.top + Math.min(main.height / 2, window.innerHeight / 2);
        const hit = document.elementFromPoint(x, y);
        return Boolean(hit && hit.closest('.sidebar'));
      });
      expect(intercepts, 'aside ligt niet over het werkgebied').toBe(false);
    });
  }

  test('accordeon houdt één vraag tegelijk open', async ({ page }) => {
    const base = process.env.PREVIEW_URL || process.env.PRODUCTION_URL;
    if (!base) throw new Error('PREVIEW_URL of PRODUCTION_URL is verplicht');

    await page.setViewportSize({ width: 1280, height: 720 });
    await openPortal(page, base);

    const questions = page.locator('.nav .dvnav-q');
    const total = await questions.count();
    expect(total, 'de zes vragen staan in de zijbalk').toBeGreaterThan(1);

    for (let index = 0; index < total; index += 1) {
      await questions.nth(index).click();
      await expect(questions.nth(index)).toHaveAttribute('aria-expanded', 'true');
      expect(await page.locator('.nav .dvnav-sub:visible').count()).toBe(1);
    }
  });
});
