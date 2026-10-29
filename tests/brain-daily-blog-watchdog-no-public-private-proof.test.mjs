import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = () => readFileSync(new URL('../.github/workflows/daily-blog-live-watchdog.yml', import.meta.url), 'utf8');

test('legacy daily blog watchdog is read-only and cannot publish private proof to GitHub', () => {
  const source = workflow();
  assert.match(source, /^permissions:\n  contents: read\n/m);
  assert.doesNotMatch(source, /^\s*(?:pull-requests|actions): write\s*$/m);
  for(const command of ['git add','git commit','git push','gh pr create','gh pr merge','writeFileSync','createWriterCandidate']) {
    assert.equal(source.includes(command), false, 'legacy watchdog cannot perform: '+command);
  }
  assert.match(source, /node tools\/content-growth\/live-readback\.mjs/);
  assert.match(source, /LEGACY_BLOG_WATCHDOG_READ_ONLY/);
  assert.match(source, /PROOF_WRITER:EXISTING_CANONICAL_POWERHOUSE_BLOG/);
});

test('read-only watchdog retains original triggers but no alternate scheduler', () => {
  const source=workflow();
  assert.match(source, /on:\n  push:/);
  assert.match(source, /schedule:\n    - cron: '30 17 \* \* \*'/);
  assert.match(source, /workflow_dispatch:/);
  assert.match(source, /node --test tests\/brain-daily-blog-watchdog-no-public-private-proof\.test\.mjs/);
});

test('stale legacy GitHub ledger never selects an older date as current proof', () => {
  const source=workflow();
  assert.match(source, /NO_ACTION_LEGACY_LEDGER_DATE_MISSING/);
  assert.match(source, /CANONICAL_POWERHOUSE_OWNS_DATE/);
  assert.doesNotMatch(source, /const dates=Object\.keys\(days\)/);
  assert.match(source, /if: steps\.record\.outputs\.run == 'true'/);
  assert.match(source, /if: steps\.record\.outputs\.run == 'true' && steps\.record\.outputs\.state == 'live'/);
  assert.match(source, /if: steps\.record\.outputs\.run == 'true' && steps\.proof\.outputs\.ok == 'true'/);
});
