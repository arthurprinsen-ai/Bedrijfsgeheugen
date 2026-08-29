import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const text = fs.readFileSync('.github/workflows/approved-central-blog.yml', 'utf8');

test('approved central blog exposes reversible candidate PR mode while defaulting to direct', () => {
  assert.match(text, /delivery_mode:[\s\S]*?default:\s*direct[\s\S]*?-\s*direct[\s\S]*?-\s*candidate-pr/);
  assert.match(text, /pull-requests:\s*write/);
  assert.match(text, /createWriterCandidate/);
  assert.match(text, /writer:\s*'approved-central-blog'/);
  assert.match(text, /git push origin "HEAD:\$CANDIDATE_BRANCH"/);
  assert.match(text, /gh pr create/);
});

test('candidate mode does not mark the Notion queue as dispatched', () => {
  assert.match(text, /Mark queue dispatched after successful direct push/);
  assert.match(text, /if:\s*steps\.render\.outputs\.changed == 'true' && steps\.commit\.outputs\.delivery == 'direct'/);
});

test('direct publication remains serialized and candidate workflow never self-merges', () => {
  assert.match(text, /group:\s*repo-schrijven/);
  assert.match(text, /cancel-in-progress:\s*false/);
  assert.doesNotMatch(text, /gh\s+pr\s+merge/);
});
