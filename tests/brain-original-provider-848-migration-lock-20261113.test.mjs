import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const exact={version:'20261113155800',name:'original_historic_handoff_source_revision_priority_v1'};
const preceding={version:'20261113153000',name:'original_no_publish_legacy_source_action_reconcile_v1'};
const path='../supabase/migrations/'+exact.version+'_'+exact.name+'.sql';
const migration=readFileSync(new URL(path,import.meta.url),'utf8');
const previous=readFileSync(new URL('../supabase/migrations/20261113132000_original_skipped_no_publish_evidence_routing_v1.sql',import.meta.url),'utf8');
const signature='CREATE OR REPLACE FUNCTION public.powerhouse_content_handoff_receipts_v1(';
const currentBody=migration.slice(migration.indexOf(signature));
const oldBody=previous.slice(previous.indexOf(signature));
const oldOrder="ORDER BY coalesce(b.updated_at,'epoch'::timestamptz),\n               c.publication_date,c.channel";
const newOrder=`ORDER BY CASE WHEN (
                 b.evidence->>'source_revision' IS DISTINCT FROM
                   to_char(c.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
                 OR b.evidence#>>'{consumer_ack,source_revision}' IS DISTINCT FROM
                   to_char(c.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
               ) THEN 0 ELSE 1 END,
               coalesce(b.updated_at,'epoch'::timestamptz),
               c.publication_date,c.channel`;

test('original provider 848 remains the real immutable applied record with the exact prior 847',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=848);
 assert.deepEqual(lock.applied[847],exact);
 assert.deepEqual(lock.applied[846],preceding);
 assert.equal(lock.applied.filter(x=>x.version===exact.version).length,1);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.ok(lock.applied.every((v,i)=>i===0||v.version>lock.applied[i-1].version));
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-13T16:05:16.124635Z'));
 const hypothetical=[...lock.applied,{version:'20991231235959',name:'only_in_memory'}];
 assert.deepEqual(hypothetical[847],exact);
});

test('provider 848 changes only one original #171 historical batch sort, preserving all other source and grants',()=>{
 assert.equal(existsSync(new URL(path,import.meta.url)),true);
 assert.equal(currentBody.replace(newOrder,oldOrder),oldBody);
 assert.equal(currentBody.split(newOrder).length-1,1);
 assert.match(migration,/LIMIT 48/);
 assert.match(migration,/REVOKE ALL ON FUNCTION public.powerhouse_content_handoff_receipts_v1\(timestamptz\)/);
 assert.match(migration,/GRANT EXECUTE ON FUNCTION public.powerhouse_content_handoff_receipts_v1\(timestamptz\)\s+TO service_role;/);
 assert.doesNotMatch(migration,/cron\.schedule|net\.http_post|CREATE TABLE|CREATE TRIGGER|LINKEDIN_CREATE_LINKED_IN_POST|INSTAGRAM_CREATE_MEDIA/i);
});

test('original fail-closed terminal acknowledgement still exists and no historical decision is fabricated',()=>{
 const trigger=readFileSync(new URL('../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',import.meta.url),'utf8');
 for(const term of ['CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED','CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED','CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED'])assert.ok(trigger.includes(term));
 assert.doesNotMatch(migration,/CREATE OR REPLACE FUNCTION public.record_content_publication_skip|INSERT INTO public.content_publication_obligations|UPDATE public.content_publication_obligations/i);
});
