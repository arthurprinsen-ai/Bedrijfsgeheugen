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
    const handle = slider?.querySelector('.compare-handle');
    if (!slider || !beforeSide || !afterSide || !before || !after || !knob || !handle) return null;

    const sr = slider.getBoundingClientRect();
    const br = before.getBoundingClientRect();
    const ar = after.getBoundingClientRect();
    const css = getComputedStyle(slider);
    const controlledRaw = parseFloat(css.getPropertyValue('--bg-compare-split'));
    const legacyRaw = parseFloat(css.getPropertyValue('--split'));
    const split = Number.isFinite(controlledRaw) ? controlledRaw : (Number.isFinite(legacyRaw) ? legacyRaw : 0);
    const cx = Math.max(0, Math.min(window.innerWidth - 1, sr.left + sr.width / 2));
    const cy = Math.max(0, Math.min(window.innerHeight - 1, sr.top + Math.min(sr.height / 2, 120)));
    const hit = document.elementFromPoint(cx, cy);
    const topSideAtCenter = hit?.closest('.compare-before') ? 'before' : hit?.closest('.compare-after') ? 'after' : null;
    const allSliders = [...new Set([...document.querySelectorAll('#compareSlider,.compare-slider,[data-compare-slider]')])]
      .filter(el => el.querySelector('.compare-before') && el.querySelector('.compare-after'));

    return {
      split,
      viewportWidth: window.innerWidth,
      slider: { left: sr.left, right: sr.right, width: sr.width, height: sr.height },
      before: { width: br.width },
      after: { width: ar.width },
      aria: {
        min: Number(knob.getAttribute('aria-valuemin')),
        max: Number(knob.getAttribute('aria-valuemax')),
        now: Number(knob.getAttribute('aria-valuenow')),
        disabled: knob.getAttribute('aria-disabled')
      },
      handleDisplay: getComputedStyle(handle).display,
      handleLeft: parseFloat(getComputedStyle(handle).left),
      marked: slider.hasAttribute('data-bg-compare-slider'),
      pointerReady: slider.getAttribute('data-bg-pointer-slider-ready') === 'true',
      pointerVersion: slider.getAttribute('data-bg-pointer-slider-version'),
      nativeRangeCount: document.querySelectorAll('.bg-compare-range,input[type="range"].bg-compare-range').length,
      allPointerOwned: allSliders.length > 0 && allSliders.every(el => el.getAttribute('data-bg-pointer-slider-ready') === 'true' && !el.querySelector('.bg-compare-range')),
      topSideAtCenter
    };
  });
}

async function readMobileChangeFlow(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-bg-change-flow]');
    if (!root) return null;
    const steps = [...root.querySelectorAll('[data-bg-change-step]')];
    const progress = parseFloat(getComputedStyle(root).getPropertyValue('--bg-change-progress')) || 0;
    const statuses = steps.map(step => step.getAttribute('data-bg-change-status'));
    const geometries = steps.map(step => {
      const rail = step.querySelector('.bg-change-step-rail');
      const content = step.querySelector('.bg-change-step-content');
      const check = step.querySelector('.bg-change-flow-check');
      if (!rail || !content || !check) return null;
      const rr = rail.getBoundingClientRect();
      const cr = content.getBoundingClientRect();
      const kr = check.getBoundingClientRect();
      return {
        rail: { left: rr.left, right: rr.right, width: rr.width },
        content: { left: cr.left, right: cr.right, width: cr.width },
        check: { left: kr.left, right: kr.right, width: kr.width, height: kr.height }
      };
    });
    const railTextOverlap = geometries.some(g => !g || g.rail.right > g.content.left + .5 || g.check.right > g.content.left + .5);
    const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
    const impact = (root.querySelector('.bg-change-impact')?.textContent || '').replace(/\s+/g, ' ').trim();
    const checksVisible = geometries.every(g => g && g.check.width >= 32 && g.check.height >= 32);
    return {
      progress,
      doneCount: statuses.filter(status => status === 'done').length,
      statuses,
      stepCount: steps.length,
      checksVisible,
      impact,
      railTextOverlap,
      horizontalOverflow,
      orientation: window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
      viewport: { width: window.innerWidth, height: window.innerHeight },
      geometries
    };
  });
}

async function dragPointerTo(page, targetX, mobile) {
  const slider = page.locator('#compareSlider');
  await slider.scrollIntoViewIfNeeded();
  const b = await slider.boundingBox();
  if (!b) fail('slider heeft geen geometry');
  const startX = b.x + b.width / 2;
  const y = b.y + Math.min(b.height / 2, 120);

  if (!mobile) {
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(targetX, y, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(160);
    return;
  }

  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y, radiusX: 8, radiusY: 8, force: 1, id: 1 }]
  });
  for (let i = 1; i <= 12; i++) {
    const x = startX + (targetX - startX) * (i / 12);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y, radiusX: 8, radiusY: 8, force: 1, id: 1 }]
    });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
  await page.waitForTimeout(200);
}

function assertCommon(g, label) {
  if (!g) fail(`${label}: compareSlider of tekstlagen ontbreken`);
  if (!g.marked || !g.pointerReady || !g.allPointerOwned) fail(`${label}: pointer runtime bezit niet alle compare-sliders`, g);
  if (g.nativeRangeCount !== 0) fail(`${label}: native range overlay mag niet meer bestaan`, g);
  if (g.aria.min !== 0 || g.aria.max !== 100) fail(`${label}: ARIA bereik moet exact 0-100 zijn`, g);
  if (g.aria.disabled === 'true') fail(`${label}: slider mag niet disabled zijn`, g);
  if (g.handleDisplay === 'none') fail(`${label}: echte sliderhandle mag niet verborgen zijn`, g);
  if (g.slider.left < -1 || g.slider.right > g.viewportWidth + 1) fail(`${label}: slider mag niet buiten viewport vallen`, g);
  const minReadableWidth = Math.min(220, g.slider.width * 0.5);
  if (g.before.width < minReadableWidth || g.after.width < minReadableWidth) fail(`${label}: tekstlagen zijn te smal`, { ...g, minReadableWidth });
}

function assertLeftEndpoint(g, label) {
  assertCommon(g, label);
  if (!(g.split <= 1)) fail(`${label}: helemaal links moet 0% bereiken`, g);
  if (g.aria.now > 1) fail(`${label}: ARIA moet links 0 zijn`, g);
  if (g.handleLeft > 1.5) fail(`${label}: scheidingslijn moet fysiek helemaal links staan`, g);
  if (g.topSideAtCenter !== 'after') fail(`${label}: links moet alleen de after-laag tonen`, g);
}

function assertRightEndpoint(g, label) {
  assertCommon(g, label);
  if (!(g.split >= 99)) fail(`${label}: helemaal rechts moet 100% bereiken`, g);
  if (g.aria.now < 99) fail(`${label}: ARIA moet rechts 100 zijn`, g);
  if (g.handleLeft < g.slider.width - 1.5) fail(`${label}: scheidingslijn moet fysiek helemaal rechts staan`, g);
  if (g.topSideAtCenter !== 'before') fail(`${label}: rechts moet alleen de before-laag tonen`, g);
}

async function testMobileChangeFlow(page, label) {
  const root = page.locator('[data-bg-change-flow]');
  await root.waitFor({ state: 'visible' });
  await root.scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  const start = await readMobileChangeFlow(page);
  if (!start) fail(`${label}: wijzigingsflow ontbreekt`);
  if (start.stepCount !== 4 || !start.checksVisible) fail(`${label}: vier zichtbare stappen/checks vereist`, start);
  if (start.railTextOverlap || start.horizontalOverflow) fail(`${label}: rail/content overlap of horizontale overflow`, start);
  for (const expected of ['Processen','Rollen','Documenten','KPI','Acties']) if (!start.impact.includes(expected)) fail(`${label}: impactketen mist ${expected}`, start);

  await page.locator('[data-bg-change-step="4"]').evaluate(el => {
    const r = el.getBoundingClientRect();
    window.scrollBy({ top: r.top - window.innerHeight * 0.42, behavior: 'auto' });
  });
  await page.waitForTimeout(240);
  const voltooid = await readMobileChangeFlow(page);
  if (!voltooid || voltooid.doneCount !== 4 || voltooid.progress < .98) fail(`${label}: voortgang moet alle vier stappen afronden`, voltooid || {});
  if (voltooid.railTextOverlap || voltooid.horizontalOverflow) fail(`${label}: layout verslechtert na scroll`, voltooid);

  await page.evaluate(() => window.scrollBy({ top: -120, behavior: 'auto' }));
  await page.waitForTimeout(160);
  const naTerug = await readMobileChangeFlow(page);
  if (!naTerug || naTerug.progress + .001 < voltooid.progress || naTerug.doneCount !== 4) fail(`${label}: cumulatieve voortgang mag niet resetten`, { voltooid, naTerug });
  return naTerug;
}

async function testViewport(browser, width, height, mobile, orientation) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const slider = page.locator('#compareSlider');
  await slider.waitFor({ state: 'visible' });
  await slider.scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  const box = await slider.boundingBox();
  if (!box) fail(`${width}px: slider heeft geen geometry`);

  await dragPointerTo(page, box.x, mobile);
  const left = await readState(page);
  assertLeftEndpoint(left, `${width}x${height} fysiek uiterste links`);

  await dragPointerTo(page, box.x + box.width, mobile);
  const right = await readState(page);
  assertRightEndpoint(right, `${width}x${height} fysiek uiterste rechts`);

  const flow = await testMobileChangeFlow(page, `${width}x${height} ${orientation} wijzigingsflow`);
  if (flow.orientation !== orientation) fail(`${width}x${height}: orientation mismatch`, flow);
  await page.close();
  return { width, height, orientation, left: left.split, right: right.split, progress: flow.progress, doneCount: flow.doneCount, pageErrors };
}

const browser = await chromium.launch({ headless: true });
try {
  const results = [];
  for (const [width,height] of [[320,720],[360,800],[390,844],[430,932]]) results.push(await testViewport(browser,width,height,true,'portrait'));
  results.push(await testViewport(browser,844,390,true,'landscape'));
  results.push(await testViewport(browser,768,1024,true,'portrait'));
  results.push(await testViewport(browser,1024,768,true,'landscape'));
  const desktop = await testViewport(browser,1128,653,false,'landscape');
  const wide = await testViewport(browser,1440,900,false,'landscape');
  console.log(JSON.stringify({ ok: true, component: '#compareSlider', desktop, wide, results }));
} finally {
  await browser.close();
}
