import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow=readFileSync('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');

test('terminal-delivery owner supports Supabase Edge Function provider readback',()=>{
  assert.match(workflow,/Terminal-Supabase-Provider-Readback/);
  assert.match(workflow,/SUPABASE_PROVIDER_READBACK_MISSING/);
  assert.match(workflow,/SUPABASE_PROVIDER_READBACK_INCOMPLETE/);
  assert.match(workflow,/SUPABASE_EDGE_PROVIDER_READBACK_PROVEN/);
  assert.match(workflow,/readback_mode=supabase_edge_provider/);
  assert.match(workflow,/netlify_runtime_supabase_provider/);
  assert.match(workflow,/supabase-provider-readbacks\.json/);
});

test('unknown non-Netlify and non-Supabase runtimes remain fail closed',()=>{
  assert.match(workflow,/UNWIRED_NON_NETLIFY_RUNTIME_READBACK/);
  assert.match(workflow,/const unknown=paths\.filter/);
  assert.match(workflow,/exit 78/);
});

test('delivery classification policy is governance rather than runtime deployment',()=>{
  assert.match(workflow,/productionTruth\?\.verifierOnlyPaths/);
  const truth=JSON.parse(readFileSync('brain/contracts/production-readback-v1.json','utf8')).productionTruth;
  assert.ok(truth.verifierOnlyPaths.includes('config/brain-delivery-system.json'));
});

test('terminal evidence accepts provider-proven Supabase runtime modes',()=>{
  const modes=workflow.match(/const runtimeReadbackModes=(\[[^;]+\]);/);
  assert.ok(modes);
  for(const mode of ['netlify_runtime','supabase_edge_provider','netlify_runtime_supabase_provider']) assert.ok(JSON.parse(modes[1].replaceAll("'",'"')).includes(mode),mode);
  assert.match(workflow,/supabase_provider_readback/);
  assert.match(workflow,/TERMINAL_SUPABASE_PROVIDER_READBACK_EVIDENCE_MISSING/);
});
