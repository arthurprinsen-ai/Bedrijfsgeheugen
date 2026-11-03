import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {researchSourceCandidate,researchRetryAt} from '../supabase/functions/_shared/relationship-research-feedback.mjs';
import {projectOutreachSourceRecovery} from '../netlify/functions/powerhouse-cro-other-data.mjs';
const at='2026-10-30T09:50:07.276Z',id='589ac0ed-a954-4baf-863f-d61d2ba8dbff';
const action={action_id:'fc027697-f107-4844-b5f9-4f727204e85a',
 company_key:'example-ltd',company_name:'Example Ltd',
 evidence:{original_outreach_action_id:id,research_need:'source_specific_evidence'}};
const hit={title:'Example Ltd announces new location',summary:'Example Ltd plans to open a new location',
 url:'https://news.example.org/business/example-ltd-location',trigger_type:'growth'};
test('original SERP snippet returns only an explicitly unverified source candidate, never mailing authority',()=>{
 const row=researchSourceCandidate(action,hit,at);
 assert.equal(row.original_outreach_action_id,id);
 assert.equal(row.research_action_id,action.action_id);
 assert.equal(row.status,'UNVERIFIED_SOURCE_CANDIDATE');
 assert.equal(row.freshness_verified,false);
 assert.equal(row.source_page_independently_read,false);
 assert.equal(row.message_quality_approved,false);
 assert.equal(row.provider_send_authorized,false);
 assert.equal(row.published_at,null);
 assert.equal(row.source_url,hit.url);
});
test('no valid company, original lineage, https URL or trigger: no source writeback',()=>{
 assert.equal(researchSourceCandidate({...action,evidence:{}},hit,at),null);
 assert.equal(researchSourceCandidate({...action,company_name:'Different Business'},hit,at),null);
 assert.equal(researchSourceCandidate(action,{...hit,url:'http://news.example.org/x'},at),null);
 assert.equal(researchSourceCandidate(action,{...hit,url:'https://127.0.0.1/x'},at),null);
 assert.equal(researchSourceCandidate(action,{...hit,trigger_type:'invented_trigger'},at),null);
 assert.equal(researchSourceCandidate(action,hit,'invalid-date'),null);
});
test('no-signal retry is bounded, deterministic and never an extra scheduler',()=>{
 assert.equal(researchRetryAt(at,24),'2026-10-31T09:50:07.276Z');
 assert.equal(researchRetryAt(at,0),null);
 assert.equal(researchRetryAt(at,168),null);
});
test('original Edge conservatively links candidate to SAME prepared outreach only with CAS',()=>{
 const src=readFileSync('supabase/functions/powerhouse-relationship-public-research/index.ts','utf8');
 assert.match(src,/researchSourceCandidate\(action,best,observedAt\)/);
 assert.match(src,/eq\('action_id',originId\)\.eq\('person_key',action\.person_key\)/);
 assert.match(src,/eq\('company_key',action\.company_key\)\.eq\('status','prepared'\)/);
 assert.match(src,/origin\?\.evidence\?\.execution_gate\?\.reason==='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'/);
 assert.match(src,/relationship_source_candidate:candidate/);
 assert.match(src,/eq\('updated_at',origin\.updated_at\)\.select\('action_id'\)\.maybeSingle\(\)/);
 assert.match(src,/researchRetryAt\(observedAt,24\)/);
 assert.match(src,/due_at:nextResearchAt/);
 assert.match(src,/or\('due_at\.is\.null,due_at\.lte\.'/);
 assert.doesNotMatch(src,/status:'sent'|provider_ack_verified:true|source_trigger_relevance:true/);
 assert.match(src,/x-powerhouse-token/);
});
test('owner-only Andere data shows pending/no-signal/candidate separately, never as sales',()=>{
 const states={actionsStatus:'LIVE',researchStatus:'LIVE'};
 const p=projectOutreachSourceRecovery(
  [{status:'prepared',evidence:{execution_gate:{reason:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'}}}],
  [{status:'waiting',evidence:{public_research_execution:{
     no_current_trigger_evidence:true,next_research_at:'2026-10-31T09:50:07.276Z'}}},
   {status:'done',evidence:{relationship_source_candidate:{status:'UNVERIFIED_SOURCE_CANDIDATE'}}}],
  states);
 assert.equal(p.sourceResearchHeld,1);
 assert.equal(p.internalResearchPending,1);
 assert.equal(p.internalResearchDone,1);
 assert.equal(p.researchNoCurrentSignal,1);
 assert.equal(p.researchSourceCandidatesUnverified,1);
 assert.equal(p.nextOriginalResearchAt,'2026-10-31T09:50:07.276Z');
 assert.equal(p.providerVerifiedSends,0);
 assert.equal(p.businessOutcomeVerified,false);
 const unavailable=projectOutreachSourceRecovery([],[{}],{actionsStatus:'LIVE',researchStatus:'UNAVAILABLE'});
 assert.equal(unavailable.status,'UNVERIFIED');
 assert.equal(unavailable.researchNoCurrentSignal,null);
});
test('original portal remains admin-only and does not expose individual research identity',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/select=status,updated_at,evidence&action_type=eq\.research_enrichment/);
 assert.match(ui,/Onderzoek: geen actueel signaal gevonden/);
 assert.match(ui,/Niet-onafhankelijk geverifieerde bronkandidaten/);
 assert.doesNotMatch(ui,/person_key|company_key|recipient_email/);
});
