import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { nativePageContent, listNativePages, PAGE_NAVIGATION } from '../native-pages.js';
import { pageMetrics, pageWorklist, hasPageData, METRIC_EMPTY, listMetricPages } from '../page-metrics.js';
import { pageVisual } from '../page-visuals.js';
import { LEGACY_FUNCTIONAL_INVENTORY } from '../legacy-functional-inventory.js';

/**
 * Deze test bestaat om één fout te voorkomen die eerder is gemaakt:
 * een pagina die er af is uitziet maar een verzonnen getal toont.
 */

const NUMERIC=/(€\s?[\d.,]+|\b\d+([.,]\d+)?\s?(%|fte|uur|mnd|weken|dagen|dgn)\b|\b\d+\/\d+\b)/i;

test('native-pages bevat geen hardgecodeerde cijfers', async () => {
  const source = await readFile(new URL('../native-pages.js', import.meta.url), 'utf8');
  const literals = [...source.matchAll(/'([^']*)'/g)].map(match => match[1]);
  const offenders = literals.filter(value => NUMERIC.test(value));
  assert.deepEqual(offenders, [], `demo-cijfer teruggeslopen in native-pages.js: ${offenders.join(' | ')}`);
});

test('elke pagina geeft zonder klantdata een leegteken in plaats van een getal', () => {
  for (const pageId of listNativePages()) {
    const view = nativePageContent(pageId, {});
    assert.ok(view, `geen inhoud voor ${pageId}`);
    assert.equal(view.derived, false, `${pageId} claimt klantdata terwijl de state leeg is`);
    for (const block of view.blocks) {
      if (block.type !== 'metrics') continue;
      for (const [label, value] of block.items) {
        assert.equal(value, METRIC_EMPTY, `${pageId} · ${label} toont "${value}" zonder klantdata`);
      }
    }
  }
});

test('zonder klantdata wordt geen enkele grafiek getekend', () => {
  for (const pageId of listMetricPages()) {
    assert.equal(pageVisual(pageId, {}), '', `${pageId} tekent een grafiek op lege data`);
  }
});

test('met klantdata komen de cijfers uit de state en veranderen ze mee', () => {
  const base = { portal: { roadmap: { items: [{ title: 'A', start: 1, duration: 3, progress: 40, value: 10000 }] } } };
  const more = { portal: { roadmap: { items: [
    { title: 'A', start: 1, duration: 3, progress: 40, value: 10000 },
    { title: 'B', start: 4, duration: 2, progress: 100, done: true, value: 5000 }
  ] } } };
  assert.equal(hasPageData('roadmap', base), true);
  const first = pageMetrics('roadmap', base);
  const second = pageMetrics('roadmap', more);
  assert.notDeepEqual(first, second, 'de cijfers reageren niet op een wijziging in de klantdata');
  assert.equal(first.find(([label]) => label === 'Items')[1], '1');
  assert.equal(second.find(([label]) => label === 'Items')[1], '2');
  assert.ok(pageWorklist('roadmap', more).length > 0, 'werklijst blijft leeg terwijl er open items zijn');
  assert.match(pageVisual('roadmap', more), /^<figure class="v2visual"/, 'roadmap tekent geen gantt');
});

test('elk beschermd legacy-tabblad heeft een pagina met echte cijfers', () => {
  for (const [tab, item] of Object.entries(LEGACY_FUNCTIONAL_INVENTORY)) {
    const metrics = pageMetrics(item.v2Page, {});
    assert.ok(
      PAGE_NAVIGATION[item.v2Page] || metrics.length,
      `legacy-tab ${tab} heeft geen v2-pagina (${item.v2Page})`
    );
    assert.ok(metrics.length >= 3, `${item.v2Page} heeft te weinig kerncijfers voor pariteit met ${tab}`);
  }
});
