import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRuntimePassportEvidence } from '../platform/read-models/data-ai-runtime-evidence.mjs';
import { buildPassportFromState } from '../portal/data-ai-passport.mjs';

test('governance registry makes AI controls evidence-driven and verified',()=>{
  const state={company:{name:'Acme'},aiGovernance:[{
    use_case_id:'agent-1',name:'Agent 1',provider:'Anthropic',model_id:'global.anthropic.claude-sonnet-5',
    inference_platform:'Amazon Bedrock',lifecycle_status:'ACTIVE',risk_class:'LIMITED',approved:true,
    human_oversight:'Human approval required',retention_policy:'Governed evidence only',training_use:'NO',
    processing_scope:'GLOBAL',cross_border_transfer:'POSSIBLE_OUTSIDE_EEA',subprocessors:['Amazon Web Services'],
    transfer_safeguard:'AWS DPA + EU SCCs',provider_evidence_urls:['https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html']
  }]};
  const runtime=buildRuntimePassportEvidence(state,{env:{BG_PORTAL_PROCESSING_REGION:'us-east-1',BG_PORTAL_STORAGE_REGION:'eu-central-1 · Frankfurt, Duitsland',BG_PORTAL_STATE_STORE:'Supabase Postgres / portal_state_layers'},now:()=> '2026-09-02T09:00:00.000Z'});
  const passport=buildPassportFromState({dataAiRuntime:runtime});
  for(const id of ['model-register','ai-risk-classification','human-oversight','retention','supplier-assurance','training-use','cross-border-transfer']){
    assert.equal(passport.controls.find(c=>c.id===id)?.status,'verified',id);
  }
  assert.match(passport.controls.find(c=>c.id==='training-use').claim,/niet.*training/i);
  assert.match(passport.controls.find(c=>c.id==='cross-border-transfer').claim,/buiten.*EER/i);
});
