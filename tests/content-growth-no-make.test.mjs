import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
for (const path of ['.github/workflows/daily-blog-publisher.yml','.github/workflows/content-growth-learning.yml','.github/workflows/daily-blog-live-watchdog.yml']) {
  test(`${path} has no Make dependency`, () => {
    const text = fs.existsSync(path) ? fs.readFileSync(path,'utf8') : '';
    assert.doesNotMatch(text, /make\.com|api\.make|scenarioId/i);
  });
}
