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
