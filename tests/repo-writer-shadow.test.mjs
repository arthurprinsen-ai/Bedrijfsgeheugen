import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { allowedForWriter, validateWriterPaths } from '../scripts/ci/repo-writer-policy.mjs';

test('authoritative policy covers all seven direct-main writers', () => {
  const writers = [
    'approved-central-blog', 'blog-bijwerken', 'menu-balk-fix', 'paginacontrole',
    'regelgeving-bijwerken', 'seo-controle', 'weekblog',
  ];
  for (const writer of writers) assert.ok(allowedForWriter(writer).length > 0, `${writer} must have a bounded path policy`);
  assert.throws(() => allowedForWriter('unknown-writer'), /UNKNOWN_WRITER/);
});

test('writer path policies accept intended files and reject cross-domain drift', () => {
  assert.equal(validateWriterPaths('regelgeving-bijwerken', ['data/regelgeving.json']).ok, true);
  assert.equal(validateWriterPaths('seo-controle', ['sitemap.xml', 'netlify.toml']).ok, true);
  assert.equal(validateWriterPaths('approved-central-blog', ['blog/voorbeeld/index.html', 'blog/index.html', 'blog/rss.xml', 'sitemap.xml']).ok, true);
  assert.throws(() => validateWriterPaths('regelgeving-bijwerken', ['data/regelgeving.json', '.github/workflows/x.yml']), /UNAPPROVED_WRITER_PATH/);
  assert.throws(() => validateWriterPaths('menu-balk-fix', ['index.html', 'package.json']), /UNAPPROVED_WRITER_PATH/);
});

test('shadow workflow is read-only and only verifies writer candidate PRs', () => {
  const text = fs.readFileSync('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  assert.match(text, /pull_request:/);
  assert.match(text, /branches:\s*\n\s*- main/);
  assert.match(text, /startsWith\(github\.head_ref, 'writer\/'\)/);
  assert.match(text, /permissions:\s*\n\s*contents:\s*read\b/);
  assert.doesNotMatch(text, /contents:\s*write\b/);
  assert.doesNotMatch(text, /pull-requests:\s*write\b/);
  assert.doesNotMatch(text, /\bgit\s+push\b|\bgh\s+pr\s+merge\b|\/merges\b/);
  assert.match(text, /repo-writer-shadow-verify\.mjs/);
});

test('shadow verification emits immutable exact-PR evidence as a read-only artifact', () => {
  const workflow = fs.readFileSync('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  const verifier = fs.readFileSync('scripts/ci/repo-writer-shadow-verify.mjs', 'utf8');

  assert.match(workflow, /GITHUB_PR_BASE_SHA:[^\n]*inputs\.base_sha[^\n]*github\.event\.pull_request\.base\.sha/);
  assert.match(workflow, /GITHUB_PR_HEAD_SHA:[^\n]*inputs\.head_sha[^\n]*github\.event\.pull_request\.head\.sha/);
  assert.match(workflow, /ref:[^\n]*inputs\.head_sha[^\n]*github\.event\.pull_request\.head\.sha/);
  assert.match(workflow, /REPO_WRITER_EVIDENCE_PATH:\s*artifacts\/repo-writer-shadow-evidence\.json/);
  assert.match(workflow, /uses:\s*actions\/upload-artifact@v4/);
  assert.match(workflow, /path:\s*artifacts\/repo-writer-shadow-evidence\.json/);

  assert.match(verifier, /GITHUB_PR_BASE_SHA/);
  assert.match(verifier, /GITHUB_PR_HEAD_SHA/);
  assert.match(verifier, /REPO_WRITER_EVIDENCE_PATH/);
  assert.match(verifier, /baseSha/);
  assert.match(verifier, /headSha/);
  assert.match(verifier, /changedFiles/);
  assert.match(verifier, /candidateBranch/);
  assert.match(verifier, /writeFileSync/);
  assert.match(verifier, /schemaVersion:\s*1/);
});

test('explicit shadow dispatch validates PR identity against GitHub before checkout', () => {
  const shadow = fs.readFileSync('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  assert.match(shadow, /Validate explicitly dispatched PR identity/);
  assert.match(shadow, /gh api .*pulls\/\$\{?PR_NUMBER/);
  assert.match(shadow, /PR_BASE_SHA_DRIFT/);
  assert.match(shadow, /PR_HEAD_SHA_DRIFT/);
  assert.match(shadow, /PR_HEAD_REF_DRIFT/);
});

test('writer-created PRs explicitly self-dispatch read-only shadow verification', () => {
  const shadow = fs.readFileSync('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  const menu = fs.readFileSync('.github/workflows/menu-balk-fix.yml', 'utf8');
  const approved = fs.readFileSync('.github/workflows/approved-central-blog.yml', 'utf8');

  assert.match(shadow, /workflow_dispatch:/);
  assert.match(shadow, /pr_number:/);
  assert.match(shadow, /base_sha:/);
  assert.match(shadow, /head_sha:/);
  assert.match(shadow, /candidate_branch:/);
  assert.match(shadow, /github\.event_name == 'workflow_dispatch'/);

  for (const [name, workflow] of [['menu-balk-fix', menu], ['approved-central-blog', approved]]) {
    assert.match(workflow, /repo-writer-candidate-shadow\.yml/, `${name} must dispatch shadow`);
    assert.match(workflow, /gh workflow run/, `${name} must explicitly dispatch shadow`);
    assert.match(workflow, /-f pr_number=/);
    assert.match(workflow, /-f base_sha=/);
    assert.match(workflow, /-f head_sha=/);
    assert.match(workflow, /-f candidate_branch=/);
  }
});
