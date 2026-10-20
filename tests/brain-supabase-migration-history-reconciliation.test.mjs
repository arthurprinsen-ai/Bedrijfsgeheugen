import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const migrations = resolve(import.meta.dirname, '../supabase/migrations');
const reconstructed = [
  "20261009133605",
  "20261009141054",
  "20261009155535",
  "20261009161226",
  "20261009190700",
  "20261009190719",
  "20261010070959",
  "20261010112728",
  "20261010113715",
  "20261011083139",
  "20261011091426",
  "20261011091442",
  "20261011111234",
  "20261011111605",
  "20261011111903",
  "20261011112359",
  "20261011112501",
  "20261011112535",
  "20261011112921",
  "20261011113700",
  "20261011122630",
  "20261012074151",
  "20261012091407",
  "20261013145222",
  "20261013145630",
  "20261013154426",
  "20261014114050",
  "20261014114212",
  "20261014115309",
  "20261014121343",
  "20261014122404",
  "20261014124203",
  "20261014124402",

];
const duplicateAliases = [
  "20261009160500_salesrobot_provider_proof_daily_assurance_v1.sql",
  "20261009185500_bedrijfslek_runtime_signal_cycle_v1.sql",
  "20261009190000_fix_noncommercial_conversion_projection_v1.sql",
  "20261009193000_filter_real_commercial_outcome_kpis_v1.sql",
  "20261010130000_publication_media_lineage_preservation.sql",
  "20261011120000_powerhouse_decision_evidence_json_normalize_v1.sql",
  "20261011171500_powerhouse_commercial_isolated_hourly_stages_v1.sql",
  "20261012093000_outreach_rejection_cross_channel_anti_repeat_4340.sql",
  "20261013132500_powerhouse_openai_content_governance_p0_4198.sql",
  "20261013160000_powerhouse_canonical_contact_authority_review_v1.sql"
];
const names = readdirSync(migrations).filter((name) => name.endsWith('.sql'));
test('all 43 provider-applied migration versions are present in source control', () => {
  assert.equal(reconstructed.length, 33);
  for (const version of reconstructed) {
    const matches = names.filter((name) => name.startsWith(version + '_'));
    assert.equal(matches.length, 1, 'exactly one file for applied version ' + version);
    const body = readFileSync(join(migrations, matches[0]), 'utf8');
    assert.ok(body.length > 10, 'SQL content present: ' + matches[0]);
  }
});
test('ten byte-identical but unrecorded historical aliases cannot be replayed', () => {
  assert.equal(duplicateAliases.length, 10);
  for (const alias of duplicateAliases) assert.ok(!names.includes(alias), alias);
});
test('each migration version maps to at most one filename', () => {
  const versions = names.map((name) => name.slice(0, 14));
  assert.equal(versions.length, new Set(versions).size);
});

test('native Supabase preview cannot fabricate a production cron owner', () => {
  const file = names.find((name) => name.startsWith('20261011083139_'));
  const sql = readFileSync(join(migrations, file), 'utf8');
  assert.match(sql, /FROM cron\.job WHERE jobid=140;\s+IF NOT FOUND THEN/);
  assert.match(sql, /IF EXISTS \(\s*SELECT 1 FROM cron\.job\s+WHERE jobname LIKE 'powerhouse-content-orchestrator%'\s*\) THEN\s+RAISE EXCEPTION 'CANONICAL_CONTENT_EXECUTOR_IDENTITY_MISMATCH'/);
  assert.match(sql, /CANONICAL_CONTENT_EXECUTOR_ABSENT_IN_PREVIEW_NO_OP/);
  assert.match(sql, /IF v_job\.jobname IS DISTINCT FROM 'powerhouse-content-orchestrator-daily-v1'/);
  assert.match(sql, /trim\(v_job\.command\) IS DISTINCT FROM\s+'select public\.powerhouse_content_closed_loop_tick_v1\(\);'/);
  assert.match(sql, /cron\.alter_job\(v_job\.jobid, schedule := '27 \* \* \* \*', active := true\)/);
  assert.doesNotMatch(sql, /cron\.schedule\s*\(/i, 'do not create a second production scheduler in preview');
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.powerhouse_content_closed_loop_tick_v1\(timestamptz\)\s+FROM PUBLIC, anon, authenticated/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.powerhouse_content_closed_loop_tick_v1\(timestamptz\)\s+TO service_role/i);
  const gate = readFileSync(new URL('../scripts/brain/check_powerhouse_supabase_security.py', import.meta.url), 'utf8');
  assert.doesNotMatch(gate, /"supabase\/migrations\/20261011083139_powerhouse_content_reconciliation_isolation_always_on_v1\.sql"\s*:/,
    'no security exemption for the adapted SQL: normal SECURITY DEFINER gate is mandatory');
});


test('identity graph migrations never alter an absent production-only owner in preview', () => {
  const versions = ['20261011111234', '20261011111903'];
  for (const version of versions) {
    const name = names.find((n) => n.startsWith(version + '_'));
    const sql = readFileSync(join(migrations, name), 'utf8');
    assert.match(sql, /DO \$identity_owner_guard\$/);
    assert.match(sql, /WHERE jobname = 'powerhouse-identity-graph-v1';\s+IF NOT FOUND THEN/);
    assert.match(sql, /WHERE jobname LIKE 'powerhouse-identity-graph%'\s*\) THEN\s+RAISE EXCEPTION 'CANONICAL_IDENTITY_EXECUTOR_IDENTITY_MISMATCH'/);
    assert.match(sql, /CANONICAL_IDENTITY_EXECUTOR_ABSENT_IN_PREVIEW_NO_OP/);
    assert.match(sql, /PERFORM cron\.alter_job\(\s*job_id := v_jobid/);
    assert.doesNotMatch(sql, /cron\.schedule\s*\(/i, 'no new identity-graph job');
  }
});


test('later identity-owner migrations cannot create or rewrite phantom production jobs', () => {
  const versions = ['20261011112359', '20261011112921', '20261013145630'];
  for (const version of versions) {
    const name = names.find((n) => n.startsWith(version + '_'));
    const sql = readFileSync(join(migrations, name), 'utf8');
    assert.match(sql, /powerhouse-identity-graph-v1/);
    assert.match(sql, /CANONICAL_IDENTITY_EXECUTOR_IDENTITY_MISMATCH/);
    assert.match(sql, /CANONICAL_IDENTITY_EXECUTOR_ABSENT_IN_PREVIEW_NO_OP/);
    assert.doesNotMatch(sql, /cron\.schedule\s*\(/i);
  }
  for (const version of ['20261011112359', '20261011112921']) {
    const sql = readFileSync(join(migrations, names.find((n) => n.startsWith(version + '_'))), 'utf8');
    assert.match(sql, /SELECT jobid INTO v_jobid FROM cron\.job/);
    assert.match(sql, /PERFORM cron\.alter_job/);
    assert.doesNotMatch(sql, /^select cron\.alter_job/im);
  }
});
