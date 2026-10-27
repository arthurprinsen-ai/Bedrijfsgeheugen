import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const closure=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
const terminalizer=await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
const delivery=await readFile('tools/brain-delivery-system.mjs','utf8');

test('cancelled or skipped exact Brain run remains nonterminal without descendant substitution',()=>{
  assert.match(closure,/require_workflow "unified-brain-delivery\.yml" "BRAIN"/);
  assert.ok(closure.includes('runs?branch=main&event=workflow_dispatch&per_page=100'));
  assert.ok(closure.includes('BRAIN delivery PR #${PR_NUMBER} ${HEAD_SHA}'));
  assert.ok(closure.includes('.display_title==$title'));
  assert.ok(closure.includes('/compare/${run_source_sha}...main'));
  assert.match(closure,/TERMINAL_BRAIN_WORKFLOW_SOURCE_NOT_PROTECTED_MAIN/);
  assert.doesNotMatch(closure,/require_brain_evidence|TERMINAL_BRAIN_(FOUNDATION|DESCENDANT)_PROVEN/);
  assert.match(closure,/TERMINAL_CRITICAL_GATE_NOT_TERMINAL/);
});
test('real exact Brain failure remains fail-closed',()=>{
  assert.match(closure,/TERMINAL_CRITICAL_GATE_FAILED:\$\{label\}/);
  assert.match(closure,/\[ "\$conclusion" = "success" \]/);
  assert.doesNotMatch(closure,/foundation_conclusion|descendant_conclusion/);
});
test('terminalizer binds same-step lineage mode and refuses false LIVE evidence',()=>{
  assert.match(terminalizer,/LINEAGE_MODE="\$lineage_mode" node --input-type=module/);
  assert.match(terminalizer,/MERGED_LINEAGE_NOT_VERIFIED/);
});
test('terminalizer workflow is scoped to automation delivery',()=>{
  assert.match(delivery,/powerhouse-obligation-terminalizer\.yml': 'automation'/);
});
