import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('AI model catalog is fresh, source-backed and governance-explicit',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const age=(Date.now()-new Date(c.verified_at+'T00:00:00Z'))/86400000;
 assert.ok(age<=14,'catalog must be refreshed within 14 days');
 assert.ok(c.models.length>=25);
 for(const m of c.models){
   assert.match(m.source,/^https:\/\//);
   assert.ok(m.jurisdiction);
   assert.ok(Object.prototype.hasOwnProperty.call(m,'eu_processing'));
   assert.ok(Object.prototype.hasOwnProperty.call(m,'eu_storage'));
 }
});
