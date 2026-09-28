import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Powerhouse hides internal delivery state from routine user chat', () => {
  const learning = JSON.parse(read('brain/learning/terminal-user-reporting-silence-20260928-v1.json'));
  assert.equal(learning.fingerprint, 'delivery|user-facing-reporting|terminal-outcomes-only|v1');
  assert.ok(learning.prevention.some(x => /terminal outcomes only/i.test(x)));

  const truth = JSON.parse(read('config/powerhouse-truth-status-contract.json'));
  assert.equal(truth.userFacingReportingPolicy.default_mode, 'TERMINAL_OUTCOMES_ONLY');
  assert.equal(truth.userFacingReportingPolicy.technical_details_on_explicit_user_request_only, true);
  assert.ok(truth.userFacingReportingPolicy.internal_states_hidden_from_chat.includes('pr_head_ref_sync'));
  assert.ok(truth.userFacingReportingPolicy.internal_states_hidden_from_chat.includes('queued_or_running_ci'));

  const continuity = read('.agents/skills/powerhouse-continuity/SKILL.md');
  assert.match(continuity, /User-facing reporting silence — terminal outcomes only/);
  assert.match(continuity, /never surface branch refs, commit SHAs, PR-head\/ref synchronization/);
  assert.match(continuity, /interruption does not justify a status handoff/i);

  const agents = read('AGENTS.md');
  assert.match(agents, /chat is geen CI-console|SHA's, PR-head-sync, queued\/running gates/i);

  const systemMap = read('platform/system-map/canonical-system-map.mjs');
  assert.match(systemMap, /userFacingReportingContract:Object\.freeze/);
  assert.match(systemMap, /TERMINAL_OUTCOMES_ONLY/);
});
