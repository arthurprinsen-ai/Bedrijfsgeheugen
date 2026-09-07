import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateProtectedPageCoverage, validateVisualRegressionRegistry, scanDangerousLayoutPatterns } from '../tools/site-shell/ui-visual-regression/contract.mjs';

const valid = {
  version: 'UI-VISUAL-REGRESSION-v1',
  defaults: {
    clsMax: 0.1,
    visibleRatioMin: 0.98,
    horizontalOverflowMaxPx: 1,
    overlapMaxAreaPx2: 0,
    viewports: [
      { name: 'phone', width: 390, height: 844 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'small-desktop', width: 1024, height: 768 },
      { name: 'intermediate-desktop', width: 1128, height: 653 },
      { name: 'desktop', width: 1440, height: 900 }
    ]
  },
  pages: [
    { route: '/', required: ['main h1'], protectedPairs: [], interactions: [] },
    { route: '/prijzen', required: ['main h1'], protectedPairs: [], interactions: [] },
    { route: '/due-diligence', required: ['main h1'], protectedPairs: [], interactions: [] }
  ]
};

test('registry accepts required critical routes', () => {
  assert.deepEqual(validateVisualRegressionRegistry(valid), []);
  assert.deepEqual(validateProtectedPageCoverage(valid, ['/', '/prijzen', '/due-diligence']), []);
});

test('production registry covers the intermediate desktop width that exposed the homepage overlap', async () => {
  const registry = JSON.parse(await readFile(new URL('../config/ui-visual-regression.json', import.meta.url), 'utf8'));
  assert.ok(
    registry.defaults.viewports.some(viewport => viewport.width === 1128 && viewport.height === 653),
    'UI visual regression registry must cover 1128x653, the real viewport where the automation card covered the homepage copy'
  );
});

test('duplicate routes fail closed', () => {
  const broken = structuredClone(valid);
  broken.pages.push(structuredClone(broken.pages[0]));
  assert.ok(validateVisualRegressionRegistry(broken).some(x => x.includes('duplicate')));
});

test('blanket page exemption fails closed', () => {
  const broken = structuredClone(valid);
  broken.pages[0].exempt = true;
  assert.ok(validateVisualRegressionRegistry(broken).some(x => x.includes('blanket')));
});

test('exemption must contain review date and ownership', () => {
  const broken = structuredClone(valid);
  broken.pages[0].exemptions = [{ selectorA: '.a', selectorB: '.b', reason: 'badge', maxIntersectionAreaPx2: 20 }];
  const errors = validateVisualRegressionRegistry(broken).join('\n');
  assert.match(errors, /owner/);
  assert.match(errors, /reviewAfter/);
});

test('known unbounded absolute+transform pattern is rejected', () => {
  const page = { protectedPairs: [{ a: '.copy', b: '.visual' }] };
  const html = '<section><div class="copy"></div><div class="visual" style="position:absolute;transform:translateX(-40%)"></div></section>';
  assert.equal(scanDangerousLayoutPatterns(html, page)[0]?.ruleId, 'dangerous-unbounded-positioning');
});

test('bounded grid does not trigger static pattern guard', () => {
  const page = { protectedPairs: [{ a: '.copy', b: '.visual' }] };
  const html = '<section style="display:grid"><div class="copy"></div><div class="visual" style="position:absolute;transform:translateX(0)"></div></section>';
  assert.deepEqual(scanDangerousLayoutPatterns(html, page), []);
});
