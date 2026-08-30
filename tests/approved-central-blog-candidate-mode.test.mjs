import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const text = fs.readFileSync('.github/workflows/approved-central-blog.yml', 'utf8');

test('approved central blog is candidate-only under BRAIN delivery v2', () => {
  assert.match(text, /delivery_mode:[\s\S]*?default:\s*candidate-pr[\s\S]*?-\s*candidate-pr/);
  assert.doesNotMatch(text, /default:\s*direct\b/);
  assert.doesNotMatch(text, /-\s*direct\b/);
  assert.match(text, /pull-requests:\s*write/);
  assert.match(text, /createWriterCandidate/);
  assert.match(text, /writer:\s*'approved-central-blog'/);
  assert.match(text, /git push origin "HEAD:\$CANDIDATE_BRANCH"/);
  assert.match(text, /gh pr create/);
});

test('writer hands off a candidate and never mutates main directly', () => {
  assert.match(text, /Mark queue dispatched after candidate PR handoff/);
  assert.doesNotMatch(text, /git\s+push\s+origin\s+HEAD:main/);
  assert.doesNotMatch(text, /gh\s+pr\s+merge/);
  assert.match(text, /production_authority=BG169/);
  assert.match(text, /direct_main_push=false/);
});

test('candidate publication remains serialized to avoid duplicate writer races', () => {
  assert.match(text, /group:\s*repo-schrijven/);
  assert.match(text, /cancel-in-progress:\s*false/);
});
