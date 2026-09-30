import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('AI model catalog v2 is fresh, source-backed, broad and governance-explicit',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 assert.ok(c.models.length>=80);
 assert.ok(new Set(c.models.map(m=>m.provider)).size>=9);
 for(const m of c.models){
   assert.match(m.source,/^https:\/\//);
   assert.ok(m.jurisdiction);
   assert.ok(m.verified_at);
   const age=(Date.now()-new Date(m.verified_at+'T00:00:00Z'))/86400000;
   assert.ok(age<=14,`${m.id} verification is stale`);
   assert.ok(Array.isArray(m.limitations));
   assert.ok(m.governance);
   assert.ok(Object.prototype.hasOwnProperty.call(m.governance,'storage_residency'));
   assert.ok(Object.prototype.hasOwnProperty.call(m.governance,'inference_residency'));
   assert.ok(Object.prototype.hasOwnProperty.call(m,'eu_processing'));
   assert.ok(Object.prototype.hasOwnProperty.call(m,'eu_storage'));
 }
 const strengths=c.models.flatMap(m=>m.strengths||[]).join(' ').toLowerCase();
 assert.match(strengths,/image generation/);
 assert.match(strengths,/ocr/);
 assert.match(strengths,/embedding/);
 assert.match(strengths,/moderation/);
 assert.ok(c.models.some(m=>(m.modalities||[]).includes('audio')));
 assert.ok(c.models.some(m=>(m.modalities||[]).includes('video')));
 assert.ok(c.models.some(m=>m.self_host===true));
});