import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const indexSql=readFileSync(new URL('../supabase/migrations/20261023064000_p0_4215_forecast_scope_lower_idx.sql',import.meta.url),'utf8');
const lookupSql=readFileSync(new URL('../supabase/migrations/20261020163500_p0_4215_evidence_forecast_direct_lookup.sql',import.meta.url),'utf8');
test('active/claimed forecast lower-scope index matches exact LATERAL predicate',()=>{
 assert.match(lookupSql,/lower\(pf\.scope_key\)=lower\(opp\.company_key\)/);
 assert.match(lookupSql,/lower\(pf\.scope_key\)=lower\(opp\.person_key\)/);
 assert.match(indexSql,/USING btree \(lower\(scope_key\)\)/);
 assert.match(indexSql,/WHERE status IN \('active','claimed'\) AND scope_key IS NOT NULL/);
});
test('versioned index is bounded, guarded and read back; does not change customer data or ACL',()=>{
 assert.match(indexSql,/BEGIN;/);assert.match(indexSql,/COMMIT;/);
 assert.match(indexSql,/SET LOCAL lock_timeout='2s'/);
 assert.match(indexSql,/SET LOCAL statement_timeout='20s'/);
 assert.match(indexSql,/P0_4215_LOWER_SCOPE_INDEX_NAME_DRIFT/);
 assert.match(indexSql,/P0_4215_LOWER_SCOPE_INDEX_READBACK_FAILED/);
 assert.match(indexSql,/CREATE INDEX IF NOT EXISTS ph_forecasts_active_scope_lower_p0/);
 assert.doesNotMatch(indexSql,/\b(?:DELETE|TRUNCATE|UPDATE|INSERT|GRANT|REVOKE|ALTER ROLE|DROP TABLE|cron\.schedule|cron\.alter_job)\b/i);
});
