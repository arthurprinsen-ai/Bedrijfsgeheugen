import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readbacksForFunctions, mergeProviderLines } from '../tools/supabase/publish-edge-provider-readback.mjs';

test('ACTIVE provider metadata becomes terminal readback evidence',()=>{
  const hash='a'.repeat(64);
  assert.deepEqual(readbacksForFunctions([
    {slug:'powerhouse-predictive-engine',version:43,status:'ACTIVE',ezbr_sha256:hash,updated_at:2}
  ],['powerhouse-predictive-engine']),[{
    function:'powerhouse-predictive-engine',version:43,runtime_sha256:hash,state:'ACTIVE'
  }]);
});

test('provider line replacement is idempotent',()=>{
  const row={function:'a',version:2,runtime_sha256:'3'.repeat(64),state:'ACTIVE'};
  const first=mergeProviderLines('Obligation-ID: x\n',[row]);
  const second=mergeProviderLines(first,[row]);
  assert.equal(second,first);
  assert.match(first,/function=a;version=2;/);
});


test('publisher supports an explicit target PR for successor replay',()=>{
  const source=readFileSync('tools/supabase/publish-edge-provider-readback.mjs','utf8');
  assert.match(source,/targetPrNumber=null/);
  assert.match(source,/SUPABASE_PROVIDER_TARGET_PR_NOT_MERGED/);
  assert.match(source,/TARGET_PR_NUMBER/);
});
