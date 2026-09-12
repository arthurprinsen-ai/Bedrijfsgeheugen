import test from 'node:test';
import assert from 'node:assert/strict';
import { rankCandidates } from '../tools/content-growth/learning.mjs';

test('proven cross-channel revenue learning influences the next blog candidate and exposes application ids', () => {
  const candidates = [
    { content_id: 'blog:ai-automatisering-mkb', slug: 'ai-automatisering-mkb', title: 'AI automatisering MKB' },
    { content_id: 'blog:afas-koppeling', slug: 'afas-koppeling', title: 'AFAS koppeling' },
  ];
  const learning = {
    candidate_scores: {},
    exploit_candidates: [],
    revenue_learnings: [
      {
        learningId: 'rev-1',
        status: 'PROVEN',
        confidence: 0.9,
        effectSize: 4,
        fingerprint: 'blog|ai|automatisering|mkb',
        claim: 'AI automatisering voor het MKB converteert beter naar orders',
      },
    ],
  };
  const ranked = rankCandidates({ candidates, learning, policy: { explorationRatio: 0 }, date: '2026-09-13' });
  assert.equal(ranked[0].slug, 'ai-automatisering-mkb');
  assert.ok(ranked[0].score > ranked[1].score);
  assert.deepEqual(ranked[0].applied_revenue_learning_ids, ['rev-1']);
});

test('unrelated revenue learning is not falsely marked as applied', () => {
  const [candidate] = rankCandidates({
    candidates: [{ content_id: 'blog:afas-koppeling', slug: 'afas-koppeling', title: 'AFAS koppeling' }],
    learning: { revenue_learnings: [{ learningId: 'rev-x', status: 'PROVEN', confidence: 1, effectSize: 10, fingerprint: 'instagram|leadership|culture', claim: 'leadership culture' }] },
    policy: { explorationRatio: 0 },
    date: '2026-09-13',
  });
  assert.deepEqual(candidate.applied_revenue_learning_ids, []);
});
