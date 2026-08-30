import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const WORKFLOWS = path.resolve('.github/workflows');

const LEGACY_DIRECT_MAIN_WRITERS = [];

const BRAIN_V2_CANDIDATE_ONLY_WRITERS = [
  'approved-central-blog.yml',
  'blog-bijwerken.yml',
  'menu-balk-fix.yml',
  'paginacontrole.yml',
  'regelgeving-bijwerken.yml',
  'seo-controle.yml',
  'weekblog.yml',
].sort();

function workflowFiles() {
  return fs.readdirSync(WORKFLOWS)
    .filter((name) => /\.ya?ml$/i.test(name))
    .sort();
}

function readsAsDirectMainWriter(text) {
  if (!/contents:\s*write\b/.test(text)) return false;
  return /git\s+push\s+origin\s+(?:HEAD:)?main\b/.test(text)
    || /\bgit\s+push\s*(?:;|\n|$)/m.test(text);
}

test('there are no remaining legacy direct-main workflow writers', () => {
  const actual = workflowFiles()
    .filter((name) => readsAsDirectMainWriter(fs.readFileSync(path.join(WORKFLOWS, name), 'utf8')))
    .sort();
  assert.deepEqual(actual, LEGACY_DIRECT_MAIN_WRITERS, `direct-main writer bypass detected: ${actual.join(', ')}`);
});

test('all seven governed writers are candidate-only and cannot regress to direct main', () => {
  for (const name of BRAIN_V2_CANDIDATE_ONLY_WRITERS) {
    const text = fs.readFileSync(path.join(WORKFLOWS, name), 'utf8');
    assert.equal(readsAsDirectMainWriter(text), false, `${name} must not be detected as a direct-main writer`);
    assert.match(text, /candidate-pr/);
    assert.match(text, /createWriterCandidate/);
    assert.match(text, /gh pr create/);
    assert.doesNotMatch(text, /default:\s*direct/);
    assert.doesNotMatch(text, /gh\s+pr\s+merge/);
  }
});

test('candidate writers remain serialized without granting main mutation', () => {
  for (const name of BRAIN_V2_CANDIDATE_ONLY_WRITERS) {
    const text = fs.readFileSync(path.join(WORKFLOWS, name), 'utf8');
    assert.match(text, /repo-schrijven/, `${name} must retain writer serialization`);
    assert.doesNotMatch(text, /git push origin HEAD:main/);
  }
});

test('PR-only branch writers are not misclassified as direct-main writers', () => {
  const text = fs.readFileSync(path.join(WORKFLOWS, 'klanten-uit-broncode.yml'), 'utf8');
  assert.match(text, /contents:\s*write\b/);
  assert.match(text, /gh\s+pr\s+create\b/);
  assert.equal(readsAsDirectMainWriter(text), false);
});
