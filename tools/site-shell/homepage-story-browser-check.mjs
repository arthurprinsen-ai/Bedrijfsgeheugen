import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = String(process.env.UI_VR_BASE_URL || '').replace(/\/$/, '');
if (!baseUrl) throw new Error('UI_VR_BASE_URL ontbreekt');

const artifactDir = 'artifacts/ui-visual-regression';
await mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });

try {
  await page.goto(`${baseUrl}/?bg_story_check=${Date.now()}`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForSelector('[data-bg-story-root]', { state: 'visible', timeout: 30000 });
  await page.locator('[data-bg-story-root]').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('[data-bg-story-root]')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(350);

  const result = await page.evaluate(() => {
    const root = document.querySelector('[data-bg-story-root]');
    if (!root) return { ok: false, reason: 'story root ontbreekt' };
    const rootRect = root.getBoundingClientRect();
    const viewportHeight = innerHeight;
    const rootHeight = rootRect.height;
    const heightRatio = rootHeight / viewportHeight;

    const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const exact = label => Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,strong,b,div,li,a,button')).find(el => text(el) === label) || null;
    const containing = label => Array.from(root.querySelectorAll('a,button,h1,h2,h3,h4,h5,h6,p,span,strong,b,div,li')).find(el => text(el).includes(label)) || null;
    const visible = el => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > .05 && r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    };

    const labels = ['Signaal komt binnen', 'Context wordt begrepen', 'Opvolging ontstaat'];
    const visibleLabels = labels.map(label => ({ label, visible: visible(exact(label)) }));
    const cta = containing('Analyseer impact');
    const ctaVisible = visible(cta);

    const stickyDescendants = Array.from(root.querySelectorAll('*')).filter(el => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.position === 'sticky' && r.width > 0 && r.height > 0;
    }).length;

    const cost = document.querySelector('[data-bg-story-cost]');
    const costStyle = cost ? getComputedStyle(cost) : null;
    const costHidden = !cost || costStyle.visibility === 'hidden' || Number(costStyle.opacity || 1) < .05 || costStyle.display === 'none';

    const meaningfulVisibleCount = visibleLabels.filter(item => item.visible).length + (ctaVisible ? 1 : 0);
    const blankViewport = meaningfulVisibleCount < 3;
    const rootInViewport = rootRect.bottom > 0 && rootRect.top < innerHeight;
    const geometryOk = rootHeight > 180 && heightRatio <= 1.35;
    const ok = rootInViewport && geometryOk && !blankViewport && ctaVisible && stickyDescendants === 0 && costHidden;

    return {
      ok,
      rootHeight,
      heightRatio,
      rootTop: rootRect.top,
      rootBottom: rootRect.bottom,
      visibleLabels,
      ctaVisible,
      meaningfulVisibleCount,
      blankViewport,
      stickyDescendants,
      costHidden,
    };
  });

  if (!result.ok) {
    await page.screenshot({ path: `${artifactDir}/homepage-story-regression.png`, fullPage: true });
    throw new Error(`Homepage story blank/geometry regression: ${JSON.stringify(result)}`);
  }

  console.log(`Homepage story browser check: groen ${JSON.stringify(result)}`);
} finally {
  await browser.close();
}
