import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const fp='delivery|terminal-user-handoff|dashboard-writeback|v1';

test('terminal user handoff rule is enforced across agent contract, skill and machine policy', async()=>{
  const [agents,skill,policyRaw]=await Promise.all([
    readFile('AGENTS.md','utf8'),
    readFile('.agents/skills/powerhouse-continuity/SKILL.md','utf8'),
    readFile('brain/policies/powerhouse-agent-continuity-v1.json','utf8')
  ]);
  const policy=JSON.parse(policyRaw);
  assert.match(agents,new RegExp(fp.replace(/[|]/g,'\\|')));
  assert.match(skill,new RegExp(fp.replace(/[|]/g,'\\|')));
  assert.ok(policy.invariants.includes('NO_TERMINAL_USER_HANDOFF_WITHOUT_DASHBOARD_WRITEBACK'));
  assert.equal(policy.terminal_user_handoff_rule?.required,true);
  assert.equal(policy.terminal_user_handoff_rule?.owner_retains_execution_until_terminal,true);
  assert.match(policy.terminal_user_handoff_rule?.dashboard_rule||'',/existing Powerhouse dashboard\/current-state/i);
  assert.equal(policy.terminal_user_handoff_rule?.only_early_terminal,'BLOCKED_HARD_BOUNDARY');
});

test('Composio fallback migration filename matches production Supabase ledger identity', async()=>{
  await access('supabase/migrations/20260925074007_composio_content_fallback_governance_v1.sql');
  await assert.rejects(access('supabase/migrations/20260925073300_composio_content_fallback_governance_v1.sql'));
});
