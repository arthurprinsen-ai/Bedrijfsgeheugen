import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {identifyOriginalPublicationHandoff,reconcileOriginalPublicationMeasurement}
  from '../supabase/functions/_shared/original-publication-metric-handoff.mjs';
import {selectMeasuredNextPostTest,proposeBoundedCreativeExploration} from '../supabase/functions/_shared/measured-next-post-challenger.mjs';

const today='2026-11-17T10:45:00.000Z',published='2026-11-15T07:30:00.000Z';
const ref='17992107825115789',postId='instagram:'+ref;
const original=()=>({tenant_id:'canonical',channel:'instagram',publication_date:'2026-11-15',
 status:'LIVE_PROVEN',external_id:ref,published_at:published,live_proven_at:'2026-11-15T08:00:00.000Z',
 metrics:{},measured_at:null,learned_at:null});
const post=()=>({tenant_id:'bedrijfsgeheugen',platform:'instagram',
 channel_kind:'instagram_business',post_id:postId,external_post_id:ref,published_at:published});
const measurement=()=>({tenant_id:'bedrijfsgeheugen',post_id:postId,
 source:'composio-instagram',data_quality:'OBSERVED',
 source_event_id:'composio:instagram:'+ref+':2026-11-17T06:00:00.000Z',
 observed_at:'2026-11-17T06:18:00.000Z',
 metrics:{views:152,reach:130,likes:4,comments:2,shares:1,saved:3}});

test('original six-hour Meta collector can hand off one mature exact owned Instagram post',()=>{
 const x=identifyOriginalPublicationHandoff(original(),[post()],[measurement()],today);
 assert.equal(x.reason,'VERIFIED_MATURED_PROVIDER_METRIC');
 assert.equal(x.patch.status,'LIVE_PROVEN');
 assert.equal(x.patch.learned_at,null);
 assert.equal(x.patch.metrics.original_provider_metric_handoff.provider_post_id,ref);
 assert.equal(x.patch.metrics.original_provider_metric_handoff.measurement_scope,'owned_instagram_media_insights');
 assert.deepEqual(x.patch.metrics.original_provider_metric_handoff.observed_metrics,measurement().metrics);
 assert.equal(x.patch.metrics.original_provider_metric_handoff.customer_leads_inferred,false);
 assert.equal(x.patch.metrics.original_provider_metric_handoff.actual_sales_attributed,false);
 assert.equal(x.patch.metrics.original_provider_metric_handoff.enough_for_commercial_or_causal_learning,false);
 const next={...original(),metrics:x.patch.metrics,measured_at:x.patch.measured_at};
 assert.equal(identifyOriginalPublicationHandoff(next,[post()],[measurement()],today).reason,'ALREADY_RECONCILED');
 assert.equal(reconcileOriginalPublicationMeasurement(next,post(),measurement(),today),null);
});
test('original Instagram receipt fails closed on false post, wrong provider, stale/read missing and unverified publication',()=>{
 const candidates=[
 [o=>{o.status='PLANNED'},()=>{},()=>{}],
 [o=>{o.status='PUBLISHED'},()=>{},()=>{}],
 [o=>{o.external_id='bad'},()=>{},()=>{}],
 [o=>{o.external_id='17999998888777777'},()=>{},()=>{}],
 [()=>{},p=>{p.tenant_id='canonical'},()=>{}],
 [()=>{},p=>{p.external_post_id='999999999999999'},()=>{}],
 [()=>{},p=>{p.channel_kind='linkedin_company'},()=>{}],
 [()=>{},p=>{p.platform='linkedin'},()=>{}],
 [()=>{},()=>{},s=>{s.source='buffer'}],
 [()=>{},()=>{},s=>{s.source_event_id='composio:linkedin:'+ref+':2026-11-17T06:00:00Z'}],
 [()=>{},()=>{},s=>{s.data_quality='OBSERVED_PARTIAL_SCOPE'}],
 [()=>{},()=>{},s=>{s.metrics={likes:10,comments:3}}],
 [()=>{},()=>{},s=>{s.observed_at='2026-11-15T09:00:00Z'}],
 [()=>{},()=>{},s=>{s.post_id='instagram:99999999999999'}]
 ];
 for(const [ao,ap,as] of candidates){
  const o=original(),p=post(),s=measurement();ao(o);ap(p);as(s);
  assert.equal(identifyOriginalPublicationHandoff(o,[p],[s],today).patch,undefined,
     JSON.stringify({o,p,s}).slice(0,250));
 }
});
const metricPost=(id)=>({tenant_id:'bedrijfsgeheugen',platform:'instagram',
 channel_kind:'instagram_business',post_id:'instagram:'+id,
 external_post_id:id,published_at:'2026-11-15T07:30:00Z'});
const metricSnapshot=(id,metrics)=>({tenant_id:'bedrijfsgeheugen',post_id:'instagram:'+id,
 source:'composio-instagram',source_event_id:'composio:instagram:'+id+':2026-11-17T06:00:00Z',
 data_quality:'OBSERVED',observed_at:'2026-11-17T06:18:00Z',metrics});
test('shares and saves beat shallow likes in existing next-post hypothesis, without claiming causal uplift',()=>{
 const ids=['17992107825115789','18060985460558066'];
 const posts=ids.map(metricPost);
 const snaps=ids.map(id=>metricSnapshot(id,{views:400,reach:350,likes:2,comments:0,shares:0,saved:0}));
 const x=selectMeasuredNextPostTest({posts,snapshots:snaps,now:today,channel:'instagram_company'});
 assert.equal(x.state,'ELIGIBLE_BOUNDED_NEXT_POST_TEST');
 assert.equal(x.proposed_test.hypothesis_id,'TEST_SHAREABLE_CONCRETE_BUSINESS_FRICTION');
 assert.equal(x.proposed_test.primary_metric,'provider_observed_shares_per_reach');
 assert.equal(x.instagram_business_evidence.shares.value,0);
 assert.equal(x.instagram_business_evidence.saves.value,0);
 assert.equal(x.instagram_business_evidence.website_clicks.value,null);
 assert.equal(x.instagram_business_evidence.paid_orders,'UNKNOWN_UNTIL_INDEPENDENT_ATTRIBUTION');
 assert.equal(x.hypothesis_not_caused_or_proven,true);
 const saved=snaps.map(s=>({...s,metrics:{...s.metrics,shares:6,saved:0}}));
 const y=selectMeasuredNextPostTest({posts,snapshots:saved,now:today,channel:'instagram_company'});
 assert.equal(y.proposed_test.hypothesis_id,'TEST_ONE_SAVEABLE_OWNER_CHECK');
});
test('unknown IG shares, missing views, cross-account rows and old posts cannot generate fabricated winners',()=>{
 const ids=['17992107825115789','18060985460558066'];
 const posts=ids.map(metricPost);
 const none=ids.map(id=>metricSnapshot(id,{views:480,reach:320,likes:3,comments:1}));
 const x=selectMeasuredNextPostTest({posts,snapshots:none,now:today,channel:'instagram_company'});
 assert.equal(x.instagram_business_evidence.shares.value,null);
 assert.equal(x.instagram_business_evidence.saves.value,null);
 assert.notEqual(x.proposed_test.hypothesis_id,'TEST_SHAREABLE_CONCRETE_BUSINESS_FRICTION');
 const other=none.map(s=>({...s,source:'buffer'}));
 const y=selectMeasuredNextPostTest({posts,snapshots:other,now:today,channel:'instagram_company'});
 assert.equal(y.state,'WAIT_FOR_COMPARABLE_PROVIDER_METRICS');
 assert.equal(y.verified_comparable_posts,0);
 const oldPosts=posts.map(p=>({...p,published_at:'2026-10-03T07:01:51Z'}));
 const z=selectMeasuredNextPostTest({posts:oldPosts,snapshots:none,now:today,channel:'instagram_company'});
 assert.equal(z.verified_comparable_posts,0);
 assert.equal(z.state,'WAIT_FOR_COMPARABLE_PROVIDER_METRICS');
});
test('Instagram remains within existing original cron 177 and measured decisions feed the same original content and Brain artifact',()=>{
 const sync=readFileSync(new URL('../supabase/functions/bg-social-metrics-sync/index.ts',import.meta.url),'utf8');
 const orchestrator=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
 assert.match(sync,/\.in\('channel',\['linkedin_personal','linkedin_company','instagram'\]\)/);
 assert.match(sync,/postQuery=ob.channel==='instagram'/);
 assert.match(sync,/reconcileOriginalPublicationMetricHandoffs\(db\)/);
 assert.match(sync,/IG_PROVIDER_POST_REGISTER/);
 assert.match(sync,/INSTAGRAM_GET_IG_MEDIA_INSIGHTS/);
 assert.match(orchestrator,/selectMeasuredNextPostTest\(\{posts:brandPosts\|\|\[\],snapshots:sourceSnapshots/);
 assert.match(orchestrator,/select\('tenant_id,post_id,source,source_event_id,data_quality,observed_at,metrics'\)/);
 assert.match(orchestrator,/measured_next_post_test:measuredNextPostTest/);
 assert.match(orchestrator,/editorial_experiment_owner:editorialExperiment.owner/);
 assert.doesNotMatch(sync,/cron\.schedule\(|INSTAGRAM_MEDIA_PUBLISH|GMAIL_SEND_EMAIL/);
});


test('without enough fresh posts, original daily Mira still tests only ONE safe copy variable and real outcome metric',()=>{
 const seen=new Map();
 for(let delta=0;delta<16;delta++){
  const date=new Date(Date.UTC(2026,10,18+delta)).toISOString().slice(0,10);
  const idea=proposeBoundedCreativeExploration({runDate:date,channel:'instagram_company',
   recommendation:{recommendation_id:'8e8708d1-a4c4-4f9a-ad58-22ed62802e6b',
    reason:'Source-backed debtor owner/action research',evidence:{source_backed:true,source_url:'https://example.com/independent-news'}},
   freshness:{ok:true},measured:{state:'WAIT_FOR_COMPARABLE_PROVIDER_METRICS'}});
  assert.equal(idea.state,'ONE_REVERSIBLE_DAILY_COPY_HYPOTHESIS');
  assert.equal(idea.causal_lift_proven,false);
  assert.equal(idea.additional_publications,0);
  assert.equal(idea.format_policy,'MIRA_REEL_ONLY_UNTIL_INDEPENDENT_CAROUSEL_ASSET_AUTHORITY');
  assert.equal(idea.primary_business_metric,'attributed_verified_paid_orders');
  assert.match(idea.lead_metric,/^provider_observed_(shares|saves|comments)_per_reach$/);
  seen.set(idea.hypothesis_id.split(':')[1],idea.lead_metric);
 }
 assert.equal(seen.size,3,'single daily exploration retains exactly three canonical publisher caption variants');
 const blocked=proposeBoundedCreativeExploration({runDate:'2026-11-18',channel:'instagram_company',
  recommendation:{reason:'source',evidence:{source_backed:true}},freshness:{ok:false}});
 assert.equal(blocked.state,'NO_EXPLORATION');
 assert.equal(blocked.reason,'SOURCE_NOT_CURRENT_OR_VERIFIED');
});
