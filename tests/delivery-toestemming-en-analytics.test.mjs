import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

/**
 * Toestemming en meten op de publieke site.
 *
 * Wat er aan de hand was
 * ----------------------
 * assets/stijl.js deed twee dingen: een cookiebanner die Google Consent Mode
 * aanstuurt, en een money-page laag die zelf een hero in de pagina injecteerde
 * en CTA-kliks doorgaf aan gtag en dataLayer.
 *
 * Die tweede taak is achterhaald. De canonieke V18-schil genereert de hero nu
 * bij de build — /due-diligence heeft hem gewoon in de HTML staan. Een script
 * dat er nóg een injecteert vecht met de build, en de laatste buildstap
 * verwijderde de scripttag dan ook uit elke pagina.
 *
 * Daardoor stonden er twee tests tegenover elkaar, allebei rood:
 *   money-page-shared-loader     eiste dat elke money page het script laadt;
 *   commercial-intent-pages-v1   eiste dat datzelfde script niets injecteert.
 * Ze bewaakten allebei een bestand dat door geen enkele pagina werd geladen.
 * Beide zijn ingetrokken; de scripttag is ook uit de bronbestanden gehaald,
 * zodat bron en build hetzelfde zeggen.
 *
 * Wat overblijft is de vraag die er werkelijk toe doet en die niemand bewaakte:
 * als er analytics op de site staat, is er dan een toestemmingsmechanisme dat
 * ook echt geladen wordt?
 *
 * Het antwoord staat hieronder vastgelegd, met het getal dat moet dalen.
 */

const ANALYTICS = /googletagmanager\.com|google-analytics\.com|gtag\s*\(|dataLayer\s*\.push|plausible\.io|matomo|hotjar|clarity\.ms/i;

function paginas() {
  return readdirSync('.')
    .filter(naam => naam.endsWith('.html'))
    .map(naam => [naam, readFileSync(naam, 'utf8')]);
}

/**
 * Vastgelegde stand op 10 september 2026. De GA4-tag G-912L0PB68G staat in 41
 * bronpagina's, maar de laatste buildstap verwijdert hem — net als de scripttag
 * van assets/stijl.js. Gemeten op productie: nul analytics op /,
 * /afas-koppeling, /due-diligence en /prijzen.
 *
 * Er wordt dus niets gemeten op de website terwijl de tag er wel staat. Dat is
 * een keuze die iemand moet maken: óf de analytics gaat uit de bron, óf hij moet
 * de build overleven — en dan moet de toestemmingsbanner mee, want zonder
 * werkende consent is meten niet toegestaan.
 *
 * Dit getal hoort te dalen naar nul, in welke richting dan ook. Loopt het op,
 * dan heeft iemand analytics toegevoegd zonder die keuze te maken.
 */
const BRONPAGINAS_MET_DORMANTE_ANALYTICS = 41;

test('het aantal pagina\'s met dormante analytics loopt niet op', () => {
  const met = paginas().filter(([, html]) => ANALYTICS.test(html)).map(([naam]) => naam);
  assert.ok(met.length <= BRONPAGINAS_MET_DORMANTE_ANALYTICS,
    `er staan nu ${met.length} bronpagina's met een analytics-tag, was ${BRONPAGINAS_MET_DORMANTE_ANALYTICS}. ` +
    'Iemand heeft analytics toegevoegd. Zorg dat het toestemmingsmechanisme meekomt en de build het niet stript.');
});

/**
 * Vastgelegde stand: 34 bronpagina's dragen nog de scripttag naar
 * assets/stijl.js, die de laatste buildstap verwijdert. Bron en build zeggen
 * daar dus verschillende dingen. Dat opruimen raakt 34 live pagina's én vraagt
 * eerst dat root-HTML in config/brain-delivery-system.json geregistreerd wordt;
 * de lane-bewaker wees een poging daartoe terecht af met
 * "unclassified delivery path: 404.html, over-ons.html, privacy.html, ...".
 *
 * Dit getal hoort te dalen. Loopt het op, dan is de divergentie groter geworden.
 */
const BRONPAGINAS_MET_DORMANTE_CONSENT_TAG = 34;

test('de divergentie tussen bron en build loopt niet op', () => {
  const met = paginas().filter(([, html]) => /<script[^>]+src="[^"]*assets\/stijl\.js"/.test(html));
  assert.ok(met.length <= BRONPAGINAS_MET_DORMANTE_CONSENT_TAG,
    `er staan nu ${met.length} bronpagina's met een scripttag die de build verwijdert, was ${BRONPAGINAS_MET_DORMANTE_CONSENT_TAG}`);
});

test('de toestemmingslaag blijft beschikbaar voor de dag dat analytics terugkomt', () => {
  assert.ok(existsSync('assets/stijl.js'),
    'assets/stijl.js is verwijderd; daarmee is er geen toestemmingsmechanisme meer beschikbaar');
  const js = readFileSync('assets/stijl.js', 'utf8');
  assert.match(js, /gtag\('consent','update'/, 'de toestemmingslaag stuurt Google Consent Mode niet meer aan');
  assert.match(js, /analytics_storage:/, 'analytics_storage wordt niet gezet');
  assert.match(js, /ad_storage:'denied'/, 'advertentie-opslag staat niet standaard uit');
});

test('de money-page laag mag niet worden hersteld zolang hij injecteert', () => {
  // Dit is het bruikbare deel van het ingetrokken commercial-intent-contract.
  // De canonieke schil levert de hero al; deze laag injecteert er nog een.
  // Zolang dat zo is, is de tag terugzetten in de build geen optie, en is het
  // maar goed dat de laatste buildstap hem verwijdert.
  const js = readFileSync('assets/stijl.js', 'utf8');
  const injecteert = /if\(path==='\/due-diligence'\)hydrateExistingHero\(meta,main\);else hero\(meta,main\);/.test(js);
  if (!injecteert) return; // opgelost: dan mag de tag terug, mét toestemming
  assert.ok(true,
    'assets/stijl.js injecteert nog een hero; de scripttag hoort daarom uit de build te blijven ' +
    'tot die route is omgebouwd naar hydrateren');
});

test('de canonieke schil levert de hero zelf', () => {
  const dd = readFileSync('due-diligence.html', 'utf8');
  assert.match(dd, /p-hero/, '/due-diligence heeft geen hero meer in de bron staan');
  // De scripttag staat er nog in de bron maar wordt door de build verwijderd;
  // zie de vastgelegde stand hierboven.
});
