import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('approved blog publisher family and recovery tests stay classified as governed content delivery', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const paths = [
    'scripts/publish_approved_blog_v2_core.py',
    'scripts/publish_approved_blog_v2_future_helper.py',
    'tests/approved-blog-stale-reconciliation.test.mjs',
    'tests/approved-central-blog-candidate-mode.test.mjs',
  ];

  for (const path of paths) {
    const plan = createDeliveryPlan({ changedPaths: [path], headSha: 'abc123def4567890', policy });
    assert.deepEqual(
      plan.lanes.map((lane) => lane.id),
      ['backend', 'website'],
      `${path} must remain governed backend + website content delivery work`,
    );
  }
});

test('approved blog classification stays bounded and unrelated scripts remain fail-closed', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  assert.throws(
    () => createDeliveryPlan({ changedPaths: ['scripts/unowned_future_publisher.py'], headSha: 'abc123def4567890', policy }),
    /unclassified delivery path/,
  );
  assert.throws(
    () => createDeliveryPlan({ changedPaths: ['tests/unowned-future-content.test.mjs'], headSha: 'abc123def4567890', policy }),
    /unclassified delivery path/,
  );
});
