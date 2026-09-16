import test from 'node:test';
import assert from 'node:assert/strict';
import * as strategicModels from '../strategic-models.js';

const { buildBcgModel } = strategicModels;

const LEGACY_DESCRIPTIONS = {
  ster: 'Groeiende markt, sterke positie. Investeren zolang het duurt.',
  melkkoe: 'Trage markt, sterke positie. Hier haal je het geld voor de rest.',
  vraagteken: 'Groeiende markt, achterstand. Kiezen: investeren of loslaten.',
  hond: 'Trage markt, achterstand. Niet groeien maar opruimen.'
};

function state({ growth, own = 3, baseline = 3.2 } = {}) {
  return { portal: { profile: { maturity: { operatie: own, commercie: own, service: own, finance: own } }, market: { growth, digitalMaturity: baseline } } };
}

test('BCG reproduces the exact legacy quadrant boundary rules', () => {
  assert.equal(buildBcgModel(state({ growth: 2.0, own: 3.2, baseline: 3.2 })).currentQuadrant, 'ster');
  assert.equal(buildBcgModel(state({ growth: 1.5, own: 3.2, baseline: 3.2 })).currentQuadrant, 'melkkoe');
  assert.equal(buildBcgModel(state({ growth: 2.0, own: 3.1, baseline: 3.2 })).currentQuadrant, 'vraagteken');
  assert.equal(buildBcgModel(state({ growth: 1.5, own: 3.1, baseline: 3.2 })).currentQuadrant, 'hond');
  assert.equal(buildBcgModel(state({ growth: 2.0, own: 2, baseline: 0 })).currentQuadrant, 'ster');
});

test('BCG preserves the legacy quadrant copy and customer prompt', () => {
  const model = buildBcgModel(state({ growth: 1.0, own: 2, baseline: 3 }));
  assert.deepEqual(Object.fromEntries(model.quadrants.map(q => [q.id, q.description])), LEGACY_DESCRIPTIONS);
  assert.equal(model.prompt, 'Wat zijn je diensten, en welk vak past bij elk?');
  assert.equal(model.legacyGuidance, 'Het gemarkeerde vak is waar je nu staat, afgeleid uit sectorgroei en je eigen niveau. Heb je meerdere diensten? Zet ze los in dit raster — dan zie je waar je aandacht heen moet.');
});

test('Vraagteken exposes a deterministic action for the canonical roadmap, not a parallel queue', () => {
  const model = buildBcgModel(state({ growth: 2.4, own: 2.5, baseline: 3.2 }));
  assert.equal(model.currentQuadrant, 'vraagteken');
  assert.deepEqual(model.roadmapAction, { id: 'bcg-vraagteken-investeren-of-loslaten', title: 'BCG Vraagteken: investeren of loslaten', dimension: 'Strategie', owner: '', progress: 0, sprint: 1, start: 1, duration: 1, done: false, source: 'bcg', sourceQuadrant: 'vraagteken' });
});

test('BCG roadmap upsert is idempotent in the existing canonical roadmap collection', () => {
  assert.equal(typeof strategicModels.upsertBcgRoadmapAction, 'function');
  const model = buildBcgModel(state({ growth: 2.4, own: 2.5, baseline: 3.2 }));
  const existing = [{ id: 'existing', title: 'Bestaand item', sprint: 2 }];
  const once = strategicModels.upsertBcgRoadmapAction(existing, model);
  const twice = strategicModels.upsertBcgRoadmapAction(once, model);
  assert.equal(once.length, 2);
  assert.equal(twice.length, 2);
  assert.deepEqual(twice.find(item => item.id === model.roadmapAction.id), model.roadmapAction);
});
