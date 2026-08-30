import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const mustContain = (text, pattern, message) => assert.match(text, pattern, message);

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

test('Unified Brain Delivery consumes explicit immutable writer candidate identity', () => {
  const text = fs.readFileSync('.github/workflows/unified-brain-delivery.yml', 'utf8');
  for (const input of ['pr_number:', 'base_sha:', 'head_sha:', 'candidate_branch:']) mustContain(text, new RegExp(input), `Unified missing ${input}`);
  mustContain(text, /inputs\.head_sha/);
  mustContain(text, /inputs\.base_sha/);
  mustContain(text, /Validate explicitly dispatched PR identity/);
  mustContain(text, /PR_HEAD_SHA_DRIFT/);
});

test('all repository writers converge on the same immutable shadow', () => {
  const workflows = [
    'approved-central-blog.yml',
    'blog-bijwerken.yml',
    'menu-balk-fix.yml',
    'paginacontrole.yml',
    'regelgeving-bijwerken.yml',
    'seo-controle.yml',
    'weekblog.yml',
  ];
  for (const file of workflows) {
    const text = fs.readFileSync(`.github/workflows/${file}`, 'utf8');
    mustContain(text, /repo-writer-candidate-shadow\.yml/, `${file} must dispatch immutable shadow`);
  }
});

test('immutable shadow is the single universal handoff into central writer gates', () => {
  const shadow = fs.readFileSync('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  mustContain(shadow, /actions:\s*write/);
  mustContain(shadow, /repo-writer-gate-dispatch\.yml/);
  mustContain(shadow, /-f pr_number=\"\$PR_NUMBER\"/);
  mustContain(shadow, /-f base_sha=\"\$BASE_SHA\"/);
  mustContain(shadow, /-f head_sha=\"\$HEAD_SHA\"/);
  mustContain(shadow, /-f candidate_branch=\"\$CANDIDATE_BRANCH\"/);

  const menu = fs.readFileSync('.github/workflows/menu-balk-fix.yml', 'utf8');
  assert.doesNotMatch(menu, /repo-writer-gate-dispatch\.yml/, 'writers must not duplicate the central gate dispatch');
});
