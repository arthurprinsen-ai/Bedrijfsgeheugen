import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_PORTAL_STATE } from '../portal-v2/demo-state.js';
import { pagePresentation } from '../portal-v2/page-shell.js';

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

test('offerte presentation carries the complete nested project offer instead of only four summary metrics',()=>{
  const view=pagePresentation('offerte',DEMO_PORTAL_STATE);
  assert.ok(view.projectOffer,'offerte page must expose a projectOffer model');
  assert.equal(view.projectOffer.number,portal.offer.number);
  assert.equal(view.projectOffer.components.length,portal.offer.components.length);
  assert.ok(view.projectOffer.components.some(component=>component.sprints?.length));
  assert.ok(view.projectOffer.components.some(component=>component.stories?.length));
});
