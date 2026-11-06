import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261106103000_powerhouse_missed_publication_v1.sql','utf8');
test('migration is read-only and service_role only',()=>{
 assert.doesNotMatch(sql,/\b(insert|update|delete|truncate|create table|cron\.schedule)\b/i);
 assert.match(sql,/STABLE/);
 assert.match(sql,/REVOKE ALL ON FUNCTION[^;]*FROM PUBLIC, anon, authenticated/);
 assert.match(sql,/GRANT EXECUTE[^;]*TO service_role/);
});
test('only published-or-later states count as done and every channel has a named owner',()=>{
 assert.match(sql,/NOT IN \('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED'\)/);
 for(const ch of ['blog','linkedin_company','linkedin_personal','instagram_company','email_newsletter'])assert.ok(sql.includes("('"+ch+"'"),ch);
 assert.match(sql,/UNOWNED_NO_AUTHORIZED_CANONICAL_EMAIL_EXECUTOR/);
});
test('the orchestrator is untouched: reading is wired later through a narrow reader, never a second scheduler',()=>{
 const orch=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 assert.ok(!orch.includes('powerhouse_missed_publication_v1'));
 assert.doesNotMatch(sql,/cron\.schedule/);
});
