import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [agents,skill,policyText,migrationReadbackSql]=await Promise.all([
  readFile('AGENTS.md','utf8'),
  readFile('.agents/skills/powerhouse-continuity/SKILL.md','utf8'),
  readFile('brain/policies/powerhouse-agent-continuity-v1.json','utf8'),
  readFile('supabase/migrations/20260925075318_powerhouse_supabase_migration_readback_unique_name_reconcile_v2.sql','utf8')
]);
const policy=JSON.parse(policyText);

test('terminal user handoff remains an owned Powerhouse closure obligation',()=>{
  assert.match(agents,/delivery\|terminal-user-handoff\|dashboard-writeback\|v1/);
  assert.match(agents,/geen open einde/i);
  assert.match(skill,/Default terminal user answer \+ Dashboard writeback/);
  assert.equal(policy.terminal_handoff_contract?.required,true);
  assert.equal(policy.terminal_handoff_contract?.owner_retention_until_terminal,true);
  assert.equal(policy.terminal_handoff_contract?.autonomous_pending_states_are_internal,true);
});

test('terminal closure requires production proof, skill learning and dashboard writeback',()=>{
  const required=new Set(policy.terminal_handoff_contract?.mandatory_before_terminal||[]);
  for(const item of [
    'production_or_provider_readback',
    'root_cause_fix_regression_prevention_writeback',
    'relevant_skill_projection_readback',
    'powerhouse_dashboard_current_state_registration',
    'powerhouse_agent_activity_registration'
  ]) assert.equal(required.has(item),true,item);
  assert.equal(policy.terminal_handoff_contract?.dashboard_authorities?.dashboard_hub_page_id,'3e4da36a-ac8a-81fb-b340-daccce80dec8');
  assert.match(policy.terminal_handoff_contract?.final_user_output_rule||'',/Do not return a what-next list/i);
  assert.match(policy.terminal_handoff_contract?.hard_boundary_rule||'',/BLOCKED_HARD_BOUNDARY/);
});


test('Supabase migration readback reconciles connector-assigned version drift only by a unique migration name',()=>{
  assert.match(migrationReadbackSql,/UNIQUE_NAME_RECONCILED/);
  assert.match(migrationReadbackSql,/AMBIGUOUS_NAME/);
  assert.match(migrationReadbackSql,/name_match_count=1/);
  assert.match(migrationReadbackSql,/v_ambiguous=0/);
  assert.match(migrationReadbackSql,/powerhouse-supabase-migration-readback-v2/);
});
