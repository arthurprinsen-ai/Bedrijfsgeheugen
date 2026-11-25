import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Original owner: protected Supabase Powerhouse blog publisher.
// This legacy GitHub watchdog is deliberately READ-ONLY, never a second proof writer.
const source=readFileSync('.github/workflows/daily-blog-live-watchdog.yml','utf8');

test('live blog readback uses exact business date, independent HTML and fail-closed evidence',()=>{
  assert.match(source,/BUSINESS_TIME_ZONE: Europe\/Amsterdam/);
  assert.match(source,/businessDate\(new Date\(\),'Europe\/Amsterdam'\)/);
  assert.match(source,/NO_ACTION_LEGACY_LEDGER_DATE_MISSING/);
  assert.match(source,/CANONICAL_POWERHOUSE_OWNS_DATE/);
  assert.match(source,/node tools\/content-growth\/live-readback\.mjs "\$url" "\$CONTENT_ID" "\$SLUG"/);
  assert.match(source,/DAILY_BLOG_NOT_LIVE/);
  assert.match(source,/if: steps\.record\.outputs\.run == 'true'/);
});

test('semantic closure belongs to original publisher, not a synthetic GitHub proof write',()=>{
  assert.match(source,/PROOF_WRITER:EXISTING_CANONICAL_POWERHOUSE_BLOG/);
  assert.match(source,/LEGACY_BLOG_WATCHDOG_READ_ONLY/);
  assert.match(source,/if: steps\.record\.outputs\.run == 'true' && steps\.proof\.outputs\.ok == 'true'/);
  assert.doesNotMatch(source,/ledger\.days\[date\]\s*=/);
  assert.doesNotMatch(source,/Materialize live proof into ledger|Commit proof candidate only/);
});

test('read-only watcher cannot claim protected writer authority or create duplicate publication',()=>{
  assert.match(source,/^permissions:\n  contents: read\n/m);
  assert.match(source,/name: Stop when ledger already records live proof/);
  assert.match(source,/node tools\/content-growth\/assert-live-ledger\.mjs/);
  for(const forbidden of ['gh pr create','gh pr merge','git add','git commit','git push','writeFileSync','createWriterCandidate']){
    assert.equal(source.includes(forbidden),false,forbidden+' cannot appear in read-only watchdog');
  }
  assert.doesNotMatch(source,/^\s+(?:pull-requests|actions): write\s*$/m);
});
