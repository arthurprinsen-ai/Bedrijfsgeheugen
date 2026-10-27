import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canRebindUnsentBlog,originalBlogSlugGuard} from '../supabase/functions/_shared/blog-null-lineage-recovery.mjs';

test('SQL NULL and empty slug require different compare-and-swap predicates',()=>{
  const calls=[];const q={is(...a){calls.push(['is',...a]);return this;},eq(...a){calls.push(['eq',...a]);return this;}};
  assert.equal(originalBlogSlugGuard(q,null),q);
  assert.deepEqual(calls.pop(),['is','slug',null]);
  assert.equal(originalBlogSlugGuard(q,undefined),q);
  assert.deepEqual(calls.pop(),['is','slug',null]);
  assert.equal(originalBlogSlugGuard(q,''),q);
  assert.deepEqual(calls.pop(),['eq','slug','']);
  assert.equal(originalBlogSlugGuard(q,'old-slug'),q);
  assert.deepEqual(calls.pop(),['eq','slug','old-slug']);
});
test('only generated, never-published blog obligations can recover metadata',()=>{
  const safe={status:'GENERATED',slug:null,external_id:null,published_at:null,live_proven_at:null};
  assert.equal(canRebindUnsentBlog(safe,{}),true);
  for(const key of ['provider_create_success','republish_forbidden','possible_provider_side_effect','provider_publication_ack_verified','provider_truth_verified']){
    assert.equal(canRebindUnsentBlog(safe,{[key]:true}),false,key);
  }
  for(const status of ['LIVE_PROVEN','DISPATCHED','PUBLISHED','FAILED','BLOCKED'])
    assert.equal(canRebindUnsentBlog({...safe,status},{}),false,status);
  assert.equal(canRebindUnsentBlog({...safe,external_id:'deploy-id'},{}),false);
  assert.equal(canRebindUnsentBlog({...safe,published_at:'2026-10-22T08:34:21Z'},{}),false);
  assert.equal(canRebindUnsentBlog({...safe,live_proven_at:'2026-10-22T08:34:21Z'},{}),false);
});
test('canonical queue applies NULL-safe CAS and preserves independent provider proof',()=>{
  const s=readFileSync('supabase/functions/powerhouse-blog-queue/index.ts','utf8');
  assert.match(s,/originalBlogSlugGuard\(recoveryQuery,o\.slug\)/);
  assert.match(s,/canRebindUnsentBlog\(o,provenance\)/);
  assert.match(s,/\.eq\('status','GENERATED'\)/);
  assert.match(s,/\.is\('external_id',null\)\.is\('published_at',null\)\.is\('live_proven_at',null\)/);
  assert.match(s,/db\.rpc\('record_content_publication_state'/);
  assert.match(s,/p_status:'GENERATED'/);
  assert.doesNotMatch(s,/p_status:'LIVE_PROVEN'/);
  assert.doesNotMatch(s,/\.eq\('slug',clean\(o\.slug\)\)/);
});
