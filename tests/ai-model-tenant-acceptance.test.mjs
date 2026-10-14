import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('tenant governance acceptance requires private evidence input',()=>{
 const r=spawnSync(process.execPath,['tests/ai-model-tenant-acceptance.mjs'],{encoding:'utf8'});
 assert.equal(r.status,2);
 assert.match(r.stderr,/PRIVATE_ATTESTATION_FILE_REQUIRED/);
});

test('tenant governance acceptance rejects unsigned unsupported self-assertions',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tenant-evidence-'));
 try {
  const filepath=path.join(dir,'invalid.json');
  fs.writeFileSync(filepath,JSON.stringify({attestations:[{
   tenant_id:'test-tenant',provider:'test-provider',model_id:'test-model',
   claim:'tenant_zdr',evidence_reference:'untrusted',approved_by:'self',
   checked_at:new Date().toISOString(),observed_value:true,expected_value:true,
   readback:{source:'authenticated_provider_api',identity:'test-tenant',observed_at:new Date().toISOString()}
  }]}));
  const r=spawnSync(process.execPath,['tests/ai-model-tenant-acceptance.mjs',filepath],{encoding:'utf8'});
  assert.equal(r.status,2);
  assert.match(r.stdout,/MISSING_SIGNATURE/);
  assert.match(r.stdout,/VERIFICATION_PUBLIC_KEY_REQUIRED/);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('signature payload includes authenticated readback evidence',()=>{
 const source=fs.readFileSync('tests/ai-model-tenant-acceptance.mjs','utf8');
 assert.match(source,/expected_value:r\.expected_value,readback:r\.readback/);
});

test('tenant readback value must be present and match attested value',()=>{
 const source=fs.readFileSync('tests/ai-model-tenant-acceptance.mjs','utf8');
 assert.match(source,/READBACK_VALUE_MISMATCH/);
 assert.match(source,/Object\.hasOwn\(r\.readback,'observed_value'\)/);
});

test('live provider readback is mandatory for all non-contract claims',()=>{
 const source=fs.readFileSync('tests/ai-model-tenant-acceptance.mjs','utf8');
 assert.match(source,/if \(r.claim !== 'signed_dpa'\)/);
 assert.doesNotMatch(source,/TENANT_LIVE_READBACK_REQUIRED/);
 assert.match(source,/TENANT_LIVE_READBACK_ALLOWED_ORIGIN/);
 assert.match(source,/LIVE_PROVIDER_CONNECTION_REQUIRED/);
 assert.match(source,/LIVE_PROVIDER_CONFIGURATION_MISMATCH/);
 assert.match(source,/redirect:'error'/);
});

test('tenant acceptance cannot pass with a single signed claim or omitted customer-model scope',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tenant-scope-'));
 try {
  const filepath=path.join(dir,'incomplete.json');
  fs.writeFileSync(filepath,JSON.stringify({
   scopes:[{tenant_id:'customer-a',provider:'OpenAI',model_id:'gpt-6-astra'}],
   attestations:[{tenant_id:'customer-a',provider:'OpenAI',model_id:'gpt-6-astra',claim:'signed_dpa'}]
  }));
  const r=spawnSync(process.execPath,['tests/ai-model-tenant-acceptance.mjs',filepath],{encoding:'utf8'});
  assert.equal(r.status,2);
  assert.match(r.stdout,/MISSING_OR_DUPLICATE_CLAIM:tenant_data_residency/);
  assert.match(r.stdout,/MISSING_OR_DUPLICATE_CLAIM:tenant_zdr/);
  assert.match(r.stdout,/MISSING_OR_DUPLICATE_CLAIM:customer_cmk/);
  assert.match(r.stdout,/MISSING_OR_DUPLICATE_CLAIM:private_networking_enabled/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
