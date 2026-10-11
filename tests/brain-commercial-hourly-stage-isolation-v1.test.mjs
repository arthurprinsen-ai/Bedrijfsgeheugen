import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261011171500_powerhouse_commercial_isolated_hourly_stages_v1.sql','utf8');
test('preserves original cron and does not create second sender, queue or scheduler',()=>{
 assert.match(sql,/jobname='powerhouse-commercial-learning-v1'/);
 assert.match(sql,/cron\.alter_job/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(/i);
 assert.doesNotMatch(sql,/create\s+table\s/i);
 assert.match(sql,/job_id=>v_jobid/);
});
test('isolate fourteen existing, ordered stages with no duplicate dispatch per hourly cycle',()=>{
 const names=["powerhouse_refresh_relationship_revenue_v1","powerhouse_execute_relationship_research_v1","powerhouse_dispatch_relationship_public_research_v1","powerhouse_refresh_trigger_based_mkb_acquisition_v1","powerhouse_refresh_linkedin_company_growth_v1","powerhouse_refresh_growth_swarm_v1","powerhouse_materialize_growth_swarm_v1","powerhouse_activate_all_growth_plays_v2","powerhouse_execute_growth_play_actions_v1","powerhouse_dispatch_linkedin_sales_machine_v1","powerhouse_prepare_autonomous_outreach_v1","powerhouse_optimize_prepared_outreach_v1","powerhouse_dispatch_autonomous_outreach_v1","powerhouse_commercial_learning_cycle_v1"];
 for(const name of names)assert.match(sql,new RegExp("'"+name+"'"));
 assert.match(sql,/3\,6\,9\,12\,15\,18\,21\,24\,27\,30\,33\,36\,39\,42 \* \* \* \*/);
 assert.match(sql,/array_position\(array\[/);
 assert.equal(names.length,14);
});
test('fail-closed stage execution, no fictitious external proof',()=>{
 assert.match(sql,/security invoker/);
 assert.match(sql,/revoke all on function/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/INVALID_CANONICAL_COMMERCIAL_STAGE/);
 assert.match(sql,/pg_try_advisory_xact_lock/);
 assert.match(sql,/provider_delivery_proven',false/);
 assert.match(sql,/truth_boundary/);
});
test('independent per-stage receipt and contact enrichment ownership',()=>{
 assert.match(sql,/powerhouse_runtime_events/);
 assert.match(sql,/commercial-stage:/);
 assert.match(sql,/on conflict\(dedupe_key\)/);
 assert.match(sql,/contact_source_refresh_owner/);
 assert.match(sql,/powerhouse-identity-graph-v1/);
});

test('commercial lanes do not perform second full-contact refresh in timed job',()=>{
 assert.doesNotMatch(sql,/perform\s+public\.powerhouse_commercial_intelligence_context_stage_v1\(/);
 assert.doesNotMatch(sql,/perform\s+public\.powerhouse_refresh_all_connection_enrichment_v1\(/);
 assert.match(sql,/contact source refresh owner/i);
});
test('stage duration is isolated into fourteen separate cron invocations',()=>{
 assert.match(sql,/array_position\(array\[3,6,9,12,15,18,21,24,27,30,33,36,39,42\]/);
 assert.match(sql,/execute format\('select public\.%I\(\$1\)'/);
 assert.match(sql,/v_result->>'failure_count'/);
 assert.match(sql,/on conflict\(dedupe_key\) do update/);
});
