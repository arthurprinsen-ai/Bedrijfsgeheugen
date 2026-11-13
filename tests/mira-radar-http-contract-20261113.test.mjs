import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyMiraRadarHttpStatus } from '../supabase/functions/_shared/mira-radar-http-status.mjs';

test('the real daily source winner is the only clean HTTP 200', () => {
  assert.equal(classifyMiraRadarHttpStatus({ sourceReady: true, errors: [] }), 200);
});
test('no new unique dated source stays visible as HTTP 503, without fake selection', () => {
  assert.equal(classifyMiraRadarHttpStatus({ sourceReady: false, errors: [] }), 503);
  assert.equal(classifyMiraRadarHttpStatus({ sourceReady: null, errors: [] }), 503);
  assert.equal(classifyMiraRadarHttpStatus({}), 503);
});
test('upstream/provider/writeback errors never report a healthy HTTP 200', () => {
  assert.equal(classifyMiraRadarHttpStatus({ sourceReady: true, errors: ['source_contract_read:429'] }), 502);
  assert.equal(classifyMiraRadarHttpStatus({ sourceReady: false, errors: ['mira_materialize:timeout'] }), 502);
});
test('original endpoint maps its real content verdict to HTTP and keeps recovery lineage', () => {
  const file = readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts', import.meta.url), 'utf8');
  assert.match(file, /classifyMiraRadarHttpStatus\(\{\s*sourceReady:supply\.ok,\s*errors\s*\}\)/);
  assert.match(file, /brain_observe_failure/);
  assert.match(file, /powerhouse_materialize_mira_problem_recommendation_v1/);
  assert.match(file, /powerhouse_ensure_personal_source_rotation_v2/);
  assert.match(file, /SOURCE_RECOVERY_DUE/);
  assert.doesNotMatch(file, /cron\.schedule\s*\(/);
});
