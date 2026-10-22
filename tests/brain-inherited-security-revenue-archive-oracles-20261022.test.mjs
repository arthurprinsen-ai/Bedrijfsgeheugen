import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Historical SQL is immutable evidence, not an executable migration.
const archiveCases = [
  { test: "tests/supabase-powerhouse-revenue-acceleration-mode-v1.test.mjs", file: "20260915143000_powerhouse_revenue_acceleration_mode_v1.sql", gitBlob: "59a2a9895df32660b678b368f92ea8da23125799" },
  { test: "tests/supabase-powerhouse-security-operations-hardening-v1.test.mjs", file: "20260916174000_powerhouse_security_operations_hardening_v1.sql", gitBlob: "e729de2cde4a618a8562c1de51e92781077408c8" },
  { test: "tests/supabase-powerhouse-structural-gap-closure-v2.test.mjs", file: "20260918090000_powerhouse_structural_gap_closure_v2.sql", gitBlob: "c26421ca46f3c24011d314e08686aa2d250a9a95" },
  { test: "tests/supabase-prospective-autonomous-commercial-experiment-v1.test.mjs", file: "20260918113000_prospective_autonomous_commercial_experiment_v1.sql", gitBlob: "8bd6f9423ab1665d8e9a0771f51f28c9d3a61ec9" },
];

for (const entry of archiveCases) {
  test(`archived historical SQL remains exact and non-executable: ${entry.file}`, () => {
    const archive = `supabase/migration-history/repository-only/${entry.file}`;
    const executable = `supabase/migrations/${entry.file}`;
    const bytes = readFileSync(archive);
    assert.ok(bytes.toString('utf8').trim().length > 0, 'archive source must contain SQL');
    const digest = createHash('sha1')
      .update(Buffer.from(`blob ${bytes.length}\\0`.replace('\\0', '\0')))
      .update(bytes)
      .digest('hex');
    assert.equal(digest, entry.gitBlob, 'historical Git blob content must not drift');
    assert.equal(existsSync(executable), false, 'retired version must not re-enter executable migrations');
    assert.ok(readFileSync(entry.test, 'utf8').includes(archive), 'existing contract test must use archived source');
  });
}
