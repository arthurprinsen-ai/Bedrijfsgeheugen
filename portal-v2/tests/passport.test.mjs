import test from 'node:test';
import assert from 'node:assert/strict';
import { bouwPassport, bouwAuditRapport, normaliseerControl, normaliseerBewijs,
         STANDAARD_CONTROLS, STATUS_LABEL } from '../passport.js';
import { pageMetrics, pageWorklist, METRIC_EMPTY } from '../page-metrics.js';
import { pageVisual } from '../page-visuals.js';
import { PORTAL_PAGE_INDEX } from '../page-registry.js';

/**
 * Het Data & AI Passport en het EU AI Act-auditrapport zaten alleen in het oude
 * `portal`-spoor en stonden live op /portal/data-ai-passport. Portal V2 kende ze
 * niet, en dat was een van de redenen dat de oude sporen niet weg konden.
 *
 * De kern is bewust ongewijzigd overgenomen: een control is pas geverifieerd als
 * álle bewijsstukken geverifieerd zijn, een openstaand punt wint van alles, en
 * de uitkomst is een bewijsstatus — geen complianceverklaring.
 *
 * Eén ding is wél veranderd: de AI Act-baseline komt nu uit regelgeving.js in
 * plaats van uit een eigen tijdlijn. Twee registers met dezelfde data verouderen
 * apart, en dat is precies het probleem dat dit portaal niet wil hebben.
 */

const MET_BEWIJS = { portal: {
  dataAiPassport: { generatedAt: '2026-09-10', controls: [
    { id: 'data-residency', claim: 'Alles in de EU', owner: 'Arthur',
      evidence: [{ id: 'e1', source: 'Supabase DPA', verified: true, confidence: 95 }] },
    { id: 'model-register', owner: 'Arthur', evidence: [
      { id: 'e2', source: 'Modelregister', verified: true, confidence: 90 },
      { id: 'e3', source: 'Make-scenario', verified: false, confidence: 40 }] },
    { id: 'retention', issue: 'Bewaartermijnen niet vastgelegd' }
  ] },
  runtime: { passport: { aiAct: {
    controls: [{ id: 'a50', article: 'Article 50', title: 'Transparantie', status: 'evidence_missing', evidenceRefs: ['e9'] }],
    findings: [{ article: 'Article 50', title: 'Markering ontbreekt', owner: 'Arthur' }],
    systems: [{ useCaseId: 'chat', role: 'deployer', riskClass: 'limited' }],
    summary: { conclusion: 'Beperkt risico, transparantieplicht van toepassing.' }
  } } }
} };

test('de tien controls uit het oude portaal zijn ongewijzigd overgenomen', () => {
  assert.equal(STANDAARD_CONTROLS.length, 10);
  const ids = STANDAARD_CONTROLS.map(control => control.id);
  for (const id of ['data-residency', 'model-register', 'ai-risk-classification', 'human-oversight', 'monitoring-audit'])
    assert.ok(ids.includes(id), `${id} ontbreekt`);
  for (const control of STANDAARD_CONTROLS) {
    assert.ok(control.label && control.categorie && control.uitleg, `${control.id} is niet volledig`);
  }
});

test('een control is pas geverifieerd als al zijn bewijs geverifieerd is', () => {
  const alles = normaliseerControl({ id: 'x', evidence: [{ verified: true }, { verified: true }] });
  assert.equal(alles.status, 'verified');
  const deels = normaliseerControl({ id: 'x', evidence: [{ verified: true }, { verified: false }] });
  assert.equal(deels.status, 'partially_verified');
  const geen = normaliseerControl({ id: 'x', evidence: [] });
  assert.equal(geen.status, 'unknown');
});

test('een openstaand punt wint van bewijs', () => {
  const control = normaliseerControl({ id: 'x', issue: 'Niet vastgelegd', evidence: [{ verified: true }] });
  assert.equal(control.status, 'action_required',
    'een control met een openstaand punt mag nooit als geverifieerd gelden');
});

test('de zekerheidsschaal van het oude portaal is behouden', () => {
  assert.equal(normaliseerBewijs({ confidence: 95 }).zekerheidLabel, 'Geverifieerd');
  assert.equal(normaliseerBewijs({ confidence: 80 }).zekerheidLabel, 'Hoge zekerheid');
  assert.equal(normaliseerBewijs({ confidence: 60 }).zekerheidLabel, 'Redelijke zekerheid');
  assert.equal(normaliseerBewijs({ confidence: 10 }).zekerheidLabel, 'Lage zekerheid');
  assert.equal(normaliseerBewijs({}).zekerheidLabel, 'Onbekend');
});

test('zonder gegevens staat alles op nog te bewijzen, niet op geverifieerd', () => {
  const passport = bouwPassport({});
  assert.equal(passport.controls.length, 10);
  assert.equal(passport.samenvatting.onbekend, 10);
  assert.equal(passport.samenvatting.verified, 0);
  assert.equal(passport.samenvatting.dekkingPct, 0);
  assert.equal(passport.claim, 'alleen bewijsstatus');
});

test('met bewijs komt elke status uit de gegevens', () => {
  const passport = bouwPassport(MET_BEWIJS);
  const status = id => passport.controls.find(control => control.id === id).status;
  assert.equal(status('data-residency'), 'verified');
  assert.equal(status('model-register'), 'partially_verified');
  assert.equal(status('retention'), 'action_required');
  assert.equal(passport.samenvatting.verified, 1);
  assert.equal(passport.samenvatting.bewijsdekkingPct, 20);
});

test('de AI Act-baseline komt uit het regelgevingsregister, niet uit een tweede tijdlijn', () => {
  const rapport = bouwAuditRapport(MET_BEWIJS);
  assert.equal(rapport.baseline.bron, 'portal-v2/regelgeving.js');
  assert.ok(rapport.baseline.mijlpalen.length >= 6, 'de AI Act-mijlpalen ontbreken');
  for (let i = 1; i < rapport.baseline.mijlpalen.length; i += 1)
    assert.ok(rapport.baseline.mijlpalen[i].datum >= rapport.baseline.mijlpalen[i - 1].datum,
      'de mijlpalen staan niet op datum');
  const hoogRisico = rapport.baseline.mijlpalen.find(m => /bijlage III/i.test(m.wat));
  assert.equal(hoogRisico.datum, '2027-12-02', 'het rapport draagt de oude hoog-risicodatum');
});

test('het rapport blijft een bewijsoverzicht en geen certificaat', () => {
  const rapport = bouwAuditRapport(MET_BEWIJS);
  assert.match(rapport.voorbehoud, /geen juridisch certificaat/);
  assert.equal(rapport.bevindingen.length, 1);
  assert.equal(rapport.transparantie.length, 1);
  assert.equal(rapport.scope.systemen, 1);
  assert.equal(bouwAuditRapport({}).conclusie, 'Scope nog niet bepaalbaar zonder eigen gegevens.');
});

test('beide schermen bestaan en tonen niets zonder gegevens', () => {
  for (const page of ['data-ai-passport', 'eu-ai-act-audit']) {
    assert.ok(PORTAL_PAGE_INDEX[page], `${page} staat niet in de paginaregistratie`);
    assert.ok(pageMetrics(page, {}).every(([, waarde]) => waarde === METRIC_EMPTY), `${page} verzint een getal`);
    assert.equal(pageVisual(page, {}), '', `${page} tekent op lege data`);
  }
});

test('met gegevens landen de cijfers en het beeld op het scherm', () => {
  assert.deepEqual(pageMetrics('data-ai-passport', MET_BEWIJS)[1], ['Geverifieerd', '1 van 10']);
  assert.deepEqual(pageMetrics('eu-ai-act-audit', MET_BEWIJS)[1], ['Open bevindingen', '1']);
  assert.match(pageVisual('data-ai-passport', MET_BEWIJS), /<figure class="v2visual"/);
  assert.match(pageVisual('eu-ai-act-audit', MET_BEWIJS), /<figure class="v2visual"/);
  const lijst = pageWorklist('data-ai-passport', MET_BEWIJS);
  assert.ok(lijst.some(([label]) => label === 'Bewaartermijnen'), 'het openstaande punt staat niet in de werklijst');
  assert.ok(Object.values(STATUS_LABEL).includes('Actie nodig'));
});
