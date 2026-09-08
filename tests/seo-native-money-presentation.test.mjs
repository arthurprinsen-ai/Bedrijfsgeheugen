import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { enrichMoneyPage, inspectMoneyPage } from '../tools/seo-order-engine/money-contract-v2.mjs';
import { injectGrowthMeasurement } from '../tools/seo-order-engine/measurement.mjs';
import { normaliseerHtml } from '../tools/normaliseer-site-ui.mjs';

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
    const heroTag = route.endsWith('/prijzen') ? 'div' : 'section';
    const html = `<!doctype html><html lang="nl"><head><title>Pagina</title></head><body><main><${heroTag} class="${heroClass}" data-bg-component="hero"><h1>Eigen pagina-hero</h1></${heroTag}><section class="inhoud-body"><h2>Eigen commerciële inhoud</h2><p>De ontworpen pagina blijft leidend.</p><a href="https://www.bedrijfsgeheugen.nl/frisse-blik" data-bg-conversion="frisse-blik">Plan een Frisse Blik</a><a href="https://www.bedrijfsgeheugen.nl/product">Bekijk platform</a><a href="https://www.bedrijfsgeheugen.nl/">Home</a></section></main></body></html>`;
    const out = enrichMoneyPage(html, entry)
      .replace('<main ', `<main data-bg-intent-owner="${entry.route}" data-bg-intent-role="primary" `);

    assert.doesNotMatch(out, /id="bg-money-v3"/, 'de generieke SEO-order tekst mag niet zichtbaar worden toegevoegd');
    assert.doesNotMatch(out, /Methodologie en bronnenbeleid|Veelgestelde vragen vóór je beslist|Het zoekprobleem:/, 'geen generieke SEO-copy op de ontworpen product- of prijzenpagina');
    assert.match(out, new RegExp(`class="${heroClass}"`), 'de eigen pagina-hero moet intact blijven');
    assert.match(out, /data-bg-money-contract-version="native-v1"/, 'native money-page krijgt wel een machineleesbaar contractsignaal');

    const fouten = inspectMoneyPage(out, entry);
    assert.doesNotMatch(fouten.join('\n'), /eigen V18 hero ontbreekt/, `${route}: de canonical eigen hero moet als native hero worden geaccepteerd`);
  });
}

test('prijzen accepteert geen generieke paginakop als vervanging van de native prijshero', () => {
  const entry = registry.pages.find(page => page.route === 'https://www.bedrijfsgeheugen.nl/prijzen');
  const html = '<!doctype html><html><body><main data-bg-money-contract-version="native-v1" data-bg-intent-owner="https://www.bedrijfsgeheugen.nl/prijzen" data-bg-intent-role="primary"><section class="paginakop" data-bg-component="hero"><h1>Prijzen</h1></section><a href="https://www.bedrijfsgeheugen.nl/frisse-blik" data-bg-conversion="frisse-blik">Plan</a><a href="https://www.bedrijfsgeheugen.nl/product">Product</a></main></body></html>';
  assert.match(inspectMoneyPage(html, entry).join('\n'), /eigen V18 hero ontbreekt/, 'een generieke paginakop mag de echte prijshero niet meer maskeren');
});

test('growth measurement injecteert alleen syntactisch geldige classic JavaScript', () => {
  const html = injectGrowthMeasurement('<!doctype html><html><head></head><body><main><a data-bg-conversion="frisse-blik" href="/frisse-blik">Plan</a></main></body></html>', {
    canonical: 'https://www.bedrijfsgeheugen.nl/test',
    page_role: 'support',
    funnel_stage: 'discover',
    intent: 'test',
    keyword_cluster: 'test'
  });
  const script = html.match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/i);
  assert.ok(script, 'growth measurement script ontbreekt');
  assert.doesNotThrow(() => new vm.Script(script[1]), 'growth measurement mag geen ongeldige regex literal genereren');
});

test('finale site-normalisatie verwijdert de defecte legacy demonstrator voordat die estate-wide wordt geprojecteerd', () => {
  const malformed = `<script>
    var howSteps=document.querySelectorAll('.how-step'),howIndex=0;
    if(howSteps.length){setInterval(()=>{howSteps.forEach(s=>s.classList.remove('active')); howSteps.forEach((step,i)=>step.addEventListener('click',()=>{howSteps.forEach(s=>s.classList.remove('active'));step.classList.add('active')})); howIndex=(howIndex+1)%howSteps.length; howSteps[howIndex].classList.add('active')},3000)}
    // Animated demonstrator only; production should bind to validated savings data
    // Actions in hero animate as if the workflow was executed
    document.querySelectorAll('.demo-action').forEach(btn=>btn.addEventListener('click',()=>{const old=btn.textContent;btn.textContent='✓ Acties gemaakt';btn.style.background='#67d9d0';setTimeout(()=>{btn.textContent=old;btn.style.background=''},2200)}));
  </script>`;
  const html = `<!doctype html><html><head><title>Test</title></head><body><main>${malformed}</main></body></html>`;
  const out = normaliseerHtml(html, 'test.html');
  assert.doesNotMatch(out, /Animated demonstrator only/, 'de defecte demonstrator mag niet in productie-output blijven staan');
  for (const match of out.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/application\/ld\+json|\bsrc\s*=/i.test(match[1]) || !match[2].trim()) continue;
    assert.doesNotThrow(() => new vm.Script(match[2]), 'alle overblijvende classic inline scripts moeten compileerbaar zijn');
  }
});
