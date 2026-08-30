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
  for (const required of ['workflow_dispatch:', 'slug:', 'queue_page:', 'central_page:', 'content_id:', 'expected_title:', 'curl', 'canonical', 'verification attempt', 'notion_token']) {
    assert.equal(lower.includes(required), true, `missing verifier contract marker: ${required}`);
  }
});

test('verifier has bounded public retries and exact success writeback', () => {
  const text = workflow();
  assert.match(text, /for attempt in 1 2 3/);
  assert.match(text, /HTTP_CODE/);
  assert.match(text, /PUBLIC_PROOF_OK/);
  assert.match(text, /Dispatch status/);
  assert.match(text, /Published/);
  assert.match(text, /Publicatielink/);
  assert.match(text, /Publish Verified At/);
  assert.match(text, /Verified At/);
});

test('Notion writeback reuses the proven Python urllib transport', () => {
  const text = workflow();
  assert.match(text, /import json, os, urllib\.request/);
  assert.match(text, /NOTION_TOKEN.*strip\(\)/s);
  assert.match(text, /urllib\.request\.Request/);
  assert.match(text, /urllib\.request\.urlopen/);
  assert.equal(/curl[\s\S]{0,500}api\.notion\.com/i.test(text), false, 'Notion PATCH must not use the failing curl transport');
});

test('verifier cannot silently verify another article', () => {
  const text = workflow();
  assert.match(text, /EXPECTED_URL=.*\/blog\/\$\{SLUG\}\//);
  assert.match(text, /EXPECTED_TITLE/);
  assert.match(text, /QUEUE_PAGE/);
  assert.match(text, /CENTRAL_PAGE/);
});
