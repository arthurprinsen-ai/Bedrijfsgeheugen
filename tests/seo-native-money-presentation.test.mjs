import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { enrichMoneyPage, inspectMoneyPage } from '../tools/seo-order-engine/money-contract-v2.mjs';

const registry = JSON.parse(await readFile(new URL('../site/seo-order-map.json', import.meta.url), 'utf8'));

for (const route of [
  'https://www.bedrijfsgeheugen.nl/product',
  'https://www.bedrijfsgeheugen.nl/prijzen'
]) {
  test(`${route}: rijke V18 money-page houdt eigen presentatie zonder generiek beslisblok`, () => {
    const entry = registry.pages.find(page => page.route === route);
    assert.ok(entry, `registry-entry ontbreekt voor ${route}`);
    assert.equal(entry.presentation, 'native', 'product en prijzen moeten expliciet als native presentatie zijn geregistreerd');

    const heroClass = route.endsWith('/prijzen') ? 'held' : 'inhoud-kop';
    const html = `<!doctype html><html lang="nl"><head><title>Pagina</title></head><body><main><section class="${heroClass}"><h1>Eigen V18 hero</h1></section><section class="inhoud-body"><h2>Eigen commerciële inhoud</h2><p>De ontworpen pagina blijft leidend.</p><a href="https://www.bedrijfsgeheugen.nl/frisse-blik" data-bg-conversion="frisse-blik">Plan een Frisse Blik</a><a href="https://www.bedrijfsgeheugen.nl/product">Bekijk platform</a><a href="https://www.bedrijfsgeheugen.nl/">Home</a></section></main></body></html>`;
    const out = enrichMoneyPage(html, entry)
      .replace('<main ', `<main data-bg-intent-owner="${entry.route}" data-bg-intent-role="primary" `);

    assert.doesNotMatch(out, /id="bg-money-v3"/, 'de generieke SEO-order tekst mag niet zichtbaar worden toegevoegd');
    assert.doesNotMatch(out, /Methodologie en bronnenbeleid|Veelgestelde vragen vóór je beslist|Het zoekprobleem:/, 'geen generieke SEO-copy op de ontworpen product- of prijzenpagina');
    assert.match(out, new RegExp(`class="${heroClass}"`), 'de eigen pagina-hero moet intact blijven');
    assert.match(out, /data-bg-money-contract-version="native-v1"/, 'native money-page krijgt wel een machineleesbaar contractsignaal');

    const fouten = inspectMoneyPage(out, entry);
    assert.doesNotMatch(fouten.join('\n'), /eigen V18 hero ontbreekt/, `${route}: de bestaande eigen hero moet als native hero worden geaccepteerd`);
  });
}