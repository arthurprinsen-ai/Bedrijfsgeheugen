import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessBlogQueueAdmission as admit} from '../supabase/functions/_shared/blog-queue-admission-contract.mjs';

const today='2026-11-07';
const valid={runDate:today,today};

test('a prior business date cannot be re-queued under the live local-day executor',()=>{
 assert.deepEqual(admit({...valid,runDate:'2026-11-04',obligation:{status:'GENERATED'}}),{allowed:false,code:'BLOG_BUSINESS_DATE_NOT_CURRENT'});
 assert.equal(admit({...valid,runDate:'bad'}).code,'BLOG_BUSINESS_DATE_INVALID');
});

test('SKIPPED and explicit NO_PUBLISH are terminal before any provider write',()=>{
 for(const state of ['SKIPPED','GENERATED']){
  const obligation={status:state,evidence:{decision:'NO_PUBLISH'}};
  assert.equal(admit({...valid,obligation}).code,'BLOG_EXPLICIT_NO_PUBLISH');
 }
 assert.equal(admit({...valid,obligation:{status:'SKIPPED'}}).code,'BLOG_EXPLICIT_NO_PUBLISH');
});

test('an active editorial veto blocks a queue even with a publishable channel decision',()=>{
 for(const evidence of [{veto:true},{veto:{active:true,reason:'OUTDATED_SUBSIDY_FORECAST'}},JSON.stringify({veto:{active:true}})]){
  assert.equal(admit({...valid,obligation:{status:'GENERATED',evidence}}).code,'BLOG_ACTIVE_VETO');
 }
 assert.equal(admit({...valid,obligation:{status:'GENERATED',evidence:{veto:{active:false}}}}).allowed,true);
});

test('never enqueue an already dispatched, live, learned or provider-ACKed blog',()=>{
 for(const status of ['DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED']){
  assert.equal(admit({...valid,obligation:{status}}).code,'BLOG_PROVIDER_SIDE_EFFECT_OR_TERMINAL');
 }
 for(const field of [{external_id:'immutable-provider-id'},{published_at:'2026-11-07T10:00:00Z'},{live_proven_at:'2026-11-07T10:01:00Z'}]){
  assert.equal(admit({...valid,obligation:{status:'GENERATED',...field}}).code,'BLOG_PROVIDER_SIDE_EFFECT_OR_TERMINAL');
 }
});

test('allow the existing same-day unsent generated path without inventing approval',()=>{
 assert.deepEqual(admit({...valid,obligation:{status:'GENERATED',evidence:{veto:{active:false}}}}),{allowed:true,code:'DUE_UNSENT_BLOG'});
 assert.equal(admit({...valid,obligation:null}).allowed,true);
});

test('canonical queue invokes prewrite admission before state mutation',()=>{
 const queue=readFileSync('supabase/functions/powerhouse-blog-queue/index.ts','utf8');
 assert.match(queue,/import \{ assessBlogQueueAdmission \} from '\.\.\/_shared\/blog-queue-admission-contract\.mjs'/);
 const admission=queue.indexOf('const admission=assessBlogQueueAdmission(');
 const mutate=queue.indexOf("db.rpc('record_content_publication_state'");
 const decisionWrite=queue.indexOf(".update({delivery_evidence:evidence");
 assert.ok(admission>0&&mutate>admission&&decisionWrite>admission,'The guard must precede both provider-facing state writes');
 assert.match(queue,/if\(!admission.allowed\) return json\(\{ok:true,queued:false,reason:admission.code,runDate\}\)/);
});
