import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('AI Model Advisor v2 prevents shallow catalog and specialist misrouting',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const page=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.ok(catalog.models.length>=80);
 assert.ok(catalog.models.every(m=>Array.isArray(m.limitations)));
 assert.ok(catalog.models.every(m=>m.governance && m.verified_at && /^https:\/\//.test(m.source)));
 assert.ok(catalog.models.some(m=>(m.strengths||[]).join(' ').toLowerCase().includes('ocr')));
 assert.ok(catalog.models.some(m=>(m.strengths||[]).join(' ').toLowerCase().includes('embedding')));
 assert.ok(catalog.models.some(m=>(m.modalities||[]).includes('audio')));
 assert.ok(catalog.models.some(m=>(m.modalities||[]).includes('video')));
 assert.match(page,/specialistIntent/);
 assert.match(page,/Minder geschikt \/ valkuilen/);
 assert.match(page,/governancevelden te verifiëren/);
});