import test from 'node:test';
import assert from 'node:assert/strict';
import { dataBronnen, bronnenSamenvatting, bronnenTeHerzien, SOORTEN } from '../data-sources.js';
import { pageMetrics, pageWorklist } from '../page-metrics.js';
import { pageVisual } from '../page-visuals.js';

/**
 * Het portaal wordt door vier soorten data gevoed: wat de klant invult, wat het
 * brein meet, wat het portaal uitrekent en wat de buitenwereld zegt. Die zaten
 * in vier losse modules zonder gedeeld beeld, waardoor je nergens kon zien of
 * de lus rond was.
 *
 * Deze test bewaakt dat het overzicht klopt én eerlijk blijft: een leeg portaal
 * hoort te laten zien dát er iets ontbreekt, niet te doen alsof alles draait.
 */

const MET_DATA = { portal: {
  profile: { headcount: 38 },
  metrics: { revenue: 2400000 },
  runtime: {
    brain: { loops: 2, items: [{ healthy: true }, { healthy: false }], updatedAt: '2026-09-10' },
    sources: { items: [{ naam: 'Supabase', healthy: true }, { naam: 'Make', healthy: false }], updatedAt: '2026-09-10' }
  }
} };

test('alle vier de soorten data zijn vertegenwoordigd', () => {
  const bronnen = dataBronnen({});
  const soorten = new Set(bronnen.map(item => item.soort));
  for (const soort of Object.keys(SOORTEN))
    assert.ok(soorten.has(soort), `geen enkele bron van soort ${soort}`);
  assert.ok(bronnen.length >= 8, 'te weinig bronnen in het register');
  const ids = bronnen.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length, 'dubbele bron-id');
});

test('elke bron zegt wat hij voedt en hoeveel erin zit', () => {
  for (const bron of dataBronnen(MET_DATA)) {
    assert.ok(String(bron.naam).trim().length > 3, `${bron.id} mist een naam`);
    assert.ok(String(bron.detail).trim().length > 10, `${bron.id} legt niet uit wat er aan de hand is`);
    assert.ok(Number.isFinite(bron.aantal), `${bron.id} heeft geen aantal`);
    assert.ok(String(bron.eenheid).trim(), `${bron.id} mist een eenheid`);
    assert.equal(typeof bron.gezond, 'boolean', `${bron.id} zegt niet of hij het portaal voedt`);
  }
});

test('een leeg portaal laat zien dat de lus onderbroken is', () => {
  const samenvatting = bronnenSamenvatting({});
  assert.equal(samenvatting.volledig, false, 'een leeg portaal doet alsof alles draait');
  assert.ok(samenvatting.aandacht >= 3, 'de ontbrekende eigen invoer en runtime worden niet gemeld');
  assert.ok(samenvatting.onderbroken.some(naam => /Ingevulde onderdelen/.test(naam)));
  assert.ok(samenvatting.onderbroken.some(naam => /Operating loop/.test(naam)));

  // De externe kant en de rekenregels staan er hoe dan ook; dat mag niet
  // verdwijnen omdat de klant nog niets heeft ingevuld.
  const bronnen = dataBronnen({});
  assert.equal(bronnen.find(item => item.id === 'rekenregels').gezond, true);
  assert.equal(bronnen.find(item => item.id === 'branchenormen').gezond, true);
  assert.equal(bronnen.find(item => item.id === 'regelgeving').gezond, true);
});

test('met eigen data en runtime is de lus rond', () => {
  const samenvatting = bronnenSamenvatting(MET_DATA);
  assert.equal(samenvatting.volledig, true, `nog onderbroken: ${samenvatting.onderbroken.join(', ')}`);
  assert.equal(samenvatting.aandacht, 0);
});

test('de rekenregels melden hun eigen dekking', () => {
  const regels = dataBronnen({}).find(item => item.id === 'rekenregels');
  assert.ok(regels.aantal >= 100, 'het pariteitscontract is gekrompen');
  assert.match(regels.detail, /uitvoerbaar/, 'de dekking van de rekenregels wordt niet gemeld');
});

test('bronnen met een houdbaarheidsdatum worden bewaakt', () => {
  const metDatum = dataBronnen({}).filter(item => item.herzienUiterlijk);
  assert.ok(metDatum.length >= 3, 'de externe datasets dragen geen herzieningsdatum meer');
  assert.deepEqual(bronnenTeHerzien(), [],
    'deze bronnen zijn over hun herzieningsdatum heen en moeten bij de bron worden nagelopen');
});

test('de bronnenpagina toont het hele beeld, ook zonder runtime', () => {
  const leeg = pageMetrics('bronnenstatus', {});
  assert.equal(leeg[0][0], 'Databronnen');
  assert.equal(leeg[0][1], String(dataBronnen({}).length));
  assert.notEqual(leeg[2][1], '0', 'een leeg portaal meldt geen enkele onderbreking');

  const lijst = pageWorklist('bronnenstatus', {});
  assert.equal(lijst.length, dataBronnen({}).length, 'niet elke bron staat op de pagina');
  assert.ok(lijst.some(([label]) => label.startsWith('Onderbroken')), 'onderbrekingen worden niet gemarkeerd');

  assert.match(pageVisual('bronnenstatus', {}), /<figure class="v2visual"/, 'de bronnenpagina tekent niets');
  assert.match(pageVisual('bronnenstatus', MET_DATA), /Aangesloten bronsystemen/, 'de integraties ontbreken in beeld');
});
