import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Portal V2 mounts the existing connector builder on the koppelingen page', () => {
  const shell = fs.readFileSync('portal-v2/page-shell.js','utf8');
  assert.match(shell, /mountConnectorWizard/);
  assert.match(shell, /pageId\s*===\s*['\"]koppelingen['\"]/);
  assert.match(shell, /mountConnectorWizard\s*\(\s*native/);
});

test('Portal V2 reuses the proven connector builder instead of cloning it', () => {
  const shell = fs.readFileSync('portal-v2/page-shell.js','utf8');
  assert.match(shell, /assets\/js\/koppelingen\/view\.js/);
  const builder = fs.readFileSync('assets/js/koppelingen/view.js','utf8');
  for (const contract of ['data-bg-route="ai"','data-bg-route="template"','data-bg-route="manual"','data-bg-safe-test','data-bg-activate']) {
    assert.match(builder, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
});
