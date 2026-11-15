import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stageOriginalWindsorCompanySources,originalCompanySourceProviderHealth,readOriginalWindsorCompanySourcePair} from '../supabase/functions/_shared/original-windsor-company-stage.mjs';

const id='urn:li:share:7526904394580238336';
const org='urn:li:organization:18234216';
const day='2026-11-14';
const observedAt='2026-11-14T19:52:00Z';
const originalProof={
 tenant_id:'canonical',channel:'linkedin_company',status:'LIVE_PROVEN',
 external_id:id,publication_date:'2026-11-13',live_proven_at:'2026-11-13T07:10:52Z',
 evidence:{provider_truth_verified:true,author_urn:org,
   linkedin_readback:{id,author:org}}
};
const actualProvider={
 date:'2026-11-13',post_id:id,share_id:'7526904394580238336',
 share_owner:org,share_published_time:'2026-11-13',
 share_url:'https://www.linkedin.com/feed/update/'+id,
 share_impression_count:3,share_clicks_count:0,
 share_like_count:0,share_comment_count:0,share_count:0
};
const actualAccount={date:day,organization_id:null,
 account_analytics_impression_count:1,account_analytics_click_count:0,
 account_analytics_comment_count:0,account_analytics_share_count:0};
const prepare=(custom={})=>stageOriginalWindsorCompanySources({
 postRows:[actualProvider],accountRows:[actualAccount],
 publicationProofs:[originalProof],slotDay:day,observedAt,...custom
});
test('real Windsor company post is staged only with exact ORIGINAL author/provider and original source handoff',()=>{
 const result=prepare();
 assert.equal(result.source_rows.length,1);
 assert.equal(result.account_row?.metrics.impressions,1);
 const row=result.source_rows[0];
 assert.equal(row.source_key,'linkedin_company_post:'+id);
 assert.equal(row.metric_date,day);
 assert.equal(row.quality,'PROVIDER_OBSERVED_UNLINKED');
 assert.equal(row.source_observed_at,observedAt);
 assert.equal(row.metrics.share_impression_count,3);
 assert.equal(row.evidence.account,'18234216');
 assert.equal(row.evidence.provider_metric_date,'2026-11-13');
 assert.equal(result.provider_delivery_proven,false);
 assert.equal(result.causal_improvement_proven,false);
});
test('fail closed for wrong account, author, post ID, URL, publication proof and invalid metric; no fabrication',()=>{
 for(const bad of [
   {...actualProvider,share_owner:'urn:li:organization:987654321'},
   {...actualProvider,share_id:'0000000000000000000'},
   {...actualProvider,share_url:'https://somewhere.invalid/post'},
   {...actualProvider,share_impression_count:-1},
   {...actualProvider,date:'2026-11-14',share_published_time:'2026-11-14'}
 ]){
  const r=prepare({postRows:[bad]});
  assert.equal(r.source_rows.length,0);
  assert.equal(r.rejected,1);
 }
 assert.equal(prepare({publicationProofs:[{...originalProof,evidence:{...originalProof.evidence,provider_truth_verified:false}}]}).source_rows.length,0);
 assert.equal(prepare({publicationProofs:[]}).source_rows.length,0);
});
test('no synthetic account aggregate from company share totals and no unknown linked provider proof',()=>{
 const r=prepare({accountRows:[]});
 assert.equal(r.source_rows.length,1);
 assert.equal(r.account_row,null);
 assert.throws(()=>prepare({organizationId:'987654321'}),/WINDSOR_ORGANIZATION_OWNER_UNVERIFIED/);
 assert.throws(()=>prepare({postRows:Array.from({length:40},()=>actualProvider)}),/WINDSOR_SOURCE_TRUNCATED/);
});
test('canonical original source poll must run before original linking and never create a second scheduler',async()=>{
 const code=await readFile('supabase/functions/bg-social-metrics-sync/index.ts','utf8');
 const start=code.indexOf('companySourceRefresh=await refreshOriginalCompanyWindsorSources');
 const next=code.indexOf('companyMetricLink=await reconcileCompanyMetricEvidence');
 assert.ok(start>0&&next>start,'same existing original poll pulls Windsor before its original downstream linker');
 assert.match(code,/WINDSOR_API_KEY/);
 assert.match(code,/select_accounts/);
 assert.match(code,/linkedin_organic/);
 assert.match(code,/ignoreDuplicates:true/);
 assert.match(code,/original_company_provider_source_refresh/);
 assert.match(code,/company_source_refresh:companySourceRefresh/);
 assert.doesNotMatch(code,/supabase\.cron\.schedule|cron\.schedule\(/);
});

test('one-time connected-app recovery links valid snapshots but MUST remain RED while original #177 Vault provider is denied',()=>{
 const base={
  sourceRefresh:{state:'PROVIDER_ACCOUNT_SOURCE_REFRESHED_AND_STAGED',original_cron:177,provider:'windsor.ai',authorized_account:'18234216',posts_staged:4,account_source_staged:true,verified_daily_readback:5},
  companyState:{state:'WINDSOR_FRESH'},companyMetricLink:{state:'VERIFIED_OWNED_COMPANY_PROVIDER_METRICS_LINKED',linked:4},companyRegistry:{eligible:12}
 };
 assert.equal(originalCompanySourceProviderHealth(base),true);
 assert.equal(originalCompanySourceProviderHealth({...base,sourceRefresh:{state:'ORIGINAL_COMPANY_SOURCE_REFRESH_UNAVAILABLE',failure_class:'WINDSOR_PROVIDER_HTTP_403'}}),false);
 assert.equal(originalCompanySourceProviderHealth({...base,sourceRefresh:{...base.sourceRefresh,authorized_account:'wrong-account'}}),false);
 assert.equal(originalCompanySourceProviderHealth({...base,sourceRefresh:{...base.sourceRefresh,original_cron:999}}),false);
 assert.equal(originalCompanySourceProviderHealth({...base,companyMetricLink:{state:'VERIFIED_OWNED_COMPANY_PROVIDER_METRICS_LINKED',linked:0}}),false);
 assert.equal(originalCompanySourceProviderHealth({...base,companyRegistry:{eligible:0}}),false);
 assert.equal(originalCompanySourceProviderHealth({...base,sourceRefresh:{...base.sourceRefresh,verified_daily_readback:0}}),false);
});

test('original metrics production health uses actual provider #177 receipt, not connected-app snapshot fallback',async()=>{
 const code=await readFile('supabase/functions/bg-social-metrics-sync/index.ts','utf8');
 assert.match(code,/originalCompanySourceProviderHealth\(\{[\s\S]*sourceRefresh:companySourceRefresh/);
 assert.doesNotMatch(code,/companyHandoffOk=companyRegistry\?\.eligible===0/);
 assert.match(code,/company_source_refresh:companySourceRefresh/);
});

test('original #177 independently retains exact post source if OPTIONAL Windsor account analytics HTTP 403',async()=>{
 let postCalls=0,accountCalls=0;
 const r=await readOriginalWindsorCompanySourcePair({
   fetchPosts:async()=>{postCalls++;return [actualProvider];},
   fetchAccount:async()=>{accountCalls++;throw new Error('WINDSOR_PROVIDER_HTTP_403');}
 });
 assert.equal(postCalls,1);
 assert.equal(accountCalls,1);
 assert.equal(r.accountFailure,'WINDSOR_PROVIDER_HTTP_403');
 assert.deepEqual(r.accountRows,[]);
 const staged=prepare({postRows:r.postRows,accountRows:r.accountRows});
 assert.equal(staged.source_rows.length,1);
 assert.equal(staged.source_rows[0].metrics.share_impression_count,3);
 assert.equal(staged.account_row,null);
 // The SAME original provider Health gate stays RED even if source rows
 // were protected from loss, and ONLY the original Brain observes the 403.
 assert.equal(originalCompanySourceProviderHealth({
  sourceRefresh:{state:'ORIGINAL_COMPANY_SOURCE_REFRESH_UNAVAILABLE',
    failure_class:r.accountFailure,posts_staged:1,account_source_staged:false},
  companyState:{state:'WINDSOR_FRESH'},
  companyMetricLink:{state:'VERIFIED_OWNED_COMPANY_PROVIDER_METRICS_LINKED',linked:1},
  companyRegistry:{eligible:1}
 }),false);
});

test('original source post read stays mandatory and cannot fallback to account-only or fabricated success',async()=>{
 await assert.rejects(
  readOriginalWindsorCompanySourcePair({
   fetchPosts:async()=>{throw new Error('WINDSOR_PROVIDER_HTTP_403');},
   fetchAccount:async()=>[actualAccount]
  }),/WINDSOR_PROVIDER_HTTP_403/
 );
 const normal=await readOriginalWindsorCompanySourcePair({
  fetchPosts:async()=>[actualProvider],
  fetchAccount:async()=>[actualAccount]
 });
 assert.equal(normal.accountFailure,null);
 assert.equal(prepare({postRows:normal.postRows,accountRows:normal.accountRows}).account_row?.metrics.impressions,1);
 await assert.rejects(
  readOriginalWindsorCompanySourcePair({fetchPosts:async()=>null,fetchAccount:async()=>[]}),
  /WINDSOR_POST_SOURCE_ARRAY_REQUIRED/
 );
});

test('optional provider account error must never leak API key, URL, or raw response body into Brain failure',async()=>{
 const r=await readOriginalWindsorCompanySourcePair({
  fetchPosts:async()=>[actualProvider],
  fetchAccount:async()=>{throw new Error('forbidden?api_key=SECRET');}
 });
 assert.equal(r.accountFailure,'WINDSOR_ACCOUNT_SOURCE_UNAVAILABLE');
 assert.doesNotMatch(JSON.stringify(r),/api_key|SECRET|forbidden/);
 const src=await readFile('supabase/functions/bg-social-metrics-sync/index.ts','utf8');
 assert.match(src,/readOriginalWindsorCompanySourcePair\(\{/);
 assert.match(src,/failure_component:'linkedin_company_account_analytics'/);
 assert.match(src,/missingAccount\?'ORIGINAL_COMPANY_SOURCE_REFRESH_UNAVAILABLE'/);
 assert.match(src,/originalCompanySourceBrainFailureInput\(\{/);
 assert.match(src,/originalCompanySourceProviderHealth\(\{/);
 assert.doesNotMatch(src,/supabase\.cron\.schedule|cron\.schedule\(/);
});

test('original Windsor Basic provider plan must not be forced into hourly public-refresh entitlement',async()=>{
 const src=await readFile('supabase/functions/bg-social-metrics-sync/index.ts','utf8');
 assert.match(src,/new URL\('https:\/\/connectors\.windsor\.ai\/linkedin_organic'\)/);
 assert.match(src,/endpoint\.searchParams\.set\('select_accounts','18234216'\)/);
 assert.match(src,/endpoint\.searchParams\.set\('date_from',since\)/);
 assert.match(src,/endpoint\.searchParams\.set\('date_to',to\)/);
 assert.match(src,/endpoint\.searchParams\.set\('_max_rows',String\(maxRows\)\)/);
 assert.doesNotMatch(src,/endpoint\.searchParams\.set\('refresh_interval'/);
 assert.doesNotMatch(src,/endpoint\.searchParams\.set\('refresh_since'/);
 assert.match(src,/originalCompanySourceProviderHealth\(\{/);
});
