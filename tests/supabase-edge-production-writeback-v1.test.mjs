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
