import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/migrations/20261020120000_contact_authority_bounded_queue_v2.sql',import.meta.url),'utf8');
test('materialized bounded SKIP LOCKED queue runs before CRM join',()=>{
 const picked=source.indexOf('with picked as materialized (');
 const limit=source.indexOf('limit greatest(1,least(coalesce(p_limit,500),500))',picked);
 const locked=source.indexOf('for update of s skip locked',picked);
 const joined=source.indexOf('join public.bg_connecties c',picked);
 assert.ok(picked>=0&&limit>picked&&locked>limit&&joined>locked);
 assert.match(source,/from picked s/);
});
test('canonical recipient authorization and suppression guards survive',()=>{
 assert.match(source,/AUTHORITY_REVIEW_REQUIRED/);
 assert.match(source,/CONTACT_PRESSURE_COOLDOWN/);
 assert.match(source,/powerhouse_email_contact_suppressions/);
 assert.match(source,/AUTHORITY_SOURCE_DRIFT_REFUSE_REWRITE/);
 assert.doesNotMatch(source,/human_approved\s*=\s*true/i);
});
test('reconciles only existing Cron without disabling/duplicating executor',()=>{
 assert.match(source,/jobname='powerhouse-identity-graph-v1' and active=true/);
 assert.match(source,/cron\.alter_job/);
 assert.doesNotMatch(source,/cron\.schedule\s*\(/);
 assert.doesNotMatch(source,/cron\.unschedule\s*\(/);
 assert.match(source,/IDENTITY_GRAPH_CANONICAL_CRON_DRIFT/);
});
