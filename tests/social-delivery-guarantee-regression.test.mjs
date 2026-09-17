
import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryDecision } from '../platform/social-delivery-guarantee.mjs';

const badIdea={id:'idea-brief',content:{text:"Absurdistische kandidaat. Format: interieurmagazine over dashboards die prachtig hangen maar waarop nog nooit een besluit is genomen. Frictie: rapporteren zonder actie. Origineel, droog en visueel in taal. Test 'Dashboarddecoratie' als nieuw begrip."}};

test('linkedin company never publishes directly from an idea or internal creative brief',()=>{
  const r=deliveryDecision({channel:'linkedin_company',posts:[],artifact:null,idea:badIdea});
  assert.deepEqual(r,{action:'BLOCK',reason:'CANONICAL_FINAL_ARTIFACT_REQUIRED'});
});

test('linkedin company can publish only a canonical artifact explicitly marked final-copy approved',()=>{
  const base={channel:'linkedin_company',artifact_type:'linkedin_post',status:'content_ready',body:'Een echte uitgewerkte bedrijfspost met complete tekst voor publicatie.',generation_evidence:{final_copy_approved:true}};
  const ok=deliveryDecision({channel:'linkedin_company',posts:[],artifact:base,idea:null});
  assert.equal(ok.action,'CREATE');
  const noApproval=deliveryDecision({channel:'linkedin_company',posts:[],artifact:{...base,generation_evidence:{}},idea:null});
  assert.deepEqual(noApproval,{action:'BLOCK',reason:'COMPANY_FINAL_COPY_APPROVAL_REQUIRED'});
});
