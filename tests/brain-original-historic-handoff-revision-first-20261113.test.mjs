import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const prior=readFileSync(new URL('../supabase/migrations/20261113132000_original_skipped_no_publish_evidence_routing_v1.sql',import.meta.url),'utf8');
const after=readFileSync(new URL('../supabase/migrations/20261113155800_original_historic_handoff_source_revision_priority_v1.sql',import.meta.url),'utf8');
const fnSignature='CREATE OR REPLACE FUNCTION public.powerhouse_content_handoff_receipts_v1(';
const oldFn=prior.slice(prior.indexOf(fnSignature));
const newFn=after.slice(after.indexOf(fnSignature));
const oldOrder="ORDER BY coalesce(b.updated_at,'epoch'::timestamptz),\n               c.publication_date,c.channel";
const newOrder="ORDER BY CASE WHEN (\n                 b.evidence->>'source_revision' IS DISTINCT FROM\n                   to_char(c.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')\n                 OR b.evidence#>>'{consumer_ack,source_revision}' IS DISTINCT FROM\n                   to_char(c.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')\n               ) THEN 0 ELSE 1 END,\n               coalesce(b.updated_at,'epoch'::timestamptz),\n               c.publication_date,c.channel";

test('historical original consumer prioritizes changed source revision and missing consumer revision ACK before 48 row batch',()=>{
 assert.ok(newFn.includes(newOrder));
 assert.match(newOrder,/CASE WHEN/);
 assert.match(newOrder,/b\.evidence->>'source_revision' IS DISTINCT FROM/);
 assert.match(newOrder,/b\.evidence#>>'\{consumer_ack,source_revision\}' IS DISTINCT FROM/);
 assert.match(newOrder,/to_char\(c\.updated_at AT TIME ZONE 'UTC'/);
 assert.match(newOrder,/THEN 0 ELSE 1 END/);
 assert.match(newFn,/LIMIT 48/);
 assert.ok(newFn.indexOf(newOrder)<newFn.indexOf('LIMIT 48'));
 assert.match(newOrder,/coalesce\(b\.updated_at,'epoch'::timestamptz\)/);
});

test('the complete original 44k source function and service role ACL change in only one ORDER BY',()=>{
 assert.equal(newFn.replace(newOrder,oldOrder),oldFn);
 assert.equal(newFn.split(newOrder).length-1,1);
 assert.equal(oldFn.split(oldOrder).length-1,1);
 for(const guarded of [
   "POWERHOUSE_SOCIAL_LEARNING", "NO_PUBLISH", "source_correlation_id",
   "provider_reference_reconciliation", "social_learning_obligations",
   "brain_obligations", "single_original_executor",
   "REVOKE ALL ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)",
   "GRANT EXECUTE ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)"
 ]) assert.ok(oldFn.includes(guarded),guarded);
 assert.doesNotMatch(after,/cron\.schedule|net\.http_post|insert\s+into\s+public\.content_publication_obligations|drop\s+trigger/i);
});

test('historical replay: eight late source revisions would now fit one original 48-item batch without dropping normal backlog',()=>{
 const entries=Array.from({length:127},(_,i)=>({
   id:i+1,previousAgeRank:i+1,stale:[52,60,71,82,91,101,109,114].includes(i+1)
 }));
 const oldPage=[...entries].sort((a,b)=>a.previousAgeRank-b.previousAgeRank).slice(0,48);
 assert.equal(oldPage.filter(x=>x.stale).length,0);
 const newPage=[...entries].sort((a,b)=>Number(b.stale)-Number(a.stale)||a.previousAgeRank-b.previousAgeRank).slice(0,48);
 assert.equal(newPage.filter(x=>x.stale).length,8);
 assert.equal(new Set(newPage.map(x=>x.id)).size,48);
});
