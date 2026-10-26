import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEntrepreneurHomeModel} from '../entrepreneur-home-model.js';

const candidate=(id,priority,other={})=>({
  id,title:`Voorstel ${id}`,tenant_id:'tenant-A',entity_type:'next_best_action',category:'groei',ownerCategory:'groei',priority,
  provenance:'canonical-brain-tenant-readback',freshness_at:'2026-10-23T14:15:00Z',confidence:0.8,model_or_formula_version:'goal-action-v1',observed_at:'2026-10-23T14:15:00Z',updated_at:'2026-10-23T14:15:00Z',customer_facing:true,
  status:'PROPOSED',source_refs:['independent-r1','independent-r1','independent-r2'],
  ownerSafety:{level:'goedkeuring',eligibility:'APPROVAL_REQUIRED'},
  evidence_health:{status:'healthy',stale:false,confidence:0.8},...other
});
const state=(actions,tenant='tenant-A')=>({
  tenant_id:tenant,
  portal:{business_context:{goals:['revenue_growth'],primary_goal:'revenue_growth',goal_targets:{revenue_growth:{target_value:1000,target_date:'2027-10-21'}}}},
  powerhouse:{tenant_id:tenant,executive:{next_best_actions:actions}}
});

test('tenant-bound homepage selects best fresh goal-aligned action and distinct source count',()=>{
  const model=buildEntrepreneurHomeModel(state([candidate('low',1),candidate('high',9)]),{authenticated:true,now:Date.parse('2026-10-23T14:15:00Z')});
  assert.equal(model.next.title,'Voorstel high');
  assert.equal(model.next.kind,'verified-proposal');
  assert.equal(model.next.evidenceCount,2);
  assert.equal(model.next.requiresApproval,true);
});

test('unrelated tenant higher-scored action is never presented',()=>{
  const model=buildEntrepreneurHomeModel(state([candidate('other',100,{tenant_id:'tenant-B'}),candidate('own',2)]),{authenticated:true,now:Date.parse('2026-10-23T14:15:00Z')});
  assert.equal(model.next.title,'Voorstel own');
});

test('guest, missing target, blocked and stale actions preserve existing safe fallback',()=>{
  const input=state([candidate('a',12)]);
  assert.equal(buildEntrepreneurHomeModel(input,{authenticated:false}).next.kind,'choose');
  delete input.portal.business_context.goal_targets.revenue_growth.target_date;
  assert.equal(buildEntrepreneurHomeModel(input,{authenticated:true}).next.kind,'measure');
  input.portal.business_context.goal_targets.revenue_growth.target_date='2027-10-21';
  input.powerhouse.executive.next_best_actions=[candidate('a',12,{customer_facing:false,internal:true,reversible:true,identity_verified:false,permission_verified:false})];
  assert.equal(buildEntrepreneurHomeModel(input,{authenticated:true}).next.kind,'explore');
  input.powerhouse.executive.next_best_actions=[candidate('a',12,{freshness_at:'2026-10-01T14:15:00Z'})];
  assert.equal(buildEntrepreneurHomeModel(input,{authenticated:true}).next.kind,'explore');
});
