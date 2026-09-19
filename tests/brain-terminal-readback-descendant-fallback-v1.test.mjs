import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('canonical production readback failure falls through to descendant live containment proof', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  const fallback='CANONICAL_PRODUCTION_READBACK_FAILED_FALLING_BACK_TO_DESCENDANT_PROOF';
  assert.match(workflow,new RegExp(fallback));
  const failure=workflow.indexOf(fallback);
  const descendant=workflow.indexOf('PRODUCTION_DESCENDANT_READBACK_PROVEN');
  assert.ok(failure>=0 && descendant>failure);
  const segment=workflow.slice(Math.max(0,failure-500),descendant);
  assert.doesNotMatch(segment,/PRODUCTION_READBACK_FAILED:[^\n]*\n\s*exit 78/);
  assert.match(segment,/Canonical production readback unavailable\/cancelled\/failed/);
  assert.match(workflow,/git merge-base --is-ancestor "\$MERGE_SHA" "\$observed"/);
  assert.match(workflow,/release\.contract!==['"]BRAIN-DELIVERY-v2['"]/);
  assert.match(workflow,/release\.production_authority!==['"]BG169['"]/);
});
