import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('post-merge terminal identity receives the canonical merged PR body explicitly', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  const start=workflow.indexOf('name: Verify machine-readable obligation and main containment');
  const end=workflow.indexOf('- name: Verify exact-head critical delivery gates',start);
  assert.ok(start>=0 && end>start,'identity block must exist');
  const identityBlock=workflow.slice(start,end);
  assert.match(identityBlock,/PR_BODY_B64: \$\{\{ steps\.context\.outputs\.body_b64 \}\}/);
  assert.match(identityBlock,/export PR_BODY=.*PR_BODY_B64/);
  assert.match(identityBlock,/parseDeliveryMetadata\(process\.env\.PR_BODY\|\|''\)/);
});
