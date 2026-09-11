import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * De toestemmingsketen op de publieke site.
 *
 * Wat er mis was, in twee lagen
 * -----------------------------
 * 1. De canonieke V18-schil bouwt elke pagina opnieuw op en nam alleen titel,
 *    description, canonical, og, twitter, ld+json, style en stylesheet over.
 *    Scripts verdwenen. Daardoor stond de GA4-tag in 41 bronpagina's maar kwam
 *    hij nooit op productie: er werd niets gemeten.
 * 2. assets/stijl.js zette wél een keuze door, maar zette geen default en paste
 *    een eerder gemaakte keuze niet toe bij een volgend bezoek. Analytics
 *    aanzetten met die laag zou slechter zijn geweest dan hem uit laten: zonder
 *    default meet Google gewoon, en wie ooit had geweigerd werd alsnog gemeten.
 *
 * De drie schilgaranties worden structureel getoetst, niet door de schil in een
 * test na te bouwen. Reden: de canonieke bronpagina draagt zelf de analytics-tag,
 * dus een handgemaakte schil geeft een vals beeld. De echte uitkomst is
 * end-to-end gemeten met de volledige build: 15 pagina's met tag én
 * toestemmingslaag, 0 met een tag zonder toestemming, en op elke pagina staat de
 * consent-default vóór de analytics-tag.
 */

const CONSENT_JS = readFileSync('assets/stijl.js', 'utf8');
const SHELL_JS = readFileSync('tools/site-shell/apply-shell.mjs', 'utf8');

test('de toestemmingslaag past een opgeslagen keuze toe bij het laden', () => {
  assert.match(CONSENT_JS, /if\(stored==='granted'\|\|stored==='denied'\)\{applyConsent\(stored\);\}/,
    'een eerder gemaakte keuze wordt niet toegepast; wie weigerde wordt bij een volgend bezoek alsnog gemeten');
  assert.match(CONSENT_JS, /gtag\('consent','update'/, 'de laag stuurt Consent Mode niet aan');
  assert.match(CONSENT_JS, /ad_storage:'denied'/, 'advertentie-opslag staat niet standaard uit');
});

test('de money-page laag verrijkt een bestaande hero en injecteert er geen tweede', () => {
  // De laag zelf blijft: daar staan de prijzen, het bewijs, de bezwaren en het
  // eigenaarschap per money page in. Wat weg moest was het injecteren van een
  // tweede hero op pagina's waar de canonieke schil er al een heeft gezet.
  // Bestaande hero = .p-hero of de V18-hero (.held[data-bg-component="hero"]); zie
  // docs/development-ledger.md, prijzen-cls-money-hero.
  assert.match(CONSENT_JS, /if\(main\.querySelector\('\.p-hero'\)(\|\|main\.querySelector\(GEBOUWDE_HERO\))?\)hydrateExistingHero\(meta,main\)/,
    'de laag kijkt niet of er al een hero staat voordat hij er een injecteert');
  assert.match(CONSENT_JS, /function hydrateExistingHero/, 'hydrateren bestaat niet meer');
});

test('de schil neemt alleen de twee toegestane scripts over', () => {
  assert.match(SHELL_JS, /TOEGESTANE_SCRIPTS = Object\.freeze\(\[/, 'er is geen allowlist voor scripts');
  const start = SHELL_JS.indexOf('TOEGESTANE_SCRIPTS = Object.freeze([');
  const lijst = SHELL_JS.slice(start, SHELL_JS.indexOf(']', start));
  assert.match(lijst, /\/assets\/stijl\.js/, 'de toestemmingslaag staat niet op de allowlist');
  assert.match(lijst, /googletagmanager\.com\/gtag\/js/, 'de analytics-tag staat niet op de allowlist');
  assert.equal((lijst.match(/'/g) || []).length / 2, 2, 'de allowlist bevat meer dan die twee scripts');
  assert.match(SHELL_JS, /TOEGESTANE_SCRIPTS\.some/, 'scripts worden overgenomen zonder tegen de allowlist te toetsen');
});

test('de consent-default staat vóór de analytics-tag en zet alles op geweigerd', () => {
  const start = SHELL_JS.indexOf('const CONSENT_DEFAULT');
  assert.ok(start >= 0, 'er is geen consent-default');
  const regel = SHELL_JS.slice(start, SHELL_JS.indexOf('\n', start));
  for (const sleutel of ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization'])
    assert.ok(regel.includes(sleutel), `${sleutel} ontbreekt in de consent-default`);
  assert.match(regel, /denied/, 'de default zet niets op geweigerd');
  assert.match(regel, /wait_for_update:500/, 'er wordt niet gewacht op een keuze');
  assert.match(SHELL_JS, /consentEerst \+ scripts\.join/,
    'de consent-default wordt niet vóór de scripts geplaatst');
});

test('analytics zonder toestemmingslaag wordt niet toegestaan', () => {
  assert.match(SHELL_JS, /heeftAnalytics && !heeftToestemming/,
    'de schil dwingt het paar analytics-plus-toestemming niet af');
  assert.match(SHELL_JS, /assets\/stijl\.js" defer><\/script>'/,
    'de toestemmingslaag wordt niet toegevoegd als hij ontbreekt');
});

test('de schil voegt niets toe aan een pagina zonder analytics', () => {
  assert.match(SHELL_JS, /if \(eigen\.scripts && eigen\.scripts\.length\) \{/,
    'de schil voegt scripts toe ook als de pagina er geen had');
});
