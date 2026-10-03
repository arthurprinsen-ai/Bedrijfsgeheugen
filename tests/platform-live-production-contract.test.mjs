import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyPlatformNavigation } from '../tools/site-shell/live-contract.mjs';

const good = `
<nav>
  <a href="/product">Platform</a>
  <div class="mobile"><a href="https://www.bedrijfsgeheugen.nl/product"><span>Platform</span></a></div>
</nav>`;

test('live Platform contract accepts canonical desktop and mobile targets', () => {
  assert.doesNotThrow(() => verifyPlatformNavigation(good, 'fixture'));
});

test('live Platform contract rejects stale mobile Bedrijfsgeheugen target', () => {
  const stale = good.replace(
    'https://www.bedrijfsgeheugen.nl/product',
    '/bedrijfsgeheugen'
  );
  assert.throws(
    () => verifyPlatformNavigation(stale, 'fixture'),
    /Platform verwijst niet naar \/product/
  );
});

test('live Platform contract rejects missing desktop or mobile counterpart', () => {
  assert.throws(
    () => verifyPlatformNavigation('<a href="/product">Platform</a>', 'fixture'),
    /desktop\/mobile Platform-anchors ontbreken live/
  );
});
