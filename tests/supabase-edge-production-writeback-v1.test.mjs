import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const production=readFileSync('.github/workflows/supabase-edge-production-authority.yml','utf8');
const closure=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
const terminalizer=readFileSync('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');

test('production authority publishes provider evidence',()=>{
  assert.ok(production.includes('pull-requests: write'));
  assert.ok(production.includes('edge-runtime-scope.mjs'));
  assert.ok(production.includes('Publish exact provider readback evidence to merged PR'));
  assert.ok(production.includes('publish-edge-provider-readback.mjs'));
});

test('terminal readers use canonical scope',()=>{
  assert.ok(closure.includes('edge-runtime-scope.mjs'));
  assert.ok(closure.includes('seq 1 24'));
  assert.ok(terminalizer.includes("path==='supabase/config.toml'"));
  assert.ok(terminalizer.includes('edge-runtime-scope.mjs'));
});


test('provider publisher keeps network readback out of local files',()=>{
  const publisher=readFileSync('tools/supabase/publish-edge-provider-readback.mjs','utf8');
  assert.doesNotMatch(publisher,/writeFileSync/);
  assert.doesNotMatch(publisher,/mkdirSync/);
  assert.doesNotMatch(publisher,/provider-manifest\.json/);
  assert.doesNotMatch(publisher,/provider-readbacks\.txt/);
  assert.match(publisher,/SUPABASE_PROVIDER_PR_WRITEBACK_PROVEN/);
});


test('provider source parity is canonical and GitHub provider checks are non-blocking observability',()=>{
  assert.ok(production.includes('Observe Supabase GitHub deployment check'));
  assert.ok(production.includes("blocking:false"));
  assert.ok(production.includes("authority:'provider-source-parity'"));
  assert.ok(production.includes('for attempt in $(seq 1 24)'));
  assert.ok(production.includes('SUPABASE_EDGE_PROVIDER_SOURCE_PARITY_CONVERGED'));
  assert.ok(production.includes('SUPABASE_EDGE_PROVIDER_SOURCE_PARITY_TIMEOUT'));
  assert.ok(production.includes('provider_convergence=BOUNDED'));
  assert.ok(!production.includes('SUPABASE_PRODUCTION_DEPLOYMENT_ANCHOR_NOT_FOUND'));
});


test('successor replay targets the original merged runtime PR without weakening runtime equality',()=>{
  assert.ok(production.includes('Terminal-Replay-PR'));
  assert.ok(production.includes('SUPABASE_REPLAY_RUNTIME_SUPERSEDED'));
  assert.ok(production.includes('target_pr=$target_pr'));
  assert.ok(production.includes('TARGET_PR_NUMBER: ${{ steps.scope.outputs.target_pr }}'));
  assert.ok(production.includes("pulls/$target_pr/files?per_page=100"));
});


test('scope resolver remains single and syntactically complete',()=>{
  const starts=(production.match(/- name: Resolve exact function set/g)||[]).length;
  const captures=(production.match(/- name: Capture immutable protected-main source identity/g)||[]).length;
  const observers=(production.match(/- name: Observe Supabase GitHub deployment check/g)||[]).length;
  const retries=(production.match(/for attempt in \$\(seq 1 24\)/g)||[]).length;
  assert.equal(starts,1);
  assert.equal(captures,1);
  assert.equal(observers,1);
  assert.equal(retries,1);
  assert.match(production,/grep -E '\^\[a-z0-9\]\[a-z0-9-\]\*\$' \| sort -u > \/tmp\/functions\.txt/);
  assert.match(production,/Terminal-Replay-PR/);
  assert.match(production,/TARGET_PR_NUMBER: \$\{\{ steps\.scope\.outputs\.target_pr \}\}/);
});
