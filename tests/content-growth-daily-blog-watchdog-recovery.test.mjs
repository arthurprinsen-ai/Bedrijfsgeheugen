import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/daily-blog-live-watchdog.yml', 'utf8');

test('legacy daily blog watchdog reads only exact current business date without historical fallback', () => {
  assert.match(workflow, /uses: actions\/checkout@v5[\s\S]*?ref: main[\s\S]*?fetch-depth: 0/);
  assert.match(workflow, /REQUESTED_DATE/);
  assert.match(workflow, /businessDate\(new Date\(\),'Europe\/Amsterdam'\)/);
  assert.match(workflow, /NO_ACTION_LEGACY_LEDGER_DATE_MISSING/);
  assert.match(workflow, /CANONICAL_POWERHOUSE_OWNS_DATE/);
  assert.doesNotMatch(workflow, /Object\.keys\(days\)\.filter\(/);
  assert.doesNotMatch(workflow, /console\.log\(dates\.at\(-1\)\)/);
  assert.doesNotMatch(workflow, /BASE_SHA:\s*\$\{\{ github\.sha \}\}/);
});

test('legacy watchdog only reports independent production readback; canonical publisher owns writes', () => {
  assert.match(workflow, /^permissions:\n  contents: read\n/m);
  assert.match(workflow, /node tools\/content-growth\/live-readback\.mjs/);
  assert.match(workflow, /if: steps\.record\.outputs\.run == 'true'/);
  assert.match(workflow, /PROOF_WRITER:EXISTING_CANONICAL_POWERHOUSE_BLOG/);
  assert.match(workflow, /LEGACY_BLOG_WATCHDOG_READ_ONLY/);
  for (const forbidden of ['git add','git commit','git push','gh pr create','gh pr merge','createWriterCandidate']) {
    assert.doesNotMatch(workflow,new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
});
