import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { diagnosePreviewCheckRuns } from '../tools/ci/supabase-preview-diagnosis.mjs';

const requiredPath='.github/workflows/required-test.yml';
const sourcePath='.github/workflows/supabase-pr-preview.yml';

const check=(id,conclusion,app='supabase')=>({
  id, name:'Supabase Preview', app:{slug:app}, status:'completed', conclusion,
  output:{summary:''},
});

async function authoritativeWorkflows() {
  const [required,source]=await Promise.all([
    readFile(requiredPath,'utf8'),
    readFile(sourcePath,'utf8'),
  ]);
  const sourceContract=required.split('\n  supabase_source_contract:\n')[1]?.split('\n  supabase_preview:\n')[0];
  const providerGate=required.split('\n  supabase_preview:\n')[1]?.split('\n  backend:\n')[0];
  assert.ok(sourceContract,'the required source-contract job must exist');
  assert.ok(providerGate,'the required provider-evidence job must exist');
  return {required,source,sourceContract,providerGate};
}

test('applicability gate always runs on pull requests to main',async()=>{
  const {required,source,sourceContract}=await authoritativeWorkflows();
  assert.match(required,/\n  pull_request:\n    branches: \[main\]/);
  assert.doesNotMatch(required,/\n  pull_request:\n    branches: \[main\]\n    paths:/);
  assert.match(sourceContract,/uses: \.\/\.github\/workflows\/supabase-pr-preview\.yml/);
  assert.match(source,/\n  workflow_call:\n/);
  assert.match(source,/ref: \S*inputs\.head_sha/);
});

test('non-Supabase changes are scoped without invented provider success',async()=>{
  const {required,sourceContract,providerGate}=await authoritativeWorkflows();
  assert.match(required,/supabase_preview_required:.*steps\.scope\.outputs\.supabase_preview_required/);
  assert.match(sourceContract,/if: needs\.preflight\.outputs\.supabase_preview_required == 'true'/);
  assert.match(providerGate,/if: needs\.preflight\.outputs\.supabase_preview_required == 'true'/);
  assert.doesNotMatch(providerGate,/SUPABASE_PREVIEW_NOT_APPLICABLE/);
});

test('Edge Function-only changes never create a second preview authority',async()=>{
  const {source,sourceContract,providerGate}=await authoritativeWorkflows();
  assert.match(sourceContract,/uses: \.\/\.github\/workflows\/supabase-pr-preview\.yml/);
  assert.match(source,/# Runtime replay authority is the Supabase Git Preview Branch/);
  assert.match(source,/empty or whitespace-only migration SQL is forbidden/);
  assert.match(source,/duplicate migration versions/);
  assert.match(source,/check_powerhouse_supabase_security\.py/);
  assert.match(providerGate,/Verify provider-owned Supabase Preview on exact candidate head/);
});

test('non-function Supabase changes require a provider-owned check on exact PR head',async()=>{
  const {providerGate}=await authoritativeWorkflows();
  assert.match(providerGate,/ref: .*needs\.preflight\.outputs\.change_head_sha/);
  assert.match(providerGate,/commits\/\$HEAD_SHA\/check-runs/);
  const valid=diagnosePreviewCheckRuns({check_runs:[check(3,'success')]});
  const spoof=diagnosePreviewCheckRuns({check_runs:[check(3,'success','github-actions')]});
  assert.equal(valid.code,'PREVIEW_PROVIDER_SUCCEEDED');
  assert.equal(spoof.code,'PREVIEW_PROVIDER_MISSING');
  assert.notEqual(spoof.code,'PREVIEW_PROVIDER_SUCCEEDED');
});

test('skipped or neutral provider outcomes fail closed',async()=>{
  const {providerGate}=await authoritativeWorkflows();
  assert.equal(diagnosePreviewCheckRuns({check_runs:[check(3,'skipped')]}).code,'PREVIEW_PROVIDER_NON_SUCCESS');
  assert.equal(diagnosePreviewCheckRuns({check_runs:[check(3,'neutral')]}).code,'PREVIEW_PROVIDER_NON_SUCCESS');
  assert.equal(diagnosePreviewCheckRuns({check_runs:[check(3,'failure')]}).code,'PREVIEW_PROVIDER_NON_SUCCESS');
  assert.match(providerGate,/SUPABASE_PREVIEW_PROVIDER_NON_SUCCESS/);
  assert.match(providerGate,/skipped:\*/);
  assert.match(providerGate,/neutral:\*/);
});

test('latest provider check wins and success must be stable before verification',async()=>{
  const {providerGate}=await authoritativeWorkflows();
  const newerFailure=diagnosePreviewCheckRuns({check_runs:[check(4,'success'),check(5,'failure')]});
  assert.equal(newerFailure.id,'5');
  assert.notEqual(newerFailure.code,'PREVIEW_PROVIDER_SUCCEEDED');
  assert.match(providerGate,/stable_provider_success_id/);
  assert.match(providerGate,/if \[ "\$stable_provider_success_id" = "\$provider_id" \]/);
  assert.match(providerGate,/SUPABASE_PREVIEW_PROVIDER_VERIFIED/);
});
