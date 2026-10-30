import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/daily-blog-live-watchdog.yml','utf8');

test('legacy blog watchdog is current-date, read-only and never silently replays historic pending publication',()=>{
  // Original older 2025/early-2026 test incorrectly expected this read-only
  // watchdog to select historical non-live GitHub ledger dates and create a
  // candidate. The canonical Supabase Powerhouse publisher is the sole owner.
  assert.match(workflow,/uses: actions\/checkout@v5[\s\S]*?ref: main[\s\S]*?fetch-depth: 0/);
  assert.match(workflow,/businessDate\(new Date\(\),'Europe\/Amsterdam'\)/);
  assert.match(workflow,/NO_ACTION_LEGACY_LEDGER_DATE_MISSING/);
  assert.match(workflow,/CANONICAL_POWERHOUSE_OWNS_DATE/);
  assert.match(workflow,/if: steps\.record\.outputs\.run == 'true'/);
  assert.match(workflow,/if: steps\.record\.outputs\.run == 'true' && steps\.proof\.outputs\.ok == 'true'/);
  assert.match(workflow,/PROOF_WRITER:EXISTING_CANONICAL_POWERHOUSE_BLOG/);
  assert.match(workflow,/LEGACY_BLOG_WATCHDOG_READ_ONLY/);
  assert.doesNotMatch(workflow,/Object\.keys\(days\)\.filter/);
  assert.doesNotMatch(workflow,/console\.log\(dates\.at\(-1\)\)/);
  assert.doesNotMatch(workflow,/export BASE_SHA=|BASE_SHA:|gh pr create|gh pr merge|git push|git commit|createWriterCandidate/);
});

test('legacy watchdog never invents missing ledger dates or publication proof',()=>{
  assert.match(workflow,/if ! node -e "const x=require/);
  assert.match(workflow,/echo "run=false" >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow,/Exact production live-readback/);
  assert.match(workflow,/live-readback\.mjs/);
  assert.match(workflow,/steps\.record\.outputs\.state == 'live'/);
  assert.doesNotMatch(workflow,/publishBlog|record_content_publication_state|supabase\.from\(/);
});
