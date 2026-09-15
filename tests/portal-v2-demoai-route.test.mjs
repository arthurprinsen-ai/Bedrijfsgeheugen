import test from 'node:test';
import assert from 'node:assert/strict';
import { isPortalDemoRoute, createPortalStateClient } from '../portal-v2/portal-state.js';

test('demoAI query is a demo route', () => {
  assert.equal(isPortalDemoRoute('/klantportaal', '?klant=demoAI'), true);
  assert.equal(isPortalDemoRoute('/klantportaal', '?klant=ijsselmonde'), false);
});

test('demo client publishes demo marker', async () => {
  const client = createPortalStateClient({ demoMode: true, customerMode: false });
  const snap = await client.load();
  assert.equal(snap.mode, 'authenticated');
  assert.equal(snap.state.portal.klant, 'demo');
});
