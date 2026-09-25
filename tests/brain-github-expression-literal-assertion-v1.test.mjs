import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Rocket Delivery regression uses literal-safe GitHub expression assertion', async () => {
  const source = await read('tests/brain-rocket-delivery-v1.test.mjs');
  const expected = "codeql.includes('group: powerhouse-codeql-${{ github.event_name }}-${{ github.event.pull_request.number || github.ref_name }}')";

  assert.ok(
    source.includes(expected),
    'fixed GitHub expression must be asserted with literal containment',
  );

  assert.doesNotMatch(
    source,
    /assert\.match\(codeql,\s*\/group:\s*powerhouse-codeql-/,
    'do not regress to regex matching for the fixed CodeQL GitHub expression',
  );
});

test('Powerhouse self-optimization skill carries the reusable prevention rule', async () => {
  const skill = await read('.agents/skills/powerhouse-delivery-self-optimization/SKILL.md');
  assert.match(skill, /github\|actions-test\|literal-expression-assertion\|v1/);
  assert.match(skill, /github\|actions\|fanout-postmerge-observation\|v1/);
});
