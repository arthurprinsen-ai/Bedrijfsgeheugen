import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyPlatformNavigation } from '../tools/site-shell/live-contract.mjs';

const canonical = `
<nav>
  <a href="/product">Platform</a>
  <aside><a href="https://www.bedrijfsgeheugen.nl/product"><span>Platform</span></a></aside>
</nav>`;

test('historical replay: canonical desktop and mobile Platform routes pass', () => {
  assert.doesNotThrow(() => verifyPlatformNavigation(canonical, 'historical-replay'));
});

test('historical replay: stale mobile /bedrijfsgeheugen route fails closed', () => {
  const stale = canonical.replace(
    'https://www.bedrijfsgeheugen.nl/product',
    '/bedrijfsgeheugen'
  );
  assert.throws(
    () => verifyPlatformNavigation(stale, 'historical-replay'),
    /Platform verwijst niet naar \/product/
  );
});

test('historical replay: both desktop and mobile Platform anchors are mandatory', () => {
  assert.throws(
    () => verifyPlatformNavigation('<a href="/product">Platform</a>', 'historical-replay'),
    /desktop\/mobile Platform-anchors ontbreken live/
  );
});
