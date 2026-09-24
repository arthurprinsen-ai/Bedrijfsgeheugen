import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const library = JSON.parse(fs.readFileSync(new URL('../config/powerhouse-problem-library.json', import.meta.url), 'utf8'));

test('Powerhouse problem library has unique canonical IDs and required decision fields', () => {
  assert.equal(library.version, '1.1.0');
  assert.ok(Array.isArray(library.problems));
  assert.ok(library.problems.length >= 40);

  const ids = new Set();
  const names = new Set();
  for (const problem of library.problems) {
    assert.match(problem.problem_id, /^PH-P\d{3}$/);
    assert.ok(!ids.has(problem.problem_id), `duplicate problem id: ${problem.problem_id}`);
    ids.add(problem.problem_id);

    assert.ok(problem.name);
    assert.ok(!names.has(problem.name), `duplicate problem name: ${problem.name}`);
    names.add(problem.name);

    assert.ok(problem.category);
    assert.ok(problem.description);
    assert.ok(Array.isArray(problem.signals) && problem.signals.length > 0);
    assert.ok(Array.isArray(problem.triggers) && problem.triggers.length > 0);
    assert.ok(problem.evidence && Array.isArray(problem.evidence.fact));
    assert.ok(problem.evidence && Array.isArray(problem.evidence.signal));
    assert.ok(problem.evidence && Array.isArray(problem.evidence.hypothesis));
    assert.deepEqual(Object.keys(problem.confidence_policy).sort(), ['high','low','medium']);
    assert.ok(Array.isArray(problem.impact.types) && problem.impact.types.length > 0);
    assert.deepEqual(problem.impact.labels, ['OBSERVED','ESTIMATED','POTENTIAL']);
    assert.ok(Array.isArray(problem.actions) && problem.actions.length > 0);
    assert.ok(Array.isArray(problem.capabilities) && problem.capabilities.length > 0);
    assert.ok(Array.isArray(problem.outcomes) && problem.outcomes.length > 0);
  }
});

test('commercial routes are not the source of truth', () => {
  for (const problem of library.problems) {
    assert.ok(Array.isArray(problem.commercial_routes));
    for (const route of problem.commercial_routes) assert.ok(route.startsWith('/'));
  }
});
