import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../supabase/migrations/20261105125354_content_outcome_measurement_v1.sql', import.meta.url), 'utf8');
const lock = JSON.parse(await readFile(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));

test('measurement writes only through the existing state function and never sets LEARNED', () => {
  assert.ok(sql.includes('record_content_publication_state'));
  assert.ok(!/'LEARNED'/.test(sql), 'Measurement must never mark content as learned');
  assert.ok(/'MEASURED'/.test(sql));
});

test('thin data is recorded honestly instead of counted as success', () => {
  assert.ok(sql.includes('INSUFFICIENT_DATA'));
  assert.ok(sql.includes('INCOMPLETE_COVERAGE'));
  assert.ok(sql.includes('Meting is te dun voor een leerregel'));
});

test('owner stays the existing content tick; no second scheduler', () => {
  assert.ok(!/cron\.schedule/i.test(sql), 'No new cron job may be created');
  assert.ok(sql.includes('powerhouse_content_closed_loop_tick_v1'));
  assert.ok(sql.includes('CONTENT_OUTCOME_MEASURE_ISOLATED'));
  assert.ok(sql.includes('powerhouse_reconcile_content_outcomes_v1'), 'Existing reconcile step must stay in the tick');
  assert.ok(sql.includes('CONTENT_LOOP_SCHEDULER_TOKEN_UNAVAILABLE'), 'Auth failures must stay uncaught');
});

test('measurement function is not callable by public roles', () => {
  assert.ok(/revoke all on function public\.powerhouse_measure_content_outcomes_v1[\s\S]*from public, anon, authenticated/i.test(sql));
});

test('lock carries the migration with exact version and name', () => {
  assert.ok(lock.applied.some(x => x.version === '20261105125354' && x.name === 'content_outcome_measurement_v1'));
});
