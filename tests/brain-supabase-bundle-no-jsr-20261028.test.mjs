import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

// Supabase preview/production bundling creates the module graph at build time.
// A jsr: import makes that step depend on jsr.io being reachable within 10s,
// which failed on 2026-10-28 (06:22 and 06:47) with "failed to create the graph".
test('no supabase edge function imports jsr: at build time', () => {
  const root = path.resolve('supabase/functions');
  const offenders = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(root, entry.name, 'index.ts');
    if (!existsSync(file)) continue;
    if (/from\s+["']jsr:|import\s+["']jsr:/.test(readFileSync(file, 'utf8'))) offenders.push(entry.name);
  }
  assert.deepEqual(offenders, []);
});
