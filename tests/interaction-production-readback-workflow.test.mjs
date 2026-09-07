import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('production readback reuses the canonical browser contracts', () => {
  const workflow = readFileSync('.github/workflows/interaction-production-readback.yml', 'utf8');
  for (const marker of [
    'push:',
    'branches: [main]',
    'https://www.bedrijfsgeheugen.nl',
    'INTERACTION_ENVIRONMENT: production',
    '@playwright/test@1.55.0',
    'playwright install --with-deps chromium',
    'tests/integration/interaction-quality-gate.spec.js',
    'actions/upload-artifact@v4',
  ]) assert.ok(workflow.includes(marker), `production readback marker missing: ${marker}`);
  assert.equal((workflow.match(/interaction-quality-gate\.spec\.js/g) || []).length, 1, 'production must use one canonical browser spec');
});
