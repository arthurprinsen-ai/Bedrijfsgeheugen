import assert from 'node:assert/strict';
import { normaliseerHtml, TRUST_BAR_HTML, PRICING_MOBILE_MENU_HTML } from './normaliseer-site-ui.mjs';

const generiek = `<!doctype html><html><head></head><body>
<div class="bgx-gegevens"><a href="mailto:arthur@bedrijfsgeheugen.nl">arthur@bedrijfsgeheugen.nl</a></div>
<header class="v17-header"></header>
<main>
<div class="bgx-vraagbalk"><div class="bgx-kop">Vraag het deze pagina</div><div><div>nested</div></div></div>
<div class="bgx-bereik bgx-rekenaar"><div class="bgx-kop">Reken het even na</div></div>
<div class="bgx-rol"><div class="kop">Wat betekent dit voor jou?</div><h3>Kies je rol</h3></div>
</main>
<footer class="bgvoet"><div>voet</div></footer>
</body></html>`;

const normaal = normaliseerHtml(generiek, 'over-ons.html');
for (const tekst of ['Vaste prijs, geen uurtje-factuurtje', 'In twee weken draaiend', 'Voor het Nederlandse mkb']) {
  assert.ok(normaal.includes(tekst), `trustregel ontbreekt: ${tekst}`);
}
assert.ok(!normaal.includes('bgx-gegevens'), 'contactbalk mag niet bovenaan staan');
assert.ok(!normaal.includes('bgx-vraagbalk'), 'vraagblok moet weg buiten prijzen');
assert.ok(!normaal.includes('bgx-rekenaar'), 'rekenblok moet weg buiten prijzen');
assert.ok(!normaal.includes('bgx-rol'), 'rolblok moet weg buiten prijzen');
assert.ok(normaal.includes('Bedrijfsgeheugen · Enschede'), 'plaats moet in footer staan');
assert.ok(normaal.includes('ma–vr 08:00–18:00'), 'openingstijden moeten in footer staan');
assert.ok(normaal.includes('mailto:arthur@bedrijfsgeheugen.nl'), 'e-mail moet in footer staan');
assert.ok(normaal.includes('tel:+31627483345'), 'telefoon moet in footer staan');

const prijzen = `<!doctype html><html><head></head><body>
<div class="bgtop"><div>oud</div></div>
<nav class="bgkop"><button id="bgkopKnop"></button><div class="bgkop-mob" id="bgkopMob" hidden><a href="/oud">Oud menu</a></div></nav>
<main>${generiek.match(/<main>([\s\S]*?)<\/main>/)[1]}</main>
<footer class="bgvoet"><div>voet</div></footer>
</body></html>`;
const prijsUit = normaliseerHtml(prijzen, 'prijzen.html');
assert.ok(prijsUit.includes('bgx-vraagbalk'), 'vraagblok hoort op prijzen te blijven');
assert.ok(prijsUit.includes('bgx-rekenaar'), 'rekenblok hoort op prijzen te blijven');
assert.ok(prijsUit.includes('bgx-rol'), 'rolblok hoort op prijzen te blijven');
for (const item of ['Home', 'Oplossingen', 'Platform', 'Prijzen', 'Cases', 'Kennis', 'Over ons', 'Meer', 'Gratis zelfscan', 'Frisse Blik Scan']) {
  assert.ok(PRICING_MOBILE_MENU_HTML.includes(`>${item}<`) || PRICING_MOBILE_MENU_HTML.includes(`>${item}</a>`), `menu-item ontbreekt: ${item}`);
}
assert.ok(priceUit.includes('ONTDEKKEN'), 'prijzen moet het juiste gegroepeerde mobiele menu krijgen');
assert.ok(priceUit.includes('KENNIS &amp; BEDRIJF'), 'tweede menugroep ontbreekt');
assert.ok(priceUit.includes('START'), 'startgroep ontbreekt');

for (const m of PRICING_MOBILE_MENU_HTML.matchAll(/href="([^"]+)"/g)) {
  assert.ok(/^https:\/\/www\.bedrijfsgeheugen\.nl\//.test(m[1]), `menu href is niet absoluut: ${m[1]}`);
}
assert.ok(TRUST_BAR_HTML.includes('Vaste prijs, geen uurtje-factuurtje'));

console.log('uniform site UI contract: OK');
