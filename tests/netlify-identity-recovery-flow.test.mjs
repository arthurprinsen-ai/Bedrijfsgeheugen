import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transformIdentityTokenFlow } from '../tools/fix-netlify-identity-token-flow.mjs';

const source = fs.readFileSync(new URL('../klantportaal.html', import.meta.url), 'utf8');
const html = transformIdentityTokenFlow(source);

test('recovery token opens recovery flow before portal state', () => {
  assert.match(html, /identityTokenFlow=.*recovery/);
  assert.match(html, /netlifyIdentity\.on\(['"]recovery['"]/);
  assert.match(html, /netlifyIdentity\.open\(['"]recovery['"]\)/);
  assert.match(html, /on\(['"]init['"],u=>\{ if\(identityTokenFlow\) return;/);
});

test('invite token opens signup flow before portal state', () => {
  assert.match(html, /identityTokenFlow=.*invite/);
  assert.match(html, /netlifyIdentity\.on\(['"]invite['"]/);
  assert.match(html, /netlifyIdentity\.open\(['"]signup['"]\)/);
  assert.match(html, /on\(['"]login['"],u=>\{ if\(identityTokenFlow\) return;/);
});

test('ordinary login still renders the portal when no token flow is active', () => {
  assert.match(html, /if\(u\) toonPortaal\(u\)/);
  assert.match(html, /netlifyIdentity\.close\(\); toonPortaal\(u\)/);
});
