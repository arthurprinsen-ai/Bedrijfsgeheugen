import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isDataForSeoEmptyNewsTask} from '../supabase/functions/_shared/dataforseo-empty-news-task.mjs';

test('a top-level OK with task 40101 or 40102 is EMPTY rather than a transient failure',()=>{
  for(const code of [40101,40102]) assert.equal(isDataForSeoEmptyNewsTask({httpOk:true,envelopeCode:20000,taskCode:code}),true);
});
test('provider errors and invalid transport never appear as an empty successful result',()=>{
  for(const code of [0,40000,40100,40103,50000,20000]) assert.equal(isDataForSeoEmptyNewsTask({httpOk:true,envelopeCode:20000,taskCode:code}),false);
  assert.equal(isDataForSeoEmptyNewsTask({httpOk:false,envelopeCode:20000,taskCode:40102}),false);
  assert.equal(isDataForSeoEmptyNewsTask({httpOk:true,envelopeCode:40100,taskCode:40102}),false);
  assert.equal(isDataForSeoEmptyNewsTask({httpOk:true,envelopeCode:null,taskCode:40102}),false);
});
test('canonical radar counts empty responses but does not synthesize a source or bypass its gates',()=>{
  const radar=readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
  assert.match(radar,/isDataForSeoEmptyNewsTask\(/);
  assert.match(radar,/dataforseo_no_results/);
  assert.match(radar,/taskCode!==20000\) throw new Error\('DATAFORSEO_'/);
  assert.match(radar,/evaluateMiraPublicationFreshness\(/);
  assert.match(radar,/eligible:total>=0\.72&&publication\.eligible/);
  assert.match(radar,/selectMiraSourceQueries\(runDate\)/);
});
