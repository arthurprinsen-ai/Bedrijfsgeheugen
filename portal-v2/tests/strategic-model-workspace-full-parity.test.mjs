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

test('all-models workspace exposes the eight legacy finance models beside the twenty strategic models',()=>{
  assert.match(source,/FINANCE_MODEL_CATALOG/);
  for(const id of ['ebitda-multiple','ebitda-margin','solvency','dscr','dupont','altman-z','break-even','working-capital-days']){
    assert.ok(source.includes("id:'"+id+"'"),id+' missing from finance catalogue');
  }
  assert.match(source,/data-model-catalog-count/);
  assert.match(source,/models\.length\+FINANCE_MODEL_CATALOG\.length/);
});

test('every model is a clickable in-page destination and no catalogue click is hardwired to canvassen',()=>{
  assert.match(source,/data-model-jump/);
  assert.match(source,/data-model-id/);
  assert.match(source,/scrollIntoView/);
  const start=source.indexOf('function modelCatalog');
  const end=source.indexOf('function bindModelNavigation');
  assert.ok(start>=0&&end>start);
  assert.doesNotMatch(source.slice(start,end),/canvassen/);
});
