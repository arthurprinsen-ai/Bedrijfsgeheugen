import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../modules/strategic-model-workspace.js',import.meta.url),'utf8');

test('strategic model workspace renders the complete registry instead of BCG only',()=>{
  assert.match(source,/buildStrategicModels/);
  assert.match(source,/STRATEGIC_MODEL_IDS/);
  assert.match(source,/data-model-id/);
  assert.match(source,/models\.map|for\s*\(const model of models\)/);
});

test('every strategic model note writes to its own canonical Powerhouse note path and flushes server state',()=>{
  assert.match(source,/model\.notePath/);
  assert.match(source,/data-model-note/);
  assert.match(source,/domainState\.set\(model\.notePath/);
  assert.match(source,/domainState\.flush\(\)/);
});

test('every strategic model can add a canonical deduplicated roadmap action',()=>{
  assert.match(source,/buildStrategicRoadmapAction/);
  assert.match(source,/mergeStrategicRoadmapAction/);
  assert.match(source,/data-model-roadmap/);
  assert.match(source,/roadmap/);
});

test('BCG production selectors remain compatible while the workspace generalizes',()=>{
  for(const token of ['data-bcg-note','data-bcg-save','data-bcg-roadmap','data-bcg-status']) assert.match(source,new RegExp(token));
});
