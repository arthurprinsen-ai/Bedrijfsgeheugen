import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
const ingest=readFileSync('supabase/functions/growth-datahub-ingest/index.ts','utf8');

test('terminal workflow promotes provider readback from PR metadata into durable control-plane payload',()=>{
  assert.match(workflow,/id: provider-readback/);
  assert.match(workflow,/provider_readback_required:\$provider_readback_required/);
  assert.match(workflow,/provider_readbacks:\$provider_readbacks/);
  assert.match(workflow,/PROVIDER_READBACK_REQUIRED/);
  assert.match(workflow,/PROVIDER_READBACKS/);
  assert.match(workflow,/provider_readback_verified == true/);
});

test('canonical Supabase authority validates and hashes provider runtime identities',()=>{
  assert.match(ingest,/PROVIDER_READBACK_EXPECTATIONS_MISSING/);
  assert.match(ingest,/PROVIDER_FUNCTION_DUPLICATE/);
  assert.match(ingest,/PROVIDER_VERSION_INVALID/);
  assert.match(ingest,/PROVIDER_RUNTIME_SHA256_INVALID/);
  assert.match(ingest,/PROVIDER_RUNTIME_NOT_ACTIVE/);
  assert.match(ingest,/JSON\.stringify\(providerReadbacks\)/);
  assert.match(ingest,/provider_readback_verified:/);
  assert.match(ingest,/provider_readbacks:providerReadbacks/);
});
