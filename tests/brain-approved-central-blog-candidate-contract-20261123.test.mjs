import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/approved-central-blog.yml', 'utf8');
const selector = fs.readFileSync('scripts/publish_approved_blog_v2.py', 'utf8');

test('original approved central writer emits protected machine metadata bound to exact approved source', () => {
  for (const field of ['Obligation-ID:', 'Delivery-Lane:', 'Candidate-Type:', 'Base-SHA:', 'Change-Scope:', 'Scope-Budget:']) {
    assert.ok(workflow.includes(field), 'missing '+field);
  }
  assert.match(workflow, /PR_BODY/);
  assert.match(workflow, /--body "\$PR_BODY"/);
  assert.match(workflow, /queue_page/);
  assert.match(workflow, /source_hash/);
  assert.match(workflow, /SOURCE_SHA/);
  assert.doesNotMatch(workflow, /gh\s+pr\s+merge/);
  assert.doesNotMatch(workflow, /git\s+push\s+origin\s+HEAD:main/);
});

test('candidate exact source closure is mandatory and independent delivery remains protected', () => {
  assert.match(workflow, /Preserve source-bound Brain candidate closure/);
  for (const path of ['brain/learning/', 'docs/changes/', 'docs/development-ledger-events/']) assert.ok(workflow.includes(path));
  assert.match(workflow, /required_closure\.issubset\(changed\)/);
  assert.match(workflow, /current_state.*CANDIDATE_NOT_LIVE/);
  assert.match(workflow, /production_authority=BG169/);
});

test('canonical redirect/typo article is never selected for repeated publication', () => {
  assert.match(selector, /is_redirected_blog_slug/);
  assert.match(selector, /if is_redirected_blog_slug\(q\['slug'\]\)/);
  assert.match(selector, /CANONICAL_REDIRECT_DUPLICATE/);
  const redirects = fs.readFileSync('_redirects', 'utf8');
  assert.match(redirects, /\/blog\/onprijsd-probleem-bedrijfsvoering\/\s+\/blog\/ongeprijsd-probleem-bedrijfsvoering\/\s+301!/);
});
