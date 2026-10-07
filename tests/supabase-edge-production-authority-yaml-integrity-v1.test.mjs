import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync('.github/workflows/supabase-edge-production-authority.yml','utf8');
const count=(needle)=>source.split(needle).length-1;

test('Supabase production authority has exactly one canonical step chain',()=>{
  assert.equal(count('- name: Resolve exact function set'),1);
  assert.equal(count('- name: Capture immutable protected-main source identity'),1);
  assert.equal(count('- name: Observe Supabase GitHub deployment check'),1);
  assert.equal(count('- name: Prove byte-for-byte provider source parity'),1);
  assert.equal(count('- name: Publish exact provider readback evidence to merged PR'),1);
  assert.equal(count('- name: Prove no newer Supabase runtime superseded the attested SHA'),1);
  assert.equal(count('- name: Upload immutable production authority evidence'),1);
});

test('requested function scope is syntactically complete and replay remains bounded',()=>{
  assert.match(source,/grep -E '\^\[a-z0-9\]\[a-z0-9-\]\*\$' \| sort -u > \/tmp\/functions\.txt/);
  assert.match(source,/target_pr=/);
  assert.match(source,/Terminal-Replay-PR/);
  assert.match(source,/for attempt in \$\(seq 1 24\)/);
  assert.match(source,/sleep 5/);
  assert.doesNotMatch(source,/\n \| sort -u > \/tmp\/functions\.txt/);
});
