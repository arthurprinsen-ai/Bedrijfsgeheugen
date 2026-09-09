import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/daily-blog-publisher.yml', 'utf8');
const publisher = fs.readFileSync('scripts/publish_approved_blog_v2.py', 'utf8');

test('daily publisher requires a learning-driven candidate selection before render', () => {
  assert.match(workflow, /content-learning/i, 'daily workflow must fetch or materialize content learning before selection');
  assert.match(workflow, /--list-candidates/, 'daily workflow must collect all eligible candidates');
  assert.match(workflow, /select-candidate\.mjs|prepare-daily-publication\.mjs/, 'daily workflow must rank/select candidates through the content-growth decision layer');
  assert.match(workflow, /FORCE_SLUG/, 'ranked winner must be passed into the approved publisher as an exact slug');
});

test('approved publisher no longer owns implicit oldest-first production selection', () => {
  assert.match(publisher, /def get_queue\(force=''/);
  assert.match(publisher, /if not force:/, 'unforced render must be rejected so production cannot silently fall back to rows[0]');
  assert.match(publisher, /learning-driven selection required/i);
});

test('daily workflow records explicit cold-start fallback semantics', () => {
  assert.match(workflow, /cold[-_ ]start|fallback/i);
  assert.match(workflow, /learning.*stale|stale.*learning/i);
});
