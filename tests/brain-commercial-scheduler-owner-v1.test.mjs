import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath = 'supabase/migrations/20261005141727_retire_secondary_commercial_scheduler_owner_v1.sql';

test('legacy commercial scheduler owner is retired without disabling the canonical heartbeat', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  assert.match(sql, /jobname\s*=\s*'powerhouse-one-commercial-loop-daily-v1'/i);
  assert.match(sql, /cron\.unschedule\('powerhouse-one-commercial-loop-daily-v1'\)/i);
  assert.match(sql, /\band\s+active\b/i);

  assert.doesNotMatch(
    sql,
    /cron\.unschedule\('powerhouse-one-commercial-heartbeat-v1'\)/i,
    'canonical commercial heartbeat must remain the sole active orchestration owner',
  );
});

test('scheduler retirement migration stays idempotent and bounded to the duplicate owner', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  const unschedules = [...sql.matchAll(/cron\.unschedule\('([^']+)'\)/gi)].map(match => match[1]);
  assert.deepEqual(unschedules, ['powerhouse-one-commercial-loop-daily-v1']);
  assert.match(sql, /if\s+exists\s*\(/i);
});
