import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

for (const path of ['portal-v2/portal-state.js','portal-v2/customer-branding.js','portal-v2/portal-actions.js','portal-v2/global-actions-ui.js']) {
  test(`${path} exists as a native V2 capability module`, () => assert.ok(fs.existsSync(path), path));
}

test('global actions are not implemented as prompt-only compatibility shims', () => {
  const actions = fs.readFileSync('portal-v2/portal-actions.js','utf8');
  assert.doesNotMatch(actions, /prompt\s*\(/);
  assert.match(actions, /exportPortalState/);
  assert.match(actions, /stagePortalImport/);
  assert.match(actions, /printPortalReport/);
  assert.match(actions, /submitPortalFeedback/);
  assert.match(actions, /logoutPortalUser/);
});

test('portal state uses authenticated canonical server state and explicit modes', () => {
  const state = fs.readFileSync('portal-v2/portal-state.js','utf8');
  assert.match(state, /\/api\/portal-state/);
  for (const mode of ['authenticated','preview','empty','error']) assert.match(state, new RegExp(`['\"]${mode}['\"]`));
  assert.doesNotMatch(state, /tenantId\s*[:=].*URLSearchParams/);
});

test('customer branding has a safe initials fallback', () => {
  const branding = fs.readFileSync('portal-v2/customer-branding.js','utf8');
  assert.match(branding, /initial/i);
  assert.match(branding, /customer|klant/i);
});
