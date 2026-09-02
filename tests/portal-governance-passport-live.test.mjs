import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRuntimePassportEvidence } from '../platform/read-models/data-ai-runtime-evidence.mjs';
import { buildPassportFromState } from '../portal/data-ai-passport.mjs';
import { renderDataAiPassport } from '../portal/data-ai-passport-view.mjs';

const governedState=()=>({company:{name:'Acme'},aiGovernance:[{
  use_case_id:'agent-1',name:'Agent 1',provider:'Anthropic',model_id:'global.anthropic.claude-sonnet-5',
  inference_platform:'Amazon Bedrock',lifecycle_status:'ACTIVE',risk_class:'LIMITED',approved:true,
  human_oversight:'Human approval required',retention_policy:'Governed evidence only',training_use:'NO',
  processing_scope:'GLOBAL',cross_border_transfer:'POSSIBLE_OUTSIDE_EEA',subprocessors:['Amazon Web Services'],
  transfer_safeguard:'AWS DPA + EU SCCs',provider_evidence_urls:['https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html'],
  data_categories:['business-data'],prohibited_data_categories:['raw-secrets'],impact_assessment_required:true,
  evidence_ids:['e1'],approval_evidence_ids:['a1']
}]});

test('governance registry makes AI controls evidence-driven and verified',()=>{
  const runtime=buildRuntimePassportEvidence(governedState(),{env:{BG_PORTAL_PROCESSING_REGION:'us-east-1',BG_PORTAL_STORAGE_REGION:'eu-central-1 · Frankfurt, Duitsland',BG_PORTAL_STATE_STORE:'Supabase Postgres / portal_state_layers'},now:()=> '2026-09-02T09:00:00.000Z'});
  const passport=buildPassportFromState({dataAiRuntime:runtime});
  for(const id of ['model-register','ai-risk-classification','human-oversight','retention','data-classification','privacy-impact','supplier-assurance','monitoring-audit','training-use','cross-border-transfer']){
    assert.equal(passport.controls.find(c=>c.id===id)?.status,'verified',id);
  }
  assert.match(passport.controls.find(c=>c.id==='training-use').claim,/niet.*training/i);
  assert.match(passport.controls.find(c=>c.id==='cross-border-transfer').claim,/buiten.*EER/i);
});

test('portal HTML visibly renders training and cross-border governance controls',()=>{
  const state=governedState();
  state.dataAiRuntime=buildRuntimePassportEvidence(state,{env:{BG_PORTAL_PROCESSING_REGION:'us-east-1',BG_PORTAL_STORAGE_REGION:'eu-central-1 · Frankfurt, Duitsland',BG_PORTAL_STATE_STORE:'Supabase Postgres / portal_state_layers'},now:()=> '2026-09-02T09:00:00.000Z'});
  const html=renderDataAiPassport(state);
  assert.match(html,/Training met klantdata/);
  assert.match(html,/Doorgifte buiten EER/);
  assert.match(html,/Amazon Web Services/);
  assert.match(html,/Frankfurt, Duitsland/);
});
