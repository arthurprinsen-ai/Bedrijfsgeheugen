import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadGuardKnowledge, matchPlannedAction } from '../scripts/brain/planned-action-guard.mjs';

// root ffmpeg-static runs `node install.js` as a postinstall and downloads a binary from GitHub
// releases. A transient HTTP 504 there failed `npm install` and with it the required `test`
// check on every PR, although none of these lanes execute that binary.
const required = readFileSync('.github/workflows/required-test.yml', 'utf8');
const backend = readFileSync('.github/workflows/lane-backend.yml', 'utf8');

function stepBody(workflow, name) {
  const start = workflow.indexOf(`- name: ${name}`);
  assert.ok(start >= 0, `step not found: ${name}`);
  const next = workflow.indexOf('\n      - name: ', start + 1);
  return workflow.slice(start, next === -1 ? workflow.length : next);
}

test('preflight installs dependencies without lifecycle scripts', () => {
  const body = stepBody(required, 'Install runtime dependencies for the unwired contracts');
  assert.match(body, /npm install --ignore-scripts /);
});

test('the backend lane keeps installing without lifecycle scripts', () => {
  const body = stepBody(backend, 'Install runtime dependencies for backend contracts');
  assert.match(body, /npm install --ignore-scripts /);
});

test('the exact Netlify build install keeps its scripts but retries a transient failure', () => {
  const body = stepBody(required, 'Install exact Netlify build dependencies');
  assert.ok(!body.includes('--ignore-scripts'), 'the parity install must stay exact');
  assert.match(body, /for attempt in 1 2 3/);
  assert.match(body, /npm install [^\n]*&& exit 0/);
  assert.match(body, /\n\s+exit 1\s*$/);
});

const RULE = 'REQUIRED_TEST_NPM_INSTALL_MUST_SURVIVE_FFMPEG_DOWNLOAD';

test('the planned-action guard blocks removing the install safeguards until acknowledged', async () => {
  const knowledge = await loadGuardKnowledge();
  const action = 'Remove ignore-scripts from the required-test npm install preflight';
  const result = matchPlannedAction({ action, ...knowledge });
  assert.ok(result.matches.some(match => match.ruleId === RULE), 'trigger did not fire');
  assert.equal(result.ok, false);
  const passed = matchPlannedAction({ action, ...knowledge, acknowledged: result.unacknowledged.map(match => match.ruleId) });
  assert.equal(passed.ok, true);
});

test('everyday dependency and workflow wording does not fire the install rule', async () => {
  const knowledge = await loadGuardKnowledge();
  for (const action of [
    'Fix a typo in a blog title',
    'Update the readme with the new build steps',
    'Draft a LinkedIn post about the AI report',
    'Add a new customer page to the portal',
    'Improve the process documentation for onboarding'
  ]) {
    const fired = matchPlannedAction({ action, ...knowledge }).matches.filter(match => match.ruleId === RULE);
    assert.deepEqual(fired, [], `false positive on: ${action}`);
  }
});
