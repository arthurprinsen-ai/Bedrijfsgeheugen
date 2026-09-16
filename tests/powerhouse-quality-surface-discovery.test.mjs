import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverQualitySurfaces } from '../scripts/brain/quality/surface-discovery.mjs';

test('SQL discovery registers durable tables but ignores trigger literals and transient probes', () => {
  const discovered = discoverQualitySurfaces({
    files: [{
      path: 'supabase/migrations/fixture.sql',
      content: `
create table if not exists public.powerhouse_security_guard_events (id bigint);
create table public.__powerhouse_rls_guard_probe (id bigint);
when tag in ('CREATE TABLE', 'CREATE TABLE AS')
      `,
    }],
  });

  assert.deepEqual(discovered.map(item => item.id), [
    'table:public.powerhouse_security_guard_events',
  ]);
});
