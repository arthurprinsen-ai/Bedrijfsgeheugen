import test from 'node:test';
import assert from 'node:assert/strict';
import { businessDate, resolveDailyPublication, transitionLedger } from '../tools/content-growth/daily-blog.mjs';

test('business date uses Europe/Amsterdam rather than UTC day', () => {
  assert.equal(businessDate(new Date('2026-09-08T22:30:00Z')), '2026-09-09');
  assert.equal(businessDate(new Date('2026-01-01T23:30:00Z')), '2026-01-02');
});

test('selects exactly one deterministic eligible candidate for empty date', () => {
  const input = {
    date: '2026-09-09',
    ledger: { version: 1, days: {} },
    candidates: [
      { content_id: 'blog:b', slug: 'b', score: 3 },
      { content_id: 'blog:a', slug: 'a', score: 8 }
    ],
    learning: {},
    policy: { explorationRatio: 0.2 }
  };
  const first = resolveDailyPublication(input);
  const second = resolveDailyPublication(input);
  assert.equal(first.type, 'SELECT_CANDIDATE');
  assert.equal(first.candidate.content_id, 'blog:a');
  assert.equal(second.candidate.content_id, first.candidate.content_id);
});

test('live date is idempotent and never selects a second article', () => {
  const record = { date: '2026-09-09', content_id: 'blog:a', slug: 'a', state: 'live' };
  const result = resolveDailyPublication({
    date: '2026-09-09',
    ledger: { version: 1, days: { '2026-09-09': record } },
    candidates: [{ content_id: 'blog:b', slug: 'b', score: 999 }]
  });
  assert.equal(result.type, 'NO_ACTION_LIVE');
  assert.equal(result.record.content_id, 'blog:a');
});

test('incomplete date resumes same content id', () => {
  const record = { date: '2026-09-09', content_id: 'blog:a', slug: 'a', state: 'candidate' };
  const result = resolveDailyPublication({
    date: '2026-09-09',
    ledger: { version: 1, days: { '2026-09-09': record } },
    candidates: [{ content_id: 'blog:b', slug: 'b' }]
  });
  assert.equal(result.type, 'RESUME_EXISTING');
  assert.equal(result.record.content_id, 'blog:a');
});

test('already used content cannot be reused on another date', () => {
  const result = resolveDailyPublication({
    date: '2026-09-10',
    ledger: { version: 1, days: { '2026-09-09': { content_id: 'blog:a', slug: 'a', state: 'live' } } },
    candidates: [{ content_id: 'blog:a', slug: 'a', score: 100 }]
  });
  assert.equal(result.type, 'NO_ELIGIBLE_DAILY_BLOG');
});

test('transition state is monotonic and rejects skipping proof', () => {
  const selected = { content_id: 'blog:a', slug: 'a', state: 'selected' };
  const candidate = transitionLedger(selected, { state: 'candidate', candidate_pr: 42 });
  assert.equal(candidate.state, 'candidate');
  assert.throws(() => transitionLedger(candidate, { state: 'live' }), /invalid publication transition/);
});
