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
    const guardScripts = [...document.querySelectorAll('script[data-bg-context-slider-readable]')];
    return {
      split,
      legacySplit: Number.isFinite(legacyRaw) ? legacyRaw : null,
      controlledInline: slider.style.getPropertyValue('--bg-compare-split') || null,
      legacyInline: slider.style.getPropertyValue('--split') || null,
      guard: {
        scriptCount: guardScripts.length,
        hasSyncLoop: guardScripts.some(script => script.textContent.includes('syncLoop')),
        ready: slider.getAttribute('data-bg-compare-ready'),
        owner: slider.getAttribute('data-bg-compare-owner'),
        version: slider.getAttribute('data-bg-compare-version')
      },
      viewportWidth: window.innerWidth,
      slider: { left: sr.left, right: sr.right, width: sr.width, height: sr.height },
      before: { width: br.width, clipPath: getComputedStyle(beforeSide).clipPath, inlineClip: beforeSide.style.getPropertyValue('clip-path') || null },
      after: { width: ar.width, clipPath: getComputedStyle(afterSide).clipPath, inlineClip: afterSide.style.getPropertyValue('clip-path') || null },
      aria: {
        min: Number(knob.getAttribute('aria-valuemin')),
        max: Number(knob.getAttribute('aria-valuemax')),
        now: Number(knob.getAttribute('aria-valuenow')),
        disabled: knob.getAttribute('aria-disabled'),
        tabIndex: knob.tabIndex
      },
      handleDisplay: getComputedStyle(handle).display,
      handleLeft: parseFloat(getComputedStyle(handle).left),
      marked: slider.hasAttribute('data-bg-compare-slider'),
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
    const checks = steps.map(step => {
      const el = step.querySelector('.bg-change-flow-check');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return { display: style.display, width: r.width, height: r.height };
    });
    const impact = (root.querySelector('.bg-change-impact')?.textContent || '').replace(/\s+/g, ' ').trim();
    const rail = root.querySelector('[data-bg-change-progress]');
    const rr = rail?.getBoundingClientRect();
    return {
      progress,
      doneCount: statuses.filter(status => status === 'done').length,
      statuses,
      checkCount: checks.filter(Boolean).length,
      checksVisible: checks.every(check => check && check.display !== 'none' && check.width >= 36 && check.height >= 36),
      impact,
      railHeight: rr?.height || 0
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
  await page.mouse.move(targetX, y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(180);
}

async function dragTouchTo(page, targetX) {
  const knob = page.locator('#compareSlider .compare-knob');
  await knob.scrollIntoViewIfNeeded();
  const b = await knob.boundingBox();
  if (!b) fail('sliderknop heeft geen touch-geometry');
  const startX = b.x + b.width / 2;
  const y = b.y + b.height / 2;
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
  await page.waitForTimeout(220);
}

function assertCommon(g, label) {
  if (!g) fail(`${label}: compareSlider of tekstlagen ontbreken`);
  if (!g.marked) fail(`${label}: slider mist generieke site-wide marker`, g);
  if (!['canonical','fallback'].includes(g.guard.owner)) fail(`${label}: slider moet door canonical runtime of functionele fallback worden beheerd`, g);
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
  if (g.handleLeft > 1.5) fail(`${label}: scheidingslijn moet fysiek helemaal links staan`, g);
  if (g.topSideAtCenter !== 'after') fail(`${label}: helemaal links moet alleen de witte/rechter after-laag tonen`, g);
}

function assertRightEndpoint(g, label) {
  assertCommon(g, label);
  if (!(g.split >= 99)) fail(`${label}: helemaal rechts moet 100% bereiken`, g);
  if (g.aria.now < 99) fail(`${label}: ARIA now moet rechts 100 zijn`, g);
  if (g.handleLeft < g.slider.width - 1.5) fail(`${label}: scheidingslijn moet fysiek helemaal rechts staan`, g);
  if (g.topSideAtCenter !== 'before') fail(`${label}: helemaal rechts moet alleen de blauwe/linker before-laag tonen`, g);
}

async function testMobileChangeFlow(page, label) {
  const root = page.locator('[data-bg-change-flow]');
  await root.waitFor({ state: 'visible' });
  await root.scrollIntoViewIfNeeded();
  await page.waitForTimeout(160);

  const start = await readMobileChangeFlow(page);
  if (!start) fail(`${label}: mobiele wijzigingsflow ontbreekt`);
  if (start.checkCount !== 4 || !start.checksVisible) fail(`${label}: vier checks moeten zichtbaar en direct aan de vier stappen gekoppeld zijn`, start);
  if (start.railHeight < 100) fail(`${label}: verticale voortgangsrail ontbreekt of is te kort`, start);
  for (const expected of ['Processen','Rollen','Documenten','KPI','Acties']) {
    if (!start.impact.includes(expected)) fail(`${label}: impactketen mist ${expected}`, start);
  }

  await page.locator('[data-bg-change-step="4"]').evaluate(el => {
    const r = el.getBoundingClientRect();
    window.scrollBy({ top: r.top - window.innerHeight * 0.42, behavior: 'auto' });
  });
  await page.waitForTimeout(220);
  const voltooid = await readMobileChangeFlow(page);
  if (!voltooid) fail(`${label}: wijzigingsflow verdween tijdens scroll`);
  if (voltooid.doneCount !== 4) fail(`${label}: na doorlopen moeten alle vier checks afgerond blijven`, voltooid);
  if (voltooid.progress < .98) fail(`${label}: voortgangslijn moet tot stap 04 gevuld zijn`, voltooid);

  await page.evaluate(() => window.scrollBy({ top: -120, behavior: 'auto' }));
  await page.waitForTimeout(140);
  const naTerug = await readMobileChangeFlow(page);
  if (!naTerug) fail(`${label}: wijzigingsflow verdween na kleine terugscroll`);
  if (naTerug.progress + .001 < voltooid.progress) fail(`${label}: kleine terugscroll mag cumulatieve voortgang niet resetten`, { voltooid, naTerug });
  if (naTerug.doneCount !== 4) fail(`${label}: afgeronde checks mogen na kleine terugscroll niet verdwijnen`, { voltooid, naTerug });

  return { startProgress: start.progress, progress: voltooid.progress, doneCount: voltooid.doneCount };
}

async function testViewport(browser, width, height, mobile = false) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const slider = page.locator('#compareSlider');
  await slider.waitFor({ state: 'visible' });
  await slider.scrollIntoViewIfNeeded();
  await page.waitForTimeout(140);
  const box = await slider.boundingBox();
  if (!box) fail(`${width}px: slider heeft geen geometry`);

  const nearLeft = box.x + 1;
  if (mobile) await dragTouchTo(page, nearLeft); else await dragKnobTo(page, nearLeft);
  const left = await readState(page);
  if (left) left.pageErrors = pageErrors;
  assertLeftEndpoint(left, `${width}px fysiek uiterste links`);

  const nearRight = box.x + box.width - 1;
  if (mobile) await dragTouchTo(page, nearRight); else await dragKnobTo(page, nearRight);
  const right = await readState(page);
  if (right) right.pageErrors = pageErrors;
  assertRightEndpoint(right, `${width}px fysiek uiterste rechts`);

  const changeFlow = mobile ? await testMobileChangeFlow(page, `${width}px wijzigingsflow`) : null;
  await page.close();
  return { width, nearLeft, nearRight, left: left.split, right: right.split, leftHandle: left.handleLeft, rightHandle: right.handleLeft, changeFlow };
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
