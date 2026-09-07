import { chromium } from 'playwright';

const baseUrl = process.env.UI_VR_BASE_URL;
if (!baseUrl) throw new Error('UI_VR_BASE_URL ontbreekt');

const GUTTER_MIN = 24;
const MIN_VISIBLE_COPY = 220;

function fail(message, evidence = {}) {
  throw new Error(`${message}\n${JSON.stringify(evidence, null, 2)}`);
}

async function readGeometry(page) {
  return page.evaluate(() => {
    const slider = document.querySelector('#compareSlider');
    const before = slider?.querySelector('.compare-before .compare-copy');
    const after = slider?.querySelector('.compare-after .compare-copy');
    const knob = slider?.querySelector('.compare-knob');
    if (!slider || !before || !after || !knob) return null;
    const sr = slider.getBoundingClientRect();
    const br = before.getBoundingClientRect();
    const ar = after.getBoundingClientRect();
    const split = parseFloat(getComputedStyle(slider).getPropertyValue('--split')) || 50;
    const dividerX = sr.left + sr.width * split / 100;
    const visible = el => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0 && r.width > 0 && r.height > 0;
    };
    return {
      slider: { left: sr.left, right: sr.right, top: sr.top, bottom: sr.bottom, width: sr.width, height: sr.height },
      before: { left: br.left, right: br.right, top: br.top, bottom: br.bottom, width: br.width, height: br.height, visible: visible(before) },
      after: { left: ar.left, right: ar.right, top: ar.top, bottom: ar.bottom, width: ar.width, height: ar.height, visible: visible(after) },
      dividerX,
      split,
      compact: slider.getAttribute('data-bg-compare-compact'),
      aria: {
        min: Number(knob.getAttribute('aria-valuemin')),
        max: Number(knob.getAttribute('aria-valuemax')),
        now: Number(knob.getAttribute('aria-valuenow')),
        disabled: knob.getAttribute('aria-disabled')
      },
      handleDisplay: getComputedStyle(slider.querySelector('.compare-handle') || knob).display,
      beforeHeadingVisible: !!before.querySelector('h3') && visible(before.querySelector('h3')),
      beforeParagraphVisible: !!before.querySelector('p') && visible(before.querySelector('p')),
      afterHeadingVisible: !!after.querySelector('h3') && visible(after.querySelector('h3')),
      afterParagraphVisible: !!after.querySelector('p') && visible(after.querySelector('p'))
    };
  });
}

function assertDesktopGeometry(g, label) {
  if (!g) fail(`${label}: compareSlider of tekstlagen ontbreken`);
  if (g.compact !== 'false') fail(`${label}: desktop mag niet in compact fallback staan`, g);
  if (!g.before.visible || !g.after.visible || !g.beforeHeadingVisible || !g.beforeParagraphVisible || !g.afterHeadingVisible || !g.afterParagraphVisible) fail(`${label}: beide tekstlagen moeten volledig zichtbaar zijn`, g);
  const leftClearance = g.dividerX - g.before.right;
  const rightClearance = g.after.left - g.dividerX;
  if (g.before.width < MIN_VISIBLE_COPY || g.after.width < MIN_VISIBLE_COPY) fail(`${label}: tekstkolom is smaller dan ${MIN_VISIBLE_COPY}px`, g);
  if (leftClearance < GUTTER_MIN || rightClearance < GUTTER_MIN) fail(`${label}: handle/scheidingslijn overlapt de tekst`, { ...g, leftClearance, rightClearance });
  if (!(g.aria.now >= g.aria.min && g.aria.now <= g.aria.max)) fail(`${label}: ARIA-waarde ligt buiten dezelfde veilige grens`, g);
}

async function bringSliderIntoView(page) {
  const slider = page.locator('#compareSlider');
  await slider.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  const box = await slider.boundingBox();
  if (!box) fail('compareSlider heeft geen geometry na scrollIntoViewIfNeeded');
  if (box.y < -2 || box.y > 653) fail('compareSlider is niet in de viewport gebracht', box);
  return box;
}

async function dragKnobTo(page, targetX) {
  const knob = page.locator('#compareSlider .compare-knob');
  await knob.scrollIntoViewIfNeeded();
  const knobBox = await knob.boundingBox();
  if (!knobBox) fail('1128x653: sliderknop heeft geen geometry');
  const startX = knobBox.x + knobBox.width / 2;
  const startY = knobBox.y + knobBox.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(targetX, startY, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(120);
}

async function testDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1128, height: 653 } });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.locator('#compareSlider').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('#compareSlider')?.hasAttribute('data-bg-compare-compact'));
  const box = await bringSliderIntoView(page);
  await dragKnobTo(page, box.x + 2);
  const left = await readGeometry(page);
  assertDesktopGeometry(left, '1128x653 uiterste links');
  await dragKnobTo(page, box.x + box.width - 2);
  const right = await readGeometry(page);
  assertDesktopGeometry(right, '1128x653 uiterste rechts');
  if (!(left.split < 50 && right.split > 50)) fail('Desktop slider moet via de echte witte knop interactief blijven binnen de veilige zone', { left, right });
  await page.close();
  return { left: left.split, right: right.split };
}

async function testMobile(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.locator('#compareSlider').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('#compareSlider')?.hasAttribute('data-bg-compare-compact'));
  await page.locator('#compareSlider').scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  const g = await readGeometry(page);
  if (!g) fail('390px: compareSlider of tekstlagen ontbreken');
  if (g.compact !== 'true') fail('390px: smalle viewport moet fail-safe naar compact mode', g);
  if (!g.before.visible || !g.after.visible || !g.beforeHeadingVisible || !g.beforeParagraphVisible || !g.afterHeadingVisible || !g.afterParagraphVisible) fail('390px: beide gestapelde teksten moeten zichtbaar zijn', g);
  if (g.before.width < 250 || g.after.width < 250) fail('390px: gestapelde tekstkolommen zijn te smal', g);
  if (g.handleDisplay !== 'none') fail('390px: onbruikbare handle moet in compact mode verborgen zijn', g);
  if (g.before.bottom > g.after.top + 2) fail('390px: compacte panelen mogen elkaar niet overlappen', g);
  await page.close();
  return { beforeWidth: g.before.width, afterWidth: g.after.width, compact: g.compact };
}

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await testDesktop(browser);
  const mobile = await testMobile(browser);
  console.log(JSON.stringify({ ok: true, component: '#compareSlider', desktop, mobile }));
} finally {
  await browser.close();
}
