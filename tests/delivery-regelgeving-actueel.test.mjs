import test from 'node:test';
import assert from 'node:assert/strict';
import { REGELGEVING, STATUS, CATEGORIEEN, verlopenHerzieningen, achterhaaldeStatus,
         komendeMijlpalen, lopendeVerplichtingen } from '../portal-v2/regelgeving.js';
import { HERKOMST, ONDERZOEK, onderzoekGeverifieerd, onderzoekZonderJaar } from '../portal-v2/external-data.js';

/**
 * Deze bewaking bestaat om één ding te voorkomen: een register met wetgeving
 * dat stil veroudert.
 *
 * Een lijst met wetten in een repo is een momentopname. Het duidelijkste
 * voorbeeld staat in het register zelf: de hoog-risicoverplichtingen van de AI
 * Act stonden jarenlang op 2 augustus 2026 en zijn op 27 juli 2026 — zes dagen
 * vóór die deadline — verschoven naar 2 december 2027. Wie in juni 2026 een
 * statisch overzicht had gemaakt, gaf klanten vanaf augustus verkeerde
 * informatie zonder het te merken.
 *
 * Het register kan zichzelf niet bijwerken. Deze test zorgt dat het niet stil
 * kan verouderen: hij gaat rood zodra een herzieningsdatum verstrijkt, of
 * zodra een aangekondigde datum gepasseerd is terwijl de status nog op
 * "verwacht" of "voorstel" staat.
 *
 * Rood betekent hier niet "de code is stuk". Het betekent: iemand moet deze
 * regels nakijken en de peildatum vooruitzetten.
 */

const nu = () => new Date().toISOString().slice(0, 10);
const isDatum = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

test('elke regel is volledig vastgelegd, met bron en peildatum', () => {
  assert.ok(REGELGEVING.length >= 20, 'het register is te dun om bruikbaar te zijn');
  const ids = new Set();
  for (const item of REGELGEVING) {
    assert.ok(item.id && !ids.has(item.id), `dubbele of ontbrekende id: ${item.id}`);
    ids.add(item.id);
    assert.ok(CATEGORIEEN[item.categorie], `${item.id} heeft een onbekende categorie`);
    assert.ok(Object.values(STATUS).includes(item.status), `${item.id} heeft een onbekende status`);
    for (const veld of ['naam', 'wat', 'raakt', 'bron']) {
      assert.ok(String(item[veld] || '').trim().length > 5, `${item.id} mist ${veld}`);
    }
    assert.match(item.url, /^https:\/\//, `${item.id} heeft geen vindplaats`);
    assert.ok(isDatum(item.peildatum), `${item.id} heeft geen peildatum`);
    assert.ok(isDatum(item.herzienUiterlijk), `${item.id} heeft geen herzieningsdatum`);
    assert.ok(item.herzienUiterlijk > item.peildatum, `${item.id}: herzien moet ná de peildatum liggen`);
    for (const m of item.mijlpalen) {
      assert.ok(isDatum(m.datum), `${item.id} heeft een mijlpaal zonder geldige datum`);
      assert.ok(String(m.wat || '').trim().length > 5, `${item.id} heeft een mijlpaal zonder omschrijving`);
    }
  }
});

test('geen enkele regel is over zijn herzieningsdatum heen', () => {
  const verlopen = verlopenHerzieningen(nu());
  assert.deepEqual(
    verlopen.map(item => `${item.id} (herzien uiterlijk ${item.herzienUiterlijk})`), [],
    'Deze regels moeten worden nagekeken bij hun bron. Werk de inhoud bij, zet de ' +
    'peildatum op vandaag en zet herzienUiterlijk vooruit. Verzet nooit alleen de datum.'
  );
});

test('geen enkele regel staat op verwacht terwijl de datum al gepasseerd is', () => {
  const achterhaald = achterhaaldeStatus(nu());
  assert.deepEqual(
    achterhaald.map(item => `${item.id} (status ${item.status})`), [],
    'Bij deze regels is een aangekondigde datum verstreken terwijl de status nog ' +
    'verwacht of voorstel is. Controleer of de wet daadwerkelijk in werking is getreden.'
  );
});

test('een wetsvoorstel wordt nooit als vaststaand gepresenteerd', () => {
  for (const item of REGELGEVING) {
    if (item.status !== STATUS.VOORSTEL) continue;
    assert.ok(String(item.letop || '').trim(), `${item.id} is een voorstel maar heeft geen voorbehoud`);
  }
});

test('de AI Act draagt de correctie van de Digital Omnibus', () => {
  const ai = REGELGEVING.find(item => item.id === 'eu-ai-act');
  assert.ok(ai, 'de AI Act ontbreekt in het register');
  const hoogRisico = ai.mijlpalen.find(m => /bijlage III/i.test(m.wat));
  assert.equal(hoogRisico.datum, '2027-12-02', 'de hoog-risicodatum is niet de gecorrigeerde datum');
  assert.match(ai.letop, /Omnibus/, 'de correctie wordt niet toegelicht');
  const transparantie = ai.mijlpalen.find(m => /artikel 50/i.test(m.wat));
  assert.equal(transparantie.datum, '2026-08-02', 'de transparantieplicht is niet uitgesteld en hoort op 2 augustus 2026 te staan');
});

test('het register kent zowel wat nu geldt als wat eraan komt', () => {
  assert.ok(lopendeVerplichtingen().length >= 8, 'te weinig lopende verplichtingen');
  assert.ok(komendeMijlpalen().length >= 3, 'het register kijkt niet vooruit');
  const komend = komendeMijlpalen();
  for (let i = 1; i < komend.length; i += 1)
    assert.ok(komend[i].datum >= komend[i - 1].datum, 'komende mijlpalen staan niet op datum');
});

test('alle categorieën die een organisatie raken zijn gedekt', () => {
  const gedekt = new Set(REGELGEVING.map(item => item.categorie));
  for (const categorie of ['ai', 'arbeid', 'cyber', 'privacy', 'duurzaam', 'financieel', 'product'])
    assert.ok(gedekt.has(categorie), `geen enkele regel in categorie ${categorie}`);
});


/**
 * Dezelfde regel geldt voor de externe datasets: branchenormen en
 * onderzoekscijfers verouderen net zo goed als wetgeving. Ze hadden alleen geen
 * vervaldatum. Dat is hiermee rechtgezet.
 */

test('elke externe dataset draagt zijn herkomst en houdbaarheid', () => {
  for (const [naam, meta] of Object.entries(HERKOMST)) {
    assert.ok(String(meta.wat || '').trim().length > 20, `${naam} mist een omschrijving`);
    assert.ok(isDatum(meta.peildatum), `${naam} mist een peildatum`);
    assert.ok(isDatum(meta.herzienUiterlijk), `${naam} mist een herzieningsdatum`);
    assert.ok(meta.herzienUiterlijk > meta.peildatum, `${naam}: herzien moet ná de peildatum liggen`);
    assert.ok(String(meta.voorbehoud || '').trim().length > 20, `${naam} mist een voorbehoud over wat wel en niet is gecontroleerd`);
  }
});

test('geen enkele externe dataset is over zijn herzieningsdatum heen', () => {
  const vandaag = nu();
  const verlopen = Object.entries(HERKOMST)
    .filter(([, meta]) => meta.herzienUiterlijk < vandaag)
    .map(([naam, meta]) => `${naam} (herzien uiterlijk ${meta.herzienUiterlijk})`);
  assert.deepEqual(verlopen, [],
    'Loop deze datasets na bij hun bron, werk de cijfers bij en zet de peildatum vooruit.');
});

test('een geverifieerd onderzoekscijfer draagt zijn jaartal en datum', () => {
  for (const item of onderzoekGeverifieerd()) {
    assert.ok(Number.isInteger(item.jaar), `${item.t} is geverifieerd maar heeft geen jaartal`);
    assert.ok(isDatum(item.geverifieerd), `${item.t} heeft geen verificatiedatum`);
    assert.match(item.bron, /\d{4}/, `${item.t} noemt geen jaar in de bronvermelding`);
  }
  assert.ok(onderzoekGeverifieerd().length >= 2, 'geen enkel onderzoekscijfer is opnieuw nagelopen');
});

test('het aantal ongedateerde onderzoekscijfers loopt niet op', () => {
  // Achtentwintig kaarten zijn overgenomen zonder jaartal. Een percentage zonder
  // jaar is voor een klant niet na te lopen. Dit getal hoort te dalen; loopt het
  // op, dan is er een ongedateerd cijfer bijgezet en gaat deze test rood.
  assert.ok(onderzoekZonderJaar().length <= 28,
    `er staan nu ${onderzoekZonderJaar().length} onderzoekscijfers zonder jaartal in het portaal`);
  assert.equal(onderzoekZonderJaar().length + onderzoekGeverifieerd().length, ONDERZOEK.length);
});

test('een omstreden cijfer wordt niet als vaststaand gepresenteerd', () => {
  const mit = ONDERZOEK.find(item => /MIT/i.test(item.bron || ''));
  assert.ok(mit, 'de MIT-bevinding ontbreekt');
  assert.match(mit.voorbehoud || '', /omstreden|één studie/i,
    'het 95%-cijfer wordt zonder voorbehoud getoond terwijl het op één studie rust');
});
