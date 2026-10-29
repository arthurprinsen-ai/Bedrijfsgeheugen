import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadPersonalSourceSupply} from '../brain/observability/publication-evidence-readback.mjs';

const api=readFileSync('netlify/functions/powerhouse-observability.mjs','utf8');
const portal=readFileSync('portal-v2/modules/powerhouse-observability.js','utf8');
const stamp='2026-10-29T18:15:00.000Z';
const answer=(count,status=200)=>({ok:status===200,status,headers:{get:name=>name==='content-range'?`0-0/${count}`:null}});
test('source supply counts independently verified provider data, no invented READY',async()=>{
 let calledUrl;
 const fake=async url=>{calledUrl=new URL(url);return answer(2)};
 const s=await loadPersonalSourceSupply({baseUrl:'https://test.supabase.co',key:'secret',observedAt:stamp,fetchImpl:fake});
 assert.equal(s.status,'FRESH_ELIGIBLE_SOURCES_PRESENT');
 assert.equal(s.freshEligibleSourceCount,2);
 assert.equal(calledUrl.pathname,'/rest/v1/powerhouse_mira_problem_signals_v1');
 assert.equal(calledUrl.searchParams.get('metadata->>contract'),'eq.personal-observational-life-source-v1');
 assert.equal(calledUrl.searchParams.get('eligible'),'eq.true');
 assert.equal(calledUrl.searchParams.getAll('source_published_at').length,2);
 assert.doesNotMatch(JSON.stringify(s),/secret|source_url|external_id/);
});
test('source absence is an explicit blocked supply state, not a publication',async()=>{
 const s=await loadPersonalSourceSupply({baseUrl:'https://test.supabase.co',key:'secret',observedAt:stamp,fetchImpl:async()=>answer(0)});
 assert.equal(s.status,'SOURCE_SUPPLY_REQUIRED');
 assert.equal(s.freshEligibleSourceCount,0);
 assert.doesNotMatch(JSON.stringify(s),/LIVE_PROVEN/);
});
test('missing count and provider read failures fail closed',async()=>{
 const base={baseUrl:'https://test.supabase.co',key:'secret',observedAt:stamp};
 const missing=await loadPersonalSourceSupply({...base,fetchImpl:async()=>({ok:true,status:200,headers:{get:()=>null}})});
 assert.equal(missing.status,'UNVERIFIED');
 const forbidden=await loadPersonalSourceSupply({...base,fetchImpl:async()=>answer(0,403)});
 assert.equal(forbidden.status,'UNVERIFIED');
 const refused=await loadPersonalSourceSupply({...base,fetchImpl:async()=>{throw Error('remote-down')}});
 assert.equal(refused.status,'UNVERIFIED');
});
test('portal source card is admin-only and separate from original 4 publication obligations',()=>{
 assert.match(api,/if\(!isPowerhouseAdmin\(user/);
 assert.match(api,/if\(!tenantId\)/);
 assert.match(api,/personalSourceSupply,publicationEvidence:/);
 assert.match(portal,/observability\.personalSourceSupply/);
 assert.match(portal,/LinkedIn persoonlijk · verse bronaanvoer/);
 assert.match(portal,/een bron is geen verhaal, post of provider-ID/);
});
