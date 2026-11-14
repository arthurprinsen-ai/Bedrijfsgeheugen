import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planOriginalPublicationHandoffs} from '../supabase/functions/_shared/publication-recovery-obligation-writeback.mjs';

const recovery=(items)=>({
  contract:'one-brain-publication-no-silent-gap-v1',status:'RECOVERY_DUE',overdue:items
});
const item=(channel,owner='powerhouse-mira-problem-radar-v1 / original media router')=>({
  channel,owner,status:'REQUIRES_RECOVERY',
  code:'MIRA_UNIQUE_SOURCE_WINNER_REQUIRED',
  repairHandoff:'FIND_FRESH_DISTINCT_SOURCE_AND_FREEZE_WINNER',
  action:'Find an independently dated real source before the original media job resumes.'
});
const obligation=(channel,more={})=>({
  channel,status:'PLANNED',external_id:null,next_action:null,...more
});

test('NULL next_action remains an actionable original handoff, never silently skipped',()=>{
  const handoff=planOriginalPublicationHandoffs(recovery([item('instagram')]),[obligation('instagram')]);
  assert.equal(handoff.ok,true);
  assert.equal(handoff.updates.length,1);
  assert.equal(handoff.updates[0].channel,'instagram');
  assert.equal(handoff.updates[0].previous,null);
  assert.match(handoff.updates[0].nextAction,/HERSTEL VEREIST \[MIRA_UNIQUE_SOURCE_WINNER_REQUIRED\]/);
  assert.equal(handoff.unresolved.length,0);
});

test('a missing original obligation or duplicate due channel is visibly unresolved',()=>{
  const missing=planOriginalPublicationHandoffs(recovery([item('instagram')]),[]);
  assert.equal(missing.updates.length,0);
  assert.deepEqual(missing.unresolved.map(x=>x.reason),['ORIGINAL_OBLIGATION_MISSING']);
  const duplicate=planOriginalPublicationHandoffs(recovery([item('instagram'),item('instagram')]),[obligation('instagram')]);
  assert.equal(duplicate.updates.length,1);
  assert.deepEqual(duplicate.unresolved.map(x=>x.reason),['DUPLICATE_DUE_CHANNEL_RECOVERY_SOURCE']);
  const ambiguous=planOriginalPublicationHandoffs(recovery([item('instagram')]),[obligation('instagram'),obligation('instagram')]);
  assert.deepEqual(ambiguous.unresolved.map(x=>x.reason),['ORIGINAL_OBLIGATION_AMBIGUOUS']);
});

test('original email authority is routed, never sent by the social writer or dropped',()=>{
  const r=planOriginalPublicationHandoffs(
    recovery([item('email_newsletter','original-authorized-gmail-owner')]),[]);
  assert.equal(r.ok,true);
  assert.deepEqual(r.updates,[]);
  assert.equal(r.routedToOriginalOwner.length,1);
  assert.deepEqual(r.routedToOriginalOwner[0],{
    channel:'email_newsletter',reason:'ORIGINAL_EMAIL_OWNER_ONLY',owner:'original-authorized-gmail-owner'
  });
});
test('advanced states and external IDs always retain original producer readback ownership',()=>{
  const published=planOriginalPublicationHandoffs(recovery([item('instagram')]),[
    obligation('instagram',{status:'DISPATCHED',external_id:'real-provider-id'})
  ]);
  assert.equal(published.updates.length,0);
  assert.equal(published.routedToOriginalOwner[0].reason,'POSSIBLE_EXTERNAL_SIDE_EFFECT_READBACK_REQUIRED');
  const approved=planOriginalPublicationHandoffs(recovery([item('instagram')]),[
    obligation('instagram',{status:'APPROVED'})
  ]);
  assert.equal(approved.routedToOriginalOwner[0].reason,
    'ADVANCED_OR_UNKNOWN_STATUS_RECONCILIATION_REQUIRED');
});

test('identical next action is acknowledged, not re-written or declared missing',()=>{
  const first=planOriginalPublicationHandoffs(recovery([item('instagram')]),[obligation('instagram')]);
  const same=planOriginalPublicationHandoffs(recovery([item('instagram')]),[
    obligation('instagram',{next_action:first.updates[0].nextAction})
  ]);
  assert.equal(same.updates.length,0);
  assert.equal(same.alreadyIdentical.length,1);
  assert.equal(same.unresolved.length,0);
});
test('malformed and missing owner recovery stays unproven without exposing injected data',()=>{
  const broken=planOriginalPublicationHandoffs(recovery([
    {...item('instagram'),owner:'owner; drop secrets',action:'leak password'},
    item('other-provider','unverified-executor')
  ]),[obligation('instagram')]);
  assert.equal(broken.updates.length,0);
  assert.equal(broken.unresolved[0].reason,'INVALID_OR_UNVERIFIED_OWNER_RECOVERY_CONTRACT');
  assert.equal(broken.routedToOriginalOwner[0].reason,'UNSUPPORTED_OR_MISSING_CHANNEL');
  assert.doesNotMatch(JSON.stringify(broken),/leak password|drop secrets/);
});
test('existing content owner uses PostgREST IS NULL CAS and exact readback, no bypass writer',()=>{
  const source=readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
  assert.match(source,/\.is\('external_id',null\)/);
  assert.match(source,/updateQuery=handoff\.previous===null/);
  assert.match(source,/updateQuery\.is\('next_action',null\)/);
  assert.match(source,/updateQuery\.eq\('next_action',handoff\.previous\)/);
  assert.match(source,/\.select\('channel,next_action,status,external_id,live_proven_at'\)/);
  assert.match(source,/ORIGINAL_HANDOFF_OWNER_OR_RECEIVER_RECHECK_REQUIRED/);
  assert.match(source,/original_owner_routes:handoffPlan\.routedToOriginalOwner/);
  assert.match(source,/original_executor_continues:true,provider_send_authorized:false/);
  assert.match(source,/brain_records'\)\.upsert/);
  assert.doesNotMatch(source,/GENERIC_DIRECT_INSTAGRAM_SEND|NEW_HANDOFF_CRON|MAKE_WEBHOOK/);
});

test('existing Portal and Brain guard keep incident readback visible when failures outnumber planned CAS writes',()=>{
  const guard=readFileSync('brain/observability/one-loop-guard-diagnostics.mjs','utf8');
  const portal=readFileSync('portal-v2/modules/powerhouse-observability.js','utf8');
  assert.match(guard,/const counts=\['planned','applied','conflicts','errors'\]/);
  assert.doesNotMatch(guard,/handoff\.applied\+handoff\.conflicts\+handoff\.errors>handoff\.planned/);
  assert.match(guard,/pendingHandoffs:unresolved\.length/);
  assert.match(guard,/originalOwnerRoutes:ownerRoutes\.length/);
  assert.match(guard,/receiverProofDue:/);
  assert.match(guard,/safeRoute=\(item\)=>/);
  assert.match(portal,/onbevestigde overdrachten/);
  assert.match(portal,/originele eigenaarroutes/);
  assert.match(portal,/De uitvoerder blijft actief; ontbrekend bewijs blijft OPEN/);
});
