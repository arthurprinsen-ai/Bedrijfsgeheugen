import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync('.github/workflows/daily-blog-live-watchdog.yml','utf8');

test('legacy watchdog reads exact Amsterdam business date from current main, not a stale historical fallback',()=>{
  assert.match(workflow,/uses: actions\/checkout@v5[\s\S]*?ref: main[\s\S]*?fetch-depth: 0/);
  assert.match(workflow,/businessDate\(new Date\(\),'Europe\/Amsterdam'\)/);
  assert.ok(workflow.includes('process.exit(x.days?.[process.argv[1]]?0:2)'));
  assert.match(workflow,/NO_ACTION_LEGACY_LEDGER_DATE_MISSING/);
  assert.match(workflow,/CANONICAL_POWERHOUSE_OWNS_DATE/);
  assert.doesNotMatch(workflow,/Object\.keys\(days\)\.filter|dates\.at\(-1\)/);
});

test('missing exact ledger date is a safe no-op; only existing record can receive public HTML readback',()=>{
  assert.match(workflow,/echo "run=false" >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow,/echo "run=true" >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow,/if: steps\.record\.outputs\.run == 'true'/);
  assert.match(workflow,/node tools\/content-growth\/live-readback\.mjs/);
  assert.match(workflow,/DAILY_BLOG_NOT_LIVE/);
  assert.match(workflow,/PROOF_WRITER:EXISTING_CANONICAL_POWERHOUSE_BLOG/);
  assert.doesNotMatch(workflow,/BASE_SHA: \$\{\{ github\.sha \}\}|git push origin|publish_approved_blog_v2\.py/);
});

test('legacy watchdog cannot reintroduce a competing public proof writer',()=>{
  assert.match(workflow,/^permissions:\n  contents: read$/m);
  assert.doesNotMatch(workflow,/^\s*(?:pull-requests|actions): write\s*$/m);
  for(const command of ['git add','git commit','git push','gh pr create','gh pr merge',
     'repo-writer-candidate-shadow.yml','Materialize live proof into ledger',
     'Commit proof candidate only','Open proof PR and dispatch BRAIN shadow']){
    assert.equal(workflow.includes(command),false,'legacy watchdog must not execute: '+command);
  }
});
