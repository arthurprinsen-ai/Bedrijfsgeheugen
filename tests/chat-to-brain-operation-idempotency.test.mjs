import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260831_brain_operation_registry.sql';

test('P0 operation registry migration exists and encodes canonical idempotency contract', () => {
  assert.equal(fs.existsSync(migrationPath), true, `${migrationPath} must exist`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /create table if not exists public\.brain_operations/i);
  assert.match(sql, /unique\s*\(\s*capability_id\s*,\s*operation_type\s*,\s*idempotency_key\s*\)/i);
  assert.match(sql, /payload_sha256/i);
  assert.match(sql, /IDEMPOTENCY_PAYLOAD_CONFLICT/);
  assert.match(sql, /RESULT_UNKNOWN/);
  assert.match(sql, /PLANNED/);
  assert.match(sql, /DISPATCHED/);
  assert.match(sql, /OBSERVED_SUCCEEDED/);
  assert.match(sql, /VERIFIED/);
  assert.match(sql, /FAILED/);
  assert.match(sql, /COMPENSATED/);
});

test('operation creation contract returns an existing operation for same logical key and rejects payload drift', () => {
  assert.equal(fs.existsSync(migrationPath), true, `${migrationPath} must exist`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /create or replace function public\.brain_create_operation/i);
  assert.match(sql, /on conflict\s*\(\s*capability_id\s*,\s*operation_type\s*,\s*idempotency_key\s*\)\s*do nothing/i);
  assert.match(sql, /raise exception 'IDEMPOTENCY_PAYLOAD_CONFLICT'/i);
});
