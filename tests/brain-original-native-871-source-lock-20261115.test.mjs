import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const migrationPath='../supabase/migrations/20261115170000_outcome_memory_source_readback_truth_v1.sql';
const migration=readFileSync(new URL(migrationPath,import.meta.url),'utf8');

test('native provider-applied Outcome Memory migration #871 enters original lock once',()=>{
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.ok(lock.applied.length>=871,'historical native 871 prefix must survive later provider-applied versions');
  assert.deepEqual(lock.applied[870],{
    version:'20261115170000',name:'outcome_memory_source_readback_truth_v1'
  });
  assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
  assert.equal(lock.applied[869].version,'20261115162500');
  assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-15T16:13:57.369674Z'));
});

test('native original #871 is a real security-invoker source-gated VIEW, not a dummy applied identity',()=>{
  assert.match(migration,/CREATE OR REPLACE VIEW public\.powerhouse_outcome_memory_v1/i);
  assert.match(migration,/security_invoker=true/i);
  assert.match(migration,/source_event_id/);
  assert.match(migration,/source_dedupe_key/);
  assert.match(migration,/REVOKE ALL ON public\.powerhouse_outcome_memory_v1 FROM public, anon, authenticated/i);
  assert.match(migration,/GRANT SELECT ON public\.powerhouse_outcome_memory_v1 TO service_role/i);
  assert.doesNotMatch(migration,/drop\s+table|delete\s+from\s+supabase_migrations|cron\.schedule/i);
});

test('original provider migrations and executable Git source have one-to-one version identity',()=>{
  const source=readdirSync(new URL('../supabase/migrations/',import.meta.url))
    .filter(n=>/^\d{14}_[a-z0-9_]+\.sql$/.test(n))
    .map(n=>({version:n.slice(0,14),name:n.slice(15,-4)}))
    .sort((a,b)=>a.version.localeCompare(b.version));
  assert.deepEqual(source,lock.applied);
});
