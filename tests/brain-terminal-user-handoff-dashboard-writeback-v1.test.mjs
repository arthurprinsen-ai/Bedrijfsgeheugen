import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const policy=JSON.parse(await readFile(new URL('../brain/policies/powerhouse-agent-continuity-v1.json',import.meta.url),'utf8'));
const skill=await readFile(new URL('../.agents/skills/powerhouse-continuity/SKILL.md',import.meta.url),'utf8');
const agents=await readFile(new URL('../AGENTS.md',import.meta.url),'utf8');

test('terminal handoff requires dashboard writeback and no autonomous open end',()=>{
  assert.equal(policy.version,'POWERHOUSE-AGENT-CONTINUITY-v1.6');
  const rule=policy.terminal_user_handoff_contract;
  assert.equal(rule.required,true);
  assert.equal(rule.fingerprint,'delivery|terminal-user-handoff|dashboard-writeback|v1');
  for(const marker of [
    'powerhouse_dashboard_or_current_state_registered',
    'activity_or_development_ledger_updated',
    'read_after_write_completed'
  ]) assert.ok(rule.required_before_normal_terminal_reply.includes(marker),marker);
  assert.equal(rule.fail_closed_state,'TERMINAL_HANDOFF_WRITEBACK_INCOMPLETE');
  assert.ok(policy.invariants.includes('NO_USER_FACING_OPEN_END_WHEN_AUTONOMOUS_NEXT_ACTION_EXISTS'));
  assert.match(rule.response_rule,/what-now list/i);
  assert.match(rule.hard_boundary_rule,/exactly one smallest necessary human action/i);
  assert.match(rule.interruption_rule,/must not need to say ga door/i);
  assert.match(skill,/delivery\|terminal-user-handoff\|dashboard-writeback\|v1/);
  assert.match(skill,/Migration-ledger prevention/);
  assert.match(agents,/delivery\|terminal-user-handoff\|dashboard-writeback\|v1/);
});

test('repository migration identity matches production ledger identity for Composio fallback',async()=>{
  const oldPath=new URL('../supabase/migrations/20260925073300_composio_content_fallback_governance_v1.sql',import.meta.url);
  const newPath=new URL('../supabase/migrations/20260925074007_composio_content_fallback_governance_v1.sql',import.meta.url);
  await assert.rejects(readFile(oldPath,'utf8'));
  const sql=await readFile(newPath,'utf8');
  assert.match(sql,/supabase-bg-composio-content-fallback-v1/);
  assert.match(sql,/Composio\/Groq/);
});
