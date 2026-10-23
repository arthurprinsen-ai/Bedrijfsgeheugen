import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const path=new URL('../supabase/migrations/20261023070053_p0_4215_forecast_scope_lower_idx.sql',import.meta.url);
const source=readFileSync(path,'utf8');

test('P0 #4215: applied production migration is preserved byte-exactly',()=>{
  assert.equal(Buffer.byteLength(source,'utf8'),1620);
  const gitBlob=createHash('sha1').update('blob '+Buffer.byteLength(source,'utf8')+'\0').update(source).digest('hex');
  assert.equal(gitBlob,'3e6af2848e72d8733b73900eff7174315427a55c');
});

test('P0 #4215: historical index remains bounded, idempotent and fails closed',()=>{
  assert.match(source,/BEGIN;/);
  assert.match(source,/COMMIT;/);
  assert.match(source,/SET LOCAL lock_timeout='2s'/);
  assert.match(source,/SET LOCAL statement_timeout='20s'/);
  assert.match(source,/P0_4215_FORECAST_TABLE_MISSING/);
  assert.match(source,/P0_4215_LOWER_SCOPE_INDEX_NAME_DRIFT/);
  assert.match(source,/P0_4215_LOWER_SCOPE_INDEX_READBACK_FAILED/);
  assert.match(source,/CREATE INDEX IF NOT EXISTS ph_forecasts_active_scope_lower_p0/);
  assert.match(source,/USING btree \(lower\(scope_key\)\)/);
  assert.match(source,/WHERE status IN \('active','claimed'\) AND scope_key IS NOT NULL/);
  assert.doesNotMatch(source,/\b(?:DELETE|TRUNCATE|UPDATE|INSERT|GRANT|REVOKE|ALTER ROLE|DROP TABLE|cron\.schedule|cron\.alter_job)\b/i);
});
