import test from 'node:test';
import assert from 'node:assert/strict';
import { injectGrowthMeasurement } from '../tools/seo-order-engine/measurement.mjs';
import { normalizeBehaviorEvent } from '../tools/seo-growth/normalize-observation.mjs';
import './seo-order-measurement.test.mjs';

// Public-safe evaluated learning: no raw form data, recipient or provider IDs.
test('BRAIN: form intent events are measurable, not independently verified lead outcomes', () => {
  const canonical = 'https://www.bedrijfsgeheugen.nl/zelfscan';
  for (const event_type of ['form_start', 'form_submit_intent']) {
    const observation = normalizeBehaviorEvent({event_id:'unit-' + event_type,event_type,canonical});
    assert.equal(observation.event_type,event_type);
    assert.equal(observation.kind,'behavior');
  }
  const html = injectGrowthMeasurement('<html><body><main></main></body></html>',{canonical});
  assert.match(html,/form_submit_intent/);
  assert.match(html,/var startedForms=new WeakSet\(\)/);
});
