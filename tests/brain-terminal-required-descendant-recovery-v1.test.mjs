import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
const policy = JSON.parse(await readFile('brain/policies/powerhouse-agent-continuity-v1.json','utf8'));
const skill = await readFile('.agents/skills/powerhouse-continuity/SKILL.md','utf8');

test('terminal Required recovery is website-only and descendant-contained',()=>{
  assert.match(workflow,/DELIVERY_LANE: \$\{\{ steps\.identity\.outputs\.delivery_lane \}\}/);
  assert.match(workflow,/\[ "\$DELIVERY_LANE" = "website" \]/);
  assert.match(workflow,/git merge-base --is-ancestor "\$MERGE_SHA" "\$current_main"/);
  assert.match(workflow,/TERMINAL_REQUIRED_DESCENDANT_RECOVERY_PROVEN/);
  assert.match(workflow,/TERMINAL_REQUIRED_DESCENDANT_REGRESSION_FAILED/);
});

test('terminal Required recovery executes current-main website regression and keeps original critical gates',()=>{
  assert.match(workflow,/tests\/site-shell-website-release-risk\.test\.mjs/);
  assert.match(workflow,/tests\/brain-standalone-visibility-bounded-concurrency-v1\.test\.mjs/);
  assert.match(workflow,/require_workflow "unified-brain-delivery\.yml" "BRAIN"/);
  assert.match(workflow,/require_workflow "powerhouse-codeql\.yml" "Powerhouse-CodeQL"/);
});

test('policy and skill define descendant recovery without retroactive exact-head success',()=>{
  assert.equal(policy.terminal_handoff_contract?.descendant_gate_recovery_fingerprint,'github|terminal-required-descendant-recovery|website-baseline|v1');
  assert.match(policy.terminal_handoff_contract?.descendant_gate_recovery_rule||'',/never retroactive exact-head success/i);
  assert.match(skill,/github\|terminal-required-descendant-recovery\|website-baseline\|v1/);
  assert.match(skill,/never as retroactive exact-head success/i);
});
