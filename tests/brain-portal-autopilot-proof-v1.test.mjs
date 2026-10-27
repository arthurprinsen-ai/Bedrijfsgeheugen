import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildAutopilotEvidence,buildEntrepreneurJourneyModel} from '../portal-v2/entrepreneur-journey-model.js';

const verified={
  id:'outcome-1',
  verification_status:'OUTCOME_VERIFIED',
  source_refs:['source:tenant-outcome-1'],
  evidence_health:{status:'healthy'},
  learning_verified:true,
  learning_evidence_refs:['learning:tenant-outcome-1'],
  next_decision_id:'decision:next-1'
};
const owner=(outcomes=[])=>({
  ready:true,actions:[{id:'proposal-1'}],decisions:[{id:'approval-1'}],
  outcomes,autonomousExecutionVerified:false
});

test('autopilot shows unknown rather than fabricated zero for unproven tenant scope',()=>{
 const m=buildAutopilotEvidence(null,'TENANT_RUNTIME_OBSERVED');
 assert.equal(m.status,'UNVERIFIED');
 for(const key of ['proposals','approvals','outcomes','learned'])assert.equal(m[key],null);
 assert.equal(m.autonomousExecutionVerified,false);
});

test('proposals and approvals never count as executed work or business return',()=>{
 const m=buildAutopilotEvidence(owner(),'TENANT_RUNTIME_OBSERVED');
 assert.equal(m.proposals,1);
 assert.equal(m.approvals,1);
 assert.equal(m.outcomes,0);
 assert.equal(m.learned,0);
 assert.equal(m.autonomousExecutionVerified,false);
 assert.equal(m.freshRuntime,true);
});

test('historical evidence is not current live autonomic execution',()=>{
 const m=buildAutopilotEvidence(owner([verified]),'UNKNOWN');
 assert.equal(m.status,'HISTORICAL_PROOF_ONLY');
 assert.equal(m.freshRuntime,false);
 assert.equal(m.outcomes,1);
 assert.equal(m.learned,1);
 assert.equal(m.autonomousExecutionVerified,false);
});

test('learning requires verified outcome, learning evidence and next decision',()=>{
 const invalid=[{...verified,id:'no-learning-evidence',learning_evidence_refs:[]},
   {...verified,id:'no-next-decision',next_decision_id:''},
   {...verified,id:'not-learned',learning_verified:false},
   {...verified,id:'provider-only',verification_status:'PROVIDER_VERIFIED'},
   {...verified,id:'stale-evidence',evidence_health:{status:'stale'}},
   {...verified,id:'no-source',source_refs:[]}];
 const m=buildAutopilotEvidence(owner([...invalid,verified]),'TENANT_RUNTIME_OBSERVED');
 assert.equal(m.outcomes,4);
 assert.equal(m.learned,1);
 assert.equal(m.status,'RUNTIME_OBSERVED');
});

test('one outcome cannot inflate proven value or learning through repeated records',()=>{
 const duplicates=[verified,{...verified,learning_evidence_refs:['learning:duplicate']},
   {...verified,id:'',outcome_id:''}];
 const m=buildAutopilotEvidence(owner(duplicates),'TENANT_RUNTIME_OBSERVED');
 assert.equal(m.outcomes,1);
 assert.equal(m.learned,1);
});


test('goal journey, cockpit and Autopilot never count the same real outcome twice',()=>{
 const now=Date.parse('2026-10-23T09:00:00.000Z');
 const evidence={
   id:'outcome-a',tenant_id:'tenant-a',entity_type:'outcome',
   source_refs:['provider:tenant-a:receipt-1'],provenance:{source:'customer-system'},
   freshness_at:'2026-10-23T08:59:00.000Z',confidence:0.95,
   model_or_formula_version:'v1',observed_at:'2026-10-23T08:59:00.000Z',
   updated_at:'2026-10-23T08:59:00.000Z',
   verification_status:'OUTCOME_VERIFIED',
   learning_verified:true,learning_evidence_refs:['learning:tenant-a:outcome-a'],
   next_decision_id:'decision:next-a'
 };
 const state={
   tenant_id:'tenant-a',
   powerhouse:{executive:{outcomes:[evidence,{...evidence,source_refs:['provider:tenant-a:receipt-2']}]}},
   portal:{business_context:{goals:['profit'],primary_goal:'profit',
     goal_confirmed_at:'2026-10-23T08:00:00.000Z'}}
 };
 const home={authenticated:true,selectedGoal:'profit',scan:{verified:false},
   next:{kind:'measure'}};
 const journey=buildEntrepreneurJourneyModel(state,{authenticated:true,home,now});
 assert.equal(journey.autopilot.outcomes,1,'unique canonical outcome ID is counted once');
 assert.equal(journey.autopilot.learned,1,'one outcome cannot double learning');
 assert.equal(journey.cockpit.outcomes,1,'cockpit uses the identical proof authority');
 const stage=journey.steps.find(item=>item.id==='outcome');
 assert.equal(stage.confirmed,true);
 assert.match(stage.detail,/1 uniek brongeverifieerd/);
 assert.doesNotMatch(stage.detail,/2 brongeverifieerde/);
});

test('no unverified outcome can upgrade the goal stage or cockpit',()=>{
 const now=Date.parse('2026-10-23T09:00:00.000Z');
 const source={
   id:'candidate',tenant_id:'tenant-a',entity_type:'outcome',
   source_refs:['provider:tenant-a:receipt'],provenance:{source:'customer-system'},
   freshness_at:'2026-10-23T08:59:00.000Z',confidence:0.95,
   model_or_formula_version:'v1',observed_at:'2026-10-23T08:59:00.000Z',
   updated_at:'2026-10-23T08:59:00.000Z',
   verification_status:'PROVIDER_VERIFIED'
 };
 const state={tenant_id:'tenant-a',powerhouse:{executive:{outcomes:[source]}}};
 const home={authenticated:true,selectedGoal:'profit',scan:{verified:false},
   next:{kind:'measure'}};
 const journey=buildEntrepreneurJourneyModel(state,{authenticated:true,home,now});
 assert.equal(journey.autopilot.outcomes,0);
 assert.equal(journey.cockpit.outcomes,0);
 assert.equal(journey.steps.find(item=>item.id==='outcome').confirmed,false);
});

test('foreign-tenant evidence never verifies this entrepreneur goal or changes cockpit results',()=>{
 const now=Date.parse('2026-10-23T09:00:00.000Z');
 const state={tenant_id:'tenant-a',powerhouse:{executive:{outcomes:[{
   id:'foreign-customer-outcome',tenant_id:'tenant-b',entity_type:'outcome',
   source_refs:['provider:tenant-b:receipt'],provenance:{source:'tenant-b'},
   freshness_at:'2026-10-23T08:59:00.000Z',confidence:0.99,
   model_or_formula_version:'v1',observed_at:'2026-10-23T08:59:00.000Z',
   updated_at:'2026-10-23T08:59:00.000Z',verification_status:'OUTCOME_VERIFIED'
 }]}}};
 const home={authenticated:true,selectedGoal:'profit',scan:{verified:false},next:{kind:'measure'}};
 const journey=buildEntrepreneurJourneyModel(state,{authenticated:true,home,now});
 assert.equal(journey.autopilot.outcomes,0);
 assert.equal(journey.cockpit.outcomes,0);
 assert.equal(journey.steps.find(item=>item.id==='outcome').confirmed,false);
});

test('guest and unauthenticated journeys never render tenant autopilot state',()=>{
 const guest=buildEntrepreneurJourneyModel({
   tenant_id:'tenant-private',powerhouse:{executive:{outcomes:[verified]}}
 },{authenticated:false,home:{authenticated:false,selectedGoal:'profit'}});
 assert.equal(guest.autopilot,null);
 assert.equal(guest.heartbeat,'UNKNOWN');
 assert.equal(guest.steps.length,0);
});

test('existing original portal renders proof from same journey; no second API or scheduler',async()=>{
 const [view,css,home]=await Promise.all([
  readFile(new URL('../portal-v2/entrepreneur-journey-view.js',import.meta.url),'utf8'),
  readFile(new URL('../portal-v2/entrepreneur-home.css',import.meta.url),'utf8'),
  readFile(new URL('../portal-v2/entrepreneur-home.js',import.meta.url),'utf8')
 ]);
 assert.match(view,/journey\.autopilot/);
 assert.match(view,/dataset\.entrepreneurAutopilot='proof-v1'/);
 assert.match(view,/dataset\.entrepreneurPage='outcomes-evidence'/);
 assert.match(css,/\.eh-autopilot-grid/);
 assert.match(home,/renderEntrepreneurJourney\(host,journey\)/);
 assert.doesNotMatch(view,/fetch\(|localStorage|setInterval|Math\.random/);
});
