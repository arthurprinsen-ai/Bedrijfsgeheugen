import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const mustContain = (text, pattern, message) => assert.match(text, pattern, message);
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('central writer gate orchestrator validates immutable PR identity and fans out gates', () => {
  const path = '.github/workflows/repo-writer-gate-dispatch.yml';
  assert.equal(fs.existsSync(path), true, 'central writer gate workflow must exist');
  const text = fs.readFileSync(path, 'utf8');
  for (const input of ['pr_number:', 'base_sha:', 'head_sha:', 'candidate_branch:']) mustContain(text, new RegExp(input), `missing ${input}`);
  mustContain(text, /Validate immutable PR identity/);
  mustContain(text, /PR_BASE_SHA_DRIFT/);
  mustContain(text, /PR_HEAD_SHA_DRIFT/);
  mustContain(text, /PR_HEAD_REF_DRIFT/);
  mustContain(text, /shared-memory:/);
  mustContain(text, /brain-foundation:/);
  mustContain(text, /v18-and-writer-operational:/);
  mustContain(text, /dispatch-unified:/);
  mustContain(text, /needs:\s*\[validate, shared-memory, brain-foundation, v18-and-writer-operational\]/);
  mustContain(text, /unified-brain-delivery\.yml/);
});

test('central writer gates use authoritative commands rather than nonexistent npm aliases', () => {
  const text = fs.readFileSync('.github/workflows/repo-writer-gate-dispatch.yml', 'utf8');
  mustContain(text, /node scripts\/brain\/test-all\.mjs/);
  mustContain(text, /tests\/v18-production-promotion\.test\.mjs/);
  mustContain(text, /tests\/v18-seo-layer\.test\.mjs/);
  mustContain(text, /tests\/site-baseline-guardian\.test\.mjs/);
  assert.doesNotMatch(text, /npm run test:brain/);
  assert.doesNotMatch(text, /npm run v18:verify/);
});

test('Unified Brain Delivery consumes explicit immutable writer candidate identity', () => {
  const text = fs.readFileSync('.github/workflows/unified-brain-delivery.yml', 'utf8');
  for (const input of ['pr_number:', 'base_sha:', 'head_sha:', 'candidate_branch:']) mustContain(text, new RegExp(input), `Unified missing ${input}`);
  mustContain(text, /inputs\.head_sha/);
  mustContain(text, /inputs\.base_sha/);
  mustContain(text, /Validate explicitly dispatched PR identity/);
  mustContain(text, /PR_HEAD_SHA_DRIFT/);
});

test('all repository writers converge exactly once on the immutable shadow', () => {
  const selfDispatch = [
    'approved-central-blog.yml',
    'blog-bijwerken.yml',
    'menu-balk-fix.yml',
  ];
  const genericDispatch = [
    'paginacontrole.yml',
    'regelgeving-bijwerken.yml',
    'seo-controle.yml',
    'weekblog.yml',
  ];
  const operational = fs.readFileSync('.github/workflows/repo-writer-operational-verification.yml', 'utf8');

  for (const file of selfDispatch) {
    const text = fs.readFileSync(`.github/workflows/${file}`, 'utf8');
    mustContain(text, /repo-writer-candidate-shadow\.yml/, `${file} must self-dispatch immutable shadow`);
  }

  for (const file of genericDispatch) {
    const text = fs.readFileSync(`.github/workflows/${file}`, 'utf8');
    assert.doesNotMatch(text, /repo-writer-candidate-shadow\.yml/, `${file} must not duplicate generic immutable shadow dispatch`);
    const writer = file.replace(/\.yml$/, '');
    mustContain(operational, new RegExp(`verify/${escapeRegex(writer)}-\\*`), `${file} missing generic verification route`);
    mustContain(operational, new RegExp(`WRITER='${escapeRegex(writer)}';\\s*WORKFLOW='${escapeRegex(file)}';\\s*GENERIC_SHADOW='true'`), `${file} must use generic immutable shadow exactly once`);
  }
  mustContain(operational, /repo-writer-candidate-shadow\.yml/, 'generic handoff must dispatch immutable shadow');
});

test('immutable shadow is the single universal handoff into central writer gates', () => {
  const shadow = fs.readFileSync('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  mustContain(shadow, /actions:\s*write/);
  mustContain(shadow, /repo-writer-gate-dispatch\.yml/);
  mustContain(shadow, /-f pr_number=\"\$PR_NUMBER\"/);
  mustContain(shadow, /-f base_sha=\"\$BASE_SHA\"/);
  mustContain(shadow, /-f head_sha=\"\$HEAD_SHA\"/);
  mustContain(shadow, /-f candidate_branch=\"\$CANDIDATE_BRANCH\"/);

  for (const file of ['menu-balk-fix.yml', 'approved-central-blog.yml', 'blog-bijwerken.yml', 'paginacontrole.yml', 'regelgeving-bijwerken.yml', 'seo-controle.yml', 'weekblog.yml']) {
    const text = fs.readFileSync(`.github/workflows/${file}`, 'utf8');
    assert.doesNotMatch(text, /repo-writer-gate-dispatch\.yml/, `${file} must not duplicate central gate dispatch`);
  }
});
