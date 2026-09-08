import { chromium } from 'playwright';

const baseUrl = process.env.UI_VR_BASE_URL;
if (!baseUrl) throw new Error('UI_VR_BASE_URL ontbreekt');

function fail(message, evidence = {}) { throw new Error(`${message}\n${JSON.stringify(evidence, null, 2)}`); }

async function readState(page) {
  return page.evaluate(() => {
    const slider = document.querySelector('#compareSlider');
    const beforeSide = slider?.querySelector('.compare-before');
    const afterSide = slider?.querySelector('.compare-after');
    const before = beforeSide?.querySelector('.compare-copy');
    const after = afterSide?.querySelector('.compare-copy');
    const knob = slider?.querySelector('.compare-knob');
    if (!slider || !beforeSide || !afterSide || !before || !after || !knob) return null;
    const sr = slider.getBoundingClientRect();
    const br = before.getBoundingClientRect();
    const ar = after.getBoundingClientRect();
    const split = parseFloat(getComputedStyle(slider).getPropertyValue('--split')) || 0;
    const cx = Math.max(0, Math.min(window.innerWidth - 1, sr.left + sr.width / 2));
    const cy = Math.max(0, Math.min(window.innerHeight - 1, sr.top + Math.min(sr.height / 2, 120)));
    const hit = document.elementFromPoint(cx, cy);
    const topSideAtCenter = hit?.closest('.compare-before') ? 'before' : hit?.closest('.compare-after') ? 'after' : null;
    return {
      split,
      viewportWidth: window.innerWidth,
      slider: { left: sr.left, right: sr.right, width: sr.width, height: sr.height },
      before: { width: br.width, clipPath: getComputedStyle(beforeSide).clipPath },
      after: { width: ar.width, clipPath: getComputedStyle(afterSide).clipPath },
      aria: {
        min: Number(knob.getAttribute('aria-valuemin')),
        max: Number(knob.getAttribute('aria-valuemax')),
        now: Number(knob.getAttribute('aria-valuenow')),
        disabled: knob.getAttribute('aria-disabled'),
        tabIndex: knob.tabIndex
      },
      handleDisplay: getComputedStyle(slider.querySelector('.compare-handle') || knob).display,
      marked: slider.hasAttribute('data-bg-compare-slider'),
      topSideAtCenter
    };
  });
}

async function dragKnobTo(page, targetX) {
  const knob = page.locator('#compareSlider .compare-knob');
  await knob.scrollIntoViewIfNeeded();
  const b = await knob.boundingBox();
  if (!b) fail('sliderknop heeft geen geometry');
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(targetX, y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(120);
}

function assertCommon(g, label) {
  if (!g) fail(`${label}: compareSlider of tekstlagen ontbreken`);
  if (!g.marked) fail(`${label}: slider mist generieke site-wide marker`, g);
  if (g.aria.min !== 0 || g.aria.max !== 100) fail(`${label}: ARIA bereik moet exact 0-100 zijn`, g);
  if (g.aria.disabled === 'true' || g.aria.tabIndex < 0) fail(`${label}: slider moet op mobiel en desktop actief blijven`, g);
  if (g.handleDisplay === 'none') fail(`${label}: echte sliderhandle mag niet verborgen zijn`, g);
  if (g.slider.left < -1 || g.slider.right > g.viewportWidth + 1) fail(`${label}: slider mag niet buiten de viewport vallen`, g);
  const minReadableWidth = Math.min(220, g.slider.width * 0.5);
  if (g.before.width < minReadableWidth || g.after.width < minReadableWidth) {
    fail(`${label}: tekstlagen moeten voldoende leesbare paneelbreedte behouden`, { ...g, minReadableWidth });
  }
}

function assertLeftEndpoint(g, label) {
  assertCommon(g, label);
  if (!(g.split <= 1)) fail(`${label}: helemaal links moet 0% bereiken`, g);
  if (g.aria.now > 1) fail(`${label}: ARIA now moet links 0 zijn`, g);
  if (g.topSideAtCenter !== 'after') fail(`${label}: helemaal links moet alleen de witte/rechter after-laag tonen`, g);
}

function assertRightEndpoint(g, label) {
  assertCommon(g, label);
  if (!(g.split >= 99)) fail(`${label}: helemaal rechts moet 100% bereiken`, g);
  if (g.aria.now < 99) fail(`${label}: ARIA now moet rechts 100 zijn`, g);
  if (g.topSideAtCenter !== 'before') fail(`${label}: helemaal rechts moet alleen de blauwe/linker before-laag tonen`, g);
}

async function testViewport(browser, width, height, mobile = false) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const slider = page.locator('#compareSlider');
  await slider.waitFor({ state: 'visible' });
  await slider.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const box = await slider.boundingBox();
  if (!box) fail(`${width}px: slider heeft geen geometry`);

  const nearLeft = box.x + box.width * 0.06;
  await dragKnobTo(page, nearLeft);
  const left = await readState(page);
  assertLeftEndpoint(left, `${width}px praktisch uiterste links`);

  const nearRight = box.x + box.width * 0.94;
  await dragKnobTo(page, nearRight);
  const right = await readState(page);
  assertRightEndpoint(right, `${width}px praktisch uiterste rechts`);

  await page.close();
  return { width, nearLeft, nearRight, left: left.split, right: right.split };
}

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await testViewport(browser, 1128, 653, false);
  const mobile = [];
  for (const [width, height] of [[320,720],[390,844],[430,932]]) {
    mobile.push(await testViewport(browser, width, height, true));
  }
  console.log(JSON.stringify({ ok: true, component: '#compareSlider', desktop, mobile }));
} finally {
  await browser.close();
}
