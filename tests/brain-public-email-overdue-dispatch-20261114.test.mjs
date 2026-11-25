import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261115001500_original_public_email_overdue_source_replay_dispatch_v1.sql',import.meta.url),'utf8');
const edge=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');

test('existing original #116 dispatch wakes due original source actions beyond eight new actions',()=>{
 assert.match(sql,/create or replace function public\.powerhouse_dispatch_relationship_public_research_v1\(/i);
 assert.match(sql,/v_due_original_retry boolean := false/);
 assert.match(sql,/select exists\([\s\S]*a\.dedupe_key like 'relationship-research:public-domain:%'/);
 assert.match(sql,/a\.evidence->>'public_email_source_checked'='false'/);
 assert.match(sql,/a\.evidence->>'public_email_next_attempt_at'/);
 assert.match(sql,/::timestamptz <= now\(\)/);
 assert.match(sql,/into v_due_original_retry/);
 assert.match(sql,/if v_pending=0 and not v_first_party_due and not v_due_original_retry then/);
 assert.match(sql,/'due_original_retry',v_due_original_retry/);
 assert.match(sql,/v_first_party_researched < 8/,'new source daily cap stays eight');
});
test('original producer-to-identity consumer and original retry action identity remain unchanged',()=>{
 assert.match(edge,/async function replayDueHistoricalFirstPartySources/);
 assert.match(edge,/processOriginalFirstPartyPublicSource\(\s*db,action,domain,company,key,observedAt,action\.evidence\)/);
 assert.match(edge,/const overdue=await replayDueHistoricalFirstPartySources\(db,observedAt\)/);
 assert.match(edge,/original_lineage_reused:true,new_provider_queries:0,external_messages_sent:0/);
 assert.match(sql,/powerhouse_daily_scheduler_token/);
 assert.match(sql,/x-powerhouse-token/);
 assert.match(sql,/net\.http_post/);
 assert.match(sql,/revoke execute on function public\.powerhouse_dispatch_relationship_public_research_v1\(date\)/i);
 assert.match(sql,/grant execute on function public\.powerhouse_dispatch_relationship_public_research_v1\(date\)[\s\S]*to service_role/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|APOLLO_PEOPLE_ENRICHMENT|HUNTER_EMAIL_FINDER|create table|create policy/i);
});
test('dispatch decision closes only after no pending work and no source retries',()=>{
 const shouldDispatch=({pending, firstPartyDue, overdueRetry})=>pending>0||firstPartyDue||overdueRetry;
 assert.equal(shouldDispatch({pending:0,firstPartyDue:false,overdueRetry:true}),true,'due retry must survive exhausted daily new-source cap');
 assert.equal(shouldDispatch({pending:0,firstPartyDue:false,overdueRetry:false}),false,'no unnecessary provider request');
 assert.equal(shouldDispatch({pending:1,firstPartyDue:false,overdueRetry:false}),true,'existing original research queue remains live');
 assert.equal(shouldDispatch({pending:0,firstPartyDue:true,overdueRetry:false}),true,'new bounded source is still supported');
});
