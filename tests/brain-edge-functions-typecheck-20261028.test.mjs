import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Guard: every Supabase edge function must pass `deno check` (type-only defects, 2026-10-28).
// Runs when a deno binary is available via DENO_BIN or on PATH; otherwise skipped with a reason.
const denoBin = process.env.DENO_BIN || 'deno';
const hasDeno = (() => {
  try { execFileSync(denoBin, ['--version'], { stdio: 'ignore' }); return true; } catch { return false; }
})();

test('every edge function passes deno check', { skip: hasDeno ? false : 'deno not available (set DENO_BIN)' }, () => {
  const root = 'supabase/functions';
  const files = readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(root, d.name, 'index.ts'))
    .filter((f) => existsSync(f));
  assert.ok(files.length > 0);
  const failures = [];
  for (const f of files) {
    try {
      execFileSync(denoBin, ['check', '--no-lock', f], { stdio: 'pipe' });
    } catch (error) {
      failures.push(f);
    }
  }
  assert.deepEqual(failures, [], `deno check failed for: ${failures.join(', ')}`);
});
