import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const observed={version:'20261113190000',name:'original_seo_heartbeat_cro_consumer_receipt_v1'};
const previous={version:'20261113174500',name:'original_social_learning_source_ack_v1'};
const actualSql=new URL('../supabase/migrations/20261113190000_original_seo_heartbeat_cro_consumer_receipt_v1.sql',import.meta.url);

test('original provider 851 is appended only after real 850 migration identity',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=851);
 assert.deepEqual(lock.applied[849],previous);
 assert.deepEqual(lock.applied[850],observed);
 assert.equal(lock.applied.filter(x=>x.version===observed.version).length,1);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.ok(lock.applied.every((x,i)=>i===0||x.version>lock.applied[i-1].version));
 assert.equal(lock.captured_at,'2026-11-13T18:21:42.215773Z');
});
test('source lock 851 includes exact already-merged SQL and introduces no new executor or duplicated migration file',()=>{
 assert.ok(existsSync(actualSql));
 const sql=readFileSync(actualSql,'utf8');
 assert.match(sql,/powerhouse|heartbeat|brain/i);
 const note=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-13-original-provider-851-migration-lock-v1.json',import.meta.url),'utf8'));
 assert.equal(note.source_lock.applied_count,851);
 assert.equal(note.evidence.provider_readback.applied_count,851);
 assert.equal(note.evidence.provider_readback.source_lock_provider_prefix_mismatches,0);
 assert.equal(note.evidence.original_outcome_boundary.heartbeat_cro_outcome_proven,false);
 assert.deepEqual(note.evaluation.shadow,['tests/brain-original-provider-851-migration-lock-20261113.test.mjs']);
 assert.deepEqual(note.evaluation.canary,['tests/brain-original-provider-851-migration-lock-20261113.test.mjs']);
 assert.equal(note.source_lock.mismatched_prior_850,0);
 assert.equal(note.remedy.no_new_sql,true);
 assert.equal(note.remedy.no_second_scheduler,true);
 assert.equal(note.production_success,false);
});
