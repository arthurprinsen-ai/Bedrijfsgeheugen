import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const text = fs.readFileSync('.github/workflows/paginacontrole.yml', 'utf8');

test('paginacontrole exposes a manual candidate PR mode while automatic runs stay direct', () => {
  assert.match(text, /delivery_mode:[\s\S]*?default:\s*direct[\s\S]*?-\s*direct[\s\S]*?-\s*candidate-pr/);
  assert.match(text, /pull-requests:\s*write/);
  assert.match(text, /github\.event_name == 'workflow_dispatch' && inputs\.delivery_mode \|\| 'direct'/);
});

test('paginacontrole bundles known source fixes and seo-status in one governed candidate', () => {
  assert.match(text, /writer:\s*'paginacontrole'/);
  assert.match(text, /createWriterCandidate/);
  assert.match(text, /seo-status\.json/);
  assert.match(text, /git push origin "HEAD:\$CANDIDATE_BRANCH"/);
  assert.match(text, /gh pr create/);
  assert.doesNotMatch(text, /gh\s+pr\s+merge/);
});

test('candidate mode does not close or mutate production issue state', () => {
  assert.match(text, /inputs\.delivery_mode != 'candidate-pr'/);
  assert.match(text, /Melding sluiten als alles goed is/);
});

test('repository writer serialization remains fail-closed for non-PR runs', () => {
  assert.match(text, /'repo-schrijven'/);
  assert.match(text, /cancel-in-progress:\s*\$\{\{ github\.event_name == 'pull_request' \}\}/);
});
