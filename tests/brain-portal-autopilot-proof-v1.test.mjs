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
 const invalid=[{...verified,learning_evidence_refs:[]},
   {...verified,next_decision_id:''},
   {...verified,learning_verified:false},
   {...verified,verification_status:'PROVIDER_VERIFIED'},
   {...verified,evidence_health:{status:'stale'}},
   {...verified,source_refs:[]}];
 const m=buildAutopilotEvidence(owner([...invalid,verified]),'TENANT_RUNTIME_OBSERVED');
 assert.equal(m.outcomes,4);
 assert.equal(m.learned,1);
 assert.equal(m.status,'RUNTIME_OBSERVED');
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
 assert.match(view,/data\.entrepreneurAutopilot='proof-v1'/);
 assert.match(view,/data\.entrepreneurPage='outcomes-evidence'/);
 assert.match(css,/\.eh-autopilot-grid/);
 assert.match(home,/renderEntrepreneurJourney\(host,journey\)/);
 assert.doesNotMatch(view,/fetch\(|localStorage|setInterval|Math\.random/);
});
