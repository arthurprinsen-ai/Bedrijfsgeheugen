import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const canonical=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
const replay=readFileSync('.github/workflows/historical-terminal-reconciliation.yml','utf8');
const marker=JSON.parse(readFileSync('config/one-shot-historical-terminal-4134.json','utf8'));

test('canonical closure remains the only Brain terminal writer and accepts trusted calls',()=>{
  assert.match(canonical,/workflow_call:/);
  assert.match(canonical,/inputs\.pr_number != ''/);
  assert.match(canonical,/Verify exact-head critical delivery gates before terminal claim/);
  assert.match(canonical,/SUPABASE_PROVIDER_LIVE_METADATA_MATCH/);
  assert.match(canonical,/Persist canonical Brain terminal evidence before terminal claim/);
  assert.match(canonical,/Publish immutable terminal evidence/);
  assert.match(canonical,/CONTROL_PLANE_DURABLE_READBACK_REJECTED/);
});

test('existing historical reconciler replays original 4134 only when its marker is newly added on protected main',()=>{
  assert.match(replay,/push:[\s\S]*?branches: \[main\][\s\S]*?config\/one-shot-historical-terminal-4134\.json/);
  assert.match(replay,/git diff-tree --no-commit-id --name-only --diff-filter=A -r "\$GITHUB_SHA"/);
  assert.match(replay,/HISTORICAL_MERGE_IDENTITY_DRIFT/);
  assert.match(replay,/f8c7f313be234da58326a399d45b5866ff13ca59/);
  assert.match(replay,/git merge-base --is-ancestor/);
  assert.match(replay,/needs: detect-original-4134/);
  assert.match(replay,/uses: \.\/\.github\/workflows\/obligation-terminal-closure\.yml/);
  assert.match(replay,/pr_number: "4134"/);
  assert.match(replay,/secrets: inherit/);
  assert.doesNotMatch(replay,/TERMINAL_STATE:\s*LIVE_BEWEZEN|supabase\/functions\/.*deploy/);
  assert.equal(marker.contract,'historical-obligation-replay-v1');
  assert.equal(marker.pr_number,4134);
  assert.equal(marker.obligation_id,'linkedin-cross-workspace-auth-proof-20261008-v1');
});
