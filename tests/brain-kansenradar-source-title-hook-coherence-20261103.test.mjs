import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 classifyKansenradarSource,KANSENRADAR_SOURCE_GATE_CONTRACT
} from '../supabase/functions/_shared/kansenradar-source-coherence-gate.mjs';
const original=readFileSync(new URL('../supabase/functions/bg-kansenradar/index.ts',import.meta.url),'utf8');
const unsafe='https://www.change.inc/transities/mobiliteit-transitie/nieuwsupdate-minder-zakelijke-en-meer-vakantievluchten-en-2-op-5-nederlanders-kijkt-serieus-naar-biologische-voeding';
test('mixed-news original incident cannot become a source-backed editorial hook',()=>{
 assert.equal(KANSENRADAR_SOURCE_GATE_CONTRACT,'bg-kansenradar-single-story-source-v1');
 assert.deepEqual(classifyKansenradarSource({url:unsafe}),{accepted:false,reason:'MULTI_STORY_HEADLINE_HOOK_UNBOUND',url:unsafe});
 for(const u of ['https://example.com/nieuwsoverzicht-2026','https://example.com/news-roundup/today','https://example.com/daily-roundup-2026','https://example.com/nieuws-in-het-kort/2026']){
  assert.equal(classifyKansenradarSource({url:u}).accepted,false);
 }
});
test('single-topic article candidates still permitted; classifier does not call external provider',()=>{
 const u='https://www.example.org/nieuws/ondernemers-krijgen-meer-cybersecurity-eisen';
 assert.deepEqual(classifyKansenradarSource({url:u}),{accepted:true,reason:'SINGLE_STORY_URL_PATTERN_ACCEPTED',url:u});
 assert.equal(classifyKansenradarSource({url:'https://www.example.org/nieuwsupdate?x=a'}).accepted,true,
  'gate is conservative and based on roundup pathname, not all potential hints');
});
test('invalid URLs fail closed instead of throwing',()=>{
 for(const u of ['',undefined,{},'not-a-url','javascript:alert(1)','https://example.com/%GG']) {
  const result=classifyKansenradarSource({url:u});
  assert.equal(result.accepted,false);
 }
});
test('original Kansenradar checks source gate before any OpenAI inference and downstream calendar/DM',()=>{
 assert.match(original,/import \{ classifyKansenradarSource, KANSENRADAR_SOURCE_GATE_CONTRACT \}/);
 const gate=original.indexOf('const sourceClassifications = ');
 const inference=original.indexOf('const toets = await openai(');
 const calendar=original.indexOf('const top = goed[0]');
 const outreach=original.indexOf('const dm = await openai(');
 assert.ok(gate>0&&gate<inference&&inference<calendar&&calendar<outreach);
 assert.match(original,/sourceRejected\.length/);
 assert.match(original,/await bewijs\(false, \{\s*error: 'KANSENRADAR_SINGLE_STORY_SOURCE_REQUIRED'/);
 assert.match(original,/reden: 'GEEN_BRONCONSISTENTE_SIGNALEN'/);
 assert.match(original,/const kand = sourceClassifications\.filter\(\(entry: any\) => entry\.gate\.accepted\)/);
 assert.match(original,/callerToken !== schedulerSecret/);
 assert.match(original,/gov\.provider !== 'OpenAI'/);
 assert.match(original,/tool_choice: \{ type: 'function', function: \{ name \} \}/);
 assert.match(original,/status: 'suggested'/);
});
