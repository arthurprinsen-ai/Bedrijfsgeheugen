import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const applied = [
  ['20261025195609_commercial_feedback_truth_private_evidence_view.sql', 'internal_reporting.commercial_feedback_truth'],
  ['20261026115246_writer_control_exclusive_lease_v1.sql', 'writer_control.acquire'],
  ['20261026115659_writer_control_service_role_acl_v1.sql', 'GRANT USAGE ON SCHEMA writer_control TO service_role'],
];

for (const [file, marker] of applied) {
  test(`already-applied remote migration ${file} is mirrored in the repository`, () => {
    const path = new URL(`../supabase/migrations/${file}`, import.meta.url);
    assert.ok(existsSync(path), `${file} must exist so Supabase Preview no longer reports remote versions missing locally`);
    const sql = readFileSync(path, 'utf8');
    assert.ok(sql.includes(marker), `${file} must carry the applied statement ${marker}`);
    assert.doesNotMatch(sql, /drop\s+(table|schema)/i, 'mirror of an applied migration must not add destructive statements');
  });
}
