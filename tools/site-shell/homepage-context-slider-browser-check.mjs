import { chromium } from 'playwright';

const baseUrl = process.env.UI_VR_BASE_URL;
if (!baseUrl) throw new Error('UI_VR_BASE_URL ontbreekt');

const GUTTER_MIN = 16;
const MIN_DESKTOP_VISIBLE_COPY = 220;
const MIN_MOBILE_VISIBLE_COPY = 96;

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
      knobDisplay: getComputedStyle(knob).display,
      knobVisibility: getComputedStyle(knob).visibility,
      touchAction: getComputedStyle(slider).touchAction
    };
  });
}

function assertInteractiveGeometry(g, label, minCopy) {
  if (!g) fail(`${label}: compareSlider of tekstlagen ontbreken`);
  if (g.compact !== null) fail(`${label}: oude compact/stacked fallback mag niet meer actief zijn`, g);
  if (!g.before.visible || !g.after.visible) fail(`${label}: beide sliderlagen moeten aanwezig blijven`, g);
  if (g.handleDisplay === 'none' || g.knobDisplay === 'none' || g.knobVisibility === 'hidden') {
    fail(`${label}: de echte sliderknop moet zichtbaar en bedienbaar blijven`, g);
  }
  if (g.before.width < minCopy || g.after.width < minCopy) {
    fail(`${label}: sliderpaneel is smaller dan ${minCopy}px`, g);
  }
  if (g.aria.disabled === 'true') fail(`${label}: slider mag niet disabled zijn`, g);
  if (!(g.aria.now >= g.aria.min && g.aria.now <= g.aria.max)) {
    fail(`${label}: ARIA-waarde ligt buiten dezelfde veilige grens`, g);
  }
}

function assertDesktopGeometry(g, label) {
  assertInteractiveGeometry(g, label, MIN_DESKTOP_VISIBLE_COPY);
  const leftClearance = g.dividerX - g.before.right;
  const rightClearance = g.after.left - g.dividerX;
  if (leftClearance < GUTTER_MIN || rightClearance < GUTTER_MIN) {
    fail(`${label}: handle/scheidingslijn overlapt de tekst`, { ...g, leftClearance, rightClearance });
  }
}

async function bringSliderIntoView(page) {
  const slider = page.locator('#compareSlider');
  await slider.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  const box = await slider.boundingBox();
  if (!box) fail('compareSlider heeft geen geometry na scrollIntoViewIfNeeded');
  return box;
}

async function dragKnobTo(page, targetX) {
  const knob = page.locator('#compareSlider .compare-knob');
  await knob.scrollIntoViewIfNeeded();
  const knobBox = await knob.boundingBox();
  if (!knobBox) fail('desktop: sliderknop heeft geen geometry');
  const startX = knobBox.x + knobBox.width / 2;
  const startY = knobBox.y + knobBox.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(targetX, startY, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(120);
}

async function dragTouchTo(page, targetX) {
  await page.locator('#compareSlider .compare-knob').scrollIntoViewIfNeeded();
  const knobBox = await page.locator('#compareSlider .compare-knob').boundingBox();
  if (!knobBox) fail('390px: sliderknop heeft geen geometry');
  const startX = knobBox.x + knobBox.width / 2;
  const startY = knobBox.y + knobBox.height / 2;
  await page.evaluate(({ startX, startY, targetX }) => {
    const knob = document.querySelector('#compareSlider .compare-knob');
    if (!knob) throw new Error('sliderknop ontbreekt');
    const pointerId = 41;
    knob.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId, pointerType: 'touch', clientX: startX, clientY: startY, isPrimary: true, buttons: 1 }));
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId, pointerType: 'touch', clientX: targetX, clientY: startY, isPrimary: true, buttons: 1 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId, pointerType: 'touch', clientX: targetX, clientY: startY, isPrimary: true, buttons: 0 }));
  }, { startX, startY, targetX });
  await page.waitForTimeout(120);
}

async function testDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1128, height: 653 } });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.locator('#compareSlider').waitFor({ state: 'visible' });
  const box = await bringSliderIntoView(page);

  await dragKnobTo(page, box.x + 2);
  const left = await readGeometry(page);
  assertDesktopGeometry(left, '1128x653 uiterste links');

  await dragKnobTo(page, box.x + box.width - 2);
  const right = await readGeometry(page);
  assertDesktopGeometry(right, '1128x653 uiterste rechts');

  if (!(left.split < 50 && right.split > 50)) {
    fail('Desktop slider moet via de echte witte knop interactief blijven binnen de veilige zone', { left, right });
  }
  await page.close();
  return { left: left.split, right: right.split };
}

async function testMobile(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.locator('#compareSlider').waitFor({ state: 'visible' });
  const box = await bringSliderIntoView(page);

  const initial = await readGeometry(page);
  assertInteractiveGeometry(initial, '390px initieel', MIN_MOBILE_VISIBLE_COPY);
  if (initial.touchAction !== 'none') fail('390px: horizontaal slepen moet touch-action:none gebruiken', initial);

  await dragTouchTo(page, box.x + 2);
  const left = await readGeometry(page);
  assertInteractiveGeometry(left, '390px uiterste links', MIN_MOBILE_VISIBLE_COPY);

  await dragTouchTo(page, box.x + box.width - 2);
  const right = await readGeometry(page);
  assertInteractiveGeometry(right, '390px uiterste rechts', MIN_MOBILE_VISIBLE_COPY);

  if (!(left.split < 50 && right.split > 50)) {
    fail('390px: slider moet met touch/pointer echt naar links én rechts bewegen', { left, right });
  }
  if (Math.abs(right.split - left.split) < 15) {
    fail('390px: mobiele slider heeft te weinig bruikbare slag', { left, right });
  }
  await page.close();
  return { initial: initial.split, left: left.split, right: right.split };
}

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await testDesktop(browser);
  const mobile = await testMobile(browser);
  console.log(JSON.stringify({ ok: true, component: '#compareSlider', desktop, mobile }));
} finally {
  await browser.close();
}
