import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Guard for supabase/migrations/20261027195341_revenue_learning_evidence_timestamp_guard.sql
// Problem: the Edge store sends a fresh updated_at on every evidence upsert, so identical replays
// look like material changes and re-open already evaluated evidence (list_due_evidence).
const MIGRATION = new URL('../supabase/migrations/20261027195341_revenue_learning_evidence_timestamp_guard.sql', import.meta.url);
const sql = readFileSync(MIGRATION, 'utf8');

test('guard function compares business data only and never mutates other columns', () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.revenue_learning_evidence_preserve_updated_at\(\)\s+RETURNS trigger/);
  assert.match(sql, /SECURITY INVOKER SET search_path = ''/);
  const excluded = sql.match(/- 'updated_at' - 'created_at' - 'evaluated_at'/g) || [];
  assert.equal(excluded.length, 2, 'both NEW and OLD must be compared with exactly updated_at, created_at and evaluated_at removed');
  assert.match(sql, /NEW\.updated_at := OLD\.updated_at;/);
  assert.doesNotMatch(sql, /NEW\.(evaluated_at|created_at)\s*:=/);
  assert.match(sql, /RETURN NEW;/, 'must return NEW so .upsert(...).select().single() keeps working');
});

test('trigger is a row-level BEFORE UPDATE trigger and creation is idempotent', () => {
  assert.match(sql, /CREATE TRIGGER revenue_learning_evidence_preserve_updated_at_bu\s+BEFORE UPDATE ON public\.revenue_learning_evidence\s+FOR EACH ROW/);
  assert.match(sql, /IF NOT EXISTS \(\s*SELECT 1 FROM pg_trigger/);
});

test('migration does not backfill, delete or rewrite existing evidence rows', () => {
  const code = sql.replace(/--.*$/gm, '');
  assert.doesNotMatch(code, /\bDELETE\s+FROM\b|\bINSERT\s+INTO\b|\bTRUNCATE\b|\bDROP\b|(^|[;\s])UPDATE\s+public\./i);
});

// Behavioural proof against a real PostgreSQL. Runs only when REVENUE_EVIDENCE_TEST_DATABASE_URL points at a
// throwaway database. Everything happens in one transaction that is rolled back, and it aborts if the table
// already exists, so it can never touch real evidence rows.
const dbUrl = process.env.REVENUE_EVIDENCE_TEST_DATABASE_URL;
const psqlOk = !!dbUrl && spawnSync('psql', ['--version']).status === 0;

test('identical upsert keeps updated_at, real change advances it, evaluated_at is never touched', { skip: psqlOk ? false : 'set REVENUE_EVIDENCE_TEST_DATABASE_URL (throwaway PostgreSQL) and install psql to run' }, () => {
  const script = `
BEGIN;
SET LOCAL TIME ZONE 'UTC';
CREATE TABLE public.revenue_learning_evidence (
  tenant_id text NOT NULL, evidence_id text NOT NULL, content_id text NOT NULL, exposures numeric,
  attributes jsonb NOT NULL DEFAULT '{}', source_refs jsonb NOT NULL DEFAULT '[]',
  evaluated_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, evidence_id));
\\i ${fileURLToPath(MIGRATION)}
\\i ${fileURLToPath(MIGRATION)}
INSERT INTO public.revenue_learning_evidence (tenant_id,evidence_id,content_id,exposures,evaluated_at,updated_at)
  VALUES ('t','e1','c',10,'2026-02-01','2026-01-01');
-- what PostgREST .upsert() sends: every column SET from EXCLUDED, including a new updated_at
INSERT INTO public.revenue_learning_evidence AS t (tenant_id,evidence_id,content_id,exposures,updated_at)
  VALUES ('t','e1','c',10,'2026-06-01')
  ON CONFLICT (tenant_id,evidence_id) DO UPDATE SET content_id=excluded.content_id, exposures=excluded.exposures, updated_at=excluded.updated_at;
SELECT 'identical_updated_at=' || (SELECT updated_at AT TIME ZONE 'UTC' FROM public.revenue_learning_evidence);
INSERT INTO public.revenue_learning_evidence AS t (tenant_id,evidence_id,content_id,exposures,updated_at)
  VALUES ('t','e1','c',11,'2026-07-01')
  ON CONFLICT (tenant_id,evidence_id) DO UPDATE SET content_id=excluded.content_id, exposures=excluded.exposures, updated_at=excluded.updated_at;
SELECT 'changed_updated_at=' || (SELECT updated_at AT TIME ZONE 'UTC' FROM public.revenue_learning_evidence);
SELECT 'evaluated_at=' || (SELECT evaluated_at AT TIME ZONE 'UTC' FROM public.revenue_learning_evidence);
ROLLBACK;
`;
  const r = spawnSync('psql', [dbUrl, '-X', '-A', '-t', '-q', '-v', 'ON_ERROR_STOP=1'], { input: script, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const out = r.stdout;
  assert.match(out, /identical_updated_at=2026-01-01 00:00:00/);
  assert.match(out, /changed_updated_at=2026-07-01 00:00:00/);
  assert.match(out, /evaluated_at=2026-02-01 00:00:00/);
});
