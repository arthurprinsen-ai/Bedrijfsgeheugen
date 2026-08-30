import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const workflowPath = '.github/workflows/verify-approved-central-blog.yml';

function workflow() {
  assert.ok(existsSync(workflowPath), `${workflowPath} must exist`);
  return readFileSync(workflowPath, 'utf8');
}

test('approved blog verifier is independent, bounded and non-generative', () => {
  const text = workflow();
  const lower = text.toLowerCase();
  for (const forbidden of ['anthropic', 'claude-code-action', 'api.openai.com', 'generatecontent', 'weekblog.yml/dispatches']) {
    assert.equal(lower.includes(forbidden), false, `forbidden verifier dependency: ${forbidden}`);
  }
  for (const required of ['workflow_dispatch:', 'slug:', 'queue_page:', 'central_page:', 'content_id:', 'expected_title:', 'curl', 'canonical', 'verification attempt']) {
    assert.equal(lower.includes(required), true, `missing approved-content contract marker: ${required}`);
  }
});

test('verifier is proof-only; Make owns Notion writeback', () => {
  const text = workflow();
  const lower = text.toLowerCase();
  for (const forbidden of ['notion_token', 'api.notion.com', 'dispatch status', 'publicatielink', 'publish verified at', 'urllib.request']) {
    assert.equal(lower.includes(forbidden), false, `GitHub verifier must not own Notion state: ${forbidden}`);
  }
  assert.match(text, /PUBLIC_PROOF_OK/);
});

test('verifier has bounded public retries and exact correlation identity', () => {
  const text = workflow();
  assert.match(text, /run-name:\s*Verify approved blog \$\{\{ inputs\.content_id \}\} \$\{\{ inputs\.slug \}\}/);
  assert.match(text, /for attempt in 1 2 3/);
  assert.match(text, /HTTP_CODE/);
  assert.match(text, /EXPECTED_URL=.*\/blog\/\$\{SLUG\}\//);
  assert.match(text, /EXPECTED_TITLE/);
  assert.match(text, /QUEUE_PAGE/);
  assert.match(text, /CENTRAL_PAGE/);
});
