import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const slo=JSON.parse(fs.readFileSync('tools/content-growth/slo.json','utf8'));
test('daily publication closes only on exact live proof',()=>{
  assert.equal(slo.requiredPerCalendarDay,1);
  assert.equal(slo.successState,'live');
  assert.equal(slo.requiresHttp200,true);
  assert.equal(slo.requiresCanonicalMatch,true);
  assert.equal(slo.requiresContentIdMatch,true);
});
