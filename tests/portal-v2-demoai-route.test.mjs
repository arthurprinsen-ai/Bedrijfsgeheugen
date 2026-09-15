import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPortalDemoRoute, createPortalStateClient } from '../portal-v2/portal-state.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('demoAI query is a demo route', () => {
  assert.equal(isPortalDemoRoute('/klantportaal', '?klant=demoAI'), true);
  assert.equal(isPortalDemoRoute('/klantportaal', '?klant=DEMOAI'), true);
  assert.equal(isPortalDemoRoute('/klantportaal', '?klant=ijsselmonde'), false);
});

test('demo client publishes demo marker', async () => {
  const client = createPortalStateClient({ demoMode: true, customerMode: false });
  const snap = await client.load();
  assert.equal(snap.mode, 'authenticated');
  assert.equal(snap.state.portal.klant, 'demo');
});

test('demoAI theme is route scoped and responsive', () => {
  const entry = fs.readFileSync(path.join(repoRoot, 'portal-v2', 'demoai-dashboard.css'), 'utf8');
  const shell = fs.readFileSync(path.join(repoRoot, 'portal-v2', 'demoai-shell.css'), 'utf8');
  const overview = fs.readFileSync(path.join(repoRoot, 'portal-v2', 'demoai-overview.css'), 'utf8');
  assert.match(entry, /demoai-shell\.css/);
  assert.match(entry, /demoai-overview\.css/);
  assert.match(shell, /\.portal-demo-ai \.sidebar/);
  assert.match(shell, /\.portal-demo-ai \.topbar/);
  assert.match(overview, /\.portal-demo-ai \.ovz/);
  assert.match(overview, /@media/);
});
