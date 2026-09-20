import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('daily blog material candidate carries same-lineage learning, ledger and human documentation', () => {
  const learning=JSON.parse(readFileSync('brain/learning/2026-09-20-content-daily-blog-excel-version-control-v1.json','utf8'));
  const ledger=readFileSync('docs/development-ledger-events/2026-09-20-content-daily-blog-excel-version-control-v1.md','utf8');
  const docs=readFileSync('docs/learning/2026-09-20-content-daily-blog-excel-version-control-v1.md','utf8');
  assert.equal(learning.obligation_id,'content-daily-blog-20260920-excel-version-control-v1');
  assert.match(ledger,/content-daily-blog-20260920-excel-version-control-v1|daily blog/i);
  assert.match(docs,/daily blog|Excel/i);
});
