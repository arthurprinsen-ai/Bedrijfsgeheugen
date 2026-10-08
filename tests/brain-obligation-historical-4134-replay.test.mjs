import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';

const canonical=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
const historical=readFileSync('.github/workflows/historical-terminal-reconciliation.yml','utf8');

test('canonical terminal writer keeps standard protected close and provider/Brain evidence gates',()=>{
  assert.match(canonical,/^  pull_request:/m);
  assert.match(canonical,/^  workflow_dispatch:/m);
  assert.doesNotMatch(canonical,/^  workflow_call:/m);
  assert.match(canonical,/Verify exact-head critical delivery gates before terminal claim/);
  assert.match(canonical,/SUPABASE_PROVIDER_LIVE_METADATA_MATCH/);
  assert.match(canonical,/Persist canonical Brain terminal evidence before terminal claim/);
  assert.match(canonical,/Publish immutable terminal evidence/);
  assert.match(canonical,/CONTROL_PLANE_DURABLE_READBACK_REJECTED/);
});

test('historical reconciliation no longer retries terminal 4134 through an unauthorized OIDC caller',()=>{
  assert.match(historical,/^name: Historical Terminal Reconciliation/m);
  assert.match(historical,/tools\/delivery\/historical-terminal-reconcile\.mjs/);
  assert.match(historical,/config\/historical-terminal-reconciliation\.json/);
  assert.doesNotMatch(historical,/one-shot-historical-terminal-4134/);
  assert.doesNotMatch(historical,/detect-original-4134|replay-original-4134/);
  assert.doesNotMatch(historical,/uses: \.\/\.github\/workflows\/obligation-terminal-closure\.yml/);
  assert.equal(existsSync('config/one-shot-historical-terminal-4134.json'),false);
});
