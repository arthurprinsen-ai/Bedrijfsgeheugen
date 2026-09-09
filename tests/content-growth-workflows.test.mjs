import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }

test('daily publisher is scheduled, native, candidate-only and idempotent', () => {
  const text = read('.github/workflows/daily-blog-publisher.yml');
  assert.match(text, /schedule:/);
  assert.match(text, /workflow_dispatch:/);
  assert.match(text, /Europe\/Amsterdam/);
  assert.match(text, /content-publication-ledger\.json/);
  assert.match(text, /publish_approved_blog_v2\.py/);
  assert.match(text, /repo-writer-candidate\.mjs/);
  assert.doesNotMatch(text, /make\.com|Make scenario|api\.make/);
  assert.doesNotMatch(text, /git push origin\s+(HEAD:)?main/);
});

test('learning workflow aggregates blogs linkedin and social without publish authority', () => {
  const text = read('.github/workflows/content-growth-learning.yml');
  assert.match(text, /schedule:/);
  assert.match(text, /aggregate\.mjs/);
  assert.match(text, /learning\.mjs/);
  assert.match(text, /blog/);
  assert.match(text, /linkedin/);
  assert.match(text, /social/);
  assert.doesNotMatch(text, /pull-requests:\s*write/);
});

test('watchdog requires exact live proof and never selects a second candidate', () => {
  const text = read('.github/workflows/daily-blog-live-watchdog.yml');
  assert.match(text, /live-readback\.mjs/);
  assert.match(text, /content-publication-ledger\.json/);
  assert.doesNotMatch(text, /publish_approved_blog_v2\.py/);
  assert.doesNotMatch(text, /SELECT_CANDIDATE/);
});
