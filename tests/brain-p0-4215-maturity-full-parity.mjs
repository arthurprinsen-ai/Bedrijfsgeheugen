// P0 #4215: fail-closed, full-row semantic parity on an isolated preview with real tenant coverage.
// Run from repository root, against a PRE-MIGRATION view with seeded, legally permitted test data:
// P0_4215_PARITY_ENV=isolated-preview P0_4215_PREVIEW_PROJECT_REF=<preview-ref>
// P0_4215_PREVIEW_DATABASE_URL=<preview-connection-url> node tests/brain-p0-4215-maturity-full-parity.mjs
// This script NEVER commits or replaces the canonical view. No customer values are printed.
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {URL} from 'node:url';

const name = 'powerhouse_action_evidence_maturity_v1';
const migrationFile = 'supabase/migrations/20261020163500_p0_4215_evidence_forecast_direct_lookup.sql';
const databaseUrl = process.env.P0_4215_PREVIEW_DATABASE_URL;
const previewRef = process.env.P0_4215_PREVIEW_PROJECT_REF;
const expectedProductionRef = 'adhjwmvyoixzjtmiroln';

function refuse(reason) {
  process.stderr.write('P0_4215_FULL_PARITY_BLOCKED: ' + reason + '\n');
  process.exit(1);
}
if (process.env.P0_4215_PARITY_ENV !== 'isolated-preview') refuse('isolated-preview acknowledgement required');
if (!previewRef || !/^[a-z0-9]{15,30}$/.test(previewRef) || previewRef === expectedProductionRef) {
  refuse('a distinct and explicit Supabase preview project ref is required');
}
if (!databaseUrl) refuse('missing preview database URL');
let parsed;
try { parsed = new URL(databaseUrl); } catch { refuse('invalid connection URL'); }
if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) refuse('Postgres connection required');
if (!decodeURIComponent(parsed.username).includes(previewRef) && !parsed.hostname.includes(previewRef)) {
  refuse('connection URL cannot be tied to the exact preview ref');
}
const source = readFileSync(migrationFile, 'utf8');
const startTag = 'CREATE OR REPLACE VIEW public.' + name + ' WITH (security_invoker=true) AS';
const start = source.indexOf(startTag);
const end = source.indexOf('\n-- Restore existing tenant-safe internal view boundary', start);
if (start < 0 || end <= start) refuse('candidate migration cannot be parsed exactly');
const candidateDefinition = source.slice(start, end).trim().replace(
  startTag, 'CREATE TEMP VIEW p0_4215_maturity_candidate WITH (security_invoker=true) AS'
);
if (!candidateDefinition.endsWith(';')) refuse('candidate SELECT not terminated');

// REPEATABLE READ keeps both readings on the same immutable snapshot.
// Only pg_temp objects are created, and the transaction is rolled back.
const sql = [
  'BEGIN ISOLATION LEVEL REPEATABLE READ;',
  "SET LOCAL statement_timeout = '180s';",
  "SET LOCAL lock_timeout = '2s';",
  "SET LOCAL search_path = public, pg_temp;",
  'DO $baseline$',
  'BEGIN',
  " IF position('LEFT JOIN powerhouse_commercial_next_best_action_v4 nba' IN",
  "    pg_get_viewdef('public.powerhouse_action_evidence_maturity_v1'::regclass,true)) = 0 THEN",
  "   RAISE EXCEPTION 'BASELINE_IS_NOT_PRE_MIGRATION_VIEW';",
  ' END IF;',
  'END $baseline$;',
  'CREATE TEMP TABLE p0_4215_old_rows ON COMMIT DROP AS',
  '  SELECT * FROM public.powerhouse_action_evidence_maturity_v1;',
  candidateDefinition,
  'CREATE TEMP TABLE p0_4215_new_rows ON COMMIT DROP AS',
  '  SELECT * FROM pg_temp.p0_4215_maturity_candidate;',
  'DO $parity$',
  'DECLARE',
  '  old_schema jsonb;',
  '  new_schema jsonb;',
  '  old_count bigint;',
  '  new_count bigint;',
  '  tenant_count bigint;',
  '  mismatch_count bigint;',
  'BEGIN',
  ' SELECT jsonb_agg(jsonb_build_array(a.attnum,a.attname,format_type(a.atttypid,a.atttypmod)) ORDER BY a.attnum)',
  ' INTO old_schema FROM pg_attribute a',
  " WHERE a.attrelid='pg_temp.p0_4215_old_rows'::regclass AND a.attnum>0 AND NOT a.attisdropped;",
  ' SELECT jsonb_agg(jsonb_build_array(a.attnum,a.attname,format_type(a.atttypid,a.atttypmod)) ORDER BY a.attnum)',
  ' INTO new_schema FROM pg_attribute a',
  " WHERE a.attrelid='pg_temp.p0_4215_new_rows'::regclass AND a.attnum>0 AND NOT a.attisdropped;",
  " IF old_schema IS DISTINCT FROM new_schema OR jsonb_array_length(old_schema) <> 51 THEN",
  "   RAISE EXCEPTION 'FULL_COLUMN_SCHEMA_MISMATCH_OR_NOT_51';",
  ' END IF;',
  ' SELECT count(*) INTO old_count FROM pg_temp.p0_4215_old_rows;',
  ' SELECT count(*) INTO new_count FROM pg_temp.p0_4215_new_rows;',
  " IF old_count=0 OR old_count<>new_count THEN RAISE EXCEPTION 'EMPTY_OR_ROW_COUNT_MISMATCH'; END IF;",
  ' SELECT count(DISTINCT t.tenant_id) INTO tenant_count',
  ' FROM pg_temp.p0_4215_old_rows o CROSS JOIN LATERAL unnest(o.tenant_ids) AS t(tenant_id);',
  " IF tenant_count < 2 THEN RAISE EXCEPTION 'AT_LEAST_TWO_DISTINCT_REAL_TEST_TENANTS_REQUIRED'; END IF;",
  ' SELECT count(*) INTO mismatch_count FROM (',
  '  (SELECT to_jsonb(o) AS entire_row FROM pg_temp.p0_4215_old_rows o',
  '   EXCEPT ALL SELECT to_jsonb(n) FROM pg_temp.p0_4215_new_rows n)',
  '  UNION ALL',
  '  (SELECT to_jsonb(n) FROM pg_temp.p0_4215_new_rows n',
  '   EXCEPT ALL SELECT to_jsonb(o) FROM pg_temp.p0_4215_old_rows o)',
  ' ) diffs;',
  " IF mismatch_count<>0 THEN RAISE EXCEPTION 'FULL_51_COLUMN_BIDIRECTIONAL_ROW_PARITY_FAILED: % rows',mismatch_count; END IF;",
  ' SELECT count(*) INTO mismatch_count FROM (',
  '  WITH previous AS (',
  '   SELECT t.tenant_id, channel, status, evidence_maturity, calibration_eligible,',
  '          count(*) AS rows_count, sum(realized_revenue_eur) AS realized_revenue_eur,',
  '          sum(verified_net_realized_value_eur) AS verified_net_eur,',
  '          sum(comparable_outcomes) AS comparable_outcome_total',
  '   FROM pg_temp.p0_4215_old_rows o CROSS JOIN LATERAL unnest(o.tenant_ids) AS t(tenant_id)',
  '   GROUP BY t.tenant_id,channel,status,evidence_maturity,calibration_eligible',
  '  ), proposed AS (',
  '   SELECT t.tenant_id, channel, status, evidence_maturity, calibration_eligible,',
  '          count(*) AS rows_count, sum(realized_revenue_eur) AS realized_revenue_eur,',
  '          sum(verified_net_realized_value_eur) AS verified_net_eur,',
  '          sum(comparable_outcomes) AS comparable_outcome_total',
  '   FROM pg_temp.p0_4215_new_rows n CROSS JOIN LATERAL unnest(n.tenant_ids) AS t(tenant_id)',
  '   GROUP BY t.tenant_id,channel,status,evidence_maturity,calibration_eligible',
  '  )',
  '  SELECT * FROM (SELECT * FROM previous EXCEPT ALL SELECT * FROM proposed) a',
  '  UNION ALL',
  '  SELECT * FROM (SELECT * FROM proposed EXCEPT ALL SELECT * FROM previous) b',
  ' ) tenant_aggregate_diffs;',
  " IF mismatch_count<>0 THEN RAISE EXCEPTION 'TENANT_CHANNEL_AND_FINANCIAL_AGGREGATE_PARITY_FAILED'; END IF;",
  " RAISE NOTICE 'P0_4215_FULL_PARITY_PASSED: % rows; 51 fields; % tenants; 0 diffs (preview only)',old_count,tenant_count;",
  'END $parity$;',
  'ROLLBACK;'
].join('\n');
const proc = spawnSync('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-q', '-d', databaseUrl], {
  input: sql, encoding: 'utf8', timeout: 900000, maxBuffer: 1024 * 1024,
  env: {...process.env, PGCONNECT_TIMEOUT:'10', PGOPTIONS:'-c application_name=p0_4215_preview_parity'}
});
if (proc.error) refuse(proc.error.code === 'ENOENT' ? 'psql client not installed' : proc.error.message);
if (proc.status !== 0) refuse((proc.stderr || 'SQL execution failed').slice(-2500));
// psql does not print rows; the script above intentionally emits only aggregate acceptance notices.
const receipt = (proc.stderr || '').split('\n').filter(line => line.includes('P0_4215_FULL_PARITY_PASSED')).join('\n');
if (!receipt) refuse('missing positive SQL parity receipt');
process.stdout.write(receipt + '\n');
