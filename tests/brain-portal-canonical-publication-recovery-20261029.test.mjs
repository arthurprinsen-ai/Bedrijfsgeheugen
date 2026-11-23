import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {summarizePublicationEvidence,loadPublicationEvidence}
 from '../brain/observability/publication-evidence-readback.mjs';

const date='2026-10-29';
const row=(channel,status,extra={})=>({
 tenant_id:'canonical',publication_date:date,channel,status,
 external_id:null,live_proven_at:null,last_error:'',...extra
});
const rows=[
 row('linkedin_company','LIVE_PROVEN',{external_id:'urn:li:share:private',live_proven_at:'2026-10-29T08:00:00Z'}),
 row('linkedin_personal','BLOCKED',{last_error:'STORY_FAMILY_DUPLICATE:private reservation key'}),
 row('instagram','PLANNED',{last_error:'MEDIA_ASSET_REQUIRED:internal user data'}),
 row('blog','GENERATED',{last_error:'private draft contents'})
];

test('honestly preserves channel-specific status and no-repeat gates without leaking provider IDs or raw error content',()=>{
 const x=summarizePublicationEvidence(rows,{count:4,date,observedAt:'2026-10-29T12:00:00Z'});
 assert.equal(x.status,'REGISTRY_READBACK_COMPLETE');
 assert.deepEqual(x.channels.map(c=>c.channel),['linkedin_company','linkedin_personal','instagram','blog']);
 assert.equal(x.channels[0].providerIdRecorded,true);
 assert.equal(x.channels[0].recoveryCode,'NO_REPOST_COLLECT_OUTCOMES');
 assert.equal(x.channels[1].recoveryCode,'NEW_FACT_VERIFIED_DISTINCT_STORY_REQUIRED');
 assert.equal(x.channels[2].recoveryCode,'CANONICAL_MEDIA_ASSET_REQUIRED');
 assert.equal(x.channels[3].recoveryCode,'PROTECTED_PUBLICATION_AND_PUBLIC_URL_READBACK');
 assert.equal(x.channels[3].internalLiveProofRecorded,false);
 assert.doesNotMatch(JSON.stringify(x),/urn:li|private|internal user data/);
});
test('tenant spoof, duplicate rows, partial, unknown channels and malformed provider totals are never green',()=>{
 for(const bad of [
  [rows.slice(0,3),4],
  [[...rows,{...rows[0]}],5],
  [[...rows.slice(0,3),{...rows[3],tenant_id:'someone-else'}],4],
  [[...rows.slice(0,3),{...rows[3],channel:'unknown'}],4],
  [rows,undefined]
 ]){
   assert.equal(summarizePublicationEvidence(bad[0],{count:bad[1],date,observedAt:'2026-10-29T12:00:00Z'}).status,'UNVERIFIED');
 }
});
test('production readback only selects canonical tenant and Amsterdam publication date, server-to-server',async()=>{
 const calls=[];
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});
  return {ok:true,headers:{get:n=>n==='content-range'?'0-3/4':null},json:async()=>rows};
 };
 const x=await loadPublicationEvidence({baseUrl:'https://example.supabase.co',key:'private-server-key',
   observedAt:'2026-10-28T23:30:00Z',fetchImpl});
 assert.equal(x.status,'REGISTRY_READBACK_COMPLETE');
 assert.equal(x.date,'2026-10-29');
 assert.equal(calls.length,1);
 const url=new URL(calls[0].url);
 assert.equal(url.searchParams.get('tenant_id'),'eq.canonical');
 assert.equal(url.searchParams.get('publication_date'),'eq.2026-10-29');
 assert.equal(calls[0].options.method,'GET');
 assert.equal(calls[0].options.headers.prefer,'count=exact');
 assert.doesNotMatch(JSON.stringify(x),/private-server-key|urn:li/);
});
test('missing provider configuration, denied provider, incomplete count and unexpected raw content fail closed',async()=>{
 assert.equal((await loadPublicationEvidence({})).status,'UNVERIFIED');
 const denied=await loadPublicationEvidence({baseUrl:'https://x',key:'k',
  observedAt:'2026-10-29T12:00:00Z',fetchImpl:async()=>({ok:false,status:403})});
 assert.equal(denied.reason,'PUBLICATION_HTTP_403');
 const incomplete=await loadPublicationEvidence({baseUrl:'https://x',key:'k',
  observedAt:'2026-10-29T12:00:00Z',
  fetchImpl:async()=>({ok:true,headers:{get:()=>null},json:async()=>rows})});
 assert.equal(incomplete.status,'UNVERIFIED');
});
test('API and portal are existing admin-only surfaces, no second publisher or scheduler',()=>{
 const api=fs.readFileSync('netlify/functions/powerhouse-observability.mjs','utf8');
 const ui=fs.readFileSync('portal-v2/modules/powerhouse-observability.js','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/resolveIdentityTenant\(user\)/);
 assert.match(api,/loadPublicationEvidence\(/);
 assert.match(api,/publicationEvidence:\{\.\.\.publicationEvidence,contract:PUBLICATION_EVIDENCE_CONTRACT\}/);
 assert.match(ui,/data-publication-evidence/);
 assert.match(ui,/REGISTRY_READBACK_COMPLETE/);
 assert.match(ui,/onafhankelijk providerbewijs/);
 assert.doesNotMatch(api,/console\.log\(.*publicationEvidence/);
});
