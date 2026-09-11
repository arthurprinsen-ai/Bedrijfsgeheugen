import test from 'node:test';
import assert from 'node:assert/strict';
import { beoordeelControl, beoordeelPortefeuille, rangschikRisicos,
         auditMomentopname, canoniekRaamwerk, STATUS } from '../compliance-engine.js';
import { pageMetrics, pageWorklist, METRIC_EMPTY } from '../page-metrics.js';

/**
 * De compliance-engine zat alleen in portal-next. Portal V2 had een eenvoudiger
 * beoordeling in compliance-state.js; vier dingen ontbraken daar, en die zijn
 * de reden dat dit bestand is meeverhuisd. Deze test bewaakt precies die vier.
 */

const NU = new Date('2026-09-10');

const control = (extra = {}) => ({
  id: 'c1', framework: 'NIS2', requirement: 'Zorgplicht', applicability: 'applicable',
  control: { implemented: true }, verifiedAt: '2026-01-01', severity: 'high',
  evidence: [{ id: 'e1', verified: true, validUntil: '2027-01-01' }], ...extra
});

test('bewijs kan verlopen, en dan is een control niet meer geverifieerd', () => {
  assert.equal(beoordeelControl(control(), { nu: NU }).status, STATUS.VERIFIED);
  const verlopen = control({ evidence: [{ id: 'e1', verified: true, validUntil: '2025-06-01' }] });
  assert.equal(beoordeelControl(verlopen, { nu: NU }).status, STATUS.EVIDENCE_MISSING,
    'een control met verlopen bewijs blijft ten onrechte geverifieerd');
  const zonder = control({ evidence: [] });
  assert.equal(beoordeelControl(zonder, { nu: NU }).status, STATUS.EVIDENCE_MISSING);
  const toekomst = control({ verifiedAt: '2027-01-01' });
  assert.equal(beoordeelControl(toekomst, { nu: NU }).status, STATUS.EVIDENCE_MISSING,
    'een verificatie in de toekomst hoort niet te tellen');
});

test('niet van toepassing en niet ingericht worden apart gehouden', () => {
  assert.equal(beoordeelControl(control({ applicability: 'not_applicable' }), { nu: NU }).status, STATUS.NOT_APPLICABLE);
  assert.equal(beoordeelControl(control({ applicability: 'unknown' }), { nu: NU }).status, STATUS.UNKNOWN);
  assert.equal(beoordeelControl(control({ control: { implemented: false } }), { nu: NU }).status, STATUS.MISSING);
  assert.equal(beoordeelControl(control({ status: STATUS.IN_PROGRESS }), { nu: NU }).status, STATUS.IN_PROGRESS);
});

test('dezelfde wet onder verschillende namen telt als één raamwerk', () => {
  for (const naam of ['NIS', 'WBNI', 'NIS2', 'CBW', 'Cyberbeveiligingswet'])
    assert.equal(canoniekRaamwerk(naam), 'NIS2_CBW', `${naam} wordt niet samengenomen`);
  assert.equal(canoniekRaamwerk('AVG'), 'AVG');
  assert.equal(canoniekRaamwerk(''), 'ONBEKEND_RAAMWERK');
});

test('dezelfde eis uit twee bronnen telt één keer, en de zwaarste wint', () => {
  const goed = control({ id: 'gedeeld' });
  const slecht = control({ id: 'gedeeld', framework: 'WBNI', evidence: [{ id: 'e', verified: true, validUntil: '2025-01-01' }] });
  const portefeuille = beoordeelPortefeuille([goed, slecht], { nu: NU });
  assert.equal(portefeuille.totaal, 1, 'de eis telt dubbel mee in de dekking');
  assert.equal(portefeuille.controls[0].status, STATUS.EVIDENCE_MISSING,
    'de gunstigste beoordeling wint, terwijl de zwaarste zou moeten winnen');
});

test('de dekking telt alleen wat beoordeeld én van toepassing is', () => {
  const portefeuille = beoordeelPortefeuille([
    control({ id: 'a' }),
    control({ id: 'b', evidence: [{ id: 'e', verified: true, validUntil: '2025-01-01' }] }),
    control({ id: 'c', applicability: 'not_applicable' }),
    control({ id: 'd', applicability: 'unknown' })
  ], { nu: NU });
  assert.equal(portefeuille.totaal, 4);
  assert.equal(portefeuille.toepasbaar, 2, 'niet-toepasbaar of onbekend hoort niet in de noemer');
  assert.equal(portefeuille.geverifieerd, 1);
  assert.equal(portefeuille.dekking, 50);
  assert.equal(beoordeelPortefeuille([], { nu: NU }).dekking, null,
    'zonder controls is er geen dekking, en 0% zou een bewering zijn');
});

test('de rangorde van risico\'s is een uitkomst, geen mening', () => {
  const hoog = control({ id: 'hoog', severity: 'critical', control: { implemented: false } });
  const laag = control({ id: 'laag', severity: 'low', evidence: [{ id: 'e', verified: true, validUntil: '2025-01-01' }] });
  const gerangschikt = rangschikRisicos([laag, hoog], { nu: NU });
  assert.equal(gerangschikt[0].id, 'hoog', 'het zwaarste risico staat niet bovenaan');
  assert.ok(gerangschikt[0].risicoScore > gerangschikt[1].risicoScore);
  assert.ok(!gerangschikt.some(item => item.status === STATUS.VERIFIED),
    'een geverifieerde control hoort geen openstaand risico te zijn');
});

test('de auditmomentopname draagt bevindingen én bewijsindex', () => {
  const snapshot = auditMomentopname([control({ id: 'a' }), control({ id: 'b', control: { implemented: false } })], { nu: NU });
  assert.equal(snapshot.samenvatting.totaal, 2);
  assert.equal(snapshot.bevindingen.length, 1);
  assert.equal(snapshot.bevindingen[0].id, 'b');
  assert.ok(snapshot.bewijsindex.length >= 1);
  assert.match(snapshot.tijdstip, /^2026-09-10/);
});

test('het Command Center rekent met de engine zodra er controls zijn', () => {
  const controls = [
    control({ id: 'c1', evidence: [{ id: 'e', verified: true, validUntil: '2025-06-01' }] }),
    control({ id: 'c2', framework: 'AVG', requirement: 'Verwerkingsregister', severity: 'medium' })
  ];
  const state = { portal: { compliance: { controls, policies: { 0: 'ontbreekt' } } } };
  const metrics = pageMetrics('compliance-command-center', state);
  assert.deepEqual(metrics[0], ['Controls beoordeeld', '2 van 2']);
  assert.deepEqual(metrics[2], ['Dekking', '50%']);
  const lijst = pageWorklist('compliance-command-center', state);
  assert.ok(lijst.some(([label]) => label.startsWith('NIS2_CBW')), 'het openstaande risico staat niet op het scherm');

  // Zonder controls valt de pagina terug op de bestaande beoordeling, en zonder
  // klantdata blijft hij leeg — dezelfde regel als elke andere pagina.
  assert.ok(pageMetrics('compliance-command-center', {}).every(([, w]) => w === METRIC_EMPTY));
});

/* ---- Powerhouse-route, geport uit portal-next ---- */
import { powerhouseRoute, routeOverzicht, agentStatus } from '../flow-state.js';
import { pageVisual } from '../page-visuals.js';

const AGENTEN = [
  { id: 'a', category: 'detectie', status: 'completed', evidence: ['e'] },
  { id: 'b', category: 'analyse', status: 'running' },
  { id: 'c', category: 'uitvoering', status: 'blocked' },
  { id: 'd', category: 'verificatie', status: 'queued' },
  { id: 'e', category: 'learning', status: 'idle' }
];

test('de route stopt bij de eerste agent die vastloopt', () => {
  const route = powerhouseRoute(AGENTEN);
  assert.deepEqual(route.map(stap => stap.categorie), ['detectie', 'analyse', 'uitvoering'],
    'wat achter een geblokkeerde agent zit is niet bereikt en hoort niet in de route');
  assert.equal(route.at(-1).status, 'blocked');
});

test('een stille agent komt niet in de route', () => {
  assert.equal(powerhouseRoute([{ id: 'x', category: 'detectie', status: 'idle' }]).length, 0);
  assert.equal(powerhouseRoute([{ id: 'x', category: 'detectie', status: 'disconnected' }]).length, 0);
  assert.deepEqual(powerhouseRoute([]), []);
});

test('een gepauzeerde agent met een openstaande herstelplicht is geblokkeerd', () => {
  assert.equal(agentStatus({ status: 'paused', recoveryObligation: { open: true } }), 'blocked');
  assert.equal(agentStatus({ status: 'paused' }), 'paused');
  assert.equal(agentStatus({}), 'idle');
});

test('het overzicht markeert waar de route stopt', () => {
  const overzicht = routeOverzicht(AGENTEN);
  assert.equal(overzicht.length, 3);
  assert.equal(overzicht[0].bereikt, true);
  assert.equal(overzicht.at(-1).huidig, true, 'de vastgelopen stap wordt niet als huidige gemarkeerd');
  assert.match(overzicht[0].uitleg, /1 bewijsstuk$/);
});

test('de route komt op het scherm en tekent niets zonder gegevens', () => {
  const state = { portal: { runtime: { agents: { items: [{ healthy: true }], route: AGENTEN } } } };
  assert.match(pageVisual('agentstatus', state), /Route door het Powerhouse/);
  assert.equal(pageVisual('agentstatus', {}), '');
});
