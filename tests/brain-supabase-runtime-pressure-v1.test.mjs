import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync('supabase/migrations/20261006085416_stagger_cron_database_pressure_v1.sql','utf8');
const telemetry = fs.readFileSync('supabase/functions/bg-interactie/index.ts','utf8');
const bridge = fs.readFileSync('supabase/functions/supabase-migration-repair-bridge/index.ts','utf8');
const contentLoop = fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
const orchestrator = fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const repairWorkflow = fs.readFileSync('.github/workflows/supabase-supported-migration-repair-3742.yml','utf8');

test('trusted repair workflow rejects direct IPv6 before Supabase CLI execution', () => {
  assert.match(repairWorkflow, /supavisor-session-ipv4/);
  assert.match(repairWorkflow, /DIRECT_IPV6_ROUTE_FORBIDDEN/);
  assert.ok(repairWorkflow.includes('aws-0-eu-central-1.pooler.supabase.com'));
  assert.match(repairWorkflow, /SESSION_POOLER_PORT_REQUIRED/);
  assert.match(repairWorkflow, /SSLMODE_REQUIRE_REQUIRED/);
  assert.match(repairWorkflow, /getent ahostsv4/);
});

test('trusted Supabase repair transport remains IPv4 Supavisor session mode', () => {
  assert.match(bridge,/const sessionPoolerHost = "aws-0-eu-central-1\.pooler\.supabase\.com";/);
  assert.ok(bridge.includes('url.port = "5432"'));
  assert.ok(bridge.includes('url.username = "postgres." + projectRef'));
  assert.ok(bridge.includes('transport: "supavisor-session-ipv4"'));
  assert.ok(bridge.includes('"db." + projectRef + ".supabase.co"'));
  assert.ok(bridge.includes('url.searchParams.set("sslmode", "require")'));
  assert.ok(bridge.includes('const dbUrl = sessionPoolerUrl(directDbUrl)'));
  assert.ok(!bridge.includes('db_url: directDbUrl'), 'direct IPv6 credential source must never be returned to GitHub');
});

test('cron pressure recovery uses stable job names and removes deterministic fan-out', () => {
  assert.match(migration, /if v_jobid is not null then/);
  assert.match(migration, /cron\.alter_job/);
  assert.doesNotMatch(migration, /raise exception 'CRON_PRESSURE_CONTRACT_JOB_MISSING/);
  assert.doesNotMatch(migration, /update\s+cron\.job/i);

  const rows = [...migration.matchAll(/\('([^']+)',\s*'([^']+)'\)/g)].map((m) => ({ name:m[1], schedule:m[2] }));
  assert.equal(rows.length, 26);

  const recurring = rows.filter(({schedule}) => schedule.split(/\s+/)[1] === '*');
  const countAtMinute = (minute) => recurring.filter(({schedule}) => {
    const field = schedule.split(/\s+/)[0];
    return field.split(',').map(Number).includes(minute);
  }).length;

  const maxTargetFanout = Math.max(...Array.from({length:60}, (_, minute) => countAtMinute(minute)));
  assert.ok(maxTargetFanout <= 2, 'staggered recurring pressure jobs must add at most two starts in one minute');
  assert.ok(maxTargetFanout + 2 <= 4, 'including the two intentional every-minute workers, planned recurring fanout must stay <= 4');
});

test('interaction telemetry cannot amplify a PostgREST outage', () => {
  assert.match(telemetry, /TELEMETRY_DB_TIMEOUT_MS = 2_500/);
  assert.match(telemetry, /TELEMETRY_BREAKER_MS = 30_000/);
  assert.match(telemetry, /DATA_API_CIRCUIT_OPEN/);
  assert.match(telemetry, /DATA_API_UNAVAILABLE/);
  assert.match(telemetry, /status: 202/);
  assert.match(telemetry, /AbortSignal\.timeout\(TELEMETRY_DB_TIMEOUT_MS\)/);
  assert.doesNotMatch(telemetry, /status:\s*500/);
});

test('content-loop auth distinguishes infrastructure failure from credential failure', () => {
  assert.match(contentLoop, /CONTENT_LOOP_AUTH_LOOKUP_FAILED/);
  assert.match(contentLoop, /AUTH_SECRET_LOOKUP_FAILED/);
  assert.match(contentLoop, /CONTENT_LOOP_AUTH_SECRET_EMPTY/);
  assert.match(contentLoop, /AUTH_SECRET_EMPTY/);
  assert.match(contentLoop, /TOKEN_REQUIRED/);
  assert.match(contentLoop, /TOKEN_MISMATCH/);
  assert.match(contentLoop, /clean\(req\.headers\.get\('x-powerhouse-token'\)\)/);
  assert.doesNotMatch(contentLoop, /error:\s*'UNAUTHORIZED'/);
});

const stateMigration = fs.readFileSync('supabase/migrations/20261006090209_normalize_runtime_event_degraded_state_v1.sql','utf8');

test('runtime event writers use only canonical lifecycle states', () => {
  assert.ok(stateMigration.includes('powerhouse_commercial_intelligence_heartbeat_v1'));
  assert.ok(stateMigration.includes('powerhouse_commercial_heartbeat_v1'));
  assert.ok(stateMigration.includes('powerhouse_revenue_event_spine_cycle_v1'));
  assert.equal((stateMigration.match(/else 'error' end/g) || []).length, 3);
  assert.equal((stateMigration.match(/else 'degraded' end/g) || []).length, 0);
});

test('orchestrator avoids blocking nested Edge Function preflight on the critical path', () => {
  assert.doesNotMatch(orchestrator, /runDailyCoreStages/);
  assert.doesNotMatch(orchestrator, /powerhouse-blog-readback/);
  assert.match(orchestrator, /powerhouse_materialize_source_backed_channel_candidates_v1/);
  assert.match(orchestrator, /powerhouse_daily_runs/);
});


test('content loop bounds nested-call memory and direct DB pool size',()=>{
  const loop=fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
  assert.match(loop,/postgres\(dbPoolerUrl\(\),\{max:2,/);
  assert.match(loop,/AbortSignal\.timeout\(timeoutMs\)/);
  assert.match(loop,/LOOP_LEASE_MS = 240_000/);
  assert.match(loop,/claimLoopLease\(runDate, leaseHolder\)/);
  assert.match(loop,/reason:'ALREADY_RUNNING'/);
  assert.doesNotMatch(loop,/for \(let i = 0; i < 5; i\+\+\)/);
  assert.equal((loop.match(/invoke\(url, expected, 'powerhouse-content-orchestrator'/g) || []).length,1);
});

test('orchestrator avoids wide payload reads on the hot path',()=>{
  const orchestrator=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  assert.match(orchestrator,/postgres\(dbPoolerUrl\(\),\{max:2,/);
  assert.doesNotMatch(orchestrator,/powerhouse_daily_runs'\)\.select\('\*'\)/);
  assert.doesNotMatch(orchestrator,/powerhouse_channel_decisions'\)\.select\('\*'\)/);
  assert.doesNotMatch(orchestrator,/content_publication_obligations'\)\.select\('\*'\)/);
  assert.doesNotMatch(orchestrator,/powerhouse_media_proof_evidence_v1'\)\.select\('\*'\)/);
  assert.doesNotMatch(orchestrator,/powerhouse_instagram_daily_winners_v1'\)\.select\('\*'\)/);
  assert.match(orchestrator,/select\('channel,priority,rationale,delivery_evidence'\)/);
});

test('publisher separates audit, cockpit and dispatch critical paths', () => {
  const loop = fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
  const publisher = fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
  assert.match(loop, /powerhouse-social-publisher', \{ runDate, mode: 'publish_only' \}/);
  assert.match(loop, /powerhouse-social-publisher', \{ runDate, mode: 'audit_only' \}/);
  assert.match(loop, /powerhouse-social-publisher', \{ runDate, mode: 'cockpit_autopilot' \}/);
  assert.match(publisher, /if \(mode === 'cockpit_autopilot'\)/);
  assert.match(publisher, /const cockpit_autopilot: any\[\] = \[\]/);
  assert.doesNotMatch(publisher, /const cockpit_autopilot = publishOnly \? \[\] : await runLinkedInCockpitAutopilot/);
});


test('direct DB adapters normalize JSONB strings before spread and write',()=>{
  for(const source of [contentLoop,orchestrator]){
    assert.match(source,/function normalizeJsonValue\(value:any\)/);
    assert.match(source,/JSON\.parse\(raw\)/);
    assert.match(source,/function normalizeRowJson\(table:string,row:any\)/);
    assert.match(source,/normalizeJsonValue\(value\)\?\?null/);
    assert.match(source,/rows\.map\(\(row:any\)=>normalizeRowJson\(this\.table,row\)\)/);
    assert.match(source,/normalizeJsonValue\(rows\?\.\[0\]\?\.result\?\?null\)/);
  }
});

test('publication delivery normalizes legacy JSONB strings before merge', () => {
  const publisher = fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
  const blogQueue = fs.readFileSync('supabase/functions/powerhouse-blog-queue/index.ts','utf8');
  const migration = fs.readFileSync('supabase/migrations/20261006095958_normalize_publication_evidence_objects_v1.sql','utf8');
  assert.match(publisher, /delivery_evidence: jsonObject\(row\.delivery_evidence\)/);
  assert.match(publisher, /generation_evidence: jsonObject\(artifact\.generation_evidence\)/);
  assert.match(blogQueue, /const deliveryEvidence=jsonObject\(d\.delivery_evidence\)/);
  assert.match(blogQueue, /const generationEvidence=jsonObject\(a\.generation_evidence\)/);
  assert.match(migration, /powerhouse_jsonb_object_v1/);
  assert.match(migration, /powerhouse_reconcile_content_outcomes_v1/);
  assert.match(migration, /record_content_publication_state/);
});

test('production pressure recovery mirrors the complete applied migration lineage', () => {
  const expected = [
    '20261006085416_stagger_cron_database_pressure_v1.sql',
    '20261006090209_normalize_runtime_event_degraded_state_v1.sql',
    '20261006091309_bound_runtime_event_hotpaths_and_identity_sync_v1.sql',
    '20261006091918_bound_loop_assurance_cron_history_scan_v1.sql',
    '20261006092057_bound_heavy_maintenance_pressure_v2.sql',
    '20261006092322_repair_revenue_snapshot_projection_v3.sql',
    '20261006092411_align_revenue_snapshot_v3_dependencies.sql',
    '20261006093306_runtime_pressure_maintenance_v2.sql',
    '20261006093340_materialize_revenue_snapshot_from_canonical_nba_v1.sql',
    '20261006093529_remove_snapshot_truncate_lock_contention_v1.sql',
    '20261006093653_canonical_content_loop_scheduler_auth_authority_v1.sql',
    '20261006094410_canonicalize_person_intelligence_alias_joins_v1.sql',
    '20261006095118_remove_account_strategy_correlated_committee_scan_v1.sql',
    '20261006095838_cache_research_freshness_and_split_one_brain_v1.sql',
    '20261006095958_normalize_publication_evidence_objects_v1.sql',
  ];
  for (const name of expected) {
    assert.ok(fs.existsSync('supabase/migrations/' + name), 'missing mirrored production migration: ' + name);
  }
});

test('loop assurance reads a bounded cron history tail once', () => {
  const sql = fs.readFileSync('supabase/migrations/20261006091918_bound_loop_assurance_cron_history_scan_v1.sql','utf8');
  assert.match(sql, /max\(runid\)/i);
  assert.match(sql, /20000/);
  assert.match(sql, /jsonb_object_agg/i);
  assert.match(sql, /v_cron_latest/);
});

test('final revenue snapshot refresh avoids truncate lock contention', () => {
  const sql = fs.readFileSync('supabase/migrations/20261006093529_remove_snapshot_truncate_lock_contention_v1.sql','utf8');
  assert.match(sql, /delete from public\.powerhouse_revenue_command_center_snapshot_v1/i);
  assert.doesNotMatch(sql, /truncate table public\.powerhouse_revenue_command_center_snapshot_v1/i);
});

test('research freshness is cached and one-brain maintenance is split by minute', () => {
  const sql = fs.readFileSync('supabase/migrations/20261006095838_cache_research_freshness_and_split_one_brain_v1.sql','utf8');
  assert.match(sql, /powerhouse_freshness_contradiction_cache_v1/);
  assert.match(sql, /powerhouse_refresh_freshness_contradiction_cache_v1/);
  assert.match(sql, /powerhouse-one-brain-reconcile-v1/);
  assert.match(sql, /powerhouse-linkedin-oauth-resume-reconcile-v1/);
  assert.match(sql, /powerhouse-regression-stage-evidence-v1/);
  assert.match(sql, /powerhouse-seo-assurance-v1/);
  assert.match(sql, /13,43 \* \* \* \*/);
  assert.match(sql, /18,48 \* \* \* \*/);
  assert.match(sql, /23,53 \* \* \* \*/);
  assert.match(sql, /28,58 \* \* \* \*/);
});

test('migration history lock matches the recovered production ledger', () => {
  const lock = JSON.parse(fs.readFileSync('supabase/migration-history.lock.json','utf8'));
  const identities = new Map(lock.applied.map((x) => [x.version, x.name]));
  assert.equal(lock.production_ledger_count, 583);
  const expected = new Map([
    ['20261006085416','stagger_cron_database_pressure_v1'],
    ['20261006090209','normalize_runtime_event_degraded_state_v1'],
    ['20261006091309','bound_runtime_event_hotpaths_and_identity_sync_v1'],
    ['20261006091918','bound_loop_assurance_cron_history_scan_v1'],
    ['20261006092057','bound_heavy_maintenance_pressure_v2'],
    ['20261006092322','repair_revenue_snapshot_projection_v3'],
    ['20261006092411','align_revenue_snapshot_v3_dependencies'],
    ['20261006093306','runtime_pressure_maintenance_v2'],
    ['20261006093340','materialize_revenue_snapshot_from_canonical_nba_v1'],
    ['20261006093529','remove_snapshot_truncate_lock_contention_v1'],
    ['20261006093653','canonical_content_loop_scheduler_auth_authority_v1'],
    ['20261006094410','canonicalize_person_intelligence_alias_joins_v1'],
    ['20261006095118','remove_account_strategy_correlated_committee_scan_v1'],
    ['20261006095838','cache_research_freshness_and_split_one_brain_v1'],
    ['20261006095958','normalize_publication_evidence_objects_v1'],
  ]);
  for (const [version,name] of expected) assert.equal(identities.get(version), name);
});

