import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const WORKFLOWS = path.resolve('.github/workflows');

const APPROVED_DIRECT_MAIN_WRITERS = [
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

  // Explicit main ref or an unqualified `git push` from a workflow that checked
  // out the triggering/default ref. Branch-specific pushes such as
  // `git push -u origin feature-branch` deliberately do not match.
  return /git\s+push\s+origin\s+(?:HEAD:)?main\b/.test(text)
    || /\bgit\s+push\s*(?:;|\n|$)/m.test(text);
}

test('all direct-main workflow writers are explicitly inventoried', () => {
  const actual = workflowFiles()
    .filter((name) => readsAsDirectMainWriter(fs.readFileSync(path.join(WORKFLOWS, name), 'utf8')))
    .sort();

  assert.deepEqual(
    actual,
    APPROVED_DIRECT_MAIN_WRITERS,
    `direct-main writer inventory changed; review governance before allowing drift: ${actual.join(', ')}`,
  );
});

test('every approved direct-main writer uses the shared non-cancelling repo lock', () => {
  for (const name of APPROVED_DIRECT_MAIN_WRITERS) {
    const text = fs.readFileSync(path.join(WORKFLOWS, name), 'utf8');
    assert.match(text, /concurrency:[\s\S]*?group:\s*(?:\$\{\{[^\n]+\}\}|repo-schrijven)\s*\n/,
      `${name} must serialize repository writes through repo-schrijven`);
    assert.match(text, /cancel-in-progress:\s*false\b/,
      `${name} must never cancel an in-flight repository write`);
  }
});

test('PR-only branch writers are not misclassified as direct-main writers', () => {
  const text = fs.readFileSync(path.join(WORKFLOWS, 'klanten-uit-broncode.yml'), 'utf8');
  assert.match(text, /contents:\s*write\b/);
  assert.match(text, /gh\s+pr\s+create\b/);
  assert.equal(readsAsDirectMainWriter(text), false);
});
