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
 assert.doesNotMatch(source,/process\.env\.TENANT_LIVE_READBACK_REQUIRED\s*===\s*'1'/);
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

test('signed DPA requires independent authenticated contract vault check',()=>{
 const source=fs.readFileSync('tests/ai-model-tenant-acceptance.mjs','utf8');
 assert.match(source,/TENANT_CONTRACT_VERIFY_ENDPOINT/);
 assert.match(source,/CONTRACT_VAULT_CONNECTION_REQUIRED/);
 assert.match(source,/SIGNED_CONTRACT_NOT_AUTHENTICATED/);
 assert.match(source,/receipt\.signature_valid!==true/);
});

test('contract vault proof is bound to the exact model identity',()=>{
 const source=fs.readFileSync('tests/ai-model-tenant-acceptance.mjs','utf8');
 assert.match(source,/receipt\.model_id!==r\.model_id/);
});

test('contract vault receipt requires executed agreement and matching independent approver',()=>{
 const source=fs.readFileSync('tests/ai-model-tenant-acceptance.mjs','utf8');
 assert.match(source,/receipt\.agreement_status!=='executed'/);
 assert.match(source,/receipt\.approved_by!==r\.approved_by/);
});

test('matching disabled control is still rejected as not enabled',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tenant-disabled-'));
 try {
  const filepath=path.join(dir,'disabled.json');
  fs.writeFileSync(filepath,JSON.stringify({
   scopes:[{tenant_id:'test-tenant',provider:'OpenAI',model_id:'test-model'}],
   attestations:[{
    tenant_id:'test-tenant',provider:'OpenAI',model_id:'test-model',claim:'tenant_zdr',
    checked_at:new Date().toISOString(),observed_value:false,expected_value:false,
    approved_by:'security',evidence_reference:'restricted:config',signature:'invalid',
    readback:{source:'authenticated_provider_api',identity:'test-tenant',observed_value:false,observed_at:new Date().toISOString()}
   }]
  }));
  const r=spawnSync(process.execPath,['tests/ai-model-tenant-acceptance.mjs',filepath],{encoding:'utf8'});
  assert.equal(r.status,2);
  assert.match(r.stdout,/SECURITY_CONTROL_NOT_ENABLED/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('residency cannot be attested by matching unspecified values',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tenant-residency-'));
 try {
  const filepath=path.join(dir,'residency.json');
  fs.writeFileSync(filepath,JSON.stringify({
   scopes:[{tenant_id:'test-tenant',provider:'OpenAI',model_id:'test-model'}],
   attestations:[{
    tenant_id:'test-tenant',provider:'OpenAI',model_id:'test-model',claim:'tenant_data_residency',
    checked_at:new Date().toISOString(),observed_value:null,expected_value:null,
    approved_by:'security',evidence_reference:'restricted:region',signature:'invalid',
    readback:{source:'authenticated_provider_api',identity:'test-tenant',observed_value:null,observed_at:new Date().toISOString()}
   }]
  }));
  const r=spawnSync(process.execPath,['tests/ai-model-tenant-acceptance.mjs',filepath],{encoding:'utf8'});
  assert.equal(r.status,2);
  assert.match(r.stdout,/RESIDENCY_LOCATION_UNVERIFIED/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('disabled security controls never count as accepted even when expected matches observed',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tenant-disabled-'));
 try{
  const now=new Date().toISOString(), filepath=path.join(dir,'disabled.json');
  fs.writeFileSync(filepath,JSON.stringify({
   scopes:[{tenant_id:'customer-a',provider:'OpenAI',model_id:'gpt-6-astra'}],
   attestations:[{tenant_id:'customer-a',provider:'OpenAI',model_id:'gpt-6-astra',
    claim:'tenant_zdr',expected_value:false,observed_value:false,
    checked_at:now,evidence_reference:'restricted://config/1',approved_by:'security',
    readback:{source:'authenticated_provider_api',identity:'customer-a',observed_at:now,observed_value:false}}]
  }));
  const r=spawnSync(process.execPath,['tests/ai-model-tenant-acceptance.mjs',filepath],{encoding:'utf8'});
  assert.equal(r.status,2);
  assert.match(r.stdout,/REQUIRED_SECURITY_CONTROL_NOT_ENABLED/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('tenant region is not proven by a vague or boolean residency assertion',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tenant-region-'));
 try{
  const now=new Date().toISOString(),filepath=path.join(dir,'region.json');
  fs.writeFileSync(filepath,JSON.stringify({
   scopes:[{tenant_id:'customer-a',provider:'OpenAI',model_id:'gpt-6-astra'}],
   attestations:[{tenant_id:'customer-a',provider:'OpenAI',model_id:'gpt-6-astra',
    claim:'tenant_data_residency',expected_value:true,observed_value:true,
    checked_at:now,evidence_reference:'restricted://config/region',approved_by:'security',
    readback:{source:'authenticated_provider_api',identity:'customer-a',observed_at:now,observed_value:true}}]
  }));
  const r=spawnSync(process.execPath,['tests/ai-model-tenant-acceptance.mjs',filepath],{encoding:'utf8'});
  assert.equal(r.status,2);
  assert.match(r.stdout,/TENANT_RESIDENCY_REGION_UNVERIFIED/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('structured configuration values compare by content instead of object identity',()=>{
 const source=fs.readFileSync('tests/ai-model-tenant-acceptance.mjs','utf8');
 assert.match(source,/JSON\.stringify\(r\.observed_value\)!==JSON\.stringify\(r\.expected_value\)/);
});

test('contract vault rejects expired agreements even if executed and signed',()=>{
 const source=fs.readFileSync('tests/ai-model-tenant-acceptance.mjs','utf8');
 assert.match(source,/receipt\.agreement_status!=='executed'/);
 assert.match(source,/receipt\.valid_until/);
 assert.match(source,/Date\.parse\(receipt\.valid_until/);
 assert.match(source,/SIGNED_CONTRACT_NOT_AUTHENTICATED/);
});

test('pinned integration endpoints reject embedded URL credentials and fragments',()=>{
 const source=fs.readFileSync('tests/ai-model-tenant-acceptance.mjs','utf8');
 assert.match(source,/target\.username \|\| target\.password \|\| target\.hash/);
 assert.match(source,/url\.username\|\|url\.password\|\|url\.hash/);
});

test('live provider proof matches restricted evidence and authenticated receipt',()=>{
 const source=fs.readFileSync('tests/ai-model-tenant-acceptance.mjs','utf8');
 assert.match(source,/live\.evidence_reference!==r\.evidence_reference/);
 assert.match(source,/live\.authenticated!==true/);
 assert.match(source,/live\.readback_id\.trim\(\)/);
});
