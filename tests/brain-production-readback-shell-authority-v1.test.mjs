import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { verifyPageShell } from '../tools/site-shell/contracts.mjs';

const canonical = `<!doctype html><html><body>
<div data-bg-component="trustbar">trust</div>
<header class="v17-header" data-bg-component="header"><nav>nav</nav></header>
<aside class="v18-mobile-drawer" data-bg-component="mobile-menu">menu</aside>
<main data-bg-component="main">pricing content</main>
<footer data-bg-component="footer">footer</footer>
</body></html>`;

test('global shell authority does not encode retired pricing component semantics', () => {
  const shellContract = fs.readFileSync('tools/site-shell/contracts.mjs','utf8');
  for (const retired of ['bgx-vraagbalk','bgx-rekenaar','bgx-rol','pricing page-tools missing']) {
    assert.doesNotMatch(shellContract,new RegExp(retired));
  }
  assert.doesNotThrow(() => verifyPageShell(canonical,'prijzen.html'));
});

test('pricing business semantics remain owned by the production live contract', () => {
  const liveContract = fs.readFileSync('tools/site-shell/live-contract.mjs','utf8');
  for (const token of ['Starter','Pro','Groei','Enterprise','fitSize','fitGoal','fitMode','fitGo','fitResult']) {
    assert.match(liveContract,new RegExp(token));
  }
});

test('global shell still rejects the retired pricing header shell', () => {
  const legacy = canonical.replace('class="v17-header"','class="bgkop"');
  assert.throws(() => verifyPageShell(legacy,'prijzen.html'),/legacy|header/i);
});
