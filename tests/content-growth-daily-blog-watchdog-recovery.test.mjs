import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/daily-blog-live-watchdog.yml', 'utf8');

test('daily blog watchdog recovers historical unresolved records against current main', () => {
  assert.match(workflow, /uses: actions\/checkout@v5[\s\S]*?ref: main[\s\S]*?fetch-depth: 0/);
  assert.match(workflow, /if \(days\[today\] && days\[today\]\.state !== 'live'\) \{ console\.log\(today\); process\.exit\(0\); \}/);
  assert.match(workflow, /Object\.keys\(days\)\.filter\(d=>d<=today && days\[d\]\?\.state !== 'live'\)\.sort\(\)/);
  assert.match(workflow, /console\.log\(dates\.at\(-1\)\)/);
  assert.match(workflow, /export BASE_SHA="\$\(git rev-parse origin\/main\)"/);
  assert.doesNotMatch(workflow, /BASE_SHA: \$\{\{ github\.sha \}\}/);
});
