import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/seo-controle.yml', 'utf8');

test('automatic SEO runs remain direct while manual runs can choose candidate-pr', () => {
  assert.match(workflow, /delivery_mode:[\s\S]*?default:\s*direct/);
  assert.match(workflow, /DELIVERY_MODE:[\s\S]*?github\.event_name/);
  assert.match(workflow, /push:[\s\S]*?branches:\s*\[main\]/);
});

test('SEO candidate uses canonical writer candidate with exact two-file allowlist', () => {
  assert.match(workflow, /repo-writer-candidate\.mjs/);
  assert.match(workflow, /writer:\s*'seo-controle'/);
  assert.match(workflow, /allowedFiles:\s*\['netlify\.toml',\s*'sitemap\.xml'\]/);
});

test('SEO candidate opens PR but never merges itself', () => {
  assert.match(workflow, /gh\s+pr\s+create/);
  assert.doesNotMatch(workflow, /gh\s+pr\s+merge/);
  assert.match(workflow, /pull-requests:\s*write/);
});
