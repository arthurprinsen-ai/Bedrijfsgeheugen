import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const text = fs.readFileSync('.github/workflows/weekblog.yml', 'utf8');

test('weekblog exposes reversible candidate PR mode', () => {
  assert.match(text, /delivery_mode:[\s\S]*?default:\s*direct[\s\S]*?-\s*direct[\s\S]*?-\s*candidate-pr/);
  assert.match(text, /pull-requests:\s*write/);
  assert.match(text, /writer:\s*'weekblog'/);
  assert.match(text, /createWriterCandidate/);
  assert.match(text, /git push origin "HEAD:\$CANDIDATE_BRANCH"/);
  assert.match(text, /gh pr create/);
  assert.doesNotMatch(text, /gh\s+pr\s+merge/);
});

test('weekblog keeps Notion publication behind successful direct push', () => {
  assert.match(text, /Notion bijwerken na succesvolle directe publicatie/);
  assert.match(text, /steps\.commit\.outputs\.delivery == 'direct'/);
});

test('automatic weekblog runs stay direct and serialized', () => {
  assert.match(text, /github\.event_name == 'workflow_dispatch' && inputs\.delivery_mode \|\| 'direct'/);
  assert.match(text, /group:\s*repo-schrijven/);
  assert.match(text, /cancel-in-progress:\s*false/);
});
