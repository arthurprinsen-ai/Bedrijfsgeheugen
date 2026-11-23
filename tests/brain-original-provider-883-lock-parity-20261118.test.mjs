import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url)));
test('native provider 883 exact original migration retained once in source history',()=>{
 assert.ok(lock.applied.length>=883);
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.filter(x=>x.version==='20261118184000'&&x.name==='original_guardian_provider_scope_source_freshness_v4').length,1);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.deepEqual(lock.applied.map(x=>x.version),[...lock.applied.map(x=>x.version)].sort());
});
test('883rd migration has executable original guardian source, not a second writer',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261118184000_original_guardian_provider_scope_source_freshness_v4.sql',import.meta.url),'utf8');
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_original_result_guardian_v1\(\)/);
 assert.match(sql,/news_source_ingests_after_last_432/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|CREATE\s+TABLE|CREATE\s+TRIGGER/i);
});
