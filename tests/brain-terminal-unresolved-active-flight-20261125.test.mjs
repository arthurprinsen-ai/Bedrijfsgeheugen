import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyOriginalBrainFlightPages as classify} from '../tools/delivery/brain-verification-flight-index.mjs';
const title='BRAIN delivery PR #6194 fac054c98b0ac6099d4e03e73b8a091ec4b2ed72';
const generic={id:45652120063,display_title:'Unified Brain Delivery',status:'queued',event:'workflow_dispatch',head_branch:'main',created_at:'2026-11-25T16:15:18Z'};
const index=rows=>classify([{total_count:rows.length,workflow_runs:rows}],title);
test('observed queued generic run denies a duplicate without claiming exact identity',()=>{const r=index([generic]);assert.equal(r.status,'ACTIVE_FLIGHT_IDENTITY_UNPROVEN');assert.equal(r.complete,false);assert.equal(r.safe_to_dispatch,false);assert.deepEqual(r.unresolved_run_ids,[generic.id]);assert.equal(r.run_id,undefined);});
test('unresolved or missing active status remains fail closed',()=>{for(const status of ['requested','pending','waiting','in_progress',undefined,'unknown'])assert.equal(index([{...generic,status}]).safe_to_dispatch,false);});
test('resolved exact run is existing, never a second dispatch',()=>{const r=index([{...generic,display_title:title}]);assert.equal(r.status,'EXISTING_FLIGHT');assert.equal(r.run_id,generic.id);assert.equal(r.safe_to_dispatch,false);});
test('known other PR flight does not starve eligible independent work',()=>{assert.equal(index([{...generic,display_title:'BRAIN delivery PR #9999 '+('a'.repeat(40))}]).safe_to_dispatch,true);});
test('completed generic run is not proof of exact identity',()=>{const r=index([{...generic,status:'completed',conclusion:'success'}]);assert.equal(r.status,'NO_FLIGHT_PROVEN_FULL_HISTORY');assert.equal(r.run_id,undefined);});
test('incomplete inventory never permits a dispatch',()=>{assert.equal(classify([{total_count:2,workflow_runs:[generic]}],title).safe_to_dispatch,false);});
test('exact existing run plus unresolved active row does not trigger a duplicate',()=>{const r=index([generic,{...generic,id:45652120064,display_title:title}]);assert.equal(r.status,'EXISTING_FLIGHT');assert.equal(r.safe_to_dispatch,false);});
test('empty fully observed history permits original verification only',()=>{assert.equal(index([]).safe_to_dispatch,true);});

test('active dispatch with missing event or branch fails closed',()=>{for(const r of [{...generic,event:undefined},{...generic,head_branch:undefined},{...generic,event:''},{...generic,head_branch:' '}]){const p=index([r]);assert.equal(p.safe_to_dispatch,false);assert.equal(p.run_id,undefined);}});
test('case-variant titles never establish exact identity or safe absence',()=>{for(const display_title of [title.toLowerCase(),title.slice(0,-40)+title.slice(-40).toUpperCase()])for(const status of ['queued','completed']){const p=index([{...generic,display_title,status}]);assert.equal(p.safe_to_dispatch,false);assert.equal(p.run_id,undefined);}});
test('exact title with missing provider identity metadata is not proof even on completion',()=>{for(const r of [{...generic,display_title:title,status:'completed',event:undefined},{...generic,display_title:title,status:'completed',head_branch:undefined}]){const p=index([r]);assert.equal(p.safe_to_dispatch,false);assert.equal(p.run_id,undefined);}});
test('known unrelated branch and push event retain existing independent eligibility',()=>{for(const r of [{...generic,head_branch:'other-branch'},{...generic,event:'push'}])assert.equal(index([r]).safe_to_dispatch,true);});

const scopedSince='2026-11-25T16:00:00Z';
const scopedIndex=rows=>classify([{total_count:rows.length,workflow_runs:rows}],title,{since:scopedSince});
for(const [name,change] of [
  ['unknown event',{event:'unknown'}],
  ['trailing event',{event:'workflow_dispatch '}],
  ['uppercase event',{event:'WORKFLOW_DISPATCH'}],
  ['trailing branch',{head_branch:'main '}],
  ['push event',{event:'push'}],
  ['other branch',{head_branch:'other-branch'}],
  ['completed exact unknown event',{event:'unknown',display_title:title,status:'completed'}]
])test('scoped inventory rejects '+name,()=>{
  const r=scopedIndex([{...generic,...change}]);
  assert.equal(r.status,'PROVIDER_HISTORY_INCOMPLETE');
  assert.equal(r.complete,false);
  assert.equal(r.safe_to_dispatch,false);
  assert.equal(r.run_id,undefined);
});
test('scoped controls preserve valid empty, unrelated exact and existing flights',()=>{
  assert.equal(scopedIndex([]).safe_to_dispatch,true);
  assert.equal(scopedIndex([{...generic,display_title:'BRAIN delivery PR #9999 '+('a'.repeat(40))}]).safe_to_dispatch,true);
  assert.equal(scopedIndex([{...generic,display_title:title}]).run_id,generic.id);
  assert.equal(scopedIndex([generic]).safe_to_dispatch,false);
});
test('scoped missing or contradictory metadata withholds even exact identity',()=>{
  for(const change of [{event:undefined},{head_branch:undefined},{event:'push'}]){
    const r=scopedIndex([{...generic,...change},{...generic,id:generic.id+1,display_title:title}]);
    assert.equal(r.status,'PROVIDER_HISTORY_INCOMPLETE');
    assert.equal(r.safe_to_dispatch,false);
    assert.equal(r.run_id,undefined);
  }
});
