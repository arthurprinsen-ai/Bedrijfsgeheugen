import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
test('original GitOps source history is exactly canonical native 884, ordered and unique',()=>{
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,884);
 assert.deepEqual(lock.applied.at(-1),{version:'20261118194000',name:'original_guardian_mira_vision_exhausted_owner_notice_v5'});
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,884);
});
test('last native migration SQL exists and contains one original v5 service-owned guardian, never a parallel writer',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261118194000_original_guardian_mira_vision_exhausted_owner_notice_v5.sql',import.meta.url),'utf8');
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_original_result_guardian_v1\(\)/);
 assert.match(sql,/mira_original_media_verification_state/);
 assert.match(sql,/mira-vision-verifier-3of3-original/);
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION/g)||[]).length,1);
 assert.doesNotMatch(sql,/CREATE\s+TABLE|cron\.schedule\s*\(|net\.http_post\(/i);
});
