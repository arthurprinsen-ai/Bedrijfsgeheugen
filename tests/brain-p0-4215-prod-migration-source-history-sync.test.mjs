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

const historicalCronSql=readFileSync(
  new URL('../supabase/migrations/20261006085416_stagger_cron_database_pressure_v1.sql',import.meta.url),
  'utf8',
);

function assertColdReplaySafeCronStagger(sql) {
  assert.match(sql,/if\s+v_jobid\s+is\s+not\s+null\s+then\s+perform\s+cron\.alter_job\s*\(\s*job_id\s*:=\s*v_jobid\s*,\s*schedule\s*:=\s*rec\.schedule\s*\)\s*;\s*end\s+if\s*;/i);
  assert.doesNotMatch(sql,/raise\s+exception\s+['"]CRON_PRESSURE_CONTRACT_JOB_MISSING/i);
  assert.doesNotMatch(sql,/\b(?:perform\s+)?cron\.schedule\s*\(/i);
}

test('P0 #3742: cold GitHub replay skips production-only missing cron jobs safely',()=>{
  assertColdReplaySafeCronStagger(historicalCronSql);
});

test('P0 #3742: regression rejects an unconditional historic missing-job exception',()=>{
  const poisoned=historicalCronSql.replace(
    'if v_jobid is not null then',
    "raise exception 'CRON_PRESSURE_CONTRACT_JOB_MISSING:%', rec.jobname;\n    if v_jobid is not null then",
  );
  assert.notEqual(poisoned,historicalCronSql);
  assert.throws(()=>assertColdReplaySafeCronStagger(poisoned),/CRON_PRESSURE_CONTRACT_JOB_MISSING/);
});
