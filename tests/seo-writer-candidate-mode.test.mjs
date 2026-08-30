import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/seo-controle.yml', 'utf8');

test('automatic and manual SEO repair runs are candidate-only', () => {
  assert.match(workflow, /delivery_mode:[\s\S]*?default:\s*candidate-pr/);
  assert.match(workflow, /push:[\s\S]*?branches:\s*\[main\]/);
  assert.doesNotMatch(workflow, /default:\s*direct\b/);
  assert.doesNotMatch(workflow, /git\s+push\s+origin\s+HEAD:main/);
});

test('SEO candidate uses canonical writer candidate with exact two-file allowlist', () => {
  assert.match(workflow, /repo-writer-candidate\.mjs/);
  assert.match(workflow, /writer:\s*'seo-controle'/);
  assert.match(workflow, /allowedFiles:\s*\['netlify\.toml',\s*'sitemap\.xml'\]/);
});

test('SEO candidate opens PR but never merges itself', () => {
  assert.match(workflow, /gh\s+pr\s+create/);
  assert.doesNotMatch(workflow, /gh\s+pr\s+merge/);
  assert.match(workflow, /production_authority=BG169/);
});
