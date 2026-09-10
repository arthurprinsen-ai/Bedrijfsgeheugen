import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRuntimeProjection, loadRuntimeEvidence, BREIN_STAPPEN } from '../runtime-evidence.js';
import { pageMetrics, pageWorklist, hasPageData, METRIC_EMPTY } from '../page-metrics.js';
import { pageVisual } from '../page-visuals.js';

/**
 * De Brein- en Powerhouse-pagina's hingen aan geen enkele bron en toonden
 * daarom altijd een lege staat. De bron bestond wel: /api/brain-operating-loop
 * geeft de volledige projectie van de operating loop per tenant terug.
 *
 * Deze test bewaakt twee dingen tegelijk: dat die projectie echt doorwerkt naar
 * de schermen, en dat er zonder projectie nog steeds niets wordt getoond.
 */

const RUNTIME_PAGINAS = ['bronnenstatus','datahubstatus','brain-verwerking','agentstatus','actieve-acties',
  'recovery-obligations','outcomes-evidence','learning-writeback','self-heal','audittrail'];

const alleStappen = Object.fromEntries(BREIN_STAPPEN.map(stap => [stap, true]));

const PROJECTIE = {
  tenantId: 't1',
  records: [
    { id: 'r1', type: 'evidence', occurredAt: '2026-09-10T08:00:00Z', correlationId: 'c1' },
    { id: 'r2', type: 'decision', occurredAt: '2026-09-10T09:00:00Z', correlationId: 'c1' }
  ],
  wholeBrainLoops: [
    { correlationId: 'c1', complete: false, stages: { evidence: true, graph: true, intelligence: true } },
    { correlationId: 'c2', complete: true, stages: alleStappen }
  ],
  loopSummary: { complete: 1, incomplete: 1, total: 2 },
  integrationHealth: { components: [{ name: 'Supabase', healthy: true }, { name: 'Make', healthy: false }] },
  verifiedValue: { verifiedValues: [{ subjectId: 's1', status: 'VERIFIED', value: 12000 }, { subjectId: 's2', status: 'OPEN', value: 3000 }] },
  livingMemory: { memories: [{ claim: 'a', status: 'PROVEN' }, { claim: 'b', status: 'OPEN' }] },
  businessGraph: { nodes: [{ id: 'n1', label: 'Klant' }, { id: 'n2', label: 'Order' }], edges: [1, 2, 3] },
  executiveCockpit: {
    recommendedActions: [{ title: 'Koppel Make opnieuw', priority: 'hoog', value: 8000 }],
    openKnowledgeObligations: [{ title: 'Bewijs ontbreekt' }],
    activityTimeline: [{ title: 'Run A', status: 'OK', occurredAt: '2026-09-10T09:00:00Z' }, { title: 'Run B', status: 'BLOCKED' }],
    openLoops: [{ id: 'c1' }]
  }
};

const MET_DATA = { portal: { runtime: mapRuntimeProjection(PROJECTIE) } };

test('de dertien stappen van een breinlus staan vast en in volgorde', () => {
  assert.equal(BREIN_STAPPEN.length, 13);
  assert.equal(BREIN_STAPPEN[0], 'evidence');
  assert.equal(BREIN_STAPPEN.at(-1), 'graph_feedback');
});

test('elke Brein- en Powerhouse-pagina krijgt eigen cijfers uit de projectie', () => {
  const gezien = new Set();
  for (const page of RUNTIME_PAGINAS) {
    assert.equal(hasPageData(page, MET_DATA), true, `${page} ziet de projectie niet`);
    const metrics = pageMetrics(page, MET_DATA);
    assert.equal(metrics.length, 4, `${page} heeft geen vier kerncijfers`);
    assert.ok(metrics.every(([, value]) => value !== METRIC_EMPTY), `${page} toont nog leegtekens met data`);
    const labels = metrics.map(([label]) => label).join('|');
    assert.equal(gezien.has(labels), false, `${page} toont dezelfde vier labels als een andere pagina`);
    gezien.add(labels);
  }
});

test('de cijfers komen aantoonbaar uit de projectie en bewegen mee', () => {
  assert.deepEqual(pageMetrics('bronnenstatus', MET_DATA)[0], ['Bronnen', '2']);
  assert.deepEqual(pageMetrics('brain-verwerking', MET_DATA)[1], ['Rond', '1']);
  assert.deepEqual(pageMetrics('outcomes-evidence', MET_DATA)[1], ['Geverifieerd', '1']);
  assert.match(pageMetrics('outcomes-evidence', MET_DATA)[2][1], /12\.000/);

  const meerBronnen = { ...PROJECTIE, integrationHealth: { components: [
    { name: 'Supabase', healthy: true }, { name: 'Make', healthy: false }, { name: 'GitHub', healthy: true }] } };
  const anders = { portal: { runtime: mapRuntimeProjection(meerBronnen) } };
  assert.deepEqual(pageMetrics('bronnenstatus', anders)[0], ['Bronnen', '3']);
});

test('wat aandacht vraagt komt in de werklijst', () => {
  assert.deepEqual(pageWorklist('bronnenstatus', MET_DATA), [['Make', 'aandacht']]);
  assert.deepEqual(pageWorklist('bronnenstatus', {}), []);
});

test('zonder projectie blijft elke runtime-pagina leeg', () => {
  for (const page of RUNTIME_PAGINAS) {
    assert.equal(hasPageData(page, {}), false, `${page} claimt data zonder projectie`);
    assert.ok(pageMetrics(page, {}).every(([, value]) => value === METRIC_EMPTY), `${page} verzint een getal`);
    assert.equal(pageVisual(page, {}), '', `${page} tekent op lege data`);
  }
});

test('met projectie tekenen de pagina\'s een echt beeld', () => {
  for (const page of ['bronnenstatus','brain-verwerking','datahubstatus','actieve-acties',
                      'recovery-obligations','outcomes-evidence','learning-writeback','self-heal','audittrail'])
    assert.match(pageVisual(page, MET_DATA), /<figure class="v2visual"/, `${page} tekent niets met data`);
});

test('een storing of ontbrekende sessie laat de pagina\'s leeg in plaats van te gokken', async () => {
  assert.deepEqual(mapRuntimeProjection(null), {});
  assert.equal(await loadRuntimeEvidence({ fetchImpl: async () => ({ ok: false, status: 401 }) }), null);
  assert.equal(await loadRuntimeEvidence({ fetchImpl: async () => { throw new Error('offline'); } }), null);
});

test('een geslaagde ophaal landt in portal.runtime van de klantstate', async () => {
  let opgeslagen = null;
  const domainState = { get: () => ({ portal: { profile: { headcount: 12 } } }), set: value => { opgeslagen = value; } };
  const runtime = await loadRuntimeEvidence({
    fetchImpl: async () => ({ ok: true, json: async () => PROJECTIE }), domainState
  });
  assert.ok(runtime.sources.items.length);
  assert.equal(opgeslagen.portal.runtime.sources.items.length, 2);
  assert.equal(opgeslagen.portal.profile.headcount, 12, 'de bestaande klantstate mag niet worden overschreven');
});
