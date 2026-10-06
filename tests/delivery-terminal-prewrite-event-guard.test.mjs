import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hygiene=fs.readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml','utf8');
const supervisor=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
const closure=fs.readFileSync('.github/workflows/powerhouse-terminal-writer-lease-closure-guard.yml','utf8');

test('pull_request synchronize cannot mutate a TERMINAL_DELIVERY candidate',()=>{
  assert.match(hygiene,/import \{[^}]*parseWriterLease[^}]*\} from '\.\/tools\/delivery\/delivery-hygiene\.mjs'/);
  assert.match(hygiene,/EVENT_ACTION: .*github\.event\.action/);
  assert.match(hygiene,/EVENT_PR_BODY: .*github\.event\.pull_request\.body/);
  assert.match(hygiene,/process\.env\.EVENT_ACTION === 'synchronize'/);
  assert.match(hygiene,/eventLease\.state === 'TERMINAL_DELIVERY'/);
  assert.match(hygiene,/TERMINAL_CANDIDATE_MUTATED_WITHOUT_LEASE_TRANSITION/);
});

test('MAIN_SYNC synchronize is bound to the old leased head and exact main target',()=>{
  assert.match(hygiene,/eventLease\.state === 'MAIN_SYNC'/);
  assert.match(hygiene,/git\/commits\/\$\{headSha\}/);
  assert.match(hygiene,/syncParents\.includes\(expectedPreviousHead\)/);
  assert.match(hygiene,/syncParents\.includes\(expectedMainTarget\)/);
  assert.match(hygiene,/INVALID_MAIN_SYNC_COMMIT/);
});

test('recovery supervisor transitions lease before branch mutation and terminalizes after it',()=>{
  const pre=supervisor.indexOf("replaceOne(body,'Writer-Lease-State','MAIN_SYNC')");
  const merge=supervisor.indexOf('repos/$repo/merges');
  const terminal=supervisor.indexOf("replaceOne(body,'Writer-Lease-State','TERMINAL_DELIVERY')", pre + 1);
  assert.ok(pre >= 0, 'MAIN_SYNC transition missing');
  assert.ok(merge > pre, 'branch merge must occur after MAIN_SYNC metadata readback');
  assert.ok(terminal > merge, 'TERMINAL_DELIVERY must be rebound after the merge');
  assert.match(supervisor,/sync_head.*\$head/);
  assert.match(supervisor,/sync_epoch.*\$refresh_main_sha/);
  assert.match(supervisor,/restoring terminal lease fail-closed/);
  assert.match(supervisor,/-f body="\$current_body"/);
});

test('MAIN_SYNC remains closure-protected while the branch mutation is in flight',()=>{
  assert.match(closure,/Writer-Lease-State: \(TERMINAL_DELIVERY\|MAIN_SYNC\)/);
  assert.match(closure,/active terminal\/main-sync lease/);
});
