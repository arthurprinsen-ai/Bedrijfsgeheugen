import test from 'node:test';
import assert from 'node:assert/strict';
import { BRANCHES, BRANCHENAMEN, ONDERZOEK, BRONNEN, brancheProfiel,
         brancheVergelijking, onderzoekVoor, regelgevingVoor } from '../external-data.js';
import { pageMetrics, pageWorklist } from '../page-metrics.js';
import { pageVisual } from '../page-visuals.js';

/**
 * Externe data: branchenormen, onderzoekscijfers en het bronnenregister.
 * Een op een overgenomen uit klantportaal.html. Portal V2 vergeleek tot nu toe
 * alleen met handmatig ingevoerde benchmarks; de markt zat er niet in.
 *
 * De regel die deze test bewaakt: elk extern cijfer wordt met zijn bron
 * getoond. Een cijfer zonder bron is een bewering.
 */

const KLANT = { portal: {
  market: { industry: 'ICT & software' },
  metrics: { revenue: 2400000, ebitda: 290000, grossMargin: 48, dso: 52 },
  people: { absence: 5.1, turnover: 19, enps: 12 },
  research: { hypotheses: [{ hypothesis: 'a', evidence: 'x', source: 'y' }] },
  compliance: { policies: { 0: 'ontbreekt' } }
} };

test('de drie datasets zijn compleet en elk cijfer heeft een bron', () => {
  assert.ok(BRANCHENAMEN.length >= 10, 'te weinig branches');
  assert.ok(ONDERZOEK.length >= 30, 'te weinig onderzoeksbevindingen');
  assert.ok(BRONNEN.length >= 15, 'te weinig bronnen');
  for (const item of ONDERZOEK) {
    assert.ok(String(item.bron || '').trim(), `onderzoeksbevinding zonder bron: ${item.t}`);
    assert.ok(String(item.cijfer || '').trim(), `onderzoeksbevinding zonder cijfer: ${item.t}`);
  }
  for (const bron of BRONNEN) assert.match(bron.url, /^https:\/\//, `bron zonder vindplaats: ${bron.naam}`);
});

test('elke branche heeft normcijfers, financiële kengetallen en wetgeving', () => {
  for (const [naam, b] of Object.entries(BRANCHES)) {
    for (const veld of ['verzuim', 'verloop', 'enps', 'tw', 'dig', 'groei'])
      assert.ok(Number.isFinite(Number(b[veld])), `${naam} mist ${veld}`);
    for (const veld of ['marge', 'ebitda', 'loonquote', 'dso'])
      assert.ok(Number.isFinite(Number(b.norm?.[veld])), `${naam} mist norm.${veld}`);
    assert.ok(Number.isFinite(Number(b.fin?.mult)), `${naam} mist een EBITDA-multiple`);
    assert.ok(Array.isArray(b.wet) && b.wet.length, `${naam} mist wetgeving`);
  }
});

test('een onbekende branche valt terug op het gemiddelde NL-bedrijf', () => {
  assert.equal(brancheProfiel('Bestaat niet'), BRANCHES['Gemiddeld NL-bedrijf']);
  assert.equal(brancheProfiel(''), BRANCHES['Gemiddeld NL-bedrijf']);
  assert.equal(brancheProfiel('ict & SOFTWARE'), BRANCHES['ICT & software'], 'hoofdletters mogen niet uitmaken');
});

test('de vergelijking weet per maatstaf of hoger of lager beter is', () => {
  const rijen = brancheVergelijking({ grossMargin: 48, dso: 52, absence: 5.1, enps: 12 }, 'ICT & software');
  const marge = rijen.find(r => r.maatstaf === 'Brutomarge');
  const dso = rijen.find(r => r.maatstaf === 'DSO');
  assert.equal(marge.norm, 62);
  assert.equal(marge.beter, false, '48% marge tegen een norm van 62% is niet beter');
  assert.equal(dso.beter, false, '52 dagen tegen een norm van 38 is niet beter');
  const snel = brancheVergelijking({ dso: 20 }, 'ICT & software').find(r => r.maatstaf === 'DSO');
  assert.equal(snel.beter, true, 'sneller factureren dan de norm is wél beter');
});

test('zonder eigen cijfers wordt er niets vergeleken', () => {
  assert.deepEqual(brancheVergelijking({}, 'ICT & software'), []);
});

test('regelgeving komt per branche met de brancheorganisatie erbij', () => {
  const ict = regelgevingVoor('ICT & software');
  assert.ok(ict.regels.length >= 3);
  assert.equal(ict.instantie, 'NLdigital');
  assert.match(ict.url, /^https:\/\//);
  assert.ok(ict.regels.some(regel => /AI Act/i.test(regel)), 'de AI Act ontbreekt bij ICT');
});

test('onderzoek kan op bedrijfsonderdeel worden gefilterd', () => {
  assert.equal(onderzoekVoor().length, ONDERZOEK.length);
  const tech = onderzoekVoor('tech');
  assert.ok(tech.length > 0);
  assert.ok(tech.every(item => item.dim === 'tech'));
});

test('de externe data landt op de schermen, met bron', () => {
  assert.deepEqual(pageMetrics('branche-markt', KLANT)[0], ['Branche', 'ICT & software']);
  assert.equal(pageMetrics('branche-markt', KLANT)[1][1], '9', 'niet alle maatstaven worden vergeleken');

  const brancheLijst = JSON.stringify(pageWorklist('branche-markt', KLANT));
  assert.match(brancheLijst, /NLdigital/, 'de brancheorganisatie staat niet op het scherm');

  const cijferLijst = JSON.stringify(pageWorklist('cijfers-maatstaven', KLANT));
  assert.match(cijferLijst, /tegen de norm/, 'de eigen cijfers worden niet naast de norm gezet');

  const onderzoekLijst = JSON.stringify(pageWorklist('onderzoek', KLANT));
  assert.match(onderzoekLijst, /McKinsey|MIT|CBS/, 'externe bevindingen komen zonder bron op het scherm');

  assert.match(pageVisual('branche-markt', KLANT), /CBS|Eurostat/, 'de grafiek noemt zijn bron niet');
});

test('zonder klantdata blijft ook de externe vergelijking leeg', () => {
  assert.equal(pageVisual('branche-markt', {}), '');
  assert.deepEqual(pageWorklist('branche-markt', {}), []);
});
