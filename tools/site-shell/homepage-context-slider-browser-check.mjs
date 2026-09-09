import { chromium } from 'playwright';

const baseUrl = process.env.UI_VR_BASE_URL;
if (!baseUrl) throw new Error('UI_VR_BASE_URL ontbreekt');

function fail(message, evidence = {}) { throw new Error(`${message}\n${JSON.stringify(evidence, null, 2)}`); }

async function gotoWithRetry(page, url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('#compareSlider').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForFunction(() => document.querySelector('#compareSlider')?.getAttribute('data-bg-pointer-capture-v14') === 'true', null, { timeout: 15000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await page.waitForTimeout(750 * attempt);
    }
  }
  throw lastError;
}

async function readState(page) {
  return page.evaluate(() => {
    const slider = document.querySelector('#compareSlider');
    const beforeSide = slider?.querySelector('.compare-before');
    const afterSide = slider?.querySelector('.compare-after');
    const before = beforeSide?.querySelector('.compare-copy');
    const after = afterSide?.querySelector('.compare-copy');
    const divider = slider?.querySelector('.bg-compare-divider');
    const handle = slider?.querySelector('.compare-handle');
    const knob = slider?.querySelector('.compare-knob');
    if (!slider || !beforeSide || !afterSide || !before || !after || !divider) return null;

    const sr = slider.getBoundingClientRect();
    const dr = divider.getBoundingClientRect();
    const hr = handle?.getBoundingClientRect() || null;
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

    return {
      split,
      endpoint: slider.getAttribute('data-bg-compare-endpoint'),
      pointerReady: slider.getAttribute('data-bg-pointer-capture-v14') === 'true',
      viewportWidth: window.innerWidth,
      slider: { left: sr.left, right: sr.right, width: sr.width, height: sr.height },
      divider: { left: dr.left, right: dr.right, width: dr.width },
      handle: hr ? { left: hr.left, right: hr.right, width: hr.width } : null,
      before: { width: br.width },
      after: { width: ar.width },
      marked: slider.hasAttribute('data-bg-compare-slider'),
      aria: knob ? { min: Number(knob.getAttribute('aria-valuemin')), max: Number(knob.getAttribute('aria-valuemax')), now: Number(knob.getAttribute('aria-valuenow')) } : null,
      topSideAtCenter
    };
  });
}

async function dragPointer(page, side) {
  const slider = page.locator('#compareSlider');
  const rect = await slider.boundingBox();
  if (!rect) fail('compareSlider heeft geen bounding box');
  const y = rect.y + Math.min(rect.height / 2, 140);
  const startX = rect.x + rect.width / 2;
  const viewportWidth = page.viewportSize()?.width || Math.ceil(rect.x + rect.width);
  const leftTarget = Math.max(0, rect.left - 40 || rect.x - 40);
  const rightEdge = rect.right || rect.x + rect.width;
  const rightTarget = Math.min(viewportWidth - 1, rightEdge + 40);
  const targetX = side === 'left' ? leftTarget : rightTarget;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(targetX, y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(80);
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
        rail: { left: rr.left, right: rr.right, top: rr.top, bottom: rr.bottom, width: rr.width, height: rr.height },
        content: { left: cr.left, right: cr.right, top: cr.top, bottom: cr.bottom, width: cr.width, height: cr.height },
        check: { left: kr.left, right: kr.right, top: kr.top, bottom: kr.bottom, width: kr.width, height: kr.height }
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

function assertCommon(g, label) {
  if (!g) fail(`${label}: compareSlider of tekstlagen ontbreken`);
  if (!g.marked || !g.pointerReady) fail(`${label}: pointer-capture runtime is niet actief`, g);
  if (g.slider.left < -1 || g.slider.right > g.viewportWidth + 1) fail(`${label}: slider mag niet buiten de viewport vallen`, g);
  const minReadableWidth = Math.min(220, g.slider.width * 0.5);
  if (g.before.width < minReadableWidth || g.after.width < minReadableWidth) fail(`${label}: tekstlagen zijn te smal`, { ...g, minReadableWidth });
  if (!g.aria || g.aria.min !== 0 || g.aria.max !== 100) fail(`${label}: ARIA sliderbereik moet 0-100 zijn`, g);
}

function assertLeftEndpoint(g, label) {
  assertCommon(g, label);
  if (g.split > .01 || g.endpoint !== 'start' || g.aria.now !== 0) fail(`${label}: pointerdrag moet exact 0 bereiken`, g);
  if (Math.abs(g.divider.left - g.slider.left) > 1.5) fail(`${label}: gele scheidingslijn moet fysiek helemaal links staan`, g);
}

function assertRightEndpoint(g, label) {
  assertCommon(g, label);
  if (g.split < 99.99 || g.endpoint !== 'end' || g.aria.now !== 100) fail(`${label}: pointerdrag moet exact 100 bereiken`, g);
  if (Math.abs(g.divider.right - g.slider.right) > 1.5) fail(`${label}: gele scheidingslijn moet fysiek helemaal rechts staan`, g);
}

async function testMobileChangeFlow(page, label) {
  const root = page.locator('[data-bg-change-flow]');
  await root.waitFor({ state: 'visible' });
  await root.scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);

  const start = await readMobileChangeFlow(page);
  if (!start) fail(`${label}: wijzigingsflow ontbreekt`);
  if (start.stepCount !== 4 || !start.checksVisible) fail(`${label}: vier zichtbare stappen/checks vereist`, start);
  if (start.railTextOverlap) fail(`${label}: rail of statusbol overlapt content`, start);
  if (start.horizontalOverflow) fail(`${label}: horizontale overflow gevonden`, start);
  for (const expected of ['Processen','Rollen','Documenten','KPI','Acties']) {
    if (!start.impact.includes(expected)) fail(`${label}: impactketen mist ${expected}`, start);
  }

  await page.locator('[data-bg-change-step="4"]').evaluate(el => {
    const r = el.getBoundingClientRect();
    window.scrollBy({ top: r.top - window.innerHeight * 0.42, behavior: 'auto' });
  });
  await page.waitForTimeout(240);
  const voltooid = await readMobileChangeFlow(page);
  if (!voltooid) fail(`${label}: wijzigingsflow verdween tijdens scroll`);
  if (voltooid.doneCount !== 4) fail(`${label}: na doorlopen moeten alle vier checks afgerond blijven`, voltooid);
  if (voltooid.progress < .98) fail(`${label}: voortgang moet stap 04 bereiken`, voltooid);
  if (voltooid.railTextOverlap || voltooid.horizontalOverflow) fail(`${label}: layout verslechtert na scroll`, voltooid);

  await page.evaluate(() => window.scrollBy({ top: -120, behavior: 'auto' }));
  await page.waitForTimeout(160);
  const naTerug = await readMobileChangeFlow(page);
  if (!naTerug) fail(`${label}: wijzigingsflow verdween na terugscroll`);
  if (naTerug.progress + .001 < voltooid.progress) fail(`${label}: cumulatieve voortgang mag niet resetten`, { voltooid, naTerug });
  if (naTerug.doneCount !== 4) fail(`${label}: afgeronde checks mogen niet verdwijnen`, { voltooid, naTerug });
  if (naTerug.railTextOverlap || naTerug.horizontalOverflow) fail(`${label}: terugscroll veroorzaakt overlap/overflow`, naTerug);
  return naTerug;
}

async function testViewport(browser, width, height, mobile, orientation) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await gotoWithRetry(page, `${baseUrl}/`);
  const slider = page.locator('#compareSlider');
  await slider.scrollIntoViewIfNeeded();
  await page.waitForTimeout(140);

  await dragPointer(page, 'left');
  const left = await readState(page);
  assertLeftEndpoint(left, `${width}x${height} pointer uiterste links`);

  await dragPointer(page, 'right');
  const right = await readState(page);
  assertRightEndpoint(right, `${width}x${height} pointer uiterste rechts`);

  const flow = await testMobileChangeFlow(page, `${width}x${height} ${orientation} wijzigingsflow`);
  if (flow.orientation !== orientation) fail(`${width}x${height}: orientation mismatch`, flow);
  if (pageErrors.length) fail(`${width}x${height}: JavaScript page errors`, { pageErrors });
  await page.close();
  return { width, height, orientation, left: left.split, right: right.split, progress: flow.progress, doneCount: flow.doneCount };
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
  console.log(JSON.stringify({ ok: true, component: '#compareSlider pointer-capture-v14', desktop, wide, results }));
} finally {
  await browser.close();
}
