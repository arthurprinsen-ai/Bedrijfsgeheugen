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

test('geen enkele pagina laadt analytics mét een toestemmingsmechanisme dat de build weghaalt', () => {
  // Zolang bron en build hetzelfde zeggen kan er geen halve situatie ontstaan
  // waarin gemeten wordt zonder dat er toestemming gevraagd kan worden.
  const laadtConsent = paginas().filter(([, html]) => /<script[^>]+src="[^"]*assets\/stijl\.js"/.test(html));
  assert.deepEqual(laadtConsent.map(([naam]) => naam), [],
    'Deze pagina\'s laden assets/stijl.js weer, terwijl de laatste buildstap die tag verwijdert. ' +
    'Bron en build zeggen dan verschillende dingen, en dat was precies de oorzaak van twee ' +
    'tegenstrijdige tests die allebei een dood bestand bewaakten.');
});

test('de toestemmingslaag blijft beschikbaar voor de dag dat analytics terugkomt', () => {
  assert.ok(existsSync('assets/stijl.js'),
    'assets/stijl.js is verwijderd; daarmee is er geen toestemmingsmechanisme meer beschikbaar');
  const js = readFileSync('assets/stijl.js', 'utf8');
  assert.match(js, /gtag\('consent','update'/, 'de toestemmingslaag stuurt Google Consent Mode niet meer aan');
  assert.match(js, /analytics_storage:/, 'analytics_storage wordt niet gezet');
  assert.match(js, /ad_storage:'denied'/, 'advertentie-opslag staat niet standaard uit');
});

test('als de money-page laag terugkomt, hydrateert hij en injecteert hij niet', () => {
  // Dit is het bruikbare deel van het ingetrokken commercial-intent-contract:
  // de canonieke schil levert de hero, dus een script mag hem hoogstens
  // verrijken. Zodra iemand assets/stijl.js weer aan een pagina hangt, geldt dit.
  const js = readFileSync('assets/stijl.js', 'utf8');
  const wordtGeladen = paginas().some(([, html]) => /<script[^>]+src="[^"]*assets\/stijl\.js"/.test(html));
  if (!wordtGeladen) return;
  assert.doesNotMatch(js, /if\(path==='\/due-diligence'\)hydrateExistingHero\(meta,main\);else hero\(meta,main\);/,
    'de money-page laag injecteert een hero terwijl de canonieke schil die al levert');
});

test('de canonieke schil levert de hero zelf, niet een script', () => {
  const dd = readFileSync('due-diligence.html', 'utf8');
  assert.match(dd, /p-hero/, '/due-diligence heeft geen hero meer in de gebouwde pagina');
  assert.doesNotMatch(dd, /<script[^>]+src="[^"]*assets\/stijl\.js"/,
    'de pagina laadt de achterhaalde money-page laag opnieuw');
});
