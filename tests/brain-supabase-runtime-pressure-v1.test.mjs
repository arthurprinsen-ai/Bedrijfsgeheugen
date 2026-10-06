import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync('supabase/migrations/20261006085416_stagger_cron_database_pressure_v1.sql','utf8');
const telemetry = fs.readFileSync('supabase/functions/bg-interactie/index.ts','utf8');
const bridge = fs.readFileSync('supabase/functions/supabase-migration-repair-bridge/index.ts','utf8');
const contentLoop = fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');

test('trusted Supabase repair transport remains IPv4 Supavisor session mode', () => {
  assert.ok(bridge.includes('aws-0-eu-central-1.pooler.supabase.com'));
  assert.ok(bridge.includes('url.port = "5432"'));
  assert.ok(bridge.includes('url.username = "postgres." + projectRef'));
  assert.ok(bridge.includes('transport: "supavisor-session-ipv4"'));
  assert.ok(bridge.includes('"db." + projectRef + ".supabase.co"'));
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
