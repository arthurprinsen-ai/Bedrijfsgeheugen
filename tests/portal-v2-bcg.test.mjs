import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyBcgItem, buildBcgModel } from '../portal-v2/models/bcg.js';

test('BCG classifies all four canonical quadrants deterministically', () => {
  assert.equal(classifyBcgItem({ relativeMarketShare: 1.4, marketGrowthPct: 18 }), 'Sterren');
  assert.equal(classifyBcgItem({ relativeMarketShare: 1.4, marketGrowthPct: 3 }), 'Cash cows');
  assert.equal(classifyBcgItem({ relativeMarketShare: 0.5, marketGrowthPct: 18 }), 'Vraagtekens');
  assert.equal(classifyBcgItem({ relativeMarketShare: 0.5, marketGrowthPct: 3 }), 'Dogs');
});

test('BCG model only uses explicit company portfolio data and never invents entries', () => {
  const empty = buildBcgModel({});
  assert.equal(empty.items.length, 0);
  assert.equal(empty.derived, false);
  assert.deepEqual(empty.quadrants.map(q => q.label), ['Sterren','Cash cows','Vraagtekens','Dogs']);
});

test('BCG model preserves evidence/provenance and rejects incomplete numeric inputs', () => {
  const model = buildBcgModel({
    portfolio: { items: [
      { id:'a', name:'Product A', relativeMarketShare:1.2, marketGrowthPct:12, evidenceRef:'crm:product-a' },
      { id:'b', name:'Incomplete', relativeMarketShare:0.8 }
    ]}
  });
  assert.equal(model.items.length, 1);
  assert.equal(model.items[0].quadrant, 'Sterren');
  assert.equal(model.items[0].evidenceRef, 'crm:product-a');
  assert.equal(model.excluded.length, 1);
  assert.equal(model.excluded[0].reason, 'missing_numeric_input');
});
