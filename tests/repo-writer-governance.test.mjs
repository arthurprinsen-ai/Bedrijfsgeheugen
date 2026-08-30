import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const WORKFLOWS = path.resolve('.github/workflows');

const LEGACY_DIRECT_MAIN_WRITERS = [
  'blog-bijwerken.yml',
  'paginacontrole.yml',
  'weekblog.yml',
].sort();

const BRAIN_V2_CANDIDATE_ONLY_WRITERS = [
  'approved-central-blog.yml',
  'menu-balk-fix.yml',
  'regelgeving-bijwerken.yml',
  'seo-controle.yml',
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

test('remaining legacy direct-main workflow writers are explicitly inventoried', () => {
  const actual = workflowFiles()
    .filter((name) => readsAsDirectMainWriter(fs.readFileSync(path.join(WORKFLOWS, name), 'utf8')))
    .sort();

  assert.deepEqual(
    actual,
    LEGACY_DIRECT_MAIN_WRITERS,
    `direct-main writer inventory changed; review governance before allowing drift: ${actual.join(', ')}`,
  );
});

test('every remaining legacy direct-main writer serializes main writes without cancellation', () => {
  for (const name of LEGACY_DIRECT_MAIN_WRITERS) {
    const text = fs.readFileSync(path.join(WORKFLOWS, name), 'utf8');

    if (name === 'paginacontrole.yml') {
      assert.match(
        text,
        /group:\s*\$\{\{\s*github\.event_name\s*==\s*'pull_request'[\s\S]*?'repo-schrijven'[\s\S]*?\}\}/,
        'paginacontrole must isolate PR verification while routing non-PR writers through repo-schrijven',
      );
      assert.match(
        text,
        /cancel-in-progress:\s*\$\{\{\s*github\.event_name\s*==\s*'pull_request'\s*\}\}/,
        'paginacontrole may cancel PR verification only; main-writing runs must remain non-cancelling',
      );
      continue;
    }

    assert.match(text, /concurrency:[\s\S]*?group:\s*repo-schrijven\s*\n/, `${name} must serialize repository writes through repo-schrijven`);
    assert.match(text, /cancel-in-progress:\s*false\b/, `${name} must never cancel an in-flight repository write`);
  }
});

test('BRAIN v2 migrated writers are candidate-only and cannot regress to direct main', () => {
  for (const name of BRAIN_V2_CANDIDATE_ONLY_WRITERS) {
    const text = fs.readFileSync(path.join(WORKFLOWS, name), 'utf8');
    assert.equal(readsAsDirectMainWriter(text), false, `${name} must not be detected as a direct-main writer`);
    assert.match(text, /candidate-pr/);
    assert.match(text, /createWriterCandidate/);
    assert.match(text, /gh pr create/);
    assert.doesNotMatch(text, /gh\s+pr\s+merge/);
  }
});

test('PR-only branch writers are not misclassified as direct-main writers', () => {
  const text = fs.readFileSync(path.join(WORKFLOWS, 'klanten-uit-broncode.yml'), 'utf8');
  assert.match(text, /contents:\s*write\b/);
  assert.match(text, /gh\s+pr\s+create\b/);
  assert.equal(readsAsDirectMainWriter(text), false);
});
