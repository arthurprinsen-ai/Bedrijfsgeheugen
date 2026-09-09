import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionLedger } from '../tools/content-growth/daily-blog.mjs';

test('selected candidate merged live is the only forward chain', () => {
  const selected = { state: 'selected', content_id: 'blog:a', slug: 'a' };
  const candidate = transitionLedger(selected, { state: 'candidate', candidate_pr: 1 });
  const merged = transitionLedger(candidate, { state: 'merged', merge_sha: 'abc' });
  const live = transitionLedger(merged, { state: 'live', live_url: 'https://www.bedrijfsgeheugen.nl/blog/a/' });
  assert.equal(live.state, 'live');
});

test('cannot skip from selected directly to live', () => {
  assert.throws(() => transitionLedger({ state: 'selected' }, { state: 'live' }), /invalid publication transition/);
});
