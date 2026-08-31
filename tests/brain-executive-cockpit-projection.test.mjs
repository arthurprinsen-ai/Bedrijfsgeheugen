import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const path='brain/contracts/executive-cockpit-projection-v1.json';
const views=['managementSummary','health','opportunities','roadmap','actions','timeline'];

test('executive cockpit is projection-only',()=>{
  assert.equal(fs.existsSync(path),true,'cockpit projection contract must exist');
  const c=JSON.parse(fs.readFileSync(path,'utf8'));
  assert.equal(c.version,'EXECUTIVE-COCKPIT-PROJECTION-v1');
  assert.equal(c.systemOfRecord,false);
  assert.equal(c.independentBusinessTruthForbidden,true);
  assert.equal(c.directBusinessMutationForbidden,true);
  for(const view of views){
    const v=c.views?.[view];
    assert.ok(v,`missing ${view}`);
    assert.ok(Array.isArray(v.sources) && v.sources.length>0,`${view} needs canonical sources`);
  }
});

test('cockpit sources are limited to canonical truth classes',()=>{
  const c=JSON.parse(fs.readFileSync(path,'utf8'));
  const allowed=new Set(['Graph','Intelligence','Execution','Evidence','Memory']);
  for(const view of Object.values(c.views)) for(const source of view.sources) assert.equal(allowed.has(source),true,`non-canonical cockpit source ${source}`);
});
