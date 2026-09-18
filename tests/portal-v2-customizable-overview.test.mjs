import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { OVERVIEW_BLOCKS, normalizeOverviewOrder, reorderOverviewBlocks } from '../portal-v2/modules/overview-reorder.js';

test('overview default starts with KPI cards and keeps directievragen lower',()=>{
  assert.deepEqual(OVERVIEW_BLOCKS.map(x=>x.id),['kpis','insights','intelligence','execution','questions','activities']);
  assert.ok(OVERVIEW_BLOCKS.findIndex(x=>x.id==='questions')>OVERVIEW_BLOCKS.findIndex(x=>x.id==='kpis'));
});

test('overview order normalization preserves valid personal order and restores missing widgets',()=>{
  assert.deepEqual(
    normalizeOverviewOrder(['questions','kpis','bogus','questions']),
    ['questions','kpis','insights','intelligence','execution','activities']
  );
});

test('overview reorder supports deterministic directional movement',()=>{
  assert.deepEqual(
    reorderOverviewBlocks(['kpis','insights','questions'],'questions','kpis'),
    ['questions','kpis','insights']
  );
});

test('overview stores separate desktop and mobile layouts and exposes explicit edit mode',()=>{
  const source=fs.readFileSync('portal-v2/modules/overview-reorder.js','utf8');
  assert.match(source,/portal\.overview\.layouts\.\$\{mode\}\.order/);
  assert.match(source,/max-width: 760px/);
  assert.match(source,/Overzicht aanpassen/);
  assert.match(source,/data-overview-size/);
  assert.match(source,/onpointerdown/);
});

test('overview renders profile insight and drill-down questions before mounting reorder controller',()=>{
  const source=fs.readFileSync('portal-v2/modules/overview.js','utf8');
  const legacy=source.indexOf('renderLegacyOverviewInsights(root,state);');
  const questions=source.indexOf('renderDirectievragen(root,state);');
  const reorder=source.indexOf('ensureOverviewReorder(root);',source.indexOf('export function applyOverviewDashboard'));
  assert.ok(legacy>=0&&questions>legacy&&reorder>questions);
  assert.match(source,/insights\.after\(houder\)/);
});

test('directievragen are now framed as lower-page drill-down instead of the page opener',()=>{
  const source=fs.readFileSync('portal-v2/modules/directievragen.js','utf8');
  assert.match(source,/Wat wil je verder weten\?/);
  assert.doesNotMatch(source,/>Waar wil je naar kijken\?</);
});
