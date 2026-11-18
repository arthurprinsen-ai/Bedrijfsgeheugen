import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertFaithfulTranslationBatch} from '../tools/site-shell/static-i18n-openai-fallback.mjs';

const patch='config/bg-static-i18n-en.d/powerhouse-blog-2026-11-18.json';
const data=JSON.parse(readFileSync(patch,'utf8'));
const entries=Object.entries(data);

test('source-exact curated EN cache closes exactly 76 genuinely observed approved 18-Nov blog gaps',()=>{
  assert.equal(entries.length,76);
  assert.equal(Object.keys(data).length,76);
  for(const [source,target] of entries){
    assert.ok(source.trim().length>1);
    assert.ok(target.trim().length>1);
    assert.notEqual(source,target,'No fake EN/identical Dutch placeholders');
  }
  assertFaithfulTranslationBatch(entries.map(e=>e[0]),entries.map(e=>e[1]));
  assert.equal(data['Inhoudelijk bijgewerkt 2026-11-18'],'Content updated 2026-11-18');
  assert.equal(data['18-11-2026 · nieuw'],'18-11-2026 · new');
  assert.ok(data['bereid: wat verandert er voor jou?']?.startsWith('Prepare:'));
  assert.equal(data['Stap 6 — Pilot: scope en succescriteria'],'Step 6 — Pilot: scope and success criteria');
});

test('unproven 50 percent hypothesis stays a hypothesis, not a claimed outcome',()=>{
  const row=entries.find(([k])=>k.startsWith('Hypothese: als we betalingswebhooks'));
  assert.ok(row);
  assert.match(row[1],/^Hypothesis:/);
  assert.match(row[1],/halved/);
  assert.match(row[1],/pilot/);
  assert.match(data['Opmerking: dit is een testbare hypothese gebaseerd op marktobservatie; het is geen gegarandeerd resultaat.'],/not a guaranteed result/);
});

test('source epistemics and reversible audit safeguards survive faithful English',()=>{
  const keys=[
    'Beperking van het bewijs:',
    'Beperking: de onderliggende observatie',
    'Eerlijk alternatief:',
    'Succescriteria (meetbaar):',
    'Beveiliging:'
  ];
  keys.forEach(prefix=>assert.ok(entries.some(([k,v])=>k.startsWith(prefix)&&v.trim().length>20),prefix));
  const aboutAll=entries.find(([k])=>k.startsWith('Beperking van het bewijs:'));
  assert.match(aboutAll[1],/no broad, independent measure/);
  assert.match(aboutAll[1],/all SMEs/);
  const alternate=entries.find(([k])=>k.startsWith('Eerlijk alternatief:'));
  assert.match(alternate[1],/^Honest alternative:/);
  assert.match(alternate[1],/costs and risks/);
  const security=entries.find(([k])=>k.startsWith('Beveiliging:'));
  assert.match(security[1],/OAuth/);
});

test('no claims of provider-paid translation or terminal live success embedded in cache file',()=>{
  const s=readFileSync(patch,'utf8');
  // Exact forbidden endpoint check; avoid ambiguous regex matching on URL hosts.
  assert.equal(s.includes('https://api.openai.com/v1/responses'),false);
  assert.doesNotMatch(s,/"live_proven_at"|"external_id"|"provider_success"|"deployment_ready"/);
});
