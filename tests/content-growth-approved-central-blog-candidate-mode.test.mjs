import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const text = fs.readFileSync('.github/workflows/approved-central-blog.yml', 'utf8');
const publisher = fs.readFileSync('scripts/publish_approved_blog_v2.py', 'utf8');

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

test('candidate handoff does not mark the source queue dispatched before production proof', () => {
  assert.doesNotMatch(text, /Mark queue dispatched after candidate PR handoff/);
  assert.doesNotMatch(text, /--mark-dispatched/);
  assert.doesNotMatch(text, /git\s+push\s+origin\s+HEAD:main/);
  assert.doesNotMatch(text, /gh\s+pr\s+merge/);
  assert.match(text, /production_authority=BG169/);
  assert.match(text, /direct_main_push=false/);
});

test('candidate publication remains serialized to avoid duplicate writer races', () => {
  assert.match(text, /group:\s*repo-schrijven/);
  assert.match(text, /cancel-in-progress:\s*false/);
});

test('exact stale recovery reconciles existing article and remains fail-closed on identity drift', () => {
  assert.doesNotMatch(publisher, /Doelslug bestaat al; verificatie vereist in plaats van tweede commit/);
  assert.match(publisher, /status = 'RECONCILED'/);
  assert.match(publisher, /Bestaande doelslug heeft afwijkende title; fail-closed/);
  assert.match(publisher, /Bestaande doelslug heeft afwijkende h1; fail-closed/);
  assert.match(publisher, /Bestaande doelslug heeft afwijkende canonical; fail-closed/);
  assert.match(publisher, /Bestaande doelslug heeft afwijkende content-id; fail-closed/);
  assert.match(publisher, /core\.base\.updates\(q\)/);
  assert.match(publisher, /print\(f["']SEALED:/);
});

test('distribution-only stale repair validates the existing article and may create a candidate without rewriting it', () => {
  assert.match(text, /FORCE_SLUG:\s*\$\{\{ steps\.resolve\.outputs\.slug \}\}/);
  assert.match(text, /article_changes = \[p for p in changed/);
  assert.match(text, /len\(article_changes\) <= 1/);
  assert.match(text, /article_path = article_changes\[0\] if article_changes else f'blog\/\{slug\}\/index\.html'/);
  assert.match(text, /pathlib\.Path\(article_path\)\.is_file\(\)/);
});
