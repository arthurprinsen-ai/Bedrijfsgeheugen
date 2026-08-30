import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const harnessPath = '.github/workflows/repo-writer-operational-verification.yml';

function harness() {
  return fs.readFileSync(harnessPath, 'utf8');
}

test('operational writer verifier is one candidate-only dispatcher for all governed writers', () => {
  const text = harness();
  assert.match(text, /dispatch-writer-candidate:/);
  for (const writer of [
    'menu-balk-fix',
    'regelgeving-bijwerken',
    'seo-controle',
    'paginacontrole',
    'approved-central-blog',
    'blog-bijwerken',
    'weekblog',
  ]) {
    assert.match(text, new RegExp(`verify/${writer}-`));
    assert.match(text, new RegExp(`WRITER='${writer}'`));
  }
  assert.match(text, /delivery_mode=candidate-pr/);
  assert.doesNotMatch(text, /delivery_mode=direct/);
  assert.doesNotMatch(text, /\bgit\s+(push|commit|add)\b|\bgh\s+pr\s+(create|merge)\b|\/merges\b/);
});

test('real writers always execute from the immutable verification ref, never from main', () => {
  const text = harness();
  assert.match(text, /--ref\s+"\$VERIFY_REF"/);
  const dispatchLine = text.split('\n').find((line) => line.includes('args=(workflow run')) || '';
  assert.match(dispatchLine, /--ref\s+"\$VERIFY_REF"/);
  assert.doesNotMatch(dispatchLine, /--ref\s+main/);
});

test('moving main is ignored only when current-main changes do not overlap the canary scope', () => {
  const text = harness();
  assert.match(text, /EXPECTED_MAIN_SHA:\s*\$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.match(text, /VERIFY_PR_NUMBER:\s*\$\{\{ github\.event\.pull_request\.number \}\}/);
  assert.match(text, /gh pr diff "\$VERIFY_PR_NUMBER"[^\n]*--name-only/);
  assert.match(text, /compare\/\$\{EXPECTED_MAIN_SHA\}\.\.\.\$\{actual_main_sha\}/);
  assert.match(text, /comm -12/);
  assert.match(text, /CURRENT_MAIN_SCOPE_OVERLAP/);
  assert.match(text, /CURRENT_MAIN_DRIFT_IGNORED/);
  assert.doesNotMatch(text, /BASE_SHA_DRIFT/);
});

test('operational harness itself remains read-only except for Actions dispatch', () => {
  const text = harness();
  assert.match(text, /permissions:\s*\n\s*contents:\s*read\s*\n\s*pull-requests:\s*read\s*\n\s*actions:\s*write/);
  assert.doesNotMatch(text, /contents:\s*write\b|pull-requests:\s*write\b/);
  assert.doesNotMatch(text, /NOTION_TOKEN|NOTION_DB|notion\.so|api\.notion/i);
});

test('paid-capable content writers use verification mode when the harness supports it', () => {
  const text = harness();
  assert.match(text, /verify\/approved-central-blog-\*\)[\s\S]*EXTRA='verification'/);
  assert.match(text, /verify\/blog-bijwerken-\*\)[\s\S]*EXTRA='verification'/);
  assert.match(text, /verification\) args\+=\(-f verification_mode=true\)/);
});
