import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('repository writer contract tests remain owned by the automation delivery lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const paths = [
    'tests/menu-balk-writer-noop-proof.test.mjs',
    'tests/repository-writer-permission-boundary.test.mjs',
    'tests/repository-writer-slow-canary-sla.test.mjs',
  ];

  for (const path of paths) {
    const plan = createDeliveryPlan({ changedPaths: [path], headSha: 'abc123def4567890', policy });
    assert.deepEqual(
      plan.lanes.map((lane) => lane.id),
      ['automation'],
      `${path} must remain governed automation delivery work`,
    );
  }
});

test('repository writer classification stays bounded and unrelated tests remain fail-closed', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  assert.throws(
    () => createDeliveryPlan({ changedPaths: ['tests/unowned-future-writer-contract.test.mjs'], headSha: 'abc123def4567890', policy }),
    /unclassified delivery path/,
  );
});
