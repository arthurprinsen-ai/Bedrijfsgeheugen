import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildVerifiedCompanyMetricSnapshots} from '../supabase/functions/_shared/linked-company-analytics.mjs';

const urn='urn:li:share:7523338311717965825';
const org='18234216';
const now=new Date('2026-11-05T10:10:00Z');
const proof={tenant_id:'canonical',channel:'linkedin_company',status:'LIVE_PROVEN',
  external_id:urn,live_proven_at:'2026-11-03T11:00:33Z',
  evidence:{provider_truth_verified:true,author_urn:'urn:li:organization:'+org,
    linkedin_readback:{id:urn,author:'urn:li:organization:'+org}}};
const post={tenant_id:'bedrijfsgeheugen',post_id:'linkedin-company:'+urn,
  external_post_id:urn,platform:'linkedin',channel_kind:'linkedin_company',
  published_at:'2026-11-03T11:00:33Z'};
const native={tenant_id:'bedrijfsgeheugen',metric_date:'2026-11-03',
  source_key:'linkedin_company_post:'+urn,quality:'PROVIDER_OBSERVED_UNLINKED',
  source_observed_at:'2026-11-05T10:01:44Z',
  metrics:{share_impression_count:4,share_like_count:0,share_comment_count:0,share_clicks_count:0},
  evidence:{source:'linkedin_organic',provider:'windsor.ai',account:org,
    post_id:urn,share_id:urn.split(':').at(-1),
    share_url:'https://www.linkedin.com/feed/update/'+urn,
    provider_metric_date:'2026-11-03'}};
const verify=(source=native,real=proof,registered=post,clock=now)=>
  buildVerifiedCompanyMetricSnapshots({observations:[source],publicationProofs:[real],
    ownedPosts:[registered],now:clock,max:5});

test('exact real native Windsor provider schema joins to original provider-proven company post',()=>{
 const [row]=verify();
 assert.ok(row);
 assert.equal(row.tenant_id,'bedrijfsgeheugen');
 assert.equal(row.post_id,post.post_id);
 assert.equal(row.metrics.impressions,4);
 assert.equal(row.metrics.likes,0);
 assert.equal(row.metrics.comments,0);
 assert.equal(row.metrics.clicks,0);
 assert.equal(row.metrics.provider_organization_urn,'urn:li:organization:'+org);
 assert.equal(row.metrics.independent_proof,'EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT');
 assert.equal(row.data_quality,'PROVIDER_OBSERVED_LINKED');
 assert.equal(row.source_event_id,'windsor:linkedin-company:'+urn+':2026-11-03');
 assert.equal(Object.hasOwn(row.metrics,'paid_revenue'),false);
});

test('native schema refuses an account, provider, author, post, URL or date spoof',()=>{
 const bad=[
  {...native,evidence:{...native.evidence,account:'999999'}},
  {...native,evidence:{...native.evidence,provider:'unknown'}},
  {...native,evidence:{...native.evidence,share_id:'wrong'}},
  {...native,evidence:{...native.evidence,share_url:'https://example.com/post'}},
  {...native,evidence:{...native.evidence,post_id:'urn:li:share:0000000000000000000'}},
  {...native,evidence:{...native.evidence,provider_metric_date:'invalid'}},
  {...native,metrics:{...native.metrics,share_impression_count:null}},
  {...native,quality:'ESTIMATED'},
  {...native,source_key:'linkedin_company_post:another'}
 ];
 for(const candidate of bad)assert.deepEqual(verify(candidate),[]);
 assert.deepEqual(verify(native,{...proof,evidence:{...proof.evidence,author_urn:'urn:li:organization:other'}}),[]);
 assert.deepEqual(verify(native,{...proof,status:'PUBLISHED'}),[]);
 assert.deepEqual(verify(native,proof,{...post,channel_kind:'linkedin_personal'}),[]);
 assert.deepEqual(verify({...native,source_observed_at:'2026-11-01T09:42:39Z'}),[]);
});

test('same original six-hour observer and provider readback remain exclusive',async()=>{
 const runtime=await readFile(new URL('../supabase/functions/bg-social-metrics-sync/index.ts',import.meta.url),'utf8');
 const bridge=await readFile(new URL('../supabase/functions/_shared/linked-company-analytics.mjs',import.meta.url),'utf8');
 assert.match(runtime,/buildVerifiedCompanyMetricSnapshots/);
 assert.match(runtime,/async function reconcileCompanyMetricEvidence/);
 assert.match(runtime,/onConflict:'tenant_id,source_event_id'/);
 assert.match(bridge,/native\&\&\(meta\.share_id!==urn\.split/);
 assert.doesNotMatch(bridge,/cron\.schedule|fetch\(|provider_create|post_social|openart/i);
});
