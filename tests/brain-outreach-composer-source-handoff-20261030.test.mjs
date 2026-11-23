import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composerHandoffForAction,outboundDeliveryGap} from '../supabase/functions/_shared/outreach-composer-hold.mjs';
const id='589ac0ed-a954-4baf-863f-d61d2ba8dbff';
const fail=[{action_id:id,status:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED',quality_passed:false,
 missing_contract_fields:['human_readable_context','source_trigger_relevance','specific_source_context']}];
test('actual 30 Oct composer refusal preserves all missing source fields without false send',()=>{
 const result=composerHandoffForAction(fail,id);
 assert.deepEqual(result,{reason:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED',
  missingFields:['human_readable_context','source_trigger_relevance','specific_source_context']});
 assert.equal(outboundDeliveryGap({selected:1,sent:0,results:[{status:'held',reason:result.reason}]}),
   'SOURCE_SPECIFIC_EVIDENCE_REQUIRED');
});
test('cannot invent confidence, evidence, recipient or an unrelated candidate',()=>{
 assert.equal(composerHandoffForAction(fail,'00000000-0000-0000-0000-000000000000'),null);
 assert.equal(composerHandoffForAction(null,id),null);
 assert.equal(composerHandoffForAction([
  {action_id:id,status:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED',
    missing_contract_fields:['human_readable_context','inject_arbitrary_data','source_trigger_relevance']}
 ],id).missingFields.includes('inject_arbitrary_data'),false);
 assert.equal(composerHandoffForAction([...fail,...fail],id).reason,'COMPOSER_RESULT_AMBIGUOUS');
});
test('pending uncertain provider side effect has priority and no automatic repeat',()=>{
 assert.equal(outboundDeliveryGap({selected:1,sent:0,results:[
  {status:'unverified'},{status:'held',reason:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'}
 ]}),'PROVIDER_READBACK_UNVERIFIED');
 assert.equal(outboundDeliveryGap({selected:0,sent:0,results:[]}),
   'NO_ELIGIBLE_PREPARED_EMAIL');
 assert.equal(outboundDeliveryGap({selected:1,sent:1,results:[{status:'sent'}]}),null);
 assert.equal(outboundDeliveryGap({selected:1,sent:0,results:[{status:'held',reason:'HUMAN_MESSAGE_QUALITY_NOT_PROVEN'}]}),
  'NO_PROVIDER_CONFIRMED_EMAIL');
});
test('original executor stores same action blocker before any provider claim',()=>{
 const worker=readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
 assert.match(worker,/composerHandoffForAction\(composerBody\?\.results,a\.action_id\)/);
 assert.match(worker,/if\(recipientApproved&&composerHandoff\)/);
 assert.match(worker,/eq\('action_id',a\.action_id\)\.eq\('status','prepared'\)/);
 assert.match(worker,/missing_contract_fields:composerHandoff\.missingFields/);
 assert.match(worker,/provider_attempted:false,provider_readback_verified:false/);
 assert.match(worker,/next_action:'RESEARCH_REAL_SOURCE_BEFORE_ORIGINAL_COMPOSER_RETRY'/);
 assert.match(worker,/const deliveryGap=outboundDeliveryGap/);
 assert.match(worker,/republish_forbidden:true/);
 assert.match(worker,/GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID/);
 assert.match(worker,/verifyRecipientAuthority\(db,a,to\)/);
 assert.match(worker,/powerhouse_email_contact_suppressions/);
});
