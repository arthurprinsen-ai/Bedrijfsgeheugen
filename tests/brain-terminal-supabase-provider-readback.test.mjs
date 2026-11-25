import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveEdgeRuntimeFunctions } from '../tools/supabase/edge-runtime-scope.mjs';

const workflow=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');

test('terminal closure fails closed for changed Supabase edge functions without provider readback',()=>{
  assert.match(workflow,/Require explicit Supabase Edge Function provider readback before terminal claim/);
  assert.match(workflow,/SUPABASE_PROVIDER_READBACK_MISSING/);
  assert.match(workflow,/SUPABASE_PROVIDER_READBACK_INCOMPLETE/);
  assert.match(workflow,/node tools\/supabase\/edge-runtime-scope\.mjs \/tmp\/supabase-runtime-paths\.txt/);
  const configText='[functions.alpha]\nverify_jwt = true\n[functions.beta]\nverify_jwt = true';
  assert.deepEqual(resolveEdgeRuntimeFunctions({changedPaths:['supabase/functions/alpha/index.ts'],configText}),['alpha']);
  assert.deepEqual(resolveEdgeRuntimeFunctions({changedPaths:['supabase/functions/_shared/auth.ts'],configText}),['alpha','beta']);
  assert.deepEqual(resolveEdgeRuntimeFunctions({changedPaths:['docs/edge.md'],configText}),[]);
  assert.deepEqual(resolveEdgeRuntimeFunctions({changedPaths:['supabase/functions/undeclared/index.ts'],configText}),['undeclared']);
  assert.match(workflow,/SUPABASE_PROVIDER_LIVE_MISMATCH/);
  assert.match(workflow,/Terminal-Supabase-Provider-Readback/);
  assert.match(workflow,/runtime_sha256=\[0-9a-fA-F\]\{64\}/);
  assert.match(workflow,/exit 78/);
});

test('provider evidence is required per changed function rather than once per PR',()=>{
  assert.match(workflow,/for fn in "\$\{changed_functions\[@\]\}"/);
  assert.match(workflow,/SUPABASE_PROVIDER_READBACK_COVERAGE_PROVEN/);
});
