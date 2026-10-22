import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const originalSql = [
  { file: '20260918110000_legacy_growth_outcome_reconciler_v1.sql', gitBlobSha: 'e84bde6ba753e773e4d74cfb39f226dde9e068e3' },
  { file: '20260918101000_forecast_calibration_health_due_v1.sql', gitBlobSha: '4828bd5facf452f579b530e2b4332133d978ef7a' },
  { file: '20260918131000_action_learning_production_truth_v1.sql', gitBlobSha: '0712bedcf5b12aed3b12e4a732c0361c9ec5c57a8' }
];
for (const item of originalSql) {
  test('immutable original SQL archive (no executable duplicate): ' + item.file, () => {
    const historicalPath = 'supabase/migration-history/repository-only/' + item.file;
    const executablePath = 'supabase/migrations/' + item.file;
    const sql = readFileSync(historicalPath, 'utf8');
    assert.ok(sql.trim().length > 0);
    const header = Buffer.from('blob ' + Buffer.byteLength(sql) + String.fromCharCode(0));
    const gitBlob = createHash('sha1').update(header).update(sql).digest('hex');
    assert.equal(gitBlob, item.gitBlobSha);
    assert.equal(existsSync(executablePath), false, 'Do not reintroduce retired SQL as executable migration');
  });
}
await import('./supabase-legacy-growth-outcome-reconciler-v1.test.mjs');
await import('./supabase-forecast-calibration-health-due-v1.test.mjs');
await import('./supabase-action-learning-production-truth-v1.test.mjs');
