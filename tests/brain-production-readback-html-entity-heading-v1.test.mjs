import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureReleaseMarker } from '../tools/site-shell/release-marker.mjs';
import { verifyLiveSite } from '../tools/site-shell/live-contract.mjs';

const COMMIT='0123456789abcdef0123456789abcdef01234567';

function shell(pricing=''){
  return ensureReleaseMarker(`<!doctype html><html><head></head><body>
<div class="bg-uniform-trust" data-bg-component="trustbar">Vaste prijs, geen uurtje-factuurtje · In twee weken draaiend · Voor het Nederlandse mkb</div>
<header class="v17-header" data-bg-component="header"><nav>Oplossingen Platform Prijzen Kennis Over ons Meer</nav></header>
<aside class="v18-mobile-drawer" data-bg-component="mobile-menu">Oplossingen Platform Prijzen Kennis Over ons Meer</aside>
<main data-bg-component="main">${pricing}</main>
<footer data-bg-component="footer"><a href="mailto:arthur@bedrijfsgeheugen.nl">mail</a><a href="tel:+31627483345">bel</a><span>ma–vr 08:00–18:00</span></footer>
</body></html>`,COMMIT);
}

const pricing=`
<div><a href="#saas">Powerhouse SaaS</a><a href="#expertise">Consulting &amp; workshops</a></div>
<section id="saas">
<article><h3>Starter</h3><div>€ 99</div></article>
<article><h3>Pro</h3><div>€ 299</div></article>
<article><h3>Groei</h3><div>€ 749</div></article>
<article><h3>Enterprise</h3><div>Op maat</div></article>
</section>
<section id="expertise">
<article><h3>Frisse Blik</h3></article>
<article><h3>Directie &amp; AI Workshop</h3></article>
<article><h3>Bedrijfsgeheugen Scan</h3></article>
<article><h3>Build Sprint</h3></article>
<article><h3>Transformation / Fractional Lead</h3></article>
</section>
<select id="pkgSize"></select><select id="pkgGoal"></select><select id="pkgMode"></select><a id="pkgGo" href="/pakketadvies">advies</a>`;

test('production readback accepts semantically identical HTML-entity heading text',()=>{
  const home=shell();
  const content=shell();
  const pricingPage=shell(pricing);
  assert.doesNotThrow(()=>verifyLiveSite({home,pricing:pricingPage,content,expectedCommit:COMMIT}));
});

test('production readback still rejects a missing required consulting proposition',()=>{
  const home=shell();
  const content=shell();
  const pricingPage=shell(pricing.replace('<h3>Directie &amp; AI Workshop</h3>','<h3>Andere workshop</h3>'));
  assert.throws(()=>verifyLiveSite({home,pricing:pricingPage,content,expectedCommit:COMMIT}),/Directie & AI Workshop/);
});
