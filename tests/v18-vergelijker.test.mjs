import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BEWEGING_CSS } from '../tools/v18-beweging.mjs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('vergelijker houdt beide tekstlagen leesbaar tijdens slepen', () => {
  assert.match(
    BEWEGING_CSS,
    /\.bgx-vergelijk \.straks\{[^}]*padding-left:calc\(var\(--bgx-grens,50%\) \+ 28px\)/s,
    'De rechter tekst moet met de scheidslijn meeschuiven zodat hij niet achter de clip verdwijnt.'
  );
  assert.match(
    BEWEGING_CSS,
    /\.bgx-vergelijk \.nu li\{[^}]*color:rgba\(255,255,255,\.9\)!important/s,
    'Tekst aan de donkere kant moet expliciet voldoende contrast houden.'
  );
});

test('V18 interactieve websitecode en regressietests horen bij de website delivery lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  for (const path of ['tools/v18-beweging.mjs', 'tests/v18-vergelijker.test.mjs']) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'c0ffee1234567890', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['website'], `${path} must be website delivery work`);
  }
});
