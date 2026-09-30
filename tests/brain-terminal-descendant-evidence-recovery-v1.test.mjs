import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const closure=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
const terminalizer=await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
const delivery=await readFile('tools/brain-delivery-system.mjs','utf8');

test('cancelled or skipped exact Brain run may use successful current-main descendant only after containment',()=>{
  assert.match(closure,/TERMINAL_BRAIN_FOUNDATION_SUPERSEDED/);
  assert.match(closure,/git merge-base --is-ancestor "\$MERGE_SHA" "\$current_main"/);
  assert.match(closure,/brain-foundation-verify\.yml\/runs\?head_sha=\$\{current_main\}&event=push/);
  assert.match(closure,/TERMINAL_BRAIN_DESCENDANT_PROVEN/);
  assert.match(closure,/TERMINAL_BRAIN_DESCENDANT_CONTAINMENT_FAILED/);
});
test('real exact Brain failure remains fail-closed',()=>{
  assert.match(closure,/foundation_conclusion" != "cancelled"/);
  assert.match(closure,/foundation_conclusion" != "skipped"/);
  assert.match(closure,/TERMINAL_BRAIN_FOUNDATION_FAILED/);
});
test('terminalizer binds same-step lineage mode and refuses false LIVE evidence',()=>{
  assert.match(terminalizer,/LINEAGE_MODE="\$lineage_mode" node --input-type=module/);
  assert.match(terminalizer,/MERGED_LINEAGE_NOT_VERIFIED/);
});
test('terminalizer workflow is scoped to automation delivery',()=>{
  assert.match(delivery,/powerhouse-obligation-terminalizer\.yml': 'automation'/);
});
