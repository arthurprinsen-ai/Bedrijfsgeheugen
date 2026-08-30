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

test('menu writer dispatches the central gate orchestrator after immutable shadow', () => {
  const text = fs.readFileSync('.github/workflows/menu-balk-fix.yml', 'utf8');
  mustContain(text, /repo-writer-gate-dispatch\.yml/);
  mustContain(text, /-f pr_number=\"\$PR_NUMBER\"/);
  mustContain(text, /-f base_sha=\"\$BASE_SHA\"/);
  mustContain(text, /-f head_sha=\"\$HEAD_SHA\"/);
  mustContain(text, /-f candidate_branch=\"\$CANDIDATE_BRANCH\"/);
});
