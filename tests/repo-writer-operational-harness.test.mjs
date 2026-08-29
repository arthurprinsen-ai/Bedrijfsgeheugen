import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const harnessPath = '.github/workflows/repo-writer-operational-verification.yml';

test('operational writer harness can only dispatch menu-balk-fix in candidate-pr mode', () => {
  const text = fs.readFileSync(harnessPath, 'utf8');

  assert.match(text, /pull_request:/);
  assert.match(text, /branches:\s*\[?main\]?/);
  assert.match(text, /verify\/menu-balk-fix-/);
  assert.match(text, /github\.event\.pull_request\.head\.repo\.full_name\s*==\s*github\.repository/);
  assert.match(text, /actions:\s*write\b/);
  assert.doesNotMatch(text, /contents:\s*write\b/);
  assert.doesNotMatch(text, /pull-requests:\s*write\b/);

  assert.match(text, /VERIFY_REF:\s*\$\{\{ github\.event\.pull_request\.head\.ref \}\}/);
  assert.match(text, /gh\s+workflow\s+run\s+menu-balk-fix\.yml/);
  assert.match(text, /--ref\s+"\$VERIFY_REF"/);
  assert.match(text, /delivery_mode=candidate-pr/);
  assert.doesNotMatch(text, /--ref\s+main/);
  assert.doesNotMatch(text, /delivery_mode=direct/);
  assert.doesNotMatch(text, /\bgit\s+push\b|\bgh\s+pr\s+(create|merge)\b|\/merges\b/);
  assert.doesNotMatch(text, /NOTION|notion|publiceer|publish/i);
});

test('operational harness has an isolated regulation writer lane that is candidate-only', () => {
  const text = fs.readFileSync(harnessPath, 'utf8');
  assert.match(text, /dispatch-regulation-candidate:/);
  assert.match(text, /verify\/regelgeving-bijwerken-/);
  assert.match(text, /gh\s+workflow\s+run\s+regelgeving-bijwerken\.yml/);
  assert.match(text, /--ref\s+"\$VERIFY_REF"/);
  assert.match(text, /delivery_mode=candidate-pr/);
});

test('operational harness has an isolated SEO writer lane that is candidate-only', () => {
  const text = fs.readFileSync(harnessPath, 'utf8');
  assert.match(text, /dispatch-seo-candidate:/);
  assert.match(text, /verify\/seo-controle-/);
  assert.match(text, /gh\s+workflow\s+run\s+seo-controle\.yml/);
  assert.match(text, /--ref\s+"\$VERIFY_REF"/);
  assert.match(text, /delivery_mode=candidate-pr/);
});

test('operational harness has an isolated paginacontrole lane that is candidate-only', () => {
  const text = fs.readFileSync(harnessPath, 'utf8');
  assert.match(text, /dispatch-paginacontrole-candidate:/);
  assert.match(text, /verify\/paginacontrole-/);
  assert.match(text, /gh\s+workflow\s+run\s+paginacontrole\.yml/);
  assert.match(text, /--ref\s+"\$VERIFY_REF"/);
  assert.match(text, /delivery_mode=candidate-pr/);
  assert.doesNotMatch(text, /delivery_mode=direct/);
  assert.doesNotMatch(text, /\bgit\s+push\b|\bgh\s+pr\s+(create|merge)\b|\/merges\b/);
});

for (const lane of [
  ['approved-central-blog', 'approved-central-blog.yml'],
  ['blog-bijwerken', 'blog-bijwerken.yml'],
  ['weekblog', 'weekblog.yml'],
]) {
  test(`operational harness has an isolated ${lane[0]} lane that is candidate-only`, () => {
    const text = fs.readFileSync(harnessPath, 'utf8');
    const escaped = lane[1].replaceAll('.', '\\.');
    assert.match(text, new RegExp(`verify/${lane[0]}-`));
    assert.match(text, new RegExp(`gh\\s+workflow\\s+run\\s+${escaped}`));
    assert.match(text, /--ref\s+"\$VERIFY_REF"/);
    assert.match(text, /delivery_mode=candidate-pr/);
  });
}

test('operational harness itself remains actions-only and cannot publish or mutate external content state', () => {
  const text = fs.readFileSync(harnessPath, 'utf8');
  assert.match(text, /permissions:\s*\n\s*contents:\s*read\s*\n\s*actions:\s*write/);
  assert.doesNotMatch(text, /contents:\s*write\b|pull-requests:\s*write\b/);
  assert.doesNotMatch(text, /\bgit\s+(push|commit|add)\b|\bgh\s+pr\s+(create|merge)\b|\/merges\b/);
  assert.doesNotMatch(text, /NOTION_TOKEN|NOTION_DB|notion\.so|api\.notion/i);
  assert.doesNotMatch(text, /delivery_mode=direct/);
});

test('operational harness records the triggering PR base SHA before dispatch', () => {
  const text = fs.readFileSync(harnessPath, 'utf8');
  assert.match(text, /github\.event\.pull_request\.base\.sha/);
  assert.match(text, /EXPECTED_MAIN_SHA/);
  assert.match(text, /git\/ref\/heads\/main|repos\/\$\{GITHUB_REPOSITORY\}\/git\/ref\/heads\/main/);
  assert.match(text, /BASE_SHA_DRIFT/);
});
