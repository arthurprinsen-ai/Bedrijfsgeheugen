import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureReleaseMarker } from '../tools/site-shell/release-marker.mjs';
import { verifyLiveSite } from '../tools/site-shell/live-contract.mjs';

const COMMIT = '0123456789abcdef0123456789abcdef01234567';

function shell({ pricing = false } = {}) {
  return ensureReleaseMarker(`<!doctype html><html><head></head><body>
<div class="bg-uniform-trust" data-bg-component="trustbar">Vaste prijs, geen uurtje-factuurtje · In twee weken draaiend · Voor het Nederlandse mkb</div>
<header class="v17-header" data-bg-component="header"><nav>hoofdmenu</nav></header>
<aside class="v18-mobile-drawer" data-bg-component="mobile-menu">Oplossingen Platform Prijzen Kennis Over ons Meer</aside>
<main data-bg-component="main">${pricing ? '<section data-bg-component="page-tools"></section>' : 'inhoud'}</main>
<footer data-bg-component="footer"><a href="mailto:arthur@bedrijfsgeheugen.nl">mail</a><a href="tel:+31627483345">bel</a><span>ma–vr 08:00–18:00</span></footer>
</body></html>`, COMMIT);
}

test('release identity closes independently from pricing semantics while strict pricing remains fail closed', () => {
  const home = shell();
  const pricingWithoutPricingSemantics = shell({ pricing: true });
  const content = shell();

  assert.doesNotThrow(() => verifyLiveSite({
    home,
    pricing: pricingWithoutPricingSemantics,
    content,
    expectedCommit: COMMIT,
    verifyPricingSemantics: false,
  }));

  assert.throws(() => verifyLiveSite({
    home,
    pricing: pricingWithoutPricingSemantics,
    content,
    expectedCommit: COMMIT,
  }), /pricing-tool ontbreekt/i);
});
