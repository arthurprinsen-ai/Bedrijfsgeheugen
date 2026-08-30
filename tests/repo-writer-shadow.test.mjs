import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { allowedForWriter, validateWriterPaths } from '../scripts/ci/repo-writer-policy.mjs';

const writerWorkflows = [
  ['approved-central-blog', '.github/workflows/approved-central-blog.yml'],
  ['blog-bijwerken', '.github/workflows/blog-bijwerken.yml'],
  ['menu-balk-fix', '.github/workflows/menu-balk-fix.yml'],
  ['paginacontrole', '.github/workflows/paginacontrole.yml'],
  ['regelgeving-bijwerken', '.github/workflows/regelgeving-bijwerken.yml'],
  ['seo-controle', '.github/workflows/seo-controle.yml'],
  ['weekblog', '.github/workflows/weekblog.yml'],
];

test('authoritative policy covers all seven repository writers', () => {
  for (const [writer] of writerWorkflows) assert.ok(allowedForWriter(writer).length > 0, `${writer} must have a bounded path policy`);
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
  assert.match(verifier, /GITHUB_PR_BASE_SHA/);
  assert.match(verifier, /GITHUB_PR_HEAD_SHA/);
  assert.match(verifier, /REPO_WRITER_EVIDENCE_PATH/);
  assert.match(verifier, /schemaVersion:\s*1/);
});

test('explicit shadow dispatch validates PR identity against GitHub before checkout', () => {
  const shadow = fs.readFileSync('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  assert.match(shadow, /Validate explicitly dispatched PR identity/);
  assert.match(shadow, /PR_BASE_SHA_DRIFT/);
  assert.match(shadow, /PR_HEAD_SHA_DRIFT/);
  assert.match(shadow, /PR_HEAD_REF_DRIFT/);
});

test('all repository writers self-dispatch read-only shadow verification', () => {
  for (const [name, path] of writerWorkflows) {
    const workflow = fs.readFileSync(path, 'utf8');
    assert.match(workflow, /actions:\s*write\b/, `${name} needs actions: write for explicit shadow dispatch`);
    assert.match(workflow, /repo-writer-candidate-shadow\.yml/, `${name} must dispatch shadow`);
    assert.match(workflow, /gh workflow run/, `${name} must explicitly dispatch shadow`);
    assert.match(workflow, /-f pr_number=/, `${name} must bind PR number`);
    assert.match(workflow, /-f base_sha=/, `${name} must bind actual PR base`);
    assert.match(workflow, /-f head_sha=/, `${name} must bind actual PR head`);
    assert.match(workflow, /-f candidate_branch=/, `${name} must bind candidate branch`);
  }
});

test('all repository writers bind shadow to actual GitHub PR identity', () => {
  for (const [name, path] of writerWorkflows) {
    const workflow = fs.readFileSync(path, 'utf8');
    assert.match(workflow, /gh api .*pulls\//, `${name} must read PR metadata from GitHub`);
    assert.match(workflow, /\.base\.sha/, `${name} must read PR base SHA`);
    assert.match(workflow, /\.head\.sha/, `${name} must read PR head SHA`);
    assert.match(workflow, /\.head\.ref/, `${name} must read PR head ref`);
    assert.match(workflow, /PR_HEAD_REF_DRIFT/, `${name} must fail closed on candidate branch drift`);
  }
});

test('workflow_dispatch never relies on protected GitHub default env for writer identity', () => {
  const shadow = fs.readFileSync('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  const verifier = fs.readFileSync('scripts/ci/repo-writer-shadow-verify.mjs', 'utf8');
  assert.match(shadow, /REPO_WRITER_HEAD_REF:[^\n]*inputs\.candidate_branch[^\n]*github\.head_ref/);
  assert.doesNotMatch(shadow, /^\s*GITHUB_HEAD_REF:/m);
  assert.match(verifier, /process\.env\.REPO_WRITER_HEAD_REF/);
});
