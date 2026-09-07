import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('interaction quality workflow gates PR previews with canonical contracts', () => {
  const workflow = readFileSync('.github/workflows/interaction-quality-gate.yml', 'utf8');
  for (const marker of [
    'pull_request:',
    'branches: [main]',
    'name: interaction-quality-gate',
    'actions/checkout@v5',
    "node-version: '22'",
    'netlify/bedrijfsgeheugen/deploy-preview',
    '@playwright/test@1.55.0',
    'playwright install --with-deps chromium',
    'tests/interaction-contract-registry.test.mjs',
    'tests/interaction-final-build-wiring.test.mjs',
    'tests/integration/interaction-quality-gate.spec.js',
    'deploy-preview-${{ github.event.pull_request.number }}--bedrijfsgeheugen.netlify.app',
    'actions/upload-artifact@v4',
  ]) assert.ok(workflow.includes(marker), `workflow marker missing: ${marker}`);
  assert.match(workflow, /if: github\.event_name == 'pull_request'[\s\S]*BASE_URL:/, 'manual dispatch must not run against an invalid preview URL');
});
