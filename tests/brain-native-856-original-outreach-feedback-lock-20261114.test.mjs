import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const lock=JSON.parse(read('supabase/migration-history.lock.json'));
const sql=read('supabase/migrations/20261114142500_original_outreach_feedback_consumer_ack_v2.sql');
const previous={version:'20261114101000',name:'original_research_consumer_handoff_receipts_v1'};
const native856={version:'20261114142500',name:'original_outreach_feedback_consumer_ack_v2'};
test('native provider 856 is an immutable prefix, not an old last-row assumption',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=856);
 assert.deepEqual(lock.applied[854],previous);
 assert.deepEqual(lock.applied[855],native856);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.ok(lock.applied.every((x,i)=>i===0||x.version>lock.applied[i-1].version));
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-14T13:42:27.402Z'));
 const hypothetical=[...lock.applied,{version:'29991231235959',name:'future_synthetic_only'}];
 assert.deepEqual(hypothetical[855],native856);
 assert.equal(hypothetical.length,lock.applied.length+1);
});
test('real original source to WAITING email receiver ACK remains non-send and service-only',()=>{
 assert.match(sql,/create or replace function public\.powerhouse_reconcile_relationship_research_handoff_v1/);
 assert.match(sql,/ORIGINAL_RESEARCH_NO_SOURCE_RECEIVED_RETRY_QUEUED/);
 assert.match(sql,/ORIGINAL_CONSUMER_NO_SOURCE_ACK_MISSING/);
 assert.match(sql,/relationship_research_feedback/);
 assert.match(sql,/o\.status in \('prepared','waiting'\)/);
 assert.match(sql,/a\.person_key=o\.person_key and a\.company_key=o\.company_key/);
 assert.match(sql,/provider_ambiguity_quarantine,external_resend_forbidden/);
 assert.match(sql,/'recipient_send_authority_inferred',false/);
 assert.match(sql,/'external_send_executed',false/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/to service_role/);
 assert.doesNotMatch(sql,/\bcron\.schedule\s*\(|GMAIL_SEND_EMAIL|\bnet\.http_post\s*\(|\bcreate\s+table\b/i);
});
