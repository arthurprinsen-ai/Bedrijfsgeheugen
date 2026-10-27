import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedCompanyPost,verifiedCompanyPostBatch,BRAND_SOCIAL_TENANT} from '../supabase/functions/_shared/verified-company-publication-registry.mjs';
const now=new Date('2026-10-24T09:00:00Z');
const proof={tenant_id:'canonical',channel:'linkedin_company',status:'LIVE_PROVEN',publication_date:'2026-10-24',
  external_id:'urn:li:share:7519639899860402176',published_at:'2026-10-24T06:04:22Z',live_proven_at:'2026-10-24T06:04:23Z'};
test('observed provider proven company post maps to the existing brand social index with NO outcomes',()=>{
 const row=verifiedCompanyPost(proof,now);
 assert.equal(row.tenant_id,BRAND_SOCIAL_TENANT);
 assert.equal(row.platform,'linkedin');
 assert.equal(row.post_id,'linkedin-company:'+proof.external_id);
 assert.equal(row.learning_status,'pending_measurement');
 assert.equal(row.published_at,'2026-10-24T06:04:22.000Z');
 assert.equal(Object.hasOwn(row,'metrics'),false);
 assert.equal(Object.hasOwn(row,'views'),false);
});
test('publication in PUBLISHED / DRAFT / without independent live evidence is never registered',()=>{
 for(const status of ['PUBLISHED','GENERATED','BLOCKED','FAILED']){
   assert.equal(verifiedCompanyPost({...proof,status},now),null);
 }
 assert.equal(verifiedCompanyPost({...proof,live_proven_at:null},now),null);
 assert.equal(verifiedCompanyPost({...proof,channel:'linkedin_personal'},now),null);
 assert.equal(verifiedCompanyPost({...proof,external_id:'https://untrusted.test'},now),null);
});
test('no cross tenant or future forged proof',()=>{
 assert.equal(verifiedCompanyPost({...proof,tenant_id:'another-company'},now),null);
 assert.equal(verifiedCompanyPost({...proof,published_at:'2026-10-25T06:04:22Z'},now),null);
 assert.equal(verifiedCompanyPost({...proof,publication_date:'nonsense'},now),null);
 assert.equal(verifiedCompanyPost({...proof,published_at:'2026-07-01T06:04:22Z'},now),null);
});
test('proof batch deduplicates, is capped and sorted deterministically',()=>{
 const b=verifiedCompanyPostBatch([proof,proof,{...proof,external_id:'urn:li:share:7519277505673986048',published_at:'2026-10-23T06:00:00Z',live_proven_at:'2026-10-23T06:00:01Z',publication_date:'2026-10-23'}],now,2);
 assert.equal(b.length,2);assert.ok(b[0].published_at < b[1].published_at);
 assert.equal(verifiedCompanyPostBatch([proof,proof],now,30).length,1);
});
