import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const yaml=fs.readFileSync('.github/workflows/powerhouse-terminal-writer-lease-closure-guard.yml','utf8');
const contract=JSON.parse(fs.readFileSync('config/branch-delivery-ownership-guard.json','utf8'));

test('active terminal writer lease auto-reopens an unmerged closed PR',()=>{
  assert.match(yaml,/pull_request:\s*\n\s*types:\s*\[closed\]/);
  assert.match(yaml,/github\.event\.pull_request\.merged == false/);
  assert.match(yaml,/Writer-Lease-State: TERMINAL_DELIVERY/);
  assert.match(yaml,/Writer-Lease-Owner: powerhouse-terminal-delivery/);
  assert.match(yaml,/--method PATCH "repos\/\$repo\/pulls\/\$PR_NUMBER"/);
  assert.match(yaml,/-f state=open/);
  assert.equal(contract.prematureClosureGuard.active,true);
  assert.equal(contract.prematureClosureGuard.unmergedCloseAction,'AUTO_REOPEN');
  assert.deepEqual(contract.prematureClosureGuard.explicitReleaseStates,['RELEASED','CANCELLED']);
});

test('closure guard never merges, bypasses protection or mutates main',()=>{
  assert.doesNotMatch(yaml,/gh pr merge|merge_pull_request|--admin|refs\/heads\/main/);
  assert.match(yaml,/pull-requests:\s*write/);
  assert.match(yaml,/contents:\s*read/);
});
