import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_PORTAL_STATE, DEMO_USER } from '../portal-v2/demo-state.js';
import { createPortalStateClient, isPortalDemoRoute } from '../portal-v2/portal-state.js';

const clone = value => structuredClone(value);

test('demo fixture is fictional and sufficiently filled for the project cockpit', () => {
  const json = JSON.stringify(DEMO_PORTAL_STATE).toLowerCase();
  assert.equal(json.includes('ijsselmonde'), false);
  assert.equal(DEMO_PORTAL_STATE.company.portalBrand.name, 'Noordwind Services B.V. — Demo');
  assert.equal(DEMO_PORTAL_STATE.portal.project.phase, 'Bouwen');
  assert.equal(DEMO_PORTAL_STATE.portal.offer.status, 'Akkoord');
  assert.equal(DEMO_PORTAL_STATE.portal.project.budget, 24800);
  assert.equal(DEMO_PORTAL_STATE.portal.project.hours, 86);
  assert.ok(DEMO_PORTAL_STATE.portal.project.buildItems.length >= 4);
  assert.ok(DEMO_PORTAL_STATE.portal.integrations.items.length >= 4);
  assert.ok(DEMO_PORTAL_STATE.portal.delivery.openTasks >= 1);
  assert.ok(DEMO_PORTAL_STATE.portal.documents.items.length >= 3);
  assert.ok(DEMO_PORTAL_STATE.portal.notes.items.length >= 2);
  assert.ok(DEMO_PORTAL_STATE.portal.activity.length >= 4);
  assert.ok(DEMO_PORTAL_STATE.portal.team.users.length >= 3);
  assert.equal(DEMO_USER.email, 'demo@bedrijfsgeheugen.nl');
});

test('only the explicit public demo route enables demo mode', () => {
  assert.equal(isPortalDemoRoute('/portaal/demo'), true);
  assert.equal(isPortalDemoRoute('/portaal/demo/'), true);
  assert.equal(isPortalDemoRoute('/portal-v2/'), false);
  assert.equal(isPortalDemoRoute('/portaal/ijsselmonde'), false);
});

test('demo client loads and writes in memory without calling the network', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; throw new Error('network must not be used'); };
  const client = createPortalStateClient({ fetchImpl, demoMode: true });
  const loaded = await client.load();
  assert.equal(loaded.mode, 'authenticated');
  assert.equal(loaded.user.email, DEMO_USER.email);
  assert.equal(loaded.state.portal.project.phase, 'Bouwen');
  const next = clone(loaded.state);
  next.portal.project.phase = 'Test & acceptatie';
  const written = await client.write(next);
  assert.equal(written.state.portal.project.phase, 'Test & acceptatie');
  assert.equal((await client.load()).state.portal.project.phase, 'Test & acceptatie');
  assert.equal(calls, 0);
});

test('normal client still uses the authenticated portal-state API', async () => {
  let request = null;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { status: 200, ok: true, json: async () => ({ company: { name: 'Echte klant' } }) };
  };
  const user = { email: 'klant@example.nl', jwt: async () => 'token' };
  const client = createPortalStateClient({ fetchImpl, demoMode: false, identityProvider: () => ({ currentUser: () => user }) });
  const loaded = await client.load();
  assert.equal(loaded.mode, 'authenticated');
  assert.equal(request.url, '/api/portal-state');
  assert.equal(request.options.headers.authorization, 'Bearer token');
});
