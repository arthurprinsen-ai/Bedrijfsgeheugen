import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('scripts/publish_approved_blog_v2.py', 'utf8');
const match = source.match(/def select_due_slug\(\):([\s\S]*?)\n\ndef actual_hash/);

assert.ok(match, 'select_due_slug must remain present');
const body = match[1];

test('due selector skips stale Pending rows already present in main and keeps searching', () => {
  assert.match(body, /for\s+row\s+in\s+rows\s*:/);
  assert.match(body, /STALE_QUEUE_ALREADY_IN_MAIN/);
  assert.match(body, /continue/);
  assert.doesNotMatch(body, /queue_contract\(rows\[0\]\)/);
});

test('stale reconciliation does not mutate queue state without production proof', () => {
  assert.doesNotMatch(body, /base\.req\(/);
  assert.doesNotMatch(body, /Dispatch status/);
  assert.match(body, /NO_DUE_BLOG/);
});
