import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const workflow = source('.github/workflows/canonical-brand-shell-live-readback.yml');
const installer = source('tools/ci/install-chromium.sh');

test('production visual readback pins Playwright with supported Ubuntu 26.04 Chromium builds', () => {
  assert.match(workflow, /PLAYWRIGHT_PACKAGE=playwright@1\.61\.0 bash tools\/ci\/install-chromium\.sh/);
  assert.doesNotMatch(workflow, /PLAYWRIGHT_PACKAGE=playwright@1\.(?:5[0-9]|60)\./);
  assert.match(installer, /@playwright\/test@1\.61\.0/);
});

test('real production verification keeps browser/render checks and evidence upload', () => {
  assert.match(workflow, /Verify every public production page is visibly rendered/);
  assert.match(workflow, /Production UI visual regression readback/);
  assert.match(workflow, /Upload production visual regression diagnostics/);
  assert.match(workflow, /github\.event_name != 'pull_request'/);
});
