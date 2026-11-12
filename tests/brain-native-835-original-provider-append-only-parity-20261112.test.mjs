import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const sqlFiles=readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(x=>/^\\d{14}_[a-z0-9_]+\\.sql$/.test(x)).sort();
const expected={version:'20261112211000',name:'original_skipped_provider_reference_readback_handoff_v1'};
test('independently provider-observed 835th migration appended after immutable 834 prefix, not fabricated',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=835,'the actual production provider has applied at least 835 migrations');
 assert.deepEqual(lock.applied[833],{version:'20261112203000',name:'original_seo_keyword_tenant_alignment_v1'});
 assert.deepEqual(lock.applied[834],expected);
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-12T19:31:33.643581Z'));
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 const exact=lock.applied.map(x=>x.version+'_'+x.name+'.sql').sort();
 assert.deepEqual(exact,sqlFiles,'all current native provider migrations must be backed by exact executable SQL source');
});
test('original 835th source is a bounded readback-routing fix, not a sender, second executor or migration-history rewrite',()=>{
 const filename=expected.version+'_'+expected.name+'.sql';
 assert.ok(sqlFiles.includes(filename));
 const sql=readFileSync(new URL('../supabase/migrations/'+filename,import.meta.url),'utf8');
 assert.match(sql,/OVERDUE_PROVIDER_READBACK/);
 assert.match(sql,/ORIGINAL_EXACT_PROVIDER_OWNER_AND_POST_READBACK_REQUIRED/);
 assert.match(sql,/provider_readback_verified/);
 assert.match(sql,/republish_forbidden/);
 assert.match(sql,/CASE WHEN v_reuse THEN 'FULFILLED' ELSE 'OPEN' END/);
 assert.doesNotMatch(sql,/cron\\.schedule|net\\.http_post|GMAIL_SEND_EMAIL|INSTAGRAM_PUBLISH/i);
});
