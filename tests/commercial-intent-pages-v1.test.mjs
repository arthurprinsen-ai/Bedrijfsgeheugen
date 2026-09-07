import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const pages = [
  ['ai-automatisering-mkb.html','AI automatisering voor het mkb','https://www.bedrijfsgeheugen.nl/ai-automatisering-mkb','ai automatisering mkb'],
  ['microsoft-365-koppeling.html','Microsoft 365 koppeling','https://www.bedrijfsgeheugen.nl/microsoft-365-koppeling','microsoft 365 koppeling'],
  ['power-bi-implementatie.html','Power BI implementatie','https://www.bedrijfsgeheugen.nl/power-bi-implementatie','power bi implementatie mkb'],
  ['bedrijf-overdraagbaar-maken.html','Bedrijf overdraagbaar maken','https://www.bedrijfsgeheugen.nl/bedrijf-overdraagbaar-maken','bedrijf overdraagbaar maken']
];

const canonicalHeader = readFileSync('.github/canoniek/kop.html','utf8').replace(/\s+/g,' ').trim();
const canonicalFooter = readFileSync('.github/canoniek/voet.html','utf8').replace(/\s+/g,' ').trim();

for (const [file, h1, canonical, keyword] of pages) {
  test(`${file} is a full commercial money page`, () => {
    assert.equal(existsSync(file), true, `${file} ontbreekt`);
    const html = readFileSync(file, 'utf8');
    const normalized = html.replace(/\s+/g,' ').trim();
    assert.match(html, new RegExp(`<h1[^>]*>[^<]*${h1.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`, 'i'));
    assert.ok(html.includes(`rel=\"canonical\" href=\"${canonical}\"`));
    assert.ok(html.includes('organic-money-page-intent-to-order-coverage-v1'));
    assert.ok(/Prijs|Investering|Vanaf|€/.test(html), 'prijs/logica ontbreekt');
    assert.ok(/bewijs|resultaat|praktijk|meetbaar/i.test(html), 'bewijs/resultaat ontbreekt');
    assert.ok(/bezwaar|risico|lock-in|eigendom|AVG|AI Act|beveilig/i.test(html), 'risico/bezwaar ontbreekt');
    assert.ok(html.includes('data-money-primary'), 'primaire CTA tracking ontbreekt');
    assert.ok(html.includes('data-money-secondary'), 'secundaire CTA tracking ontbreekt');
    assert.ok(html.includes('https://www.bedrijfsgeheugen.nl/'), 'absolute interne hrefs ontbreken');

    assert.ok(normalized.includes(canonicalHeader), 'canonieke header ontbreekt');
    assert.ok(normalized.includes(canonicalFooter), 'canonieke footer ontbreekt');
    assert.match(html, /class=\"bgkruim\"/, 'breadcrumb ontbreekt');
    assert.match(html, /type=\"application\/ld\+json\"/, 'JSON-LD ontbreekt');
    assert.ok(html.includes('<meta name="robots" content="index,follow">'), 'robots meta ontbreekt');
    assert.ok(html.includes(`<meta name="bg-zoekwoord" content="${keyword}">`), 'bg-zoekwoord ontbreekt');
    for (const property of ['og:title','og:description','og:url','og:image']) {
      assert.ok(html.includes(`property="${property}"`), `${property} ontbreekt`);
    }
    assert.ok(html.includes('rel="stylesheet" href="/assets/kop.css?v=0466dd43"'), 'canonieke kop stylesheet ontbreekt');
  });
}

test('existing canonical owners are not duplicated', () => {
  assert.equal(existsSync('ai-implementatie-mkb.html'), false, 'AI implementatie duplicate mag niet bestaan');
  assert.equal(existsSync('kennis-borgen.html'), false, 'kennis-borgen duplicate mag niet bestaan');
  const expansion = JSON.parse(readFileSync('site/seo-order-expansion.json','utf8'));
  const base = JSON.parse(readFileSync('site/seo-order-map.json','utf8'));
  assert.ok(expansion.pages.some(p => p.route === 'https://www.bedrijfsgeheugen.nl/ai-implementeren' && p.primary_keyword === 'ai implementatie mkb'));
  assert.ok(base.pages.some(p => p.route === 'https://www.bedrijfsgeheugen.nl/bedrijfsgeheugen' && p.secondary_keywords.includes('kennis borgen bedrijf')));
});

test('/due-diligence hydrates the existing hero instead of injecting a second money hero', () => {
  const js = readFileSync('assets/stijl.js','utf8');
  assert.match(js, /function hydrateExistingHero\(meta,main\)/, 'existing-hero hydration ontbreekt');
  assert.match(js, /existing\.setAttribute\('data-bg-money-contract',CONTRACT\)/, 'money-page contract wordt niet op bestaande hero gezet');
  assert.match(js, /trackExistingCta\(ctas\[0\],'primary',meta\)/, 'primaire bestaande CTA krijgt geen money tracking');
  assert.match(js, /trackExistingCta\(ctas\[1\],'secondary',meta\)/, 'secundaire bestaande CTA krijgt geen money tracking');
});

test('/due-diligence performs no post-render layout injection', () => {
  const js = readFileSync('assets/stijl.js','utf8');
  assert.match(js, /if\(path==='\/due-diligence'\)\{hydrateExistingHero\(meta,main\);event\('money_page_view',meta\);return;\}/, 'due-diligence moet na hydratatie stoppen voordat style/hero/decision DOM-injectie plaatsvindt');
  assert.doesNotMatch(js, /if\(path==='\/due-diligence'\)hydrateExistingHero\(meta,main\);else hero\(meta,main\);/, 'oude due-diligence route injecteert nog layout-mutaties');
});
