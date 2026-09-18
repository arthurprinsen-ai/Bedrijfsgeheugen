
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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


test('canonical orchestrator marks company artifact as final-copy approved only after artifact materialization',()=>{
  const orchestrator=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  assert.match(orchestrator,/final_copy_approved:\s*pending\.channel\s*===\s*['"]linkedin_company['"]/);
});

test('personal scheduled or published artifacts require explicit verified truth from nested or legacy evidence',()=>{
  const path='supabase/migrations/20260917235906_linkedin_personal_verified_truth_schedule_guard.sql';
  assert.equal(existsSync(path),true,'verified-truth schedule guard migration must exist');
  const migration=readFileSync(path,'utf8');
  assert.match(migration,/identity_gate_evidence/);
  assert.match(migration,/personal_truth_verified/);
  assert.match(migration,/enforce_linkedin_personal_artifact_identity_gate_v3/);
  assert.match(migration,/enforce_linkedin_personal_obligation_identity_gate_v3/);
});


test('reconciler never promotes a provider-sent post whose content integrity was invalidated',()=>{
  const path='supabase/migrations/20260917235907_social_content_integrity_invalidation_guard.sql';
  assert.equal(existsSync(path),true,'content-integrity invalidation guard migration must exist');
  const migration=readFileSync(path,'utf8');
  assert.match(migration,/content_integrity_invalidated/);
  assert.match(migration,/CONTENT_INTEGRITY_INVALIDATED/);
  assert.match(migration,/status='BLOCKED'/);
  assert.match(migration,/revoke execute on function public\.powerhouse_reconcile_content_outcomes_v1\(date\) from public, anon, authenticated/i);
});
