import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261020140000_contact_authority_preselect_function_only_p0_4198.sql',import.meta.url),'utf8');

test('bounded preselection materializes at most the requested contact rows before CRM join',()=>{
  assert.match(sql,/with picked as materialized \(/);
  assert.match(sql,/for update of s skip locked/);
  assert.match(sql,/from picked s\s+join public\.bg_connecties/);
  assert.match(sql,/limit greatest\(1,least\(coalesce\(p_limit,500\),500\)\)/);
});

test('fail closed on source drift, preserving the original consent and pressure gates',()=>{
  for(const s of ['AUTHORITY_REVIEW_REQUIRED','CONTACT_PRESSURE_COOLDOWN','powerhouse_email_contact_suppressions','AUTHORITY_SOURCE_DRIFT_REFUSE_REWRITE'])
    assert.ok(sql.includes(s),s);
  assert.match(sql,/pg_get_functiondef/);
  assert.match(sql,/if strpos\(v_def,'with picked as materialized \('\)>0/);
});

test('short, safe function-only schema migration does not seize a large table or mutate active cron jobs',()=>{
  assert.match(sql,/SET LOCAL lock_timeout = '2s'/);
  assert.match(sql,/SET LOCAL statement_timeout = '12s'/);
  assert.doesNotMatch(sql,/\bCREATE INDEX\b/i);
  assert.doesNotMatch(sql,/\bcron\.(?:unschedule|schedule|alter_job)\s*\(/i);
  assert.doesNotMatch(sql,/\bTRUNCATE\b|\bDROP TABLE\b/i);
});
