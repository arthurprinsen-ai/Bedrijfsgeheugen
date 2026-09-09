import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const nativeBlogChain = [
  '.github/workflows/native-approved-blog-supply.yml',
  '.github/workflows/daily-blog-publisher.yml',
  '.github/workflows/content-growth-learning.yml',
  '.github/workflows/daily-blog-live-watchdog.yml',
];

for (const path of nativeBlogChain) {
  test(`${path} exists and has no Make dependency`, () => {
    assert.equal(fs.existsSync(path), true, `${path} must exist as part of the native blog chain`);
    const text = fs.readFileSync(path,'utf8');
    assert.doesNotMatch(text, /make\.com|api\.make|scenarioId|hook\.make|make_webhook/i);
  });
}

test('native approved blog supply reads BRAIN learning and writes the Approved Blogtekst queue directly', () => {
  const path = '.github/workflows/native-approved-blog-supply.yml';
  assert.equal(fs.existsSync(path), true, 'native supply workflow must exist');
  const text = fs.readFileSync(path, 'utf8');
  assert.match(text, /\/api\/content-learning/);
  assert.match(text, /api\.notion\.com\/v1/);
  assert.match(text, /Approved Blogtekst/);
  assert.match(text, /Quality gate/);
  assert.match(text, /Autopublish toegestaan/);
  assert.doesNotMatch(text, /make\.com|api\.make|scenarioId|hook\.make|make_webhook/i);
});
