import test from 'node:test';
import assert from 'node:assert/strict';
import {buildVerifiedCompanyMetricSnapshots} from '../supabase/functions/_shared/linked-company-analytics.mjs';
import {selectMeasuredNextPostTest} from '../supabase/functions/_shared/measured-next-post-challenger.mjs';
const now=new Date('2026-10-24T17:00:00Z');
const urn='urn:li:share:7519277505673986048',account='18234216';
const proof={tenant_id:'canonical',channel:'linkedin_company',status:'LIVE_PROVEN',external_id:urn,
 live_proven_at:'2026-10-23T06:04:20Z',
 evidence:{provider_truth_verified:true,author_urn:'urn:li:organization:'+account,
  linkedin_readback:{id:urn,author:'urn:li:organization:'+account}}};
const post={tenant_id:'bedrijfsgeheugen',post_id:urn,external_post_id:urn,platform:'linkedin',
 channel_kind:'linkedin_company',published_at:'2026-10-23T06:04:20Z'};
const observation={tenant_id:'bedrijfsgeheugen',metric_date:'2026-10-23',
 source_key:'linkedin_company_post:'+urn,quality:'PROVIDER_OBSERVED_UNLINKED',
 source_observed_at:'2026-10-24T13:18:19Z',metrics:{post_id:urn,share_impression_count:5,
 share_like_count:0,share_comment_count:0,share_clicks_count:1,share_video_views:0},
 evidence:{source:'windsor.ai',provider:'linkedin',connector:'linkedin_organic',scope:'post-snapshot',
  account_id:account,provider_post_urn:urn}};
const call=(o=[observation],p=[proof],s=[post])=>buildVerifiedCompanyMetricSnapshots({observations:o,publicationProofs:p,ownedPosts:s,now});
test('matches an independently proven company author to exact provider account and post URN; no invented leads',()=>{
 const [x]=call();assert.equal(x.tenant_id,'bedrijfsgeheugen');assert.equal(x.post_id,urn);
 assert.equal(x.metrics.impressions,5);assert.equal(x.metrics.clicks,1);
 assert.equal(x.metrics.comments,0);assert.equal(x.data_quality,'PROVIDER_OBSERVED_LINKED');
 assert.equal(Object.hasOwn(x.metrics,'orders'),false);assert.equal(Object.hasOwn(x.metrics,'customers'),false);
});
test('wrong organization, mismatched URN, personal account, no live proof and legacy scope fail closed',()=>{
 const cases=[
   [observation,{...proof,evidence:{...proof.evidence,author_urn:'urn:li:organization:999999'}},post],
   [observation,{...proof,status:'PUBLISHED'},post],
   [observation,{...proof,evidence:{...proof.evidence,provider_truth_verified:false}},post],
   [{...observation,evidence:{...observation.evidence,account_id:'99999'}},proof,post],
   [{...observation,source_key:'linkedin_company_post:another'},proof,post],
   [observation,proof,{...post,channel_kind:'linkedin_personal'}],
   [{...observation,quality:'OBSERVED_LEGACY'},proof,post]
 ];
 for(const [o,p,s] of cases)assert.deepEqual(call([o],[p],[s]),[]);
});
test('same exact post and provider-day never produces duplicate metric snapshots',()=>{
 const older={...observation,source_observed_at:'2026-10-24T12:18:19Z'};
 const x=call([older,observation,observation]);assert.equal(x.length,1);
 assert.equal(x[0].observed_at,'2026-10-24T13:18:19.000Z');
 assert.equal(x[0].source_event_id,x[0].snapshot_id);
});
test('unobserved impression denominator stays unknown and cannot be silently upgraded',()=>{
 const data={...observation,metrics:{...observation.metrics,share_impression_count:null}};
 assert.deepEqual(call([data]),[]);
});
test('real linked company impressions may be used for a bounded hypothesis, but sparse sample cannot promote winner',()=>{
 const a=call()[0],b={...a,post_id:'second',observed_at:a.observed_at,
   metrics:{...a.metrics,impressions:220,comments:0,likes:0}};
 const decision=selectMeasuredNextPostTest({posts:[post,{...post,post_id:'second',external_post_id:'urn:li:share:7518915119540576256'}],
 snapshots:[a,b],now});
 assert.equal(decision.state,'WAIT_FOR_COMPARABLE_PROVIDER_METRICS');
 assert.equal(decision.proposed_test,null);
});
