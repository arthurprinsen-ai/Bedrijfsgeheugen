import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow=readFileSync('.github/workflows/supabase-edge-production-authority.yml','utf8');

const count=(needle)=>workflow.split(needle).length-1;

test('Supabase production authority contains one canonical step chain',()=>{
  assert.equal(count('- name: Resolve exact function set'),1);
  assert.equal(count('- name: Capture immutable protected-main source identity'),1);
  assert.equal(count('- name: Observe Supabase GitHub deployment check'),1);
  assert.equal(count('- name: Install pinned Supabase CLI for read-only provider parity'),1);
  assert.equal(count('- name: Prove byte-for-byte provider source parity'),1);
  assert.equal(count('- name: Publish exact provider readback evidence to merged PR'),1);
  assert.equal(count('- name: Prove no newer Supabase runtime superseded the attested SHA'),1);
  assert.equal(count('- name: Upload immutable production authority evidence'),1);
});

test('scope resolver is syntactically complete and replay-aware',()=>{
  assert.match(workflow,/grep -E '\^\[a-z0-9\]\[a-z0-9-\]\*\$' \| sort -u > \/tmp\/functions\.txt/);
  assert.match(workflow,/Terminal-Replay-PR/);
  assert.match(workflow,/SUPABASE_REPLAY_RUNTIME_SUPERSEDED/);
  assert.doesNotMatch(workflow,/^\s*\| sort -u > \/tmp\/functions\.txt$/m);
});

test('provider parity remains bounded and fail closed',()=>{
  assert.match(workflow,/for attempt in \$\(seq 1 24\)/);
  assert.match(workflow,/sleep 5/);
  assert.match(workflow,/SUPABASE_EDGE_PROVIDER_SOURCE_PARITY_TIMEOUT/);
  assert.match(workflow,/provider_source_parity=BYTE_FOR_BYTE/);
});
