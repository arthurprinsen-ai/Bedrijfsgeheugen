import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('production DOM readback must prove exact revision and full V2 parity', async () => {
  const [spec, workflow] = await Promise.all([
    read('tests/integration/portal-v2-production-csrd.spec.js'),
    read('.github/workflows/portal-v2-production-dom-readback.yml'),
  ]);

  for (const marker of [
    'EXPECTED_RELEASE_SHA',
    'release.json',
    'Strategy DNA',
    'data-capability="export"',
    'data-capability="import"',
    'data-capability="print-permission"',
    'data-capability="feedback"',
    'data-capability="customer-branding"',
    'data-capability="identity-login-logout"',
    'legacy-parity.js',
  ]) assert.ok(spec.includes(marker), `production readback missing ${marker}`);

  assert.match(workflow, /EXPECTED_RELEASE_SHA:\s*\$\{\{\s*github\.sha\s*\}\}/);
  assert.doesNotMatch(spec, /\/klantportaal(?:\?|["'])/i);
});
