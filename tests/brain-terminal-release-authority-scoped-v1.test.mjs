import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyTerminalReleaseScope} from '../tools/delivery/terminal-release-scope.mjs';
import {resolveEdgeRuntimeFunctions} from '../tools/supabase/edge-runtime-scope.mjs';

const workflow=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
const config=readFileSync('supabase/config.toml','utf8');

test('Supabase-only source changes require Edge provider and not Netlify',()=>{
  assert.deepEqual(classifyTerminalReleaseScope([
    'supabase/functions/powerhouse-composio-linkedin-setup/index.ts',
    'tests/brain-linkedin-org-scope-workspace-isolation-v1.test.mjs',
    'brain/learning/2026-10-08-linkedin-org-scope-workspace-isolation-v1.json'
  ]),{website:false,edge:true,other:false,non_runtime:false});
});

test('website-only changes require Netlify, not Supabase',()=>{
  const scope=classifyTerminalReleaseScope(['netlify/functions/connector-readiness.mjs','docs/changes/release.md']);
  assert.equal(scope.website,true);
  assert.equal(scope.edge,false);
});

test('mixed changes require both deployment authorities',()=>{
  const scope=classifyTerminalReleaseScope([
    'supabase/functions/powerhouse-composio-linkedin-setup/index.ts',
    'netlify/functions/connector-readiness.mjs'
  ]);
  assert.equal(scope.website,true);
  assert.equal(scope.edge,true);
  assert.equal(scope.other,false);
});

test('unknown production paths never qualify for a Supabase-only fast path',()=>{
  const scope=classifyTerminalReleaseScope([
    'supabase/functions/powerhouse-composio-linkedin-setup/index.ts',
    'new-runtime/adapter.ts'
  ]);
  assert.equal(scope.other,true);
});

test('governance-only path stays non-runtime and empty change scope fails',()=>{
  assert.equal(classifyTerminalReleaseScope(['docs/changes/test.md','tests/delivery.test.mjs']).non_runtime,true);
  assert.throws(()=>classifyTerminalReleaseScope([]),/TERMINAL_MERGE_CHANGE_SCOPE_EMPTY/);
});

test('directly changed undeclared Edge function cannot silently become not applicable',()=>{
  const resolved=resolveEdgeRuntimeFunctions({
    changedPaths:['supabase/functions/unregistered-function/index.ts'],
    configText:'[functions.some-other-function]\\nverify_jwt = true'
  });
  assert.deepEqual(resolved,['unregistered-function']);
});

test('LinkedIn company setup Edge function is under canonical production inventory',()=>{
  assert.match(config,/\\[functions\\.powerhouse-composio-linkedin-setup\\][\\s\\S]*?verify_jwt = false/);
});

test('terminal workflow requires provider version/hash, main lineage and Netlify when appropriate',()=>{
  assert.match(workflow,/classifyTerminalReleaseScope/);
  assert.match(workflow,/SUPABASE_ONLY_PROVIDER_READBACK_REQUIRED/);
  assert.match(workflow,/SUPABASE_ONLY_PROVIDER_READBACK_INVALID/);
  assert.match(workflow,/SUPABASE_ONLY_RUNTIME_SUPERSEDED/);
  assert.match(workflow,/PRODUCTION_DESCENDANT_READBACK_NOT_PROVEN/);
  assert.match(workflow,/PROVIDER_READBACK_REQUIRED/);
});
