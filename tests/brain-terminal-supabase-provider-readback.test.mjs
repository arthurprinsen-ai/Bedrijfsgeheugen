import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');

test('terminal closure fails closed for changed Supabase edge functions without provider readback',()=>{
  assert.match(workflow,/Require explicit Supabase Edge Function provider readback before terminal claim/);
  assert.match(workflow,/SUPABASE_PROVIDER_READBACK_MISSING/);
  assert.match(workflow,/SUPABASE_PROVIDER_READBACK_INCOMPLETE/);
  assert.match(workflow,/\^supabase\/functions\/\(\[\^\/\]\+\)\//);
  assert.match(workflow,/Terminal-Supabase-Provider-Readback/);
  assert.match(workflow,/runtime_sha256=\[0-9a-fA-F\]\{64\}/);
  assert.match(workflow,/exit 78/);
});

test('provider evidence is required per changed function rather than once per PR',()=>{
  assert.match(workflow,/for fn in "\$\{changed_functions\[@\]\}"/);
  assert.match(workflow,/SUPABASE_PROVIDER_READBACK_COVERAGE_PROVEN/);
});
