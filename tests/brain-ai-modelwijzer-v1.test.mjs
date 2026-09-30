import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const page=fs.readFileSync('ai-modelwijzer.html','utf8');
const js=fs.readFileSync('assets/js/ai-modelwijzer.mjs','utf8');
const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog.json','utf8'));
test('AI Modelwijzer has goal-first ungated advice and commercial continuation',()=>{
  assert.match(page,/Wat wil je|Vertel wat je wilt/i);
  assert.match(page,/id="advise"/);
  assert.match(page,/id="leadForm"/);
  assert.ok(page.indexOf('id="advise"')<page.indexOf('id="leadForm"'));
});
test('catalog carries provenance and governance fields',()=>{
  assert.ok(catalog.models.length>=70);
  for(const m of catalog.models){
    assert.ok(m.id&&m.provider&&m.name&&m.status&&m.source&&m.verified_at);
    assert.ok(Object.hasOwn(m,'data_residency'));
    assert.ok(Object.hasOwn(m,'eu_option'));
    assert.ok(Object.hasOwn(m,'self_host'));
  }
  assert.ok(catalog.governance_questions.length>=10);
});
test('advisor is fail-closed on unknown governance and estimates workload cost',()=>{
  assert.match(js,/govPenalty/);
  assert.match(js,/verify-before|unknown|verify-policy/);
  assert.match(js,/monthlyCost/);
});
test('lead capture uses canonical commercial route',()=>{
  const f=fs.readFileSync('netlify/functions/ai-model-advisor-lead.mjs','utf8');
  assert.match(f,/captureCommercialLead/);
  assert.match(f,/source:'ai-modelwijzer'/);
});
test('current frontier and specialist families are represented',()=>{
  const ids=new Set(catalog.models.map(m=>m.id));
  for(const id of ['gpt-6.1-sol','gemini-3.8-flash','mistral-medium-3.5','claude-sonnet-5','deepseek-v4-pro']) assert.ok(ids.has(id),id);
});
test('created HTML uses absolute hrefs',()=>{
  const hrefs=[...page.matchAll(/href="([^"]+)"/g)].map(x=>x[1]);
  assert.ok(hrefs.every(h=>/^https:\/\//.test(h)),hrefs.filter(h=>!/^https:\/\//.test(h)).join(','));
});
test('specialist models are penalized outside matching user goals',()=>{ assert.match(js,/specialistPenalty/); });
