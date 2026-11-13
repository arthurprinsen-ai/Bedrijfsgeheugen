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

test('source verdict is applied after the original provider, BRAIN and rotation checks', () => {
  const edge = readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts', import.meta.url), 'utf8');
  const authIndex = edge.indexOf('authorizePowerhouseScheduler(req)');
  const materializeIndex = edge.indexOf("db.rpc('powerhouse_materialize_mira_problem_recommendation_v1'");
  const brainIndex = edge.indexOf("db.rpc('brain_observe_failure'");
  const rotateIndex = edge.indexOf("db.rpc('powerhouse_ensure_personal_source_rotation_v2'");
  const responseIndex = edge.lastIndexOf('classifyMiraRadarHttpStatus({sourceReady:supply.ok,errors})');
  assert.ok(authIndex >= 0 && materializeIndex > authIndex);
  assert.ok(brainIndex > materializeIndex);
  assert.ok(rotateIndex > brainIndex && responseIndex > rotateIndex);
  assert.match(edge, /if\(!auth\.ok\) return json\(\{error:auth\.error\},auth\.status\)/);
  assert.match(edge, /sendsAuthorized:false/);
  assert.match(edge, /MIRA_UNIQUE_SOURCE_WINNER_REQUIRED/);
});
