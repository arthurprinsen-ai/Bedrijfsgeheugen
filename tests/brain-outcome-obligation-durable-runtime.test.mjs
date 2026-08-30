import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createOutcomeObligationCliStores } from '../tools/outcome-obligation-runtime.mjs';

test('CLI uses durable Supabase obligation stores when server-only credentials are available', () => {
  const stores=createOutcomeObligationCliStores({
    env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'service-role'},
    fetchImpl:async()=>new Response('[]',{status:200})
  });
  assert.equal(stores.mode,'durable-supabase');
  assert.equal(typeof stores.workStore.get,'function');
  assert.equal(typeof stores.workStore.putIfAbsent,'function');
  assert.equal(typeof stores.evidenceStore.list,'function');
  assert.equal(typeof stores.recoveryStore.putIfAbsent,'function');
  assert.equal(stores.hardBoundary,null);
});

test('CLI remains explicitly fail-closed when durable credentials are absent', () => {
  const stores=createOutcomeObligationCliStores({env:{},fetchImpl:async()=>new Response('{}',{status:200})});
  assert.equal(stores.mode,'decision-only-fail-closed');
  assert.equal(stores.hardBoundary,'durable_work_store_not_configured');
});

test('scheduled workflow passes only secret-backed Supabase credentials into the durable runtime', async () => {
  const yaml=await readFile('.github/workflows/outcome-obligation-sweep.yml','utf8');
  assert.match(yaml,/SUPABASE_URL:\s*\$\{\{\s*secrets\.SUPABASE_URL\s*\}\}/);
  assert.match(yaml,/SUPABASE_SERVICE_ROLE_KEY:\s*\$\{\{\s*secrets\.SUPABASE_SERVICE_ROLE_KEY\s*\}\}/);
  assert.doesNotMatch(yaml,/service[_-]?role[^\n]*['\"][A-Za-z0-9._-]{8,}/i);
});
