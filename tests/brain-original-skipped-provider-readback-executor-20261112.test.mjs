import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ORIGINAL_HISTORICAL_READBACK_BATCH,originalHistoricalProviderReference as select,originalProviderReadbackResult as proof,originalProviderReadbackErrorCode as errorCode} from '../supabase/functions/_shared/original-skipped-provider-readback-selection.mjs';
const publisher=readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts',import.meta.url),'utf8');
const base={status:'SKIPPED',channel:'linkedin_company',publication_date:'2026-09-26',
 external_id:'urn:li:share:7509384024180686848',evidence:{
 source_state_conflict:'SKIPPED_WITH_ORIGINAL_PROVIDER_REFERENCE',
 republish_forbidden:true,reconciliation_required:true}};
test('only original fenced SKIPPED references are eligible; internal 24hex is never sent to provider',()=>{
 assert.deepEqual(select(base).kind,'linkedin_company');
 assert.equal(select({...base,status:'LIVE_PROVEN'}).eligible,false);
 assert.equal(select({...base,evidence:{...base.evidence,republish_forbidden:false}}).eligible,false);
 assert.equal(select({...base,evidence:{...base.evidence,reconciliation_required:false}}).eligible,false);
 assert.equal(select({...base,channel:'instagram',external_id:'18103653614617314'}).kind,'instagram');
 assert.equal(select({...base,external_id:'6aab7fa7587e9f368fe1d58c'}).kind,'internal_reference');
 assert.equal(select({...base,external_id:'https://example.com'}).eligible,false);
});
test('source read cooldown and exact owner/identity/date evidence cannot be bypassed',()=>{
 const date=Date.parse('2026-11-12T19:00:00Z');
 assert.equal(select({...base,evidence:{...base.evidence,reconciliation_provider_probe:{checked_at:'2026-11-12T18:30:00Z'}}},{nowMs:date}).eligible,false);
 assert.equal(select({...base,evidence:{...base.evidence,reconciliation_provider_probe:{checked_at:'2026-11-11T18:30:00Z'}}},{nowMs:date}).eligible,true);
 const valid={id:base.external_id,author:'urn:li:organization:18234216',lifecycleState:'PUBLISHED',publishedAt:Date.parse('2026-09-26T11:10:00Z')};
 assert.equal(proof(base,valid,{expectedAuthor:'urn:li:organization:18234216'}).verified,true);
 assert.equal(proof(base,{...valid,author:'urn:li:organization:OTHER'},{expectedAuthor:'urn:li:organization:18234216'}).verified,false);
 assert.equal(proof(base,{...valid,publishedAt:Date.parse('2026-09-27T11:10:00Z')},{expectedAuthor:'urn:li:organization:18234216'}).verified,false);
 assert.equal(proof(base,{...valid,id:'urn:li:share:9999999999999'},{expectedAuthor:'urn:li:organization:18234216'}).verified,false);
});
test('403/400 cannot be treated as proof of deletion or authority to republish',()=>{
 assert.equal(errorCode({http:403,message:'Forbidden'}),'PROVIDER_READ_PERMISSION_LIMITED');
 assert.equal(errorCode({http:400,message:'Unsupported get request'}),'PROVIDER_OBJECT_UNAVAILABLE_OR_ACCESS_LIMITED');
 assert.equal(ORIGINAL_HISTORICAL_READBACK_BATCH,3);
 for(const exact of [
 "reconcileHistoricalSkippedProviderReferences(db)",
 "'INSTAGRAM_GET_IG_MEDIA'",
 "'LINKEDIN_GET_POST_CONTENT'",
 "'status','SKIPPED'",
 "eq('updated_at',row.updated_at)",
 "eq('updated_at',checkedAt)",
 "source_state_updated:false",
 "original_consumer_fulfilled:false",
 "publication_created:false",
 "no_provider_create:true"
 ])assert.ok(publisher.includes(exact),exact);
 const start=publisher.indexOf('async function reconcileHistoricalSkippedProviderReferences');
 const end=publisher.indexOf('Deno.serve(async (req)',start);
 const readOnly=publisher.slice(start,end);
 assert.doesNotMatch(readOnly,/INSTAGRAM_POST_IG_USER_MEDIA|LINKEDIN_CREATE_LINKED_IN_POST|recordObligation\(|issuePublishCapability\(|consumePublishCapability\(|cron\.schedule|net\.http_post/);
 assert.ok(publisher.includes("if (mode === 'audit_only') return json"));
});
