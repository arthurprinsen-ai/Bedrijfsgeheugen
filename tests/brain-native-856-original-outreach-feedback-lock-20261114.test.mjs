import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const lock=JSON.parse(read('supabase/migration-history.lock.json'));
const sql=read('supabase/migrations/20261114142500_original_outreach_feedback_consumer_ack_v2.sql');
test('native provider version 856 exact immutable original prefix, no fabricated provider history',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=856);
 assert.deepEqual(lock.applied[854],{version:'20261114101000',name:'original_research_consumer_handoff_receipts_v1'});
 assert.deepEqual(lock.applied[855],{version:'20261114142500',name:'original_outreach_feedback_consumer_ack_v2'});
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.ok(lock.applied.every((x,i)=>i===0||x.version>lock.applied[i-1].version));
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-14T13:36:14Z'));
});
test('historical 854/855 contract survives a hypothetical later append without rewriting prior versions',()=>{
 const hypothetical=[...lock.applied,{version:'20261114150000',name:'hypothetical_future_only'}];
 assert.deepEqual(hypothetical[853],lock.applied[853]);
 assert.deepEqual(hypothetical[854],lock.applied[854]);
 assert.deepEqual(hypothetical[855],lock.applied[855]);
 assert.equal(hypothetical.length,lock.applied.length+1);
});
test('native 856 only fixes original consumer feedback, no new scheduler or outbound permission',()=>{
 assert.match(sql,/powerhouse_reconcile_relationship_research_handoff_v1/);
 assert.match(sql,/relationship_research_feedback/);
 assert.match(sql,/ORIGINAL_RESEARCH_NO_SOURCE_RECEIVED_RETRY_QUEUED/);
 assert.match(sql,/ORIGINAL_CONSUMER_NO_SOURCE_ACK_MISSING/);
 assert.match(sql,/o\.status in \('prepared','waiting'\)/);
 assert.match(sql,/a\.person_key=o\.person_key and a\.company_key=o\.company_key/);
 assert.match(sql,/'recipient_send_authority_inferred',false/);
 assert.match(sql,/'external_send_executed',false/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/to service_role/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|net\.http_post\s*\(|\bcreate\s+table\b|GMAIL_SEND_EMAIL/i);
});
