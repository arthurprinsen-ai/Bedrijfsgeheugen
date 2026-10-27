import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectMeasuredNextPostTest} from '../supabase/functions/_shared/measured-next-post-challenger.mjs';
const now=new Date('2026-10-24T17:00:00Z');
const posts=['a','b','c'].map((i,k)=>({tenant_id:'bedrijfsgeheugen',platform:'linkedin',channel_kind:'linkedin_company',
 post_id:i,published_at:'2026-10-20T06:00:00Z'}));
const m=(id,comments=0)=>({tenant_id:'bedrijfsgeheugen',post_id:id,data_quality:'OBSERVED',
 observed_at:'2026-10-24T12:00:00Z',metrics:{views:170,reach:140,comments,likes:1}});
test('two distinct owned provider exposures can propose one next-day TEST but never a winner',()=>{
 const x=selectMeasuredNextPostTest({posts,snapshots:[m('a'),m('b')],now});
 assert.equal(x.state,'ELIGIBLE_BOUNDED_NEXT_POST_TEST');
 assert.equal(x.proposed_test.hypothesis_id,'TEST_RELEVANT_CUSTOMER_DISCUSSION_QUESTION');
 assert.equal(x.verified_comparable_posts,2);
 assert.equal(x.hypothesis_not_caused_or_proven,true);
 assert.equal(x.proposed_test.treatment,'ONE_REVERSIBLE_CREATIVE_COMPONENT_ONLY');
});
test('reactions only and missing LinkedIn denominators cannot trigger false low-comments diagnosis',()=>{
 const a=m('a');a.data_quality='OBSERVED_PARTIAL_SCOPE';a.metrics={reactions:2,views_unavailable:true,metric_scope:'reactions_only'};
 const x=selectMeasuredNextPostTest({posts,snapshots:[a,m('b')],now});
 assert.equal(x.state,'WAIT_FOR_COMPARABLE_PROVIDER_METRICS');
 assert.equal(x.proposed_test,null);
});
test('never promote old, duplicate, cross-tenant or personal post metrics',()=>{
 const ghost={...m('a'),tenant_id:'other-customer'};
 const personal={...posts[0],post_id:'p',channel_kind:'linkedin_personal'};
 const old={...m('b'),observed_at:'2026-10-01T08:00:00Z'};
 const x=selectMeasuredNextPostTest({posts:[...posts,personal],snapshots:[ghost,old,m('a')],now});
 assert.equal(x.state,'WAIT_FOR_COMPARABLE_PROVIDER_METRICS');
 assert.equal(x.verified_comparable_posts,1);
});
test('different content engagement results only propose another hypothesis not a paid order',()=>{
 const x=selectMeasuredNextPostTest({posts,snapshots:[m('a',3),m('b',4)],now});
 assert.equal(x.proposed_test.hypothesis_id,'TEST_CONCRETE_NEXT_STEP_CTA');
 assert.equal(Object.hasOwn(x,'revenue'),false);
});
test('no data is unknown, not zero performance, and executor wiring remains in canonical lane',()=>{
 const x=selectMeasuredNextPostTest({posts:[],snapshots:[],now});
 assert.equal(x.state,'WAIT_FOR_COMPARABLE_PROVIDER_METRICS');
 assert.equal(x.cumulative_verified_exposure,0);
 const body=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
 assert.ok(body.includes("selectMeasuredNextPostTest"));
 assert.ok(body.includes("measured_next_post_test:measuredNextPostTest"));
 assert.ok(body.includes("measured_next_post_test:measuredNextPostTest,"));
 assert.ok(body.includes("eq('tenant_id','bedrijfsgeheugen')"));
});
