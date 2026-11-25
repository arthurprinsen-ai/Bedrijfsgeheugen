import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
const release=src.slice(src.indexOf('async function releaseLoopLease('),src.indexOf('Deno.serve(',src.indexOf('async function releaseLoopLease(')));
test('all JSONB lease release parameters have explicit PostgreSQL data types',()=>{
  assert.match(release,/'holder',\$2::text/);
  assert.match(release,/'run_date',\$3::text/);
  assert.match(release,/'expires_at',\$1::timestamptz/);
  assert.match(release,/'released_at',\$1::timestamptz/);
  assert.match(release,/record_id=\$4::text/);
});
test('lease release still requires original holder equality',()=>{
  assert.match(release,/tenant_id='canonical'/);
  assert.match(release,/jsonb_typeof\(payload\)='object'/);
  assert.match(release,/payload->>'holder'=\$2::text/);
  assert.match(src,/claimLoopLease\(runDate, leaseHolder\)/);
  assert.match(src,/releaseLoopLease\(runDate, leaseHolder\)/);
});
test('no bypass of canonical scheduler authentication or proof',()=>{
  assert.match(src,/x-powerhouse-token/);
  assert.match(src,/TOKEN_MISMATCH/);
  assert.match(src,/GREEN MEANS PROVIDER SIDE-EFFECT OR OUTCOME VERIFIED/);
  assert.match(src,/CONTENT_LOOP_LEASE_RELEASE_FAILED/);
});
