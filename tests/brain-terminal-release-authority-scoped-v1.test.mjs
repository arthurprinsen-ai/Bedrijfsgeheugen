import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyTerminalReleaseScope} from '../tools/delivery/terminal-release-scope.mjs';
import {resolveEdgeRuntimeFunctions} from '../tools/supabase/edge-runtime-scope.mjs';

const workflow=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
const config=readFileSync('supabase/config.toml','utf8');

test('non-runtime governance and CI changes do not require a fake Netlify release',()=>{
  const backend=classifyTerminalReleaseScope([
    'tools/brain-delivery-system.mjs',
    'tests/brain-change-scoped-release-lanes.test.mjs',
    'brain/learning/2026-10-08-ci-heartbeat-lane-scope-v1.json',
    'docs/changes/2026-10-08-ci-heartbeat-lane-scope-v1.md'
  ]);
  assert.deepEqual(backend,{website:false,edge:false,other:false,non_runtime:true});
  const collector=classifyTerminalReleaseScope([
    'tools/delivery/ci-calibration-engine.mjs',
    'scripts/brain/powerhouse-ci-intelligence.mjs',
    'tests/brain-ci-calibration-engine-v1.test.mjs'
  ]);
  assert.deepEqual(collector,backend);
  assert.match(workflow,/if \[ "\$non_runtime" = true \]; then/);
  assert.match(workflow,/NON_RUNTIME_MAIN_READBACK_PROVEN/);
  assert.doesNotMatch(workflow,/if \[ "\$\{DELIVERY_LANE\}" = "automation" \] && \[ "\$non_runtime" = true \]/);
});

test('unknown backend, actual website, and Supabase runtime remain fail closed',()=>{
  assert.deepEqual(classifyTerminalReleaseScope(['config/unrecognized-live-engine.json']),
    {website:false,edge:false,other:true,non_runtime:false});
  const website=classifyTerminalReleaseScope(['platform/api/connector-handler.mjs']);
  assert.equal(website.website,true);
  const edge=classifyTerminalReleaseScope(['supabase/functions/powerhouse-runtime/index.ts']);
  assert.equal(edge.edge,true);
});

test('Supabase-only source changes require Edge provider and not Netlify',()=>{
  assert.deepEqual(classifyTerminalReleaseScope([
    'supabase/functions/powerhouse-composio-linkedin-setup/index.ts',
    'tests/brain-linkedin-org-scope-workspace-isolation-v1.test.mjs',
    'brain/learning/2026-10-08-linkedin-org-scope-workspace-isolation-v1.json'
  ]),{website:false,edge:true,other:false,non_runtime:false});
});

test('Supabase-only delivery includes both deployment toolchain files without a Netlify dependency',()=>{
  const scope=classifyTerminalReleaseScope([
    'supabase/config.toml',
    'tools/delivery/terminal-release-scope.mjs',
    'tools/supabase/edge-runtime-scope.mjs',
    '.github/workflows/obligation-terminal-closure.yml',
    'brain/learning/test-record.json',
    'docs/changes/test-note.md',
    'tests/brain-terminal-release-authority-scoped-v1.test.mjs'
  ]);
  assert.deepEqual(scope,{website:false,edge:true,other:false,non_runtime:false});
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
    configText:'[functions.some-other-function]\nverify_jwt = true'
  });
  assert.deepEqual(resolved,['unregistered-function']);
});

test('LinkedIn company setup Edge function is under canonical production inventory',()=>{
  assert.ok(config.includes('[functions.powerhouse-composio-linkedin-setup]'));
  assert.ok(config.includes('entrypoint = "./functions/powerhouse-composio-linkedin-setup/index.ts"'));
});

test('terminal workflow requires provider version/hash, main lineage and Netlify when appropriate',()=>{
  assert.match(workflow,/classifyTerminalReleaseScope/);
  assert.match(workflow,/SUPABASE_ONLY_PROVIDER_READBACK_REQUIRED/);
  assert.match(workflow,/SUPABASE_ONLY_PROVIDER_READBACK_INVALID/);
  assert.match(workflow,/SUPABASE_ONLY_RUNTIME_SUPERSEDED/);
  assert.match(workflow,/PRODUCTION_DESCENDANT_READBACK_NOT_PROVEN/);
  assert.match(workflow,/PROVIDER_READBACK_REQUIRED/);
});
