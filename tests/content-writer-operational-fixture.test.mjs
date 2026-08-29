import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const approved = fs.readFileSync('.github/workflows/approved-central-blog.yml', 'utf8');
const harness = fs.readFileSync('.github/workflows/repo-writer-operational-verification.yml', 'utf8');

test('approved central operational verification is fixture-only and candidate-only', () => {
  assert.match(approved, /verification_mode:[\s\S]*?default:\s*false/);
  assert.match(approved, /VERIFICATION_MODE/);
  assert.match(approved, /VERIFICATION_REQUIRES_CANDIDATE_PR/);
  assert.match(approved, /writer-verification-approved-central/);
  assert.match(approved, /if \[ "\$VERIFICATION_MODE" = "true" \]/);
  assert.match(approved, /else[\s\S]*?publish_approved_blog_v2\.py/);
});

test('trusted harness forces approved central verification fixture plus candidate delivery', () => {
  const section = harness.split('dispatch-approved-central-blog-candidate:')[1]?.split('dispatch-blog-bijwerken-candidate:')[0] || '';
  assert.match(section, /approved-central-blog\.yml/);
  assert.match(section, /delivery_mode=candidate-pr/);
  assert.match(section, /verification_mode=true/);
  assert.doesNotMatch(section, /delivery_mode=direct/);
});
