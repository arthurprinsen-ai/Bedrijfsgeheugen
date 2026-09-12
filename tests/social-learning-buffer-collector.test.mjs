import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBufferMetricName,
  normalizeBufferPost,
  buildBufferPostsQuery,
  collectBufferPosts,
} from '../netlify/functions/_buffer-social-collector.mjs';

test('normalizes Buffer metrics into canonical learning metrics', () => {
  assert.equal(normalizeBufferMetricName('impressions'), 'impressions');
  assert.equal(normalizeBufferMetricName('reach'), 'reach');
  assert.equal(normalizeBufferMetricName('reactions'), 'likes');
  assert.equal(normalizeBufferMetricName('comments'), 'comments');
  assert.equal(normalizeBufferMetricName('shares'), 'shares');
  assert.equal(normalizeBufferMetricName('clicks'), 'clicks');
});

test('normalizes a sent Buffer post into a social outcome envelope', () => {
  const post = normalizeBufferPost({
    id: 'buf-1', text: 'Example', dueAt: '2026-09-09T08:00:00Z', channelId: 'ch-1',
    metricsUpdatedAt: '2026-09-09T09:00:00Z',
    metrics: [
      { type: 'impressions', value: 1000 },
      { type: 'reactions', value: 20 },
      { type: 'comments', value: 5 },
      { type: 'shares', value: 2 },
    ],
  }, { tenantId: 'canonical', platform: 'linkedin', observedAt: '2026-09-09T09:00:00Z' });
  assert.equal(post.externalPostId, 'buf-1');
  assert.equal(post.source, 'buffer');
  assert.equal(post.metrics.impressions, 1000);
  assert.equal(post.metrics.likes, 20);
  assert.equal(post.metrics.comments, 5);
  assert.equal(post.metrics.shares, 2);
  assert.equal(post.contentHash.length, 64);
});

test('preserves Buffer channel identity so personal and company LinkedIn do not collapse together', () => {
  const personal = normalizeBufferPost({
    id: 'buf-personal', text: 'P', dueAt: '2026-09-12T08:00:00Z', channelId: 'li-personal', metrics: [],
  }, {
    tenantId: 'canonical', service: 'linkedin', channelName: 'Arthur Prinsen', channelKind: 'linkedin_personal', observedAt: '2026-09-12T09:00:00Z',
  });
  const company = normalizeBufferPost({
    id: 'buf-company', text: 'C', dueAt: '2026-09-12T08:00:00Z', channelId: 'li-company', metrics: [],
  }, {
    tenantId: 'canonical', service: 'linkedin', channelName: 'Bedrijfsgeheugen', channelKind: 'linkedin_company', observedAt: '2026-09-12T09:00:00Z',
  });
  assert.equal(personal.channelId, 'li-personal');
  assert.equal(personal.channelName, 'Arthur Prinsen');
  assert.equal(personal.channelKind, 'linkedin_personal');
  assert.equal(company.channelId, 'li-company');
  assert.equal(company.channelName, 'Bedrijfsgeheugen');
  assert.equal(company.channelKind, 'linkedin_company');
});

test('builds paginated sent-post query with metrics', () => {
  const query = buildBufferPostsQuery({ organizationId: 'org-1', channelIds: ['ch-1'], after: 'cursor-1' });
  assert.match(query.query, /posts\s*\(/);
  assert.match(query.query, /metrics\s*\{/);
  assert.deepEqual(query.variables.channelIds, ['ch-1']);
  assert.equal(query.variables.after, 'cursor-1');
});

test('collector follows Buffer cursor pagination and ingests every sent post', async () => {
  const pages = [
    { data: { posts: { edges: [{ node: { id: 'p1', text: 'A', dueAt: '2026-09-08T08:00:00Z', channelId: 'c1', metricsUpdatedAt: '2026-09-09T08:00:00Z', metrics: [{ type: 'impressions', value: 100 }] } }], pageInfo: { hasNextPage: true, endCursor: 'next' } } } },
    { data: { posts: { edges: [{ node: { id: 'p2', text: 'B', dueAt: '2026-09-08T09:00:00Z', channelId: 'c1', metricsUpdatedAt: '2026-09-09T08:00:00Z', metrics: [{ type: 'impressions', value: 200 }] } }], pageInfo: { hasNextPage: false, endCursor: null } } } },
  ];
  let calls = 0;
  const ingested = [];
  const fetchFn = async () => new Response(JSON.stringify(pages[calls++]), { status: 200, headers: { 'content-type': 'application/json' } });
  const result = await collectBufferPosts({
    apiKey: 'secret', organizationId: 'org-1', channelIds: ['c1'], tenantId: 'canonical',
    fetchFn, ingest: async envelope => ingested.push(envelope), now: new Date('2026-09-09T10:00:00Z'),
  });
  assert.equal(result.pages, 2);
  assert.equal(result.posts, 2);
  assert.deepEqual(ingested.map(x => x.externalPostId), ['p1','p2']);
});

test('collector fails closed when Buffer API key is absent', async () => {
  await assert.rejects(() => collectBufferPosts({ organizationId: 'org-1', channelIds: ['c1'] }), /BUFFER_API_KEY_REQUIRED/);
});
