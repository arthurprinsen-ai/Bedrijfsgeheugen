import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('protected test workflow includes interaction gate without dropping existing UI regressions', () => {
  const workflow = readFileSync('.github/workflows/required-test.yml', 'utf8');
  for (const marker of [
    'name: test',
    'tests/v18-vergelijker.test.mjs',
    'tests/interaction-contract-registry.test.mjs',
    'tests/interaction-final-build-wiring.test.mjs',
    'tests/integration/interaction-quality-gate.spec.js',
    'netlify/bedrijfsgeheugen/deploy-preview',
    '@playwright/test@1.55.0',
  ]) assert.ok(workflow.includes(marker), `required gate marker missing: ${marker}`);
});
