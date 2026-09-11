import test from 'node:test';
import assert from 'node:assert/strict';
import { bevindingen, bevindingenSamenvatting } from '../bevindingen.js';
import { pageMetrics, pageWorklist, METRIC_EMPTY } from '../page-metrics.js';
import { pageVisual } from '../page-visuals.js';

/**
 * Het portaal rekende honderd getallen uit en concludeerde niets.
 *
 * De pagina's `advies` en `kansenkaart` en de berekening `blocker-ranking` lazen
 * allemaal een lijst die iemand met de hand had ingetypt. Gemeten met een
 * volledig ingevuld bedrijf — 38 medewerkers, 4,2 miljoen omzet, volwassenheid
 * per onderdeel, compliance-controls, businesscase — bleven ze leeg. Het portaal
 * liet zien wat je erin stopte, niet wat eruit volgde.
 *
 * bevindingen.js leidt af uit wat al is doorgerekend. Deze test bewaakt de drie
 * regels die dat eerlijk houden:
 *
 *   1. geen bevindingen zonder eigen gegevens;
 *   2. elke bevinding draagt bewijs én een bron;
 *   3. een bedrag verschijnt alleen waar het te berekenen valt — een verzonnen
 *      bedrag is erger dan geen bedrag.
 */

const KLANT = { portal: {
  company: { name: 'Van Dijk Techniek BV' },
  profile: { headcount: 38, hourlyCost: 52, manualHoursPerWeek: 14,
    maturity: { sturing: 3, commercie: 4, operatie: 2, finance: 3, mensen: 3, tech: 2, data: 2, klant: 4 } },
  metrics: { revenue: 4200000, ebitda: 504000, grossMargin: 38, dso: 52, wages: 1900000, it: 63000 },
  people: { absence: 5.4, turnover: 17, enps: 8 },
  market: { industry: 'Industrie & productie' },
  compliance: { controls: [
    { id: 'nis-1', framework: 'NIS2', requirement: 'Zorgplicht', applicability: 'applicable',
      control: { implemented: true }, verifiedAt: '2025-02-01', severity: 'high',
      evidence: [{ id: 'e1', verified: true, validUntil: '2025-12-01' }] },
    { id: 'avg-2', framework: 'AVG', requirement: 'Datalekprocedure', applicability: 'applicable',
      control: { implemented: false }, severity: 'critical' }
  ] }
} };

test('zonder eigen gegevens komt er geen enkele bevinding', () => {
  assert.deepEqual(bevindingen({}), [],
    'het portaal concludeert iets over een leeg dossier; dat is precies wat in #1339 eruit is gehaald');
  assert.equal(bevindingenSamenvatting({}).totaal, 0);
  assert.equal(bevindingenSamenvatting({}).eerste, null);
  assert.deepEqual(bevindingen({ portal: { metrics: {} } }), []);
});

test('met een ingevuld bedrijf komt er een geordende lijst uit', () => {
  const lijst = bevindingen(KLANT);
  assert.ok(lijst.length >= 5, `te weinig bevindingen: ${lijst.length}`);
  for (let i = 1; i < lijst.length; i += 1)
    assert.ok(lijst[i].score <= lijst[i - 1].score, 'de lijst staat niet op volgorde van wat het oplevert');
});

test('elke bevinding draagt bewijs, een bron en een pagina', () => {
  for (const item of bevindingen(KLANT)) {
    assert.ok(String(item.bewijs).trim().length > 15, `${item.id} heeft geen bewijs`);
    assert.ok(String(item.bron).trim().length > 5, `${item.id} heeft geen bron`);
    assert.ok(String(item.pagina).trim(), `${item.id} verwijst niet naar een pagina`);
    assert.ok(['klein', 'middel', 'groot'].includes(item.moeite), `${item.id} heeft geen moeite-inschatting`);
    assert.ok(['kosten', 'markt', 'kans', 'verplichting'].includes(item.soort), `${item.id} heeft een onbekende soort`);
  }
});

test('een bedrag verschijnt alleen waar het te berekenen valt', () => {
  const lijst = bevindingen(KLANT);
  const handmatig = lijst.find(item => item.id === 'handmatig-werk');
  assert.ok(handmatig, 'handmatig werk ontbreekt, terwijl uren en uurkosten zijn ingevuld');
  assert.ok(handmatig.waarde > 0);
  assert.match(handmatig.bewijs, /14 uur per week/);

  // Bij verzuim, verloop en eNPS is het verschil met de norm niet eenduidig in
  // geld uit te drukken. Daar hoort dus geen bedrag te staan.
  for (const item of lijst.filter(x => /eNPS|Verloop|Verzuim/.test(x.titel)))
    assert.equal(item.waarde, null, `${item.titel} draagt een verzonnen bedrag`);
});

test('een cijfer dat ongunstig afwijkt wordt ook zo genoemd', () => {
  const loonquote = bevindingen(KLANT).find(item => /Loonquote/.test(item.titel));
  if (!loonquote) return;
  assert.match(loonquote.titel, /ongunstig/,
    'bij een loonquote hoort een hogere waarde slechter te zijn; "ligt onder de norm" zegt het omgekeerde');
  assert.match(loonquote.bewijs, /tegenover/, 'het eigen cijfer staat niet naast de norm');
});

test('verplichtingen komen uit de compliance-controls, met hun raamwerk', () => {
  const lijst = bevindingen(KLANT).filter(item => item.soort === 'verplichting');
  assert.ok(lijst.length >= 2);
  const datalek = lijst.find(item => /Datalekprocedure/.test(item.titel));
  assert.ok(datalek, 'de niet-ingerichte kritieke control ontbreekt');
  assert.match(datalek.bron, /AVG/);
  const zorgplicht = lijst.find(item => /Zorgplicht/.test(item.titel));
  assert.match(zorgplicht.bewijs, /bewijs ontbreekt of is verlopen/,
    'verlopen bewijs wordt niet als zodanig gemeld');
});

test('de adviespagina concludeert nu in plaats van af te lezen', () => {
  const metrics = pageMetrics('advies', KLANT);
  assert.equal(metrics[0][0], 'Bevindingen');
  assert.notEqual(metrics[0][1], METRIC_EMPTY);
  assert.match(metrics[2][0], /Waarde per jaar/);
  assert.equal(metrics[3][0], 'Eerst aanpakken');

  const lijst = pageWorklist('advies', KLANT);
  assert.ok(lijst.length >= 4);
  assert.ok(lijst.some(([label]) => label.includes('€')), 'geen enkele regel noemt een bedrag');
  assert.ok(lijst.every(([, uitleg]) => uitleg.includes('—')), 'niet elke regel noemt zijn bron');

  assert.match(pageVisual('advies', KLANT), /<figure class="v2visual"/);
  assert.equal(pageVisual('advies', {}), '', 'de adviespagina tekent op een leeg dossier');
  assert.ok(pageMetrics('advies', {}).every(([, waarde]) => waarde === METRIC_EMPTY));
});

test('een eigen ingetypte advieslijst blijft werken', () => {
  const eigen = { portal: { advice: { items: [
    { advice: 'Zelf bedacht advies', priority: 5, value: 25000, owner: 'Arthur' }] } } };
  const metrics = pageMetrics('advies', eigen);
  assert.equal(metrics[0][0], 'Adviezen', 'een eigen lijst wordt niet meer getoond');
  assert.equal(metrics[0][1], '1');
});

/* ---- Kosten per bedrijfsonderdeel: de motor onder het oude advies ---- */
import { calculateLegacyEquivalent as calc } from '../legacy-parity-engine.js';

test('elk ingevuld volwassenheidsniveau levert een bedrag per jaar op', () => {
  const kosten = calc('dimension-costs', KLANT);
  assert.ok(kosten.length >= 5, 'niet elk ingevuld onderdeel krijgt een bedrag');
  for (const d of kosten) {
    assert.ok(d.kosten > 0, `${d.id} heeft geen kosten`);
    assert.ok(d.niveau >= 1 && d.niveau <= 5);
    assert.ok(d.potentieel >= 0 && d.potentieel <= d.kosten, `${d.id}: te winnen bedrag klopt niet`);
  }
  for (let i = 1; i < kosten.length; i += 1)
    assert.ok(kosten[i].kosten <= kosten[i - 1].kosten, 'de duurste onderdelen staan niet bovenaan');
});

test('een lager niveau kost meer, en zonder profiel is er geen bedrag', () => {
  const laag = { portal: { profile: { headcount: 38, hourlyCost: 52, maturity: { operatie: 1 } } } };
  const hoog = { portal: { profile: { headcount: 38, hourlyCost: 52, maturity: { operatie: 5 } } } };
  assert.ok(calc('dimension-costs', laag)[0].kosten > calc('dimension-costs', hoog)[0].kosten,
    'niveau 1 hoort meer te kosten dan niveau 5');
  assert.deepEqual(calc('dimension-costs', {}), [],
    'zonder medewerkers en uurkosten mag er geen bedrag worden verzonnen');
  assert.deepEqual(calc('dimension-costs', { portal: { profile: { headcount: 38 } } }), [],
    'zonder uurkosten is het bedrag niet te berekenen');
});

test('de duurste onderdelen komen als bevinding terug, met hun onderdeel erbij', () => {
  const lijst = bevindingen(KLANT).filter(item => item.dim);
  assert.ok(lijst.length >= 2, 'geen enkele bevinding is aan een bedrijfsonderdeel gekoppeld');
  const duurste = lijst.find(item => item.id === 'onderdeel-tech');
  assert.ok(duurste, 'het duurste onderdeel levert geen bevinding op');
  assert.ok(duurste.waarde > 0);
  assert.ok(duurste.duur > 0, 'er staat geen doorlooptijd bij');
  assert.match(duurste.bewijs, /Op niveau \d+ kost dit onderdeel/);
});

test('de dekking zegt welk deel van je onderdelen geraakt wordt', () => {
  const v = bevindingenSamenvatting(KLANT);
  assert.ok(v.dekking > 0 && v.dekking <= 100, `dekking klopt niet: ${v.dekking}`);
  assert.equal(v.geraakteOnderdelen, new Set(bevindingen(KLANT).map(b => b.dim).filter(Boolean)).size);
  assert.equal(bevindingenSamenvatting({}).dekking, 0);
});

test('de capabilities-pagina toont de kosten per onderdeel', () => {
  const metrics = pageMetrics('ai-capabilities', KLANT);
  assert.equal(metrics[0][0], 'Kosten op huidig niveau');
  assert.notEqual(metrics[0][1], METRIC_EMPTY);
  assert.equal(metrics[2][0], 'Duurste onderdeel');
  assert.match(pageVisual('ai-capabilities', KLANT), /per jaar kost op zijn huidige niveau/);
  assert.equal(pageVisual('ai-capabilities', {}), '');
});

/* ---- Extern onderzoek gericht op de zwakke onderdelen ---- */

test('extern onderzoek wordt advies voor het onderdeel waar het over gaat', () => {
  const lijst = bevindingen(KLANT).filter(item => item.id.startsWith('onderzoek-'));
  assert.ok(lijst.length >= 2, 'geen enkele onderzoekskaart wordt advies');
  for (const item of lijst) {
    assert.ok(item.dim, `${item.id} hangt aan geen bedrijfsonderdeel`);
    assert.match(item.bewijs, /Bij jou staat .+ op niveau \d van \d/,
      'het externe cijfer wordt niet naast het eigen niveau gezet');
    assert.match(item.bewijs, /kost .+ euro per jaar/, 'wat dit onderdeel kost ontbreekt');
    assert.ok(String(item.bron).length > 10, `${item.id} noemt zijn bron niet`);
  }
  assert.ok(lijst.some(item => /McKinsey/.test(item.bron)), 'de McKinsey-bevinding komt niet terug');
});

test('een extern onderzoekscijfer krijgt geen verzonnen bedrag', () => {
  for (const item of bevindingen(KLANT).filter(x => x.id.startsWith('onderzoek-')))
    assert.equal(item.waarde, null,
      'extern onderzoek zegt iets over de markt, niet over wat het bij dit bedrijf oplevert');
});

test('onderdelen die al op streefniveau staan krijgen geen onderzoeksadvies', () => {
  const opOrde = { portal: { profile: { headcount: 38, hourlyCost: 52,
    maturity: { tech: 4, operatie: 4, finance: 4 } } } };
  assert.deepEqual(bevindingen(opOrde).filter(item => item.id.startsWith('onderzoek-')), [],
    'een bevinding over een onderdeel dat al op orde is, is geen werk');
});

test('welke afdelingen het raakt staat erbij', () => {
  const tech = bevindingen(KLANT).find(item => item.id === 'onderzoek-tech');
  assert.ok(tech, 'het zwakste onderdeel krijgt geen onderzoeksadvies');
  assert.match(tech.bewijs, /het raakt /, 'de geraakte afdelingen ontbreken');
});

/* ---- Invoer die eerder geen gevolg had ---- */

const ZWAK = { portal: {
  profile: { headcount: 20, hourlyCost: 48, maturity: { finance: 2 } },
  metrics: { revenue: 1800000, ebitda: 72000 },
  valueFinance: { balance: 1600000, equity: 120000, debt: 900000, cash: 20000, interest: 58000, multiple: 4, fixed: 800000 },
  roadmap: { items: [{ title: 'ERP', progress: 0, owner: 'Sam' }, { title: 'Werkinstructies', progress: 0, owner: '' }] },
  changes: { items: [{ change: 'Nieuwe planning', status: 'Open' }] },
  offer: { package: 'Groei', sprints: 4, approval: { agreed: false } },
  aiScan: { tasks: [{ name: 'Offertes', hours: 4, freq: 52 }], hourlyRate: 48 }
} };

test('een leeg veld wordt niet als nul met de norm vergeleken', () => {
  // Number(null) is 0 en Number.isFinite(0) is waar, waardoor een niet ingevuld
  // veld verscheen als "brutomarge 0% tegenover 38%": een bewering over iets
  // wat de klant nooit heeft opgegeven.
  const markt = bevindingen(ZWAK).filter(item => item.soort === 'markt' && /wijkt ongunstig/.test(item.titel));
  assert.ok(!markt.some(item => /Brutomarge/.test(item.titel)),
    'de brutomarge wordt vergeleken terwijl het veld leeg is');
  assert.ok(!markt.some(item => /eNPS/.test(item.titel)), 'eNPS wordt vergeleken terwijl het veld leeg is');
  assert.ok(markt.some(item => /EBITDA-marge/.test(item.titel)), 'de wél ingevulde marge ontbreekt');
});

test('financiële weerbaarheid wordt werk zodra de cijfers eronder zakken', () => {
  const lijst = bevindingen(ZWAK);
  for (const id of ['altman-z', 'dscr', 'rentedekking'])
    assert.ok(lijst.find(item => item.id === id), `${id} levert geen bevinding op`);
  const altman = lijst.find(item => item.id === 'altman-z');
  assert.match(altman.bewijs, /Altman Z staat op/);
  assert.equal(altman.dim, 'finance');

  // Een gezond bedrijf hoort hier niets te zien.
  const gezond = bevindingen(KLANT);
  for (const id of ['altman-z', 'dscr', 'rentedekking'])
    assert.ok(!gezond.find(item => item.id === id), `${id} slaat aan bij een gezond bedrijf`);
});

test('roadmap, wijzigingen, offerte en AI-scan hebben gevolgen', () => {
  const lijst = bevindingen(ZWAK);
  const zonderEigenaar = lijst.find(item => item.id === 'roadmap-zonder-eigenaar');
  assert.match(zonderEigenaar.bewijs, /1 van de 2 onderdelen/);
  assert.ok(lijst.find(item => item.id === 'roadmap-stilstand'));
  assert.match(lijst.find(item => item.id === 'wijzigingen-niet-geborgd').bewijs, /Open/);
  assert.match(lijst.find(item => item.id === 'offerte-wacht').bewijs, /Pakket Groei/);
  assert.ok(lijst.find(item => item.id === 'ai-scan-kansen'));
});

test('een afgeronde roadmap en een getekende offerte leveren geen werk op', () => {
  const afgerond = { portal: {
    profile: { headcount: 20, hourlyCost: 48, maturity: { finance: 4 } },
    roadmap: { items: [{ title: 'ERP', progress: 100, owner: 'Sam', done: true }] },
    changes: { items: [{ change: 'Nieuwe planning', status: 'Geborgd' }] },
    offer: { package: 'Groei', approval: { agreed: true, name: 'Sam' } }
  } };
  const ids = bevindingen(afgerond).map(item => item.id);
  for (const id of ['roadmap-zonder-eigenaar', 'roadmap-stilstand', 'wijzigingen-niet-geborgd', 'offerte-wacht'])
    assert.ok(!ids.includes(id), `${id} slaat aan terwijl er niets openstaat`);
});

/* ---- Borging, strategie en conclusie ---- */

const BORGING = { portal: {
  profile: { headcount: 20, hourlyCost: 48, maturity: { sturing: 2 } },
  freshness: { items: [
    { what: 'Offerteproces', date: '2026-01-10', document: 'Werkinstructie offertes', documentOwner: '', reviewDate: '2026-06-01' },
    { what: 'RIE', date: '2026-02-02', document: 'RIE 2026', documentOwner: 'Arthur', reviewDate: '2027-01-01' }
  ] },
  strategy: { horizon: '2027', minimumValue: 10000, findings: [
    { title: 'Serviceportaal bouwen', value: 45000 }, { title: 'Kleine verbetering', value: 2000 } ] },
  tasks: { items: [{ title: 'Iets anders' }] },
  finalConclusion: { text: 'We gaan door op automatisering', decision: 'Investeren in ERP', owner: '' }
} };

const PEIL = '2026-09-11';

test('een verstreken reviewdatum is een feit, geen interpretatie', () => {
  const item = bevindingen(BORGING, PEIL).find(b => b.id === 'borging-review-verlopen');
  assert.ok(item, 'een verstreken reviewdatum levert geen bevinding op');
  assert.equal(item.soort, 'verplichting');
  assert.equal(item.datum, '2026-06-01', 'de oudste verstreken datum wordt niet genoemd');
  assert.match(item.bewijs, /1 vastlegging/, 'de nog geldige vastlegging telt ten onrechte mee');
});

test('een document zonder eigenaar en een log dat stilstaat', () => {
  const lijst = bevindingen(BORGING, PEIL);
  assert.match(lijst.find(b => b.id === 'borging-zonder-eigenaar').bewijs, /Werkinstructie offertes/);
  assert.match(lijst.find(b => b.id === 'borging-stilstand').bewijs, /2026-02-02/);

  // Vier maanden is de grens; recenter dan dat is geen stilstand.
  const recent = { portal: { ...BORGING.portal, freshness: { items: [
    { what: 'Iets', date: '2026-08-01', document: 'Doc', documentOwner: 'Arthur', reviewDate: '2027-01-01' }] } } };
  assert.ok(!bevindingen(recent, PEIL).find(b => b.id === 'borging-stilstand'));
  assert.ok(!bevindingen(recent, PEIL).find(b => b.id === 'borging-review-verlopen'));
});

test('de eigen minimumwaarde bepaalt wat groot genoeg is om op te pakken', () => {
  const item = bevindingen(BORGING, PEIL).find(b => b.id === 'strategie-zonder-werk');
  assert.ok(item, 'strategische bevindingen zonder werk leveren geen bevinding op');
  assert.match(item.bewijs, /1 van de 1/, 'de bevinding onder de drempel telt ten onrechte mee');
  assert.match(item.bewijs, /Serviceportaal bouwen/);

  // Zodra er werk aan hangt, is het gat gedicht.
  const metWerk = { portal: { ...BORGING.portal,
    tasks: { items: [{ title: 'Serviceportaal bouwen' }] } } };
  assert.ok(!bevindingen(metWerk, PEIL).find(b => b.id === 'strategie-zonder-werk'));
});

test('de conclusie wordt één stille regel, geen gezeur', () => {
  const zonder = bevindingen(BORGING, PEIL).filter(b => b.pagina === 'eindconclusie');
  assert.equal(zonder.length, 1, 'de eindconclusie levert meer dan één bevinding op');
  assert.equal(zonder[0].id, 'conclusie-zonder-eigenaar');

  const metEigenaar = { portal: { ...BORGING.portal,
    finalConclusion: { ...BORGING.portal.finalConclusion, owner: 'Arthur' } } };
  assert.deepEqual(bevindingen(metEigenaar, PEIL).filter(b => b.pagina === 'eindconclusie'), [],
    'een conclusie met eigenaar hoort niets op te leveren');
});

test('canvassen en due-diligence leveren bewust geen bevindingen op', () => {
  // Een half ingevuld canvas is een staat, geen werk. Er is geen eerlijke manier
  // om te zeggen wat het kost, en alles tot bevinding maken maakt de lijst stuk.
  const canvas = { portal: {
    profile: { headcount: 20, hourlyCost: 48, maturity: { sturing: 3 } },
    canvases: { businessModel: { partners: 'ja', activities: '' } },
    dueDiligence: { notes: 'iets' } } };
  const paginas = bevindingen(canvas, PEIL).map(b => b.pagina);
  assert.ok(!paginas.includes('canvassen'));
  assert.ok(!paginas.includes('due-diligence'));
});
