import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const basename = '20260915125800_powerhouse_linkedin_sales_prediction_activation_v1.sql';
const retired = 'supabase/migrations/' + basename;
const archive = 'supabase/migration-history/repository-only/' + basename;
const consumer = 'tests/supabase-powerhouse-linkedin-sales-prediction-activation.test.mjs';

test('LinkedIn pre-action forecast SQL source remains archived, non-executable and verified', () => {
  assert.equal(fs.existsSync(retired), false, 'Historical SQL must not return as executable migration');
  const sql = fs.readFileSync(archive, 'utf8');
  assert.ok(sql.trim().length > 0, 'Archived SQL must be nonempty');
  assert.match(sql, /buying_window_confidence>=0\\.25 and n\\.buying_window_score>=0\\.30/i);
  assert.match(sql, /direct.outreach.*positive.value gates/i);
  assert.doesNotMatch(sql, /create\\s+table/i);
  const testSource = fs.readFileSync(consumer, 'utf8');
  assert.ok(testSource.includes(archive), 'Contract must reference archived immutable source');
  assert.ok(!testSource.includes(retired), 'Contract must not read missing executable source');
});
