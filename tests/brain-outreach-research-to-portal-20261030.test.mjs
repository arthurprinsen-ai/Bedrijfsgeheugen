import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composerHandoffForAction,sourceResearchTaskForAction} from '../supabase/functions/_shared/outreach-composer-hold.mjs';
import {projectOutreachSourceRecovery} from '../netlify/functions/powerhouse-cro-other-data.mjs';
const id='589ac0ed-a954-4baf-863f-d61d2ba8dbff';
const at='2026-10-30T09:22:10Z';
const held={reason:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED',missingFields:['source_trigger_relevance','human_readable_context','specific_source_context']};
const action={action_id:id,person_key:'canonical-person',company_key:'canonical-company',person_name:'Example',company_name:'Example Organisation',priority:80};
test('missing real source is transferred to the original internal relationship-research queue, not sender',()=>{
 const task=sourceResearchTaskForAction(action,held,at);
 assert.equal(task.dedupe_key,'relationship-research:outreach-source:'+id);
 assert.equal(task.action_type,'research_enrichment');
 assert.equal(task.channel,'internal');
 assert.equal(task.status,'suggested');
 assert.equal(task.evidence.original_outreach_action_id,id);
 assert.equal(task.evidence.external_side_effect_allowed,false);
 assert.equal(task.evidence.delivery_not_attempted,true);
 assert.equal(task.source_url,'');
 assert.equal(task.message_draft,'');
 assert.equal(task.evidence.recipient_authority_not_inferred,true);
 assert.equal(task.dedupe_key,sourceResearchTaskForAction(action,held,at).dedupe_key);
});
test('no research task on incomplete identity, unverified composer or non-UUID action',()=>{
 assert.equal(sourceResearchTaskForAction({...action,company_key:''},held,at),null);
 assert.equal(sourceResearchTaskForAction({...action,person_key:''},held,at),null);
 assert.equal(sourceResearchTaskForAction(action,{reason:'COMPOSER_QUALITY_NOT_PROVEN'},at),null);
 assert.equal(sourceResearchTaskForAction({...action,action_id:'fake'},held,at),null);
 assert.equal(sourceResearchTaskForAction(action,held,'future-missing'),null);
});
test('two source-result records cannot generate research proof',()=>{
 assert.equal(composerHandoffForAction([
  {action_id:id,status:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'},
  {action_id:id,status:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'}],id)?.reason,'COMPOSER_RESULT_AMBIGUOUS');
});
test('original sender inserts exactly one idempotent internal task before a no-send checkpoint',()=>{
 const worker=readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
 const start=worker.indexOf('if(recipientApproved&&composerHandoff)');
 const end=worker.indexOf("if(!recipientApproved)",start);
 const hold=worker.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.match(hold,/sourceResearchTaskForAction\(a,composerHandoff,now\)/);
 assert.match(hold,/upsert\(researchTask,\{onConflict:'dedupe_key',ignoreDuplicates:true\}\)/);
 assert.match(hold,/provider_attempted:false/);
 assert.match(hold,/continue;/);
 assert.doesNotMatch(hold,/await send\(/);
 assert.match(worker,/verifyRecipientAuthority\(db,a,to\)/);
 assert.match(worker,/republish_forbidden:true/);
});
test('admin other-data projection counts original action records but not unverified revenue or sends',()=>{
 const actions=[{status:'prepared',evidence:{execution_gate:{reason:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'}}},
                {status:'waiting',evidence:{autonomous_outbound:{provider_ack_verified:true,provider_message_id:'g-1'}}},
                {status:'done',evidence:{autonomous_outbound:{provider_ack_verified:true,provider_readback_verified:true,provider_message_id:'g-2'}}}];
 const research=[{status:'suggested'},{status:'done'}];
 const s=projectOutreachSourceRecovery(actions,research,{actionsStatus:'LIVE',researchStatus:'LIVE'});
 assert.equal(s.status,'SOURCE_READBACK_COMPLETE');
 assert.equal(s.sourceResearchHeld,1);
 assert.equal(s.internalResearchPending,1);
 assert.equal(s.internalResearchDone,1);
 assert.equal(s.providerVerifiedSends,1);
 assert.equal(s.businessOutcomeVerified,false);
 const missing=projectOutreachSourceRecovery(actions,null,{actionsStatus:'LIVE'});
 assert.equal(missing.status,'UNVERIFIED');
 assert.equal(missing.providerVerifiedSends,null);
});
test('portal exposes aggregate fields only; original admin gate and single source remain',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const page=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/action_type=eq\.autonomous_email/);
 assert.match(api,/dedupe_key=like\.relationship-research:outreach-source:\*/);
 assert.match(api,/outreachResearch:datasets\[8\]/);
 assert.match(page,/Autonome outreach · brononderzoek/);
 assert.match(page,/Verzendingen met vastgelegde Gmail-readback/);
 assert.doesNotMatch(api,/setInterval|cron\.schedule|CREATE TABLE/);
});
