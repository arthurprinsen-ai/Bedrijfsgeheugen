import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_PORTAL_STATE } from '../portal-v2/demo-state.js';

const portal=DEMO_PORTAL_STATE.portal;

test('demo contains every project data slice used by the V2 project workspace',()=>{
  assert.ok(portal.offer?.package);
  assert.ok(Array.isArray(portal.offer?.components) && portal.offer.components.length>=5);
  assert.ok(Array.isArray(portal.offer?.components?.[0]?.sprints) && portal.offer.components[0].sprints.length>0);
  assert.ok(Array.isArray(portal.offer?.components?.[0]?.stories) && portal.offer.components[0].stories.length>0);
  assert.ok(Array.isArray(portal.roadmap?.items) && portal.roadmap.items.length>=5);
  assert.ok(Array.isArray(portal.tasks?.items) && portal.tasks.items.length>=5);
  assert.ok(Array.isArray(portal.deliveryPlan?.features) && portal.deliveryPlan.features.length>=5);
  assert.ok(Array.isArray(portal.deliveryPlan?.stories) && portal.deliveryPlan.stories.length>=8);
  assert.ok(Array.isArray(portal.documents?.items) && portal.documents.items.length>=5);
  assert.ok(Array.isArray(portal.integrations?.items) && portal.integrations.items.length>=4);
});

test('canonical demo offer carries complete nested project scope, sprints and stories',()=>{
  assert.ok(portal.offer,'demo must expose the canonical project offer');
  assert.equal(portal.offer.number,'OFF-2026-041');
  assert.equal(portal.offer.components.length,5);
  assert.ok(portal.offer.components.every(component=>component.sprints?.length));
  assert.ok(portal.offer.components.every(component=>component.stories?.length));
  assert.equal(portal.delivery.sprints.length,5);
  assert.equal(portal.delivery.sprints.flatMap(sprint=>sprint.stories).length,14);
});
